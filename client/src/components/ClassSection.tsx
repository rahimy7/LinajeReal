import contentData from "@/data/content.json";

export default function ClassSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">IASD - 7Class</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contentData.courses.map((course, index) => (
            <div 
              key={course.id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              data-testid={`course-${course.id}`}
            >
              <img 
                src={getCourseImage(index)} 
                alt={course.title} 
                className="w-full h-32 object-cover"
                data-testid={`image-course-${index}`}
              />
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-sm">{course.title}</h3>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <a 
            href="https://www.7class.app/showcase" 
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            data-testid="button-descubre-mas"
          >
            Descubre Más
          </a>
        </div>
      </div>
    </section>
  );
}

function getCourseImage(index: number): string {
  const images = [
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
    "https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
  ];
  return images[index] || images[0];
}
