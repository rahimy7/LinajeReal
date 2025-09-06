import { Book, GraduationCap, Heart } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Banner 1 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-center text-white">
            <Book className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">EN QUÉ CREEMOS</h3>
            <p className="text-blue-100 mb-4">Conoce las 28 creencias fundamentales de la Iglesia Adventista</p>
            <a 
              href="https://institucional.adventistas.org/es/nuestras-crencias/" 
              className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              data-testid="button-creencias"
            >
              Descubre
            </a>
          </div>

          {/* Banner 2 */}
          <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-8 text-center text-white">
            <GraduationCap className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">LECCIÓN 4</h3>
            <p className="text-green-100 mb-4">Estudia la lección de Escuela Sabática de esta semana</p>
            <a 
              href="https://www.adventistas.org/es/escuelasabatica/" 
              className="inline-block bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              data-testid="button-leccion"
            >
              Estudiar
            </a>
          </div>

          {/* Banner 3 */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-xl p-8 text-center text-white">
            <Heart className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">PODEMOS ORAR</h3>
            <p className="text-orange-100 mb-4">Comparte tu pedido de oración con nosotros</p>
            <a 
              href="http://adv.st/pedidodeoracion" 
              className="inline-block bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              data-testid="button-oracion"
            >
              Orar
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
