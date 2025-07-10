'use client'

export default function OfferSection() {
    return (<>
{/* Offer Section */}
 <div className="w-full flex flex-col md:flex-row justify-center gap-8 md:gap-32 px-4 max-w-4xl mx-auto">
        
 <div className="bg-white shadow-2xl border-2 border-black p-6 sm:p-8 flex flex-col items-center justify-between max-w-sm mx-auto" style={{ borderRadius: '2rem' }}>
   <h3 className="text-xl sm:text-2xl font-bold text-[#25D366] mb-2 font-agrandir text-center">Free Plan</h3>
   <p className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-center">
     <span role="img" aria-label="party">🎉</span>
     <span>100% free.</span>
   </p>
   <div className="flex flex-col gap-3 w-full mb-6">
     <div className="flex items-center justify-center bg-[#f6fdf9] rounded-lg p-2 w-full">
       <span className="mr-2 text-xl">✅</span>
       <span className="text-base sm:text-lg">One WhatsApp nudge every single day</span>
     </div>
     <div className="flex items-center justify-center bg-[#f6fdf9] rounded-lg p-2 w-full">
       <span className="mr-2 text-xl">📝</span>
       <span className="text-base sm:text-lg">Up to five reminders to help you remember what matters</span>
     </div>
   </div>
   <p className="text-base text-black mb-6 text-center">No credit card. No fuss. Just daily wins.</p>
   <a
     href="/register"
     className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-colors duration-200 font-agrandir animate-bounce text-center"
     style={{ boxShadow: '0 2px 8px 0 #25D36633' }}
   >
     👉 Join now — for free!
   </a>
 </div>

 <div className="bg-white shadow-2xl border-2 border-black p-6 sm:p-8 flex flex-col items-center justify-between max-w-sm mx-auto" style={{ borderRadius: '2rem' }}>
   <h3 className="text-xl sm:text-2xl font-bold text-[#25D366] mb-2 font-agrandir text-center">Pro Plan</h3>
   <p className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-center">
     <span role="img" aria-label="star">🌟</span>
     <span>£5/month</span>
   </p>
   <div className="flex flex-col gap-3 w-full mb-6">
     <div className="flex items-center justify-center bg-[#f6fdf9] rounded-lg p-2 w-full">
       <span className="mr-2 text-xl">♾️</span>
       <span className="text-base sm:text-lg">Unlimited reminders</span>
     </div>
     <div className="flex items-center justify-center bg-[#f6fdf9] rounded-lg p-2 w-full">
       <span className="mr-2 text-xl">🔔</span>
       <span className="text-base sm:text-lg">Regular WhatsApp nudges</span>
     </div>
   </div>
   <span className="mr-2 text-xl">🥓</span>
   <p className="text-base text-black mb-6 text-center">Track daily progress with streaks.</p>
   <a
     href="/register?plan=pro"
     className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-colors duration-200 font-agrandir text-center"
     style={{ boxShadow: '0 2px 8px 0 #25D36633' }}
   >
     🚀 Go Pro
   </a>
 </div>
</div>
</>);