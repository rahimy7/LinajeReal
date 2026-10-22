import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { communityApi } from "./CommunitySection";
interface Post { id: string; channel: string; message: string; image_url?: string; permalink?: string; state: string; published: boolean }
export default function CommunitySocialAdmin() {
  const { data, error, refetch } = useQuery<{ channels: { channel: string; connected: boolean }[]; posts: Post[] }>({ queryKey: ["community-social-admin"], queryFn: () => communityApi("/admin/social"), retry: false });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function action(path: string, method: string, body: unknown) {
    setBusy(true); setNotice("");
    try { const result = await communityApi(`/admin/social${path}`,method,body); setNotice(result.imported !== undefined ? `${result.imported} publicaciones recibidas para revisión.` : "Cambios guardados."); await refetch(); return true; }
    catch (err) { setNotice((err as Error).message); await refetch(); return false; } finally { setBusy(false); }
  }
  async function draft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element);
    if (await action("/drafts", "POST", { channel: form.get("channel"), message: form.get("message"), ...(form.get("imageUrl") ? { imageUrl: form.get("imageUrl") } : {}) })) element.reset();
  }
  return <section className="bg-white border rounded-2xl p-5 mt-8"><h2 className="text-xl font-bold">Publicaciones de redes sociales</h2><p className="text-sm text-slate-600 mt-3">Guarda un borrador y revisa el contenido antes de publicarlo en la red elegida. Para mostrar publicaciones en la web, impórtalas y selecciona «Mostrar en la web».</p>
    {error && <p role="alert" className="text-red-700 mt-3">{error.message}</p>}
    <div className="flex flex-wrap gap-3 mt-5">{data?.channels.map(item => <div key={item.channel} className="border rounded-lg p-3"><p className="capitalize font-semibold">{item.channel}</p><p className="text-sm mb-2">{item.connected ? "Cuenta configurada; Meta validará los permisos al usarla" : "Pendiente de conexión en Ajustes de redes"}</p><button disabled={busy || !item.connected} className="text-blue-700 underline disabled:opacity-50" onClick={() => action("/import", "POST", { channel: item.channel })}>Importar publicaciones</button></div>)}</div>
    {notice && <p role="status" className="border rounded-lg p-4 mt-4">{notice}</p>}
    <form onSubmit={draft} className="grid md:grid-cols-2 gap-4 mt-6"><label>Red<select name="channel" className="block border rounded-lg p-3 mt-1 w-full"><option value="facebook">Facebook</option><option value="instagram">Instagram</option></select></label><label>Foto pública HTTPS (JPEG para Instagram)<input name="imageUrl" type="url" className="block border rounded-lg p-3 mt-1 w-full" /></label><label className="md:col-span-2">Texto de la publicación<textarea name="message" required maxLength={2200} rows={4} className="block border rounded-lg p-3 mt-1 w-full" /></label><button disabled={busy} className="justify-self-start bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">Guardar borrador</button></form>
    <div className="grid md:grid-cols-2 gap-4 mt-6">{data?.posts.map(post => <article key={post.id} className="border rounded-xl p-4"><p className="capitalize font-semibold">{post.channel} · {({ draft: "Borrador", publishing: "En proceso", check_required: "Comprobar directamente en la red", published: "Publicada en la red", imported: "Importada" } as Record<string,string>)[post.state] || post.state}</p><p className="whitespace-pre-wrap my-3">{post.message}</p>{post.image_url && <img src={post.image_url} alt="Vista previa de la publicación" className="w-full h-48 object-contain bg-slate-50 mb-3" loading="lazy" referrerPolicy="no-referrer" />}{post.permalink && <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline block mb-3">Ver en la red</a>}{post.state === "draft" && <button disabled={busy} className="bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50" onClick={() => { if (window.confirm(`¿Publicar ahora este contenido en ${post.channel}? Será visible para el público de esa cuenta.`)) action(`/${post.id}/publish`, "POST", { confirm: true }); }}>Publicar ahora en {post.channel}</button>}{["published", "imported"].includes(post.state) && <button disabled={busy} className="text-blue-700 underline" onClick={() => action(`/${post.id}`, "PATCH", { published: !post.published })}>{post.published ? "Ocultar de la web" : "Mostrar en la web"}</button>}{["check_required", "publishing"].includes(post.state) && <p className="text-sm text-amber-800">Comprueba la cuenta antes de volver a publicar para evitar duplicados.</p>}</article>)}</div>
  </section>;
}
