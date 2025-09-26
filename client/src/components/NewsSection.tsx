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

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {contentData.news.map((article, index) => (
            <article
              key={article.id}
              className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col transition-transform duration-300 hover:scale-[1.015]"
              data-testid={`article-${article.id}`}
            >
              <div className="h-[280px] w-full overflow-hidden">
               <img
  src={getNewsImage(index)}
  alt={article.title}
  className="w-full h-full object-contain object-center bg-gray-100"
/>
              </div>

              <div className="flex flex-col justify-between flex-grow p-5">
                <div>
                  <div className={`text-xs uppercase font-semibold mb-2 ${article.categoryColor}`}>
                    {article.category}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 leading-snug mb-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{article.description}</p>
                </div>
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
    "/images/maraton.jpeg",   // imagen vertical de backup
    "/images/cultojoven.jpeg",
  ];
  return images[index] || images[0];
}
