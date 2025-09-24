// client/src/App.tsx
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Importar componente de navegación
import Header from "./components/Header";

// Importar páginas existentes
import Home from "@/pages/Home";
import BibliaInteractiva from "./pages/BibliaInteractiva";
import MaratonConfig from "./pages/MaratonConfig";
import NotFound from "@/pages/not-found";

// Importar nuevos componentes de administración
// Nota: Estos componentes deben crearse en client/src/components/
import MarathonAdminDashboard from "./components/MarathonAdminDashboard";
import RealTimeMarathonProgress from "./components/RealTimeMarathonProgress";
import AdminIndexPage from "./components/AdminIndexPage";

// Layout para páginas con header normal
function LayoutWithHeader({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

// Layout para páginas de administración (sin header adicional)
function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

// Router principal con todas las rutas
function Router() {
  return (
    <Switch>
      {/* Páginas públicas con header */}
      <Route path="/" component={() => (
        <LayoutWithHeader>
          <Home />
        </LayoutWithHeader>
      )} />
      
      <Route path="/biblia" component={() => (
        <LayoutWithHeader>
          <BibliaInteractiva />
        </LayoutWithHeader>
      )} />
      
      <Route path="/maraton" component={() => (
        <LayoutWithHeader>
          <MaratonConfig />
        </LayoutWithHeader>
      )} />
      
      {/* Rutas de administración */}
      <Route path="/admin" component={() => (
        <AdminLayout>
          <AdminIndexPage />
        </AdminLayout>
      )} />
      
      <Route path="/admin/dashboard" component={() => (
        <AdminLayout>
          <MarathonAdminDashboard />
        </AdminLayout>
      )} />
      
      <Route path="/admin/live" component={() => (
        <AdminLayout>
          <RealTimeMarathonProgress />
        </AdminLayout>
      )} />
      
      {/* Vista pública en tiempo real */}
      <Route path="/live" component={() => (
        <AdminLayout>
          <RealTimeMarathonProgress />
        </AdminLayout>
      )} />
      
      {/* Página 404 */}
      <Route component={() => (
        <LayoutWithHeader>
          <NotFound />
        </LayoutWithHeader>
      )} />
    </Switch>
  );
}

// Componente principal de la aplicación
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;