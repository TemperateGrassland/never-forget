// src/app/page.tsx

export default function HomePage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
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

    <div className="relative z-10 flex flex-col items-start justify-center text-left h-full px-4 md:px-8 lg:px-16">        
      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
          daily reminders to your whatsapp
        </h1>
        <p className="text-lg md:text-xl text-white mb-8 max-w-xl">
          no apps, no fuss - just one simple nudge a day to help you build better habits.
        </p>
        <a
          href="/signup"
          className="bg-[#25d366] text-white font-semibold text-base sm:text-lg px-6 py-4 rounded-md shadow hover:bg-gray-100 transition"
        >
          get started
        </a>
      </div>
    </div>
  );
}