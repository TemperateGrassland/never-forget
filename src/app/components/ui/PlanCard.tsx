interface PlanCardProps {
    title: string;
    price: string;
    features: { icon: string; text: string }[];
    ctaLabel: string;
    ctaHref: string;
  }
  
  export default function PlanCard({
    title,
    price,
    features,
    ctaLabel,
    ctaHref,
  }: PlanCardProps) {
    return (
      <div className="bg-white shadow-2xl border-2 border-black p-6 sm:p-8 flex flex-col items-center justify-between max-w-sm mx-auto w-full" style={{ borderRadius: '2rem' }}>
        <h3 className="text-xl sm:text-2xl font-bold text-[#25d366] mb-2 font-agrandir text-center">
          {title}
        </h3>
        <p className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 text-center">
          {price}
        </p>
        <div className="flex flex-col gap-3 w-full mb-6">
          {features.map((item, i) => (
            <div key={i} className="flex items-center justify-center bg-[#f6fdf9] rounded-lg p-2 w-full">
              <span className="mr-2 text-xl">{item.icon}</span>
              <span className="text-base sm:text-lg">{item.text}</span>
            </div>
          ))}
        </div>
        <a
          href={ctaHref}
          className="w-full bg-[#25d366] hover:bg-[#1ebe5d] text-black font-bold py-3 px-6 rounded-full text-lg shadow-lg transition-colors duration-200 font-agrandir text-center"
          style={{ boxShadow: '0 2px 8px 0 #25d36633' }}
        >
          {ctaLabel}
        </a>
      </div>
    );
  }