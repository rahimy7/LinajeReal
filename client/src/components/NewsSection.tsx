import contentData from "@/data/content.json";

export default function NewsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Noticias</h2>
          <a 
            href="https://noticias.adventistas.org/es/" 
            className="text-blue-600 hover:text-blue-700 font-semibold"
            data-testid="link-mas-noticias"
          >
            Más noticias
          </a>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {contentData.news.map((article, index) => (
            <article 
              key={article.id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              data-testid={`article-${article.id}`}
            >
              <img 
                src={getNewsImage(index)} 
                alt={article.title} 
                className="w-full h-48 object-cover"
                data-testid={`image-news-${index}`}
              />
              <div className="p-6">
                <div className={`text-sm ${article.categoryColor} font-semibold mb-2`}>
                  {article.category}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{article.title}</h3>
                <p className="text-gray-600 text-sm">{article.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function getNewsImage(index: number): string {
  const images = [
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    "https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
  ];
  return images[index] || images[0];
}
