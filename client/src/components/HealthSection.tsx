import contentData from "@/data/content.json";

export default function HealthSection() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Quiero vida y salud</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentData.health.map((article, index) => (
            <article 
              key={article.id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              data-testid={`health-article-${article.id}`}
            >
              <img 
                src={getHealthImage(index)} 
                alt={article.title} 
                className="w-full h-32 object-cover"
                data-testid={`image-health-${index}`}
              />
              <div className="p-4">
                <div className={`text-sm ${article.categoryColor} font-semibold mb-2`}>
                  {article.category}
                </div>
                <h3 className="font-bold text-gray-800 text-sm">{article.title}</h3>
              </div>
            </article>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <a 
            href="https://quierovidaysalud.com/" 
            className="text-blue-600 hover:text-blue-700 font-semibold"
            data-testid="link-mas-articulos"
          >
            Más artículos
          </a>
        </div>
      </div>
    </section>
  );
}

function getHealthImage(index: number): string {
  const images = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
  ];
  return images[index] || images[0];
}
