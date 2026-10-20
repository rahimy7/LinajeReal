import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, MessageSquare, RefreshCw, ShieldCheck } from "lucide-react";

interface PanelStatus {
  state: "ready" | "not-configured" | "configuration-error" | "wrong-instance" | "unavailable";
  panelUrl?: string;
}

async function getStatus(signal: AbortSignal): Promise<PanelStatus> {
  const response = await fetch("/api/omnichannel/status", { signal, credentials: "same-origin" });
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("state" in result)) throw new Error("No se pudo comprobar el servicio.");
  return result as PanelStatus;
}

const messages: Record<Exclude<PanelStatus["state"], "ready">, string> = {
  "not-configured": "El servicio de redes sociales todavía no está conectado. El administrador debe completar la activación de la instancia de Linaje Real.",
  "configuration-error": "La dirección del servicio necesita revisión por parte del administrador.",
  "wrong-instance": "La dirección configurada no corresponde a Linaje Real. El acceso está detenido hasta corregirla.",
  unavailable: "El servicio de redes sociales no está disponible en este momento. Intenta de nuevo en unos minutos.",
};

export default function RedesSociales() {
  const [frameVersion, setFrameVersion] = useState(0);
  const status = useQuery({
    queryKey: ["linaje-omnichannel-status"],
    queryFn: ({ signal }) => getStatus(signal),
    retry: false, staleTime: 30_000, refetchOnWindowFocus: false,
  });
  const ready = status.data?.state === "ready" && Boolean(status.data.panelUrl);
  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-lg p-2 hover:bg-slate-100" aria-label="Volver a Linaje Real"><ArrowLeft size={20} /></Link>
          <MessageSquare className="text-blue-700" aria-hidden="true" />
          <div><h1 className="text-lg font-semibold">Linaje Real · Redes sociales</h1><p className="text-xs text-slate-600">Comunicación con nuestra comunidad</p></div>
        </div>
        <button className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50" disabled={status.isFetching} onClick={() => { setFrameVersion(value => value + 1); void status.refetch(); }}>
          <RefreshCw size={16} aria-hidden="true" />Actualizar
        </button>
      </header>
      {ready ? (
        <iframe key={frameVersion} src={status.data!.panelUrl} title="Administrador de comunicaciones de Linaje Real" className="min-h-[calc(100dvh-82px)] w-full flex-1 border-0" referrerPolicy="strict-origin-when-cross-origin" allow="microphone; clipboard-write" />
      ) : (
        <section className="mx-auto my-16 max-w-xl rounded-2xl border bg-white p-8 text-center shadow-sm" aria-live="polite">
          <ShieldCheck className="mx-auto mb-4 text-blue-700" size={40} aria-hidden="true" />
          <h2 className="mb-3 text-xl font-semibold">Administración de redes sociales</h2>
          <p className="text-slate-600">{status.isPending ? "Comprobando el servicio de Linaje Real…" : status.isError ? "No se pudo comprobar la conexión. Pulsa Actualizar para intentarlo de nuevo." : status.data && status.data.state !== "ready" ? messages[status.data.state] : "No se pudo abrir el panel."}</p>
          <p className="mt-5 text-sm text-slate-500">El equipo autorizado accederá con su correo y contraseña para atender WhatsApp, Facebook e Instagram.</p>
        </section>
      )}
      <footer className="border-t bg-white px-4 py-3 text-slate-600"><nav aria-label="Información legal" className="flex flex-wrap justify-center gap-4 text-sm"><a href="/privacidad" className="underline">Privacidad</a><a href="/condiciones-del-servicio" className="underline">Condiciones del servicio</a><a href="/eliminacion-de-datos" className="underline">Eliminación de datos</a></nav></footer>
    </main>
  );
}
