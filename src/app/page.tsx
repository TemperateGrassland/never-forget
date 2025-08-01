// src/app/page.tsx

export default function HomePage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden" data-page="homepage">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img
          src="/bg-hero-1024.jpg"
          alt="Sunrise background"
          className="w-full h-full object-cover"
          srcSet="
            /bg-hero-640.jpg 640w,
            /bg-hero-1024.jpg 1024w,
            /bg-hero-1600.jpg 1600w
          "
          sizes="100vw"
        />
      </div>

    <div className="relative z-10 flex flex-col items-start justify-center text-left h-full px-4 sm:px-6 md:px-8 lg:px-16 pt-16 sm:pt-20">        
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 sm:mb-4 text-white leading-tight">
          daily reminders to your whatsapp
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-8 max-w-lg sm:max-w-xl leading-relaxed">
          no apps, no fuss - just one simple nudge a day to help you build better habits.
        </p>
        <a
          href="/signup"
          className="bg-[#25d366] text-white font-semibold text-sm sm:text-base md:text-lg px-4 sm:px-6 py-3 sm:py-4 rounded-md shadow hover:bg-[#128C7E] transition-colors"
        >
          get started
        </a>
      </div>
    </div>
  );
}