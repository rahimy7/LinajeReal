import contentData from "@/data/content.json";

export default function FeaturedContent() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {contentData.featured.map((item) => (
            <div key={item.id} className={`bg-gradient-to-br ${item.gradient} rounded-xl p-6 text-center`}>
              <img 
                src={getImageForItem(item.id)} 
                alt={item.title} 
                className="w-full h-32 object-cover rounded-lg mb-4"
                data-testid={`image-${item.id}`}
              />
              <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              <a 
                href={item.link} 
                className={`inline-block ${item.buttonColor} text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors`}
                data-testid={`button-${item.id}`}
              >
                {item.buttonText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getImageForItem(id: string): string {
  const images = {
    "probad-y-ved": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    "escuela-sabatica": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    "semana-esperanza": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
    "7class": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
  };
  return images[id as keyof typeof images] || images["probad-y-ved"];
}
