import { useState } from "react";
import contentData from "@/data/content.json";
import { Play, X, ExternalLink } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  link: string;
  duration?: string;
  youtubeId?: string;
}

export default function VideosSection() {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Función para extraer el ID de YouTube de diferentes formatos de URL
  const getYouTubeId = (url: string): string | undefined => {
    // Expresión regular mejorada que incluye YouTube Live
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : undefined;
  };

  // Función para obtener la miniatura de YouTube
  const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Procesar videos para extraer IDs de YouTube
  const processedVideos: VideoItem[] = contentData.videos.map(video => ({
    ...video,
    youtubeId: getYouTubeId(video.link)
  }));

  const openVideoModal = (video: VideoItem) => {
    setSelectedVideo(video);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  return (
    <>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Videos</h2>
            <a 
              href="https://videos.adventistas.org/es/" 
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
              data-testid="link-mas-videos"
            >
              Más videos
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          {/* Reel de videos horizontal */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 w-max">
              {processedVideos.map((video, index) => (
                <div 
                  key={video.id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer flex-shrink-0 w-80"
                  data-testid={`video-${video.id}`}
                  onClick={() => openVideoModal(video)}
                >
                  <div className="relative">
                    <img 
                      src={video.youtubeId ? getYouTubeThumbnail(video.youtubeId) : getVideoImage(index)} 
                      alt={video.title} 
                      className="w-full h-48 object-cover"
                      data-testid={`image-video-${index}`}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-red-600 rounded-full p-3">
                        <Play className="text-white w-8 h-8 ml-1" fill="white" />
                      </div>
                    </div>
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
                        {video.duration}
                      </div>
                    )}
                    {/* Badge de YouTube */}
                    {video.youtubeId && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                        YouTube
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight">
                      {video.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicador de scroll */}
          <div className="flex justify-center mt-4">
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>Desliza para ver más videos</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de video */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold text-gray-800 truncate">
                {selectedVideo.title}
              </h3>
              <button
                onClick={closeVideoModal}
                className="text-gray-500 hover:text-gray-700 p-2"
                data-testid="close-video-modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="aspect-video">
              {selectedVideo.youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="youtube-iframe"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Video no disponible para reproducción embebida</p>
                    <a
                      href={selectedVideo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Ver en sitio original
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getVideoImage(index: number): string {
  const images = [
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450"
  ];
  return images[index] || images[0];
}