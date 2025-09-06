import contentData from "@/data/content.json";
import { Play } from "lucide-react";

export default function VideosSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Videos</h2>
          <a 
            href="https://videos.adventistas.org/es/" 
            className="text-blue-600 hover:text-blue-700 font-semibold"
            data-testid="link-mas-videos"
          >
            Más videos
          </a>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {contentData.videos.map((video, index) => (
            <div 
              key={video.id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              data-testid={`video-${video.id}`}
            >
              <div className="relative">
                <img 
                  src={getVideoImage(index)} 
                  alt={video.title} 
                  className="w-full h-48 object-cover"
                  data-testid={`image-video-${index}`}
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <Play className="text-white w-12 h-12" />
                </div>
                {video.duration && (
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    {video.duration}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getVideoImage(index: number): string {
  const images = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450"
  ];
  return images[index] || images[0];
}
