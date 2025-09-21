import { useState } from "react";
import { Globe, Search, Menu, ChevronDown } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      {/* Top Bar */}
   {/*    <div className="bg-gray-100 py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-end space-x-4 text-sm text-gray-600">
            <a href="#" className="hover:text-blue-600" data-testid="link-institucional">INSTITUCIONAL</a>
            <a href="#" className="hover:text-blue-600" data-testid="link-noticias">NOTICIAS</a>
            <a href="#" className="hover:text-blue-600" data-testid="link-videos">VIDEOS</a>
            <a href="#" className="hover:text-blue-600" data-testid="link-downloads">DOWNLOADS</a>
            <a href="#" className="hover:text-blue-600" data-testid="link-busqueda">
              <Search className="inline w-4 h-4 mr-1" />
              BÚSQUEDA
            </a>
            <a href="#" className="hover:text-blue-600 flex items-center" data-testid="link-language">
              <Globe className="w-4 h-4 mr-1" />
              ES
              <ChevronDown className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div> */}

      {/* Main Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="/src/data/images/logo.jpg" 
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
             {/*  <a 
                href="https://www.feliz7play.com/" 
                className="text-gray-700 hover:text-blue-600"
                data-testid="nav-feliz7play"
              >
                feliz7play.com
              </a> */}
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
            </div>
          </div>
        </div>
      )}
    </header>
  );
}