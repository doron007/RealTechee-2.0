export default function VideoSection() {
    return (
      <section id="video" className="bg-gray-100 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          {/* Left: Video description */}
          <div className="w-full md:w-1/2 md:pr-12 mb-10 md:mb-0">
            <h2 className="text-3xl font-bold text-gray-900">See RealTechee in Action</h2>
            <p className="text-lg text-gray-700 mt-4">
              Watch how RealTechee helps homeowners transform their properties and maximize value. Our platform connects you with the right contractors and manages the entire renovation process from start to finish.
            </p>
            <div className="mt-8">
              <button 
                className="px-6 py-3 rounded-lg font-semibold"
                style={{
                  backgroundColor: "var(--accent-color)",
                  color: "white"
                }}
              >
                Learn more about our process →
              </button>
            </div>
          </div>
          
          {/* Right: Video */}
          <div className="w-full md:w-1/2">
            <div className="rounded-lg overflow-hidden shadow-lg">
              <video 
                controls
                className="w-full"
                poster="/realtechee_testimonial_image.png"
              >
                <source src="/RealTechee Intro.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>
    );
  }  