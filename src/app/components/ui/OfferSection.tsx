import PlanCard from './PlanCard';

const freeFeatures = [
  { icon: '✅', text: 'One WhatsApp nudge every single day' },
  { icon: '📝', text: 'Up to five reminders to help you remember what matters' },
  { icon: '🎉', text: 'No credit card. No fuss. Just daily wins.' },
];

const proFeatures = [
  { icon: '♾️', text: 'Unlimited reminders to your whatsapp' },
  { icon: '🔔', text: 'Regular WhatsApp nudges' },
  { icon: '🥓', text: 'Track daily progress with streaks' },
];

export default function OfferSection() {
  return (
    <div className="w-full flex flex-col md:flex-row justify-center gap-8 md:gap-32 px-4 max-w-4xl mx-auto">
      <PlanCard
        title="Free Plan"
        price="🎉 100% free."
        features={freeFeatures}
        ctaLabel="👉 Join now — for free!"
        ctaHref="/register"
      />
      <PlanCard
        title="Pro Plan"
        price="🌟 £5/month"
        features={proFeatures}
        ctaLabel="🚀 Go Pro"
        ctaHref="/register?plan=pro"
      />
    </div>
  );
}