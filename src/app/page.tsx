import OnboardingToast from "./components/ui/OnboardingToast";
import Demo from "./components/ui/Demo";
import { WaitlistButton } from "./components/ui/Waitlist";
import CheckoutButton from "./components/ui/CheckoutButton";
import StripeProvider from "./components/ui/StripeProvider";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from 'next/image';
import OfferSection from "./components/ui/OfferSection";

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
      <div className="w-full flex flex-col items-center py-8 bg-white shadow-sm relative z-10 px-4">
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
          <div className="flex items-center gap-2 text-black text-lg sm:text-xl font-semibold justify-center text-center">
            ✅ Tiny reminders
          </div>
          <div className="flex items-center gap-2 text-black text-lg sm:text-xl font-semibold justify-center text-center">
            🔥 Big wins
          </div>
          <div className="flex items-center gap-2 text-black text-lg sm:text-xl font-semibold justify-center text-center mb-6">
            📱 Delivered daily to your WhatsApp
          </div>
          <h1 className="text-3xl sm:text-4xl font-agrandir font-extrabold text-[#25D366] mb-2 tracking-tight animate-fadeIn text-center">Start for Free. Stay on Track.</h1>
        </div>
      </div>

      <OfferSection/>

      {/* Demo Section
      <div className="w-full flex flex-col items-center mt-12">
        <div className="mb-4 text-[#25D366] font-bold text-xl animate-fadeInUp">See it in action</div>
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-6 animate-fadeInUp delay-100">
          <Demo />
        </div>
      </div> */}

      {/* Mission Statement Section */}
      <div className="w-full flex flex-col items-center mt-12 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#25D366] mb-4 font-agrandir text-center">Our Mission</h2>
        <div className="max-w-2xl text-base sm:text-xl text-black text-center leading-relaxed space-y-4">
          <p>To help people show up for the things that matter —<br/>with one tiny nudge at a time.</p>
          <p>Because building a better life isn’t about big moments —<br/>it’s about remembering to do the small things, consistently.<br/>And that’s what we’re here for.<br/><span className="font-bold text-[#25D366]">Every. Single. Day.</span></p>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="w-full flex flex-col items-center mt-8 px-4">
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