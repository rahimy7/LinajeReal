import { useState, useEffect } from "react";
import { Instagram, Facebook, Youtube } from "lucide-react";

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden min-h-[600px] flex items-center bg-gradient-to-br from-blue-900 via-blue-800 to-orange-500">
      {/* Background city image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
        }}
      />

      <div className="container mx-auto px-4 relative z-20">
        <div className="flex items-center justify-between">
          {/* Social Media Icons */}
          <div className="flex flex-col space-y-4 mr-8">
            <a 
              href="#" 
              className="w-12 h-12 bg-black bg-opacity-70 rounded-full flex items-center justify-center text-white hover:bg-opacity-90 transition-all"
              data-testid="social-instagram-hero"
            >
              <Instagram className="w-6 h-6" />
            </a>
            <a 
              href="#" 
              className="w-12 h-12 bg-black bg-opacity-70 rounded-full flex items-center justify-center text-white hover:bg-opacity-90 transition-all"
              data-testid="social-facebook-hero"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a 
              href="#" 
              className="w-12 h-12 bg-black bg-opacity-70 rounded-full flex items-center justify-center text-white hover:bg-opacity-90 transition-all"
              data-testid="social-youtube-hero"
            >
              <Youtube className="w-6 h-6" />
            </a>
          </div>

          {/* YouTube Video Player - Centrado pero más a la izquierda */}
          <div className="flex-1 max-w-3xl ml-8">
            <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden shadow-2xl">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/HyoKx3hDnKQ?autoplay=1&mute=1&controls=1&rel=0"
                title="Miami Central Spanish SDA"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                data-testid="youtube-player"
              />
            </div>
          </div>

          {/* Espacio vacío a la derecha para balancear */}
          <div className="w-16"></div>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white opacity-100 scale-125' : 'bg-white opacity-50 hover:opacity-75'
            }`}
            onClick={() => setCurrentSlide(index)}
            data-testid={`carousel-indicator-${index}`}
          />
        ))}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white opacity-10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-300 opacity-20 rounded-full blur-2xl"></div>
      <div className="absolute top-1/3 right-20 w-16 h-16 bg-blue-300 opacity-15 rounded-full blur-lg"></div>
    </section>
  );
}