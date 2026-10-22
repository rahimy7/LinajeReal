import { Router, type Request, type Response, type NextFunction } from "express";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { panelOrigin } from "./omnichannel";
import { socialAdminRouter, publicSocialPosts } from "./community-social";

export const communityRouter = Router();
let pool: Pool | undefined;
let initialization: Promise<unknown> | undefined;
async function database() {
  if (!process.env.COMMUNITY_DATABASE_URL) throw new Error("community unavailable");
  if (!pool) {
    pool = new Pool({ connectionString: process.env.COMMUNITY_DATABASE_URL, max: 5, connectionTimeoutMillis: 8000 });
    pool.on("error", () => console.error("Community database connection interrupted"));
  }
  initialization ??= pool.query(`CREATE SCHEMA IF NOT EXISTS linaje_web;
    CREATE TABLE IF NOT EXISTS linaje_web.requests (
      id uuid PRIMARY KEY, kind text NOT NULL, name text NOT NULL, contact text NOT NULL,
      message text NOT NULL, activity_id uuid, status text NOT NULL DEFAULT 'pendiente',
      created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS linaje_web.activities (
      id uuid PRIMARY KEY, title text NOT NULL, description text NOT NULL,
      starts_at timestamptz NOT NULL, location text NOT NULL, published boolean NOT NULL DEFAULT false);
    CREATE TABLE IF NOT EXISTS linaje_web.photos (
      id uuid PRIMARY KEY, title text NOT NULL, image_url text NOT NULL,
      consent boolean NOT NULL DEFAULT false, published boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS linaje_web.social_posts (
      id uuid PRIMARY KEY, channel text NOT NULL, message text NOT NULL, image_url text,
      external_id text, permalink text, state text NOT NULL DEFAULT 'draft',
      published boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(channel,external_id));`).catch(error => { initialization = undefined; throw error; });
  await initialization;
  return pool;
}
const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res)).catch(error => {
    if (error instanceof z.ZodError) { res.status(400).json({ error: "Revisa los campos del formulario." }); return; }
    res.status(503).json({ error: "El servicio no está disponible. Inténtalo más tarde." });
  });
};
// This router never returns private requests on a public endpoint.
communityRouter.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
communityRouter.use((req, res, next) => {
  if (["GET", "HEAD"].includes(req.method)) { next(); return; }
  const origin = req.headers.origin;
  const trusted = process.env.PUBLIC_SITE_URL || "https://www.iasdcentrallinajereal.org";
  if (!origin || (origin !== trusted && !(process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)))) {
    res.status(403).json({ error: "Acceso no permitido." }); return;
  }
  if (req.method !== "DELETE" && !req.is("application/json")) { res.status(415).json({ error: "Formato no admitido." }); return; }
  next();
});
const attempts = new Map<string, { count: number; until: number }>();
function limit(req: Request, res: Response, next: NextFunction) {
  // Railway's last proxy supplies the client address; do not trust the leftmost value supplied by callers.
  const address = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",").at(-1)!.trim();
  const now = Date.now();
  attempts.forEach((value, key) => { if (value.until < now) attempts.delete(key); });
  const key = `${req.path}:${address}`;
  const item = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  if (++item.count > 10 || attempts.size > 10000) { res.setHeader("Retry-After", "900"); res.status(429).json({ error: "Espera unos minutos antes de volver a intentar." }); return; }
  attempts.set(key, item); next();
}
function token(req: Request) {
  const value = req.headers.cookie?.split(";").map(x => x.trim()).find(x => x.startsWith("linaje_community="))?.slice(17);
  return value && /^[A-Za-z0-9_.-]+$/.test(value) ? value : undefined;
}
async function omni(path: string, init: RequestInit = {}) {
  const origin = panelOrigin(process.env.OMNICHANNEL_URL);
  if (!origin) throw new Error("not configured");
  return fetch(`${origin}/api${path}`, { ...init, redirect: "error", signal: AbortSignal.timeout(10000) });
}
const admin = async (req: Request, res: Response, next: NextFunction) => { try {
  const bearer = token(req);
  if (!bearer) { res.status(401).json({ error: "Inicia sesión con tu cuenta de administrador de redes." }); return; }
  const upstream = await omni("/auth/me", { headers: { Authorization: `Bearer ${bearer}` } });
  if (!upstream.ok) { res.status(401).json({ error: "La sesión ha vencido." }); return; }
  const user = await upstream.json() as { role?: string };
  if (user.role !== "admin") { res.status(403).json({ error: "Se requiere una cuenta administradora." }); return; }
  next();
} catch { res.status(503).json({ error: "No se pudo verificar la sesión." }); } };
communityRouter.post("/admin/login", limit, wrap(async (req, res) => {
  const body = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(512) }).parse(req.body);
  const upstream = await omni("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!upstream.ok) { res.status(401).json({ error: "No se pudo iniciar sesión. Revisa tus credenciales." }); return; }
  const result = await upstream.json() as { token: string; user: { role: string } };
  if (result.user.role !== "admin") { res.status(403).json({ error: "Se requiere una cuenta administradora." }); return; }
  res.setHeader("Set-Cookie", `linaje_community=${result.token}; HttpOnly; SameSite=Strict; Path=/api/community/admin; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  res.json({ ok: true });
}));
communityRouter.post("/admin/logout", (_req, res) => {
  res.setHeader("Set-Cookie", "linaje_community=; HttpOnly; SameSite=Strict; Path=/api/community/admin; Max-Age=0; Secure");
  res.json({ ok: true });
});
communityRouter.use("/admin", admin);
communityRouter.use("/admin/social", socialAdminRouter);
communityRouter.get("/admin", wrap(async (_req, res) => {
  const db = await database();
  const [requests, activities, photos] = await Promise.all([
    db.query("SELECT r.*,a.title AS activity_title FROM linaje_web.requests r LEFT JOIN linaje_web.activities a ON a.id=r.activity_id ORDER BY r.created_at DESC LIMIT 200"),
    db.query("SELECT * FROM linaje_web.activities ORDER BY starts_at DESC LIMIT 100"),
    db.query("SELECT * FROM linaje_web.photos ORDER BY created_at DESC LIMIT 100")
  ]);
  res.json({ requests: requests.rows, activities: activities.rows, photos: photos.rows });
}));
communityRouter.patch("/admin/requests/:id", wrap(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const { status } = z.object({ status: z.enum(["pendiente", "en_atencion", "completada"]) }).parse(req.body);
  const db = await database();
  const result = await db.query("UPDATE linaje_web.requests SET status=$1 WHERE id=$2 RETURNING id", [status,id]);
  res.status(result.rowCount ? 200 : 404).json({ ok: Boolean(result.rowCount) });
}));
communityRouter.delete("/admin/requests/:id", wrap(async (req, res) => {
  const db = await database();
  await db.query("DELETE FROM linaje_web.requests WHERE id=$1", [z.string().uuid().parse(req.params.id)]);
  res.json({ ok: true });
}));
communityRouter.post("/admin/activities", wrap(async (req, res) => {
  const body = z.object({ title: z.string().trim().min(3).max(160), description: z.string().trim().min(5).max(2000), startsAt: z.string().datetime({ offset: true }), location: z.string().trim().min(3).max(300), published: z.boolean() }).parse(req.body);
  const db = await database();
  await db.query("INSERT INTO linaje_web.activities VALUES($1,$2,$3,$4,$5,$6)", [randomUUID(),body.title,body.description,body.startsAt,body.location,body.published]);
  res.status(201).json({ ok: true });
}));
communityRouter.post("/admin/photos", wrap(async (req, res) => {
  const body = z.object({ title: z.string().trim().min(3).max(160), imageUrl: z.string().url().max(2000), consent: z.literal(true), published: z.boolean() }).parse(req.body);
  const image = new URL(body.imageUrl);
  if (image.protocol !== "https:" || image.username || image.password) { res.status(400).json({ error: "Utiliza una imagen con dirección HTTPS pública." }); return; }
  const db = await database();
  await db.query("INSERT INTO linaje_web.photos(id,title,image_url,consent,published) VALUES($1,$2,$3,true,$4)", [randomUUID(),body.title,body.imageUrl,body.published]);
  res.status(201).json({ ok: true });
}));
for (const resource of ["photos", "activities"] as const) {
  communityRouter.patch(`/admin/${resource}/:id`, wrap(async (req, res) => {
    const { published } = z.object({ published: z.boolean() }).parse(req.body);
    const db = await database();
    const result = await db.query(`UPDATE linaje_web.${resource} SET published=$1 WHERE id=$2 RETURNING id`, [published,z.string().uuid().parse(req.params.id)]);
    res.status(result.rowCount ? 200 : 404).json({ ok: Boolean(result.rowCount) });
  }));
  communityRouter.delete(`/admin/${resource}/:id`, wrap(async (req, res) => {
    const db = await database();
    await db.query(`DELETE FROM linaje_web.${resource} WHERE id=$1`, [z.string().uuid().parse(req.params.id)]);
    res.json({ ok: true });
  }));
}

communityRouter.get("/public", wrap(async (_req, res) => {
  const db = await database();
  const [activities, photos] = await Promise.all([
    db.query("SELECT id,title,description,starts_at,location FROM linaje_web.activities WHERE published AND starts_at >= now() - interval '1 day' ORDER BY starts_at LIMIT 30"),
    db.query("SELECT id,title,image_url FROM linaje_web.photos WHERE published AND consent ORDER BY created_at DESC LIMIT 60")
  ]);
  res.json({ activities: activities.rows, photos: photos.rows, posts: await publicSocialPosts(db) });
}));
communityRouter.post("/requests", limit, wrap(async (req, res) => {
  const body = z.object({ kind: z.enum(["oracion", "estudio", "actividad", "contacto"]), name: z.string().trim().min(2).max(100), contact: z.string().trim().min(5).max(254), message: z.string().trim().min(5).max(3000), activityId: z.string().uuid().optional(), consent: z.literal(true), website: z.string().max(0).optional() }).parse(req.body);
  const db = await database();
  if (body.kind === "actividad") {
    if (!body.activityId) { res.status(400).json({ error: "Selecciona una actividad publicada." }); return; }
    const activity = await db.query("SELECT id FROM linaje_web.activities WHERE id=$1 AND published AND starts_at > now()", [body.activityId]);
    if (!activity.rowCount) { res.status(400).json({ error: "La actividad ya no está disponible." }); return; }
  }
  const id = randomUUID();
  await db.query("INSERT INTO linaje_web.requests(id,kind,name,contact,message,activity_id) VALUES($1,$2,$3,$4,$5,$6)", [id,body.kind,body.name,body.contact,body.message,body.activityId || null]);
  res.status(201).json({ reference: id, message: "Recibimos tu solicitud. El equipo de la iglesia te contactará por el medio indicado." });
}));

export { database as communityDatabase };

