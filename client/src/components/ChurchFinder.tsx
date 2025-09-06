import { useState } from "react";
import { Search, MapPin, Smartphone } from "lucide-react";

export default function ChurchFinder() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <section className="bg-adventist-blue-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Church Finder */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4">Encuentra una iglesia</h3>
            <p className="text-blue-200 mb-6">Iglesias adventistas ubicadas en la División Sudamericana.</p>
            <div className="space-y-4">
              <p className="text-white font-semibold">Búsqueda de iglesias</p>
              <form onSubmit={handleSearch} className="flex">
                <input 
                  type="text" 
                  placeholder="Búsqueda por código postal, ciudad, barrio..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-l-lg border-0 focus:ring-2 focus:ring-blue-400"
                  data-testid="input-church-search"
                />
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-r-lg font-semibold flex items-center"
                  data-testid="button-church-search"
                >
                  <Search className="w-5 h-5 mr-2" />
                  BÚSQUEDA
                </button>
              </form>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="text-blue-600 w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Para tu sábado</h4>
                <p className="text-sm text-gray-600">Materiales que complementan tu momento de adoración.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Smartphone className="text-orange-600 w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800">7Me</h4>
                <p className="text-sm text-gray-600">Tu iglesia más cerca de ti</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
