import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { communityApi, type CommunityData } from "@/components/CommunitySection";
import CommunitySocialAdmin from "@/components/CommunitySocialAdmin";

interface ChurchRequest { id: string; kind: string; name: string; contact: string; message: string; status: string; created_at: string; activity_title?: string }
interface AdminData extends CommunityData { requests: ChurchRequest[] }
const input = "block w-full border rounded-lg p-3 mt-1";
const button = "rounded-lg bg-blue-700 text-white px-4 py-2 disabled:opacity-50";
export default function ComunidadAdmin() {
  const queryClient = useQueryClient();
  const { data, error, refetch, isPending } = useQuery<AdminData>({ queryKey: ["community-admin"], queryFn: () => communityApi("/admin"), retry: false });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function action(path: string, method: string, body?: unknown) {
    setBusy(true); setNotice("");
    try { await communityApi(path, method, body); await queryClient.invalidateQueries({ queryKey: ["community-admin"] }); await queryClient.invalidateQueries({ queryKey: ["community-public"] }); setNotice("Cambios guardados."); return true; }
    catch (err) { setNotice((err as Error).message); return false; }
    finally { setBusy(false); }
  }
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    setBusy(true); setNotice("");
    try { await communityApi("/admin/login", "POST", { email: form.get("email"), password: form.get("password") }); await refetch(); }
    catch (err) { setNotice((err as Error).message); } finally { setBusy(false); }
  }
  async function activity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element);
    const date = String(form.get("date"));
    if (await action("/admin/activities", "POST", { title: form.get("title"), description: form.get("description"), startsAt: new Date(`${date}:00-04:00`).toISOString(), location: form.get("location"), published: form.get("published") === "on" })) element.reset();
  }
  async function photo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element);
    if (await action("/admin/photos", "POST", { title: form.get("title"), imageUrl: form.get("imageUrl"), consent: form.get("consent") === "on", published: form.get("published") === "on" })) element.reset();
  }
  return <main className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="max-w-6xl mx-auto">
    <nav className="flex gap-5 mb-6 text-blue-700 underline"><a href="/">Página principal</a><a href="/admin/redes-sociales">Redes sociales</a></nav>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-8"><div><h1 className="text-3xl font-bold">Comunidad · Linaje Real</h1><p className="text-slate-600 mt-2">Solicitudes privadas, actividades y galería</p></div>{data && <button className={button} disabled={busy} onClick={async () => { await communityApi("/admin/logout", "POST", {}); queryClient.removeQueries({ queryKey: ["community-admin"] }); window.location.reload(); }}>Cerrar sesión</button>}</div>
    {notice && <p role="status" className="p-4 mb-5 rounded-lg border bg-white">{notice}</p>}
    {!data ? <section className="max-w-md bg-white border rounded-2xl p-6"><h2 className="font-bold text-xl">Acceso del equipo</h2><p className="text-sm text-slate-600 my-3">Usa la misma cuenta administradora del servicio de redes sociales.</p>{isPending ? <p>Verificando sesión…</p> : <><p className="text-sm mb-4">{error?.message}</p><form onSubmit={login} className="space-y-4"><label className="block">Correo<input name="email" type="email" required autoComplete="username" className={input} /></label><label className="block">Contraseña<input name="password" type="password" required autoComplete="current-password" className={input} /></label><button className={button} disabled={busy}>{busy ? "Ingresando…" : "Iniciar sesión"}</button></form></>}</section> : <>
    <section className="bg-white border rounded-2xl p-5 mb-8"><div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold">Solicitudes recibidas</h2><button disabled={busy} onClick={() => refetch()} className="text-blue-700 underline">Actualizar</button></div><p className="text-sm text-slate-600 mb-5">Información privada. Atiende por el teléfono o correo indicado. Las solicitudes no envían publicidad ni respuestas automáticas.</p>{data.requests.length === 0 ? <p>No hay solicitudes todavía.</p> : <div className="space-y-4">{data.requests.map(request => <article key={request.id} className="border rounded-xl p-4"><div className="flex flex-wrap justify-between gap-3"><div><span className="text-xs uppercase text-blue-700">{request.kind}</span><h3 className="font-bold text-lg">{request.name}</h3><p className="break-all">{request.contact}</p></div><label className="text-sm">Estado<select disabled={busy} value={request.status} onChange={event => action(`/admin/requests/${request.id}`, "PATCH", { status: event.target.value })} className={input}><option value="pendiente">Pendiente</option><option value="en_atencion">En atención</option><option value="completada">Completada</option></select></label></div>{request.activity_title && <p className="mt-2 font-semibold">{request.activity_title}</p>}<p className="whitespace-pre-wrap my-3">{request.message}</p><p className="text-xs text-slate-500">{new Date(request.created_at).toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" })} · {request.id}</p><button disabled={busy} className="text-red-700 underline text-sm mt-3" onClick={() => { if (window.confirm("¿Eliminar definitivamente esta solicitud y sus datos personales?")) action(`/admin/requests/${request.id}`, "DELETE"); }}>Eliminar datos</button></article>)}</div>}</section>
    <div className="grid lg:grid-cols-2 gap-8"><section className="bg-white border rounded-2xl p-5"><h2 className="text-xl font-bold mb-5">Actividades de la iglesia</h2><form onSubmit={activity} className="space-y-4"><label className="block">Título<input name="title" minLength={3} maxLength={160} required className={input} /></label><label className="block">Descripción<textarea name="description" minLength={5} maxLength={2000} required className={input} /></label><label className="block">Fecha y hora de República Dominicana<input name="date" type="datetime-local" required className={input} /></label><label className="block">Lugar<input name="location" minLength={3} maxLength={300} required className={input} /></label><label className="flex gap-2"><input name="published" type="checkbox" /> Publicar en la página</label><button disabled={busy} className={button}>Guardar actividad</button></form><div className="mt-6 space-y-3">{data.activities.map(item => <div key={item.id} className="border-t pt-3"><p className="font-semibold">{item.title}</p><p className="text-sm">{item.published ? "Publicada" : "Borrador"}</p><button disabled={busy} className="text-blue-700 underline mr-4" onClick={() => action(`/admin/activities/${item.id}`, "PATCH", { published: !item.published })}>{item.published ? "Ocultar" : "Publicar"}</button><button disabled={busy} className="text-red-700 underline" onClick={() => { if (window.confirm("¿Eliminar esta actividad?")) action(`/admin/activities/${item.id}`, "DELETE"); }}>Eliminar</button></div>)}</div></section>
    <section className="bg-white border rounded-2xl p-5"><h2 className="text-xl font-bold mb-5">Galería de fotos</h2><form onSubmit={photo} className="space-y-4"><label className="block">Título y descripción de la imagen<input name="title" required minLength={3} maxLength={160} className={input} /></label><label className="block">Dirección HTTPS de la foto<input name="imageUrl" type="url" placeholder="https://…" required className={input} /></label><p className="text-sm text-slate-600">Utiliza una imagen alojada públicamente y una dirección estable.</p><label className="flex items-start gap-2 text-sm"><input name="consent" type="checkbox" required className="mt-1" />Confirmo que la iglesia tiene autorización para publicar esta imagen y, cuando corresponda, permiso de las personas o tutores.</label><label className="flex gap-2"><input name="published" type="checkbox" /> Publicar en la galería</label><button disabled={busy} className={button}>Guardar foto</button></form><div className="mt-6 space-y-3">{data.photos.map(item => <div key={item.id} className="border-t pt-3"><p className="font-semibold">{item.title}</p><p className="text-sm">{item.published ? "Publicada" : "Borrador"}</p><button disabled={busy} className="text-blue-700 underline mr-4" onClick={() => action(`/admin/photos/${item.id}`, "PATCH", { published: !item.published })}>{item.published ? "Ocultar" : "Publicar"}</button><button disabled={busy} className="text-red-700 underline" onClick={() => { if (window.confirm("¿Eliminar esta foto de la galería?")) action(`/admin/photos/${item.id}`, "DELETE"); }}>Eliminar</button></div>)}</div></section></div>
    <CommunitySocialAdmin />
    </>}
  </div></main>;
}
