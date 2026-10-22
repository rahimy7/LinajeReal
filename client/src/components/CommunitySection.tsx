import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, X, Heart, BookOpen, CalendarDays, Send } from "lucide-react";

export interface Activity { id: string; title: string; description: string; starts_at: string; location: string; published?: boolean }
export interface Photo { id: string; title: string; image_url: string; published?: boolean }
export interface CommunityData { activities: Activity[]; photos: Photo[]; posts?: { id: string; channel: string; message: string; image_url?: string; permalink?: string }[] }
export async function communityApi(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`/api/community${path}`, { method, credentials: "same-origin", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo completar la solicitud.");
  return data;
}
const choices = [{ id: "oracion", label: "Pedir oración", icon: Heart }, { id: "estudio", label: "Estudios bíblicos", icon: BookOpen }, { id: "actividad", label: "Actividades", icon: CalendarDays }, { id: "contacto", label: "Hablar con el equipo", icon: MessageCircle }];
export default function CommunitySection() {
  const { data, isError } = useQuery<CommunityData>({ queryKey: ["community-public"], queryFn: () => communityApi("/public"), retry: 1 });
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("oracion");
  const [activityId, setActivityId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const closeButton = useRef<HTMLButtonElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); launcher.current?.focus(); }
      if (event.key === "Tab") {
        const nodes = dialog.current?.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href]');
        const items = nodes ? Array.from(nodes).filter(node => !node.hasAttribute("disabled") && node.offsetParent !== null) : [];
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open]);
  function start(type: string, activity = "") { setKind(type); setActivityId(activity); setReference(""); setError(""); setOpen(true); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const result = await communityApi("/requests", "POST", { kind, name: form.get("name"), contact: form.get("contact"), message: form.get("message"), consent: form.get("consent") === "on", website: form.get("website"), ...(kind === "actividad" ? { activityId } : {}) });
      setReference(result.reference);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <>
    <section id="comunidad" className="bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <p className="text-blue-700 font-semibold mb-2">Una iglesia para acompañarte</p>
        <h2 className="text-3xl font-bold text-slate-900">Conecta con Linaje Real</h2>
        <p className="text-slate-600 mt-3 max-w-2xl">Queremos orar contigo, estudiar la Biblia y compartir momentos en comunidad. Déjanos tu solicitud para que nuestro equipo te acompañe.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">{choices.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => start(id)} className="rounded-2xl border border-blue-100 bg-white text-left p-6 shadow-sm hover:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600"><Icon className="text-blue-600 mb-4" aria-hidden="true" /><span className="font-semibold text-slate-900">{label}</span></button>)}</div>
        <h3 className="text-2xl font-bold mt-12 mb-5">Próximas actividades</h3>
        {isError ? <p role="status">La agenda no está disponible en este momento. Puedes volver a intentarlo más tarde.</p> : !data ? <p>Cargando agenda…</p> : data.activities.length === 0 ? <p className="text-slate-600">Pronto anunciaremos nuevas actividades. Escríbenos para conocer nuestros encuentros.</p> : <div className="grid md:grid-cols-3 gap-5">{data.activities.map(activity => <article key={activity.id} className="p-6 bg-white rounded-xl border"><p className="text-sm text-blue-700">{new Date(activity.starts_at).toLocaleString("es-DO", { dateStyle: "long", timeStyle: "short", timeZone: "America/Santo_Domingo" })}</p><h4 className="text-xl font-bold mt-2">{activity.title}</h4><p className="whitespace-pre-wrap mt-3">{activity.description}</p><p className="text-sm text-slate-600 mt-3">{activity.location}</p><button className="mt-5 text-blue-700 font-semibold underline" onClick={() => start("actividad", activity.id)}>Quiero participar</button></article>)}</div>}
      </div>
    </section>
    {Boolean(data?.posts?.length) && <section id="redes" className="py-16 container mx-auto px-4 max-w-6xl"><h2 className="text-3xl font-bold mb-8">Lo que compartimos en redes</h2><div className="grid md:grid-cols-3 gap-5">{data?.posts?.map(post => <article key={post.id} className="border rounded-2xl overflow-hidden">{post.image_url && <img src={post.image_url} alt="Publicación de Linaje Real" loading="lazy" referrerPolicy="no-referrer" className="w-full h-56 object-cover" />}<div className="p-5"><p className="text-blue-700 capitalize text-sm mb-2">{post.channel}</p><p className="whitespace-pre-wrap">{post.message}</p>{post.permalink && <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="inline-block underline text-blue-700 mt-4">Ver publicación</a>}</div></article>)}</div></section>}
    <section id="galeria" className="py-16 container mx-auto px-4 max-w-6xl"><h2 className="text-3xl font-bold">Nuestra comunidad en imágenes</h2><p className="text-slate-600 mt-3 mb-8">Momentos que compartimos como familia de fe.</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"><figure className="overflow-hidden rounded-2xl bg-slate-100"><img src="/images/linaje1.JPG" alt="Iglesia Linaje Real" loading="lazy" className="w-full h-64 object-cover" /><figcaption className="p-4">Linaje Real</figcaption></figure>{data?.photos.map(photo => <figure key={photo.id} className="overflow-hidden rounded-2xl bg-slate-100"><a href={photo.image_url} target="_blank" rel="noopener noreferrer"><img src={photo.image_url} alt={photo.title} loading="lazy" referrerPolicy="no-referrer" className="w-full h-64 object-cover" /></a><figcaption className="p-4">{photo.title}</figcaption></figure>)}</div></section>
    <button ref={launcher} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="linaje-chat" className="fixed bottom-5 right-5 z-40 rounded-full bg-blue-700 hover:bg-blue-800 text-white px-5 py-4 shadow-xl flex items-center gap-2"><MessageCircle aria-hidden="true" /> ¿Cómo podemos ayudarte?</button>
    {open && <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center p-3" onClick={event => { if (event.target === event.currentTarget) { setOpen(false); launcher.current?.focus(); } }}><div id="linaje-chat" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="chat-title" className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="bg-blue-800 text-white p-5 flex items-center justify-between"><div><h2 id="chat-title" className="font-bold text-xl">Estamos para ti</h2><p className="text-sm text-blue-100">Asistente de solicitudes · Linaje Real</p></div><button ref={closeButton} aria-label="Cerrar chat" onClick={() => { setOpen(false); launcher.current?.focus(); }} className="p-2"><X /></button></div><div className="p-5">
      {reference ? <div role="status"><Heart className="text-blue-700 mb-3" /><h3 className="text-xl font-bold">Recibimos tu solicitud</h3><p className="mt-3">El equipo de la iglesia te contactará por el medio que indicaste. No es una conversación en vivo.</p><p className="text-xs break-all mt-4 text-slate-600">Referencia: {reference}</p><button className="mt-5 underline text-blue-700" onClick={() => setReference("")}>Enviar otra solicitud</button></div> : <form onSubmit={submit} className="space-y-4">
      <p className="bg-blue-50 rounded-xl p-3 text-sm">Hola, nos alegra que estés aquí. ¿En qué podemos acompañarte? Tu solicitud será privada y la atenderá nuestro equipo.</p>
      <label className="block text-sm font-medium">Quiero…<select value={kind} onChange={event => { setKind(event.target.value); setError(""); }} className="mt-1 w-full border rounded-lg p-3">{choices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select></label>
      {kind === "actividad" && <label className="block text-sm font-medium">Actividad<select required value={activityId} onChange={event => setActivityId(event.target.value)} className="mt-1 w-full border rounded-lg p-3"><option value="">Selecciona una actividad</option>{data?.activities.map(activity => <option key={activity.id} value={activity.id}>{activity.title}</option>)}</select>{!data?.activities.length && <span className="text-xs text-slate-600">Aún no hay actividades publicadas. Elige «Hablar con el equipo» para consultar.</span>}</label>}
      <label className="block text-sm font-medium">Tu nombre<input name="name" autoComplete="name" required minLength={2} maxLength={100} className="mt-1 w-full border rounded-lg p-3" /></label>
      <label className="block text-sm font-medium">Teléfono o correo para contactarte<input name="contact" autoComplete="email" required minLength={5} maxLength={254} className="mt-1 w-full border rounded-lg p-3" /></label>
      <label className="block text-sm font-medium">{kind === "oracion" ? "¿Por qué quieres que oremos?" : kind === "estudio" ? "Cuéntanos tu disponibilidad para estudiar" : "Tu mensaje"}<textarea name="message" required minLength={5} maxLength={3000} rows={3} className="mt-1 w-full border rounded-lg p-3" /></label>
      <div hidden aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" name="consent" required className="mt-1" /><span>Autorizo a Linaje Real a tratar mi solicitud y contactarme, incluso por la información personal o religiosa que decida compartir, según su <a href="/privacidad" target="_blank" rel="noreferrer" className="underline text-blue-700">política de privacidad</a>. No se publicará ni se usará para publicidad.</span></label>
      {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
      <button disabled={busy || (kind === "actividad" && !activityId)} className="w-full bg-blue-700 text-white rounded-lg p-3 font-semibold disabled:opacity-50 flex justify-center gap-2"><Send size={18} aria-hidden="true" />{busy ? "Enviando…" : "Enviar solicitud"}</button><p className="text-xs text-slate-500">Evita incluir datos de otras personas sin su permiso.</p>
      </form>}
    </div></div></div>}
  </>;
}
