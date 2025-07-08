import OnboardingToast from "./components/ui/OnboardingToast";
import Demo from "./components/ui/Demo";
import { WaitlistButton } from "./components/ui/Waitlist";
import CheckoutButton from "./components/ui/CheckoutButton";
import StripeProvider from "./components/ui/StripeProvider";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from 'next/image';

export const metadata = {
  title: "Daily Reminders via Whatsapp | Never Forget",
  description: "Set and manage daily WhatsApp reminders with Never Forget.",
};

export default async function Page() {
  const session = await auth();
  if (session?.user) {
    redirect("/daily-reminder");
  }

  return (
    <>
      {/* Hero Section */}
      <div className="w-full flex flex-col items-center py-10 bg-white shadow-sm relative z-10">
        {/* New bullet points from tagline */}
        <div className="flex items-center gap-2 text-black text-xl font-semibold justify-center text-center">
            ✅ Tiny reminders
          </div>
          <div className="flex items-center gap-2 text-black text-xl font-semibold justify-center text-center">
            🔥 Big wins
          </div>
          <div className="flex items-center gap-2 text-black text-xl font-semibold justify-center text-center mb-8">
            📱 Delivered daily to your WhatsApp
          </div>
        {/* <Image src="/NeverForgetLogo.svg" alt="Never Forget Logo" width={180} height={60} className="mb-4" /> */}
        <h1 className="text-4xl sm:text-5xl font-agrandir font-extrabold text-[#25D366] mb-2 tracking-tight animate-fadeIn">Start for Free. Stay on Track.</h1>
      </div>

      {/* Offer Section */}
      <div className="w-full flex justify-center mt-[-2rem] z-20 relative">
        <div className="max-w-4xl w-full flex flex-col md:flex-row gap-12 md:gap-32 items-stretch animate-fadeInUp px-2 md:px-0">
          {/* Free Plan Box */}
          <div
            className="flex-1 bg-white shadow-2xl border-2 border-black p-10 flex flex-col items-center justify-between min-w-[260px] mx-2 my-4"
            style={{ borderRadius: '2rem' }}
          >
            <h3 className="text-2xl font-bold text-[#25D366] mb-2 font-agrandir">Free Plan</h3>
            <p className="text-lg font-semibold mb-4 flex items-center gap-2 text-center">
              <span role="img" aria-label="party">🎉</span>
              <span>100% free.</span>
            </p>
            <div className="flex flex-col gap-4 w-full mb-6">
              <div className="flex items-center justify-center bg-[#f6fdf9] rounded-lg p-3 w-full">
                <span className="mr-3 text-2xl">✅</span>
                <span className="text-base sm:text-lg">One WhatsApp nudge every single day</span>
              </div>
              <div className="flex items-center justify-center bg-[#f6fdf9] rounded-lg p-3 w-full">
                <span className="mr-3 text-2xl">📝</span>
                <span className="text-base sm:text-lg">Up to five reminders to help you remember what matters</span>
              </div>
            </div>
            <p className="text-base text-black mb-6 text-center">No credit card. No fuss. Just daily wins.</p>
            <a
              href="/register"
              className="inline-block bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-2 px-6 rounded-full text-lg shadow-lg transition-colors duration-200 font-agrandir animate-bounce"
              style={{ boxShadow: '0 2px 8px 0 #25D36633' }}
            >
              👉 Join now — for free!
            </a>
          </div>
          {/* Pro Plan Box */}
          <div
            className="flex-1 bg-white shadow-2xl border-2 border-black p-10 flex flex-col items-center justify-between min-w-[260px] mx-2 my-4"
            style={{ borderRadius: '2rem' }}
          >
            <h3 className="text-2xl font-bold text-[#25D366] mb-2 font-agrandir">Pro Plan</h3>
            <p className="text-lg font-semibold mb-4 flex items-center gap-2 text-center">
              <span role="img" aria-label="star">🌟</span>
              <span>£5/month</span>
            </p>
            <div className="flex flex-col gap-4 w-full mb-6">
              <div className="flex items-center justify-center bg-[#f6fdf9] rounded-lg p-3 w-full">
                <span className="mr-3 text-2xl">♾️</span>
                <span className="text-base sm:text-lg">Unlimited reminders</span>
              </div>
              <div className="flex items-center justify-center bg-[#f6fdf9] rounded-lg p-3 w-full">
                <span className="mr-3 text-2xl">🔔</span>
                <span className="text-base sm:text-lg">Regular WhatsApp nudges</span>
              </div>
            </div>
            <p className="text-base text-black mb-6 text-center">Track daily progress with streaks.</p>
            <a
              href="/register?plan=pro"
              className="inline-block bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-2 px-6 rounded-full text-lg shadow-lg transition-colors duration-200 font-agrandir"
              style={{ boxShadow: '0 2px 8px 0 #25D36633' }}
            >
              🚀 Go Pro
            </a>
          </div>
        </div>
      </div>

      {/* Demo Section
      <div className="w-full flex flex-col items-center mt-12">
        <div className="mb-4 text-[#25D366] font-bold text-xl animate-fadeInUp">See it in action</div>
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-6 animate-fadeInUp delay-100">
          <Demo />
        </div>
      </div> */}

      {/* Mission Statement Section */}
      <div className="w-full flex flex-col items-center mt-10 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#25D366] mb-4 font-agrandir text-center">Our Mission</h2>
        <div className="max-w-2xl text-lg sm:text-xl text-black text-center leading-relaxed space-y-4">
          <p>To help people show up for the things that matter —<br/>with one tiny nudge at a time.</p>
          <p>Because building a better life isn’t about big moments —<br/>it’s about remembering to do the small things, consistently.<br/>And that’s what we’re here for.<br/><span className="font-bold text-[#25D366]">Every. Single. Day.</span></p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="w-full flex flex-col items-center mt-10 space-y-2">
        {/* <div className="flex flex-col items-center justify-center gap-10 w-full max-w-2xl animate-fadeInUp delay-200 text-center">
          <div className="flex items-center gap-2 text-[#25D366] text-xl font-semibold justify-center text-center">
            ✅ Build habits that stick
          </div>
          <div className="flex items-center gap-2 text-[#25D366] text-xl font-semibold justify-center text-center">
            📱 Works with WhatsApp — no extra apps needed
          </div>
          <div className="flex items-center gap-2 text-[#25D366] text-xl font-semibold justify-center text-center">
            🔥 Never miss what matters
          </div>
        </div> */}
        <OnboardingToast />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1) both;
        }
        .animate-fadeInUp {
          animation: fadeIn 1s cubic-bezier(0.4,0,0.2,1) both;
        }
        .animate-bounce {
          animation: bounce 1.2s infinite alternate;
        }
        @keyframes bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>
    </>
  );
}