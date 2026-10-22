import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { communityApi } from "./CommunitySection";
interface Post { id: string; channel: string; message: string; image_url?: string; permalink?: string; published: boolean }
export default function CommunitySocialAdmin() {
  const queryClient = useQueryClient();
  const { data, error, refetch } = useQuery<{ channels: { channel: string; connected: boolean }[]; posts: Post[] }>({ queryKey: ["community-social-admin"], queryFn: () => communityApi("/admin/social"), retry: false });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function action(path: string, method: string, body: unknown) {
    setBusy(true); setNotice("");
    try {
      const result = await communityApi(`/admin/social${path}`, method, body);
      setNotice(result.imported !== undefined ? `${result.imported} publicaciones recibidas para revisión.` : "Cambios guardados.");
      await Promise.all([refetch(), queryClient.invalidateQueries({ queryKey: ["community-public"] })]);
    } catch (err) { setNotice((err as Error).message); } finally { setBusy(false); }
  }
  return <section className="bg-white border rounded-2xl p-5 mt-8">
    <h2 className="text-xl font-bold">Mostrar publicaciones de redes en la web</h2>
    <p className="text-sm text-slate-600 mt-3">Importa las publicaciones existentes de las cuentas de la iglesia y selecciona cuáles aparecerán en la página principal. Cada una incluye un enlace a su publicación original.</p>
    {error && <p role="alert" className="text-red-700 mt-3">{error.message}</p>}
    <div className="flex flex-wrap gap-3 mt-5">{data?.channels.map(item => <div key={item.channel} className="border rounded-lg p-3">
      <p className="capitalize font-semibold">{item.channel}</p><p className="text-sm mb-2">{item.connected ? "Cuenta configurada; Meta validará el acceso de lectura al importar" : "Pendiente de conexión en Ajustes de redes"}</p>
      <button disabled={busy || !item.connected} className="text-blue-700 underline disabled:opacity-50" onClick={() => action("/import", "POST", { channel: item.channel })}>Importar publicaciones</button>
    </div>)}</div>
    {notice && <p role="status" className="border rounded-lg p-4 mt-4">{notice}</p>}
    {data?.posts.length === 0 && <p className="mt-6 text-slate-600">Todavía no hay publicaciones importadas.</p>}
    <div className="grid md:grid-cols-2 gap-4 mt-6">{data?.posts.map(post => <article key={post.id} className="border rounded-xl p-4">
      <p className="capitalize font-semibold">{post.channel} · {post.published ? "Visible en la web" : "Pendiente de mostrar"}</p>
      <p className="whitespace-pre-wrap my-3">{post.message}</p>
      {post.image_url && <img src={post.image_url} alt="Publicación de Linaje Real" className="w-full h-48 object-contain bg-slate-50 mb-3" loading="lazy" referrerPolicy="no-referrer" />}
      {post.permalink && <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline block mb-3">Ver publicación original</a>}
      <button disabled={busy} className="text-blue-700 underline" onClick={() => action(`/${post.id}`, "PATCH", { published: !post.published })}>{post.published ? "Ocultar de la web" : "Mostrar en la web"}</button>
    </article>)}</div>
  </section>;
}

