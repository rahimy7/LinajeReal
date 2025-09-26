import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-adventist-blue-900 text-white py-12">
      <div className="container mx-auto px-4">
        
        
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4">Ministerios</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li><a href="#" className="hover:text-white" data-testid="footer-escuela-sabatica">Escuela Sabática</a></li>
              <li><a href="#" className="hover:text-white" data-testid="footer-ministerio-joven">Ministerio Joven</a></li>
              <li><a href="#" className="hover:text-white" data-testid="footer-ministerio-infantil">Ministerio Infantil</a></li>
              <li><a href="#" className="hover:text-white" data-testid="footer-ministerio-familia">Ministerio de la Familia</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li><a href="#" className="hover:text-white" data-testid="footer-downloads">Descargas</a></li>
              <li><a href="#" className="hover:text-white" data-testid="footer-videos">Videos</a></li>
              <li><a href="#" className="hover:text-white" data-testid="footer-7class">7Class</a></li>
              <li><a href="#" className="hover:text-white" data-testid="footer-feliz7play">Feliz7Play</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Institucional</h4>
            <ul className="space-y-2 text-blue-200 text-sm">
              <li><a href="#" className="hover:text-white" data-testid="footer-sobre-nosotros">Sobre Nosotros</a></li>
              <li><a href="#" className="hover:text-white" data-testid="footer-creencias">Creencias</a></li>
              <li><a href="#" className="hover:text-white" data-testid="footer-historia">Historia</a></li>
              <li><a href="#" className="hover:text-white" data-testid="footer-contacto">Contacto</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Síguenos</h4>
            <div className="flex space-x-4">
              <a  href="https://www.facebook.com/IASDLinajeReal"  className="text-blue-200 hover:text-white" data-testid="social-facebook">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://www.instagram.com/iasdlinajereal"  className="text-blue-200 hover:text-white" data-testid="social-instagram">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://www.youtube.com/@IASDLinajeReal"  className="text-blue-200 hover:text-white" data-testid="social-youtube">
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-blue-800 pt-8 text-center text-blue-200 text-sm">
          <p>&copy; Iglesia Adventista del Séptimo Día - Central Linaje Real. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
