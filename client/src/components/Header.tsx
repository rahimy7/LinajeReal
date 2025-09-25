import { useState } from "react";
import { Globe, Search, Menu, ChevronDown, Shield } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAdminAccess = () => {
    const password = prompt("Ingrese la contraseña de administrador:");
    if (password === "LinajeMaraton7") {
      window.location.href = "/admin";
    } else {
      alert("Contraseña incorrecta");
    }
  };

  return (
    <header className="bg-white shadow-sm">
      {/* Main Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="/images/logo.jpg" 
                  alt="Iglesia Adventista del 7mo Día - Central Linaje Real"
                  className="w-12 h-12 object-contain"
                  data-testid="logo-image"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Iglesia Adventista del 7mo Dia</h1>
                <p className="text-lg font-bold text-gray-800">CENTRAL LINAJE REAL</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <a 
                href="#" 
                className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-6"
                data-testid="nav-inicio"
              >
                Inicio
              </a>
              <div className="relative group">
                <button 
                  className="text-gray-700 hover:text-blue-600 flex items-center space-x-1"
                  data-testid="nav-departamentos"
                >
                  <span>Departamentos</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="relative group">
                <a 
                  href="/biblia" 
                  className="text-gray-700 hover:text-blue-600 flex items-center space-x-1"
                  data-testid="nav-maraton"
                >
                  <span>Maratón Bíblico</span>
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>
              <div className="relative group">
                <button 
                  className="text-gray-700 hover:text-blue-600 flex items-center space-x-1"
                  data-testid="nav-nosotros"
                >
                  <span>Sobre Nosotros</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="relative group">
                <button 
                  className="text-gray-700 hover:text-blue-600 flex items-center space-x-1"
                  data-testid="nav-construccion"
                >
                  <span>Proyecto de Construcción</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Admin Access Button */}
              <button
                onClick={handleAdminAccess}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                data-testid="admin-access"
                title="Acceso Administrador"
              >
                <Shield className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">Admin</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mobile-menu active bg-white border-b" data-testid="mobile-menu">
          <div className="container mx-auto px-4 py-4">
            <div className="space-y-4">
              <a href="#" className="block text-blue-600 font-semibold">Inicio</a>
              <a href="#" className="block text-gray-700">Departamentos</a>
              <a href="/biblia" className="block text-gray-700">Maratón Bíblico</a>
              <a href="#" className="block text-gray-700">Sobre Nosotros</a>
              <a href="#" className="block text-gray-700">Proyecto de Construcción</a>
              
              {/* Admin Access for Mobile */}
              <button
                onClick={handleAdminAccess}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full"
              >
                <Shield className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">Administrador</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}