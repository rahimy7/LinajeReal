import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Pool } from "pg";
import { communityDatabase } from "./community";

export const socialAdminRouter = Router();
type Channel = "facebook" | "instagram";
interface Settings { facebook_enabled: boolean; facebook_page_id: string; facebook_page_access_token: string; instagram_enabled: boolean; instagram_business_account_id: string; instagram_access_token: string }
async function settings(db: Pool) {
  const result = await db.query<Settings>("SELECT facebook_enabled,facebook_page_id,facebook_page_access_token,instagram_enabled,instagram_business_account_id,instagram_access_token FROM public.integration_settings WHERE id=1");
  return result.rows[0];
}
function connection(s: Settings | undefined, channel: Channel) {
  const token = channel === "facebook" ? s?.facebook_page_access_token : s?.instagram_access_token || s?.facebook_page_access_token;
  const id = channel === "facebook" ? s?.facebook_page_id : s?.instagram_business_account_id;
  const enabled = channel === "facebook" ? s?.facebook_enabled : s?.instagram_enabled;
  if (!enabled || !token || !id || !/^\d+$/.test(id)) throw new Error("Conecta primero esta cuenta en Ajustes de redes sociales y autoriza los permisos para publicaciones.");
  const version = process.env.META_GRAPH_API_VERSION || "v25.0";
  if (!/^v\d+\.0$/.test(version)) throw new Error("Revisa la versión de la API de Meta.");
  return { token, id, base: `https://${channel === "instagram" && token.startsWith("IG") ? "graph.instagram.com" : "graph.facebook.com"}/${version}` };
}
async function graph(config: ReturnType<typeof connection>, path: string, method = "GET", body?: Record<string,string>) {
  const response = await fetch(`${config.base}/${path}`, { method, redirect: "error", signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${config.token}`, ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) }, body: body ? new URLSearchParams(body) : undefined });
  const result = await response.json() as any;
  if (!response.ok || result.error) {
    // Do not return raw provider payloads: they can contain credentials and internal details.
    throw new Error(`Meta rechazó la operación${result.error?.code ? ` (código ${Number(result.error.code)})` : ""}. Revisa permisos, token y formato del contenido en Ajustes.`);
  }
  return result;
}
const safeUrl = z.string().url().max(2000).refine(value => { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; });
const handler = (fn: Function) => async (req: any, res: any) => {
  try { await fn(req, res); } catch (error) {
    res.status(error instanceof z.ZodError ? 400 : 502).json({ error: error instanceof z.ZodError ? "Revisa los campos de la publicación." : "No se pudo completar la operación. Revisa la conexión de Meta y sus permisos." });
  }
};
export async function publicSocialPosts(db: Pool) {
  return (await db.query("SELECT id,channel,message,image_url,permalink FROM linaje_web.social_posts WHERE published AND state IN ('published','imported') ORDER BY created_at DESC LIMIT 12")).rows;
}
socialAdminRouter.get("/", handler(async (_req: any, res: any) => {
  const db = await communityDatabase();
  const s = await settings(db);
  const channels = (["facebook", "instagram"] as const).map(channel => { try { connection(s,channel); return { channel, connected: true }; } catch { return { channel, connected: false }; } });
  res.json({ channels, posts: (await db.query("SELECT * FROM linaje_web.social_posts ORDER BY created_at DESC LIMIT 100")).rows });
}));
socialAdminRouter.post("/drafts", handler(async (req: any, res: any) => {
  const body = z.object({ channel: z.enum(["facebook", "instagram"]), message: z.string().trim().min(1).max(2200), imageUrl: safeUrl.optional() }).parse(req.body);
  if (body.channel === "instagram" && !body.imageUrl) { res.status(400).json({ error: "Instagram necesita una fotografía JPEG pública." }); return; }
  const db = await communityDatabase();
  const id = randomUUID();
  await db.query("INSERT INTO linaje_web.social_posts(id,channel,message,image_url) VALUES($1,$2,$3,$4)", [id,body.channel,body.message,body.imageUrl || null]);
  res.status(201).json({ id });
}));
socialAdminRouter.post("/:id/publish", handler(async (req: any, res: any) => {
  const id = z.string().uuid().parse(req.params.id);
  z.object({ confirm: z.literal(true) }).parse(req.body);
  const db = await communityDatabase();
  const post = (await db.query("SELECT * FROM linaje_web.social_posts WHERE id=$1", [id])).rows[0];
  if (!post || post.state !== "draft") { res.status(409).json({ error: "Esta publicación ya fue procesada. Comprueba su estado en la red antes de crear otra." }); return; }
  let config: ReturnType<typeof connection>;
  try { config = connection(await settings(db),post.channel); }
  catch { res.status(409).json({ error: "Conecta la cuenta en Ajustes de redes sociales y autoriza los permisos de publicación." }); return; }
  const claimed = await db.query("UPDATE linaje_web.social_posts SET state='publishing' WHERE id=$1 AND state='draft' RETURNING id", [id]);
  if (!claimed.rowCount) { res.status(409).json({ error: "La publicación ya está en proceso." }); return; }
  try {
    let result: any;
    if (post.channel === "facebook") {
      result = await graph(config, `${config.id}/${post.image_url ? "photos" : "feed"}`, "POST", post.image_url ? { url: post.image_url, caption: post.message } : { message: post.message });
    } else {
      const container = await graph(config, `${config.id}/media`, "POST", { image_url: post.image_url, caption: post.message });
      let ready = false;
      for (let attempt = 0; attempt < 4; attempt++) {
        const status = await graph(config, `${encodeURIComponent(container.id)}?fields=status_code`);
        if (status.status_code === "FINISHED") { ready = true; break; }
        if (["ERROR", "EXPIRED"].includes(status.status_code)) throw new Error("container unavailable");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (!ready) throw new Error("container still processing");
      result = await graph(config, `${config.id}/media_publish`, "POST", { creation_id: container.id });
    }
    if (!result.id) throw new Error("missing ID");
    const externalId = String(result.post_id || result.id);
    let permalink: string | null = null;
    // Publication succeeded; failure to read the permalink must never cause a second post.
    try { const candidate = (await graph(config, `${encodeURIComponent(externalId)}?fields=${post.channel === "facebook" ? "permalink_url" : "permalink"}`))[post.channel === "facebook" ? "permalink_url" : "permalink"]; permalink = safeUrl.safeParse(candidate).success ? candidate : null; } catch {}
    await db.query("UPDATE linaje_web.social_posts SET state='published',external_id=$1,permalink=$2 WHERE id=$3", [externalId,permalink,id]);
    res.json({ ok: true });
  } catch {
    await db.query("UPDATE linaje_web.social_posts SET state='check_required' WHERE id=$1", [id]);
    res.status(502).json({ error: "No pudimos confirmar la publicación. Comprueba directamente la cuenta antes de crear otra para evitar duplicados." });
  }
}));
socialAdminRouter.post("/import", handler(async (req: any, res: any) => {
  const { channel } = z.object({ channel: z.enum(["facebook", "instagram"]) }).parse(req.body);
  const db = await communityDatabase();
  const config = connection(await settings(db), channel);
  const fields = channel === "facebook" ? "id,message,full_picture,permalink_url" : "id,caption,media_url,media_type,permalink";
  const result = await graph(config, `${config.id}/${channel === "facebook" ? "posts" : "media"}?fields=${fields}&limit=12`);
  let imported = 0;
  for (const item of result.data || []) {
    const image = channel === "facebook" ? item.full_picture : item.media_type === "IMAGE" ? item.media_url : null;
    const permalink = channel === "facebook" ? item.permalink_url : item.permalink;
    if (!safeUrl.safeParse(permalink).success || (image && !safeUrl.safeParse(image).success)) continue;
    await db.query("INSERT INTO linaje_web.social_posts(id,channel,message,image_url,external_id,permalink,state) VALUES($1,$2,$3,$4,$5,$6,'imported') ON CONFLICT(channel,external_id) DO UPDATE SET message=EXCLUDED.message,image_url=EXCLUDED.image_url,permalink=EXCLUDED.permalink,published=false", [randomUUID(),channel,String(item.message || item.caption || "").slice(0,2200),image || null,String(item.id),permalink]);
    imported++;
  }
  res.json({ imported });
}));
socialAdminRouter.patch("/:id", handler(async (req: any, res: any) => {
  const { published } = z.object({ published: z.boolean() }).parse(req.body);
  const db = await communityDatabase();
  const result = await db.query("UPDATE linaje_web.social_posts SET published=$1 WHERE id=$2 AND state IN ('published','imported') RETURNING id", [published,z.string().uuid().parse(req.params.id)]);
  res.status(result.rowCount ? 200 : 409).json({ ok: Boolean(result.rowCount) });
}));

