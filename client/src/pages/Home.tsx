import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ChurchFinder from "@/components/ChurchFinder";
import FeaturedContent from "@/components/FeaturedContent";
import NewsSection from "@/components/NewsSection";
import VideosSection from "@/components/VideosSection";
import HealthSection from "@/components/HealthSection";
import ClassSection from "@/components/ClassSection";
import DownloadsSection from "@/components/DownloadsSection";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";
import MarathonFloatingWidget from "@/components/MarathonFloatingWidget";

export default function Home() {
  const mockReadingProgress = {
    juan: { genesis: [1, 2, 3, 5, 10], mateo: [1, 3, 5] },
    maria: { salmos: [1, 23, 51], juan: [1, 2, 3] },
    pedro: { exodo: [1, 2, 3], marcos: [1] }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
     
      <main className="bg-white">
        <FeaturedContent />
        <NewsSection />
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Destacados</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <a 
                href="#" 
                className="block bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 text-center transition-colors"
                data-testid="link-escuela-sabatica"
              >
                <i className="fas fa-book-open text-3xl mb-4"></i>
                <h3 className="text-xl font-semibold">Escuela Sabática</h3>
              </a>
              <a 
                href="#" 
                className="block bg-green-600 hover:bg-green-700 text-white rounded-xl p-6 text-center transition-colors"
                data-testid="link-jovenes"
              >
                <i className="fas fa-users text-3xl mb-4"></i>
                <h3 className="text-xl font-semibold">Jóvenes</h3>
              </a>
              <a 
                href="#" 
                className="block bg-orange-600 hover:bg-orange-700 text-white rounded-xl p-6 text-center transition-colors"
                data-testid="link-conquistadores"
              >
                <i className="fas fa-medal text-3xl mb-4"></i>
                <h3 className="text-xl font-semibold">Conquistadores</h3>
              </a>
            </div>

            {/* Feliz7Play Section */}
           {/*  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-center text-white mb-12">
              <div className="flex items-center justify-center mb-6">
                <i className="fas fa-play-circle text-4xl mr-3"></i>
                <h3 className="text-3xl font-bold">Feliz7Play</h3>
              </div>
              <a 
                href="https://www.feliz7play.com/" 
                className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                data-testid="button-feliz7play"
              >
                Acceder
              </a>
            </div> */}
          </div>
        </section>
        <VideosSection />
        <HealthSection />
        {/* <ClassSection /> */}
        <DownloadsSection />
        <CallToAction />

        <MarathonFloatingWidget
        readingProgress={mockReadingProgress}
        currentBook="genesis"
        currentChapter={15}
        position="bottom-right"
        theme="default"
      />
      </main>
      <Footer />
    </div>
  );
}
