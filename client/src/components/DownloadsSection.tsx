import contentData from "@/data/content.json";

export default function DownloadsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">IASD - Downloads</h2>
        
        <div className="carousel-container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contentData.downloads.map((download, index) => (
              <div 
                key={download.id} 
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                data-testid={`download-${download.id}`}
              >
                <img 
                  src={getDownloadImage(index)} 
                  alt={download.title} 
                  className="w-full h-32 object-cover"
                  data-testid={`image-download-${index}`}
                />
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-sm">{download.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function getDownloadImage(index: number): string {
  const images = [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
    "https://images.unsplash.com/photo-1485182708500-e8f1f318ba72?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
  ];
  return images[index] || images[0];
}
