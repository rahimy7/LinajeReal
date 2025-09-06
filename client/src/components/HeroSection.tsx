import { useState, useEffect } from "react";

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
    <section className="hero-gradient relative overflow-hidden min-h-[600px] flex items-center">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
        }}
      />
      
      {/* Figure with raised arms */}
      <div className="absolute right-10 top-10 z-10 opacity-80 hidden md:block">
        <img 
          src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600" 
          alt="Person with raised arms in worship" 
          className="w-64 h-96 object-cover rounded-lg shadow-2xl"
          data-testid="hero-worship-image"
        />
      </div>

      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Semana de la<br />
            Esperanza 2025
          </h2>
          <div className="text-4xl md:text-5xl lg:text-7xl font-black text-adventist-orange-600 mb-8 leading-none">
            LA<br />
            VERDAD<br />
            REVELA
          </div>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200"
            data-testid="button-hero-accede"
          >
            ACCEDE
          </button>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-opacity ${
              index === currentSlide ? 'bg-white opacity-100' : 'bg-white opacity-50'
            }`}
            onClick={() => setCurrentSlide(index)}
            data-testid={`carousel-indicator-${index}`}
          />
        ))}
      </div>
    </section>
  );
}
