// src/app/page.tsx

"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/subscription-plans';
import CheckoutButton from '@/app/components/ui/CheckoutButton';
import { Check, Star } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const plans = Object.values(SUBSCRIPTION_PLANS);

  const handleGetStarted = () => {
    // Scroll to the how it works section
    const howItWorksSection = document.querySelector('[data-section="how-it-works"]');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
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
            /bg-hero-charlie-1600.jpg 1600w
          "
          sizes="100vw"
        />
      </div>

    <div className="relative z-10 flex flex-col items-start justify-center text-left h-full px-4 sm:px-6 md:px-8 lg:px-16 pt-16 sm:pt-20">        
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 sm:mb-4 text-white leading-tight">
          daily reminders to your whatsapp
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white mb-6 sm:mb-8 max-w-lg sm:max-w-xl leading-relaxed">
          no apps, no fuss - just one nudge a day to help you build better habits.
        </p>
        <button 
                    onClick={handleGetStarted}
                    className="bg-[#25d366] hover:bg-[#20bd5a] text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#25d366] focus:ring-offset-2 text-base sm:text-lg"
                    aria-label="Learn how it works"
                    type="button"
                  >
                    learn how it works
        </button>
      </div>
    </div>

    <div className="bg-white py-16 sm:py-20" data-section="how-it-works">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-left">
            how it works
          </h2>
        </div>
        
        <div className="space-y-6 text-lg sm:text-xl text-gray-700 leading-relaxed">
          <p>
            never forget sends you a daily WhatsApp message with the things you want to remember - like birthdays, booking the dentist, or time to stretch after work. Set a reminder today and get a nudge tomorrow morning - and every day after that.
          </p>
          <p>
            and if things change? You can update your reminders on the web app.
          </p>
          <p className="space-y-6 text-xl sm:text-2xl font-medium text-gray-900 text-left pt-8">
            the things that matter most in life aren&apos;t always hard to do - they&apos;re just easy to forget.
          </p>
        </div>
      </div>
    </div>

    {/* Pricing Section */}
    <div className="bg-gradient-to-br from-blue-50 to-green-50 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Never forget another birthday with our simple, affordable reminder service. 
            Start free and upgrade when you need more.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`
                relative bg-white rounded-2xl shadow-lg border-2 p-8 transition-transform hover:scale-105
                ${plan.popular ? 'border-[#25d366] shadow-green-100' : 'border-gray-200'}
              `}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#25d366] text-white px-2 py-2 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatPrice(plan)}
                </div>
                <p className="text-gray-600">
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <div className="mb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div className="mb-4">
                <CheckoutButton
                  planId={plan.id as 'free' | 'pro'}
                  className={`
                    w-full py-3 px-6 rounded-lg font-medium transition-colors
                    ${plan.popular 
                      ? 'bg-[#25d366] hover:bg-[#1fb854] text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }
                  `}
                >
                  {plan.id === 'free' ? 'Start Free' : 'Upgrade to Pro'}
                </CheckoutButton>
              </div>

              {/* Usage Limits */}
              <div className="text-center text-sm text-gray-500">
                {plan.limits.monthlyReminderDeliveries === null ? (
                  'Unlimited birthday reminders'
                ) : (
                  `${plan.limits.monthlyReminderDeliveries} birthday reminders per month`
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What counts as a birthday reminder?
              </h4>
              <p className="text-gray-600 text-sm">
                Each WhatsApp message sent to remind you of someone&apos;s birthday counts as one delivery. 
                Creating reminders is unlimited on both plans.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                When does my monthly limit reset?
              </h4>
              <p className="text-gray-600 text-sm">
                Your delivery count resets on the first day of each month, giving you a fresh start 
                with your monthly allowance.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h4>
              <p className="text-gray-600 text-sm">
                Yes! You can upgrade to Pro anytime. Changes take effect immediately, 
                and you&apos;ll only be charged for the time you use.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Why limit free users?
              </h4>
              <p className="text-gray-600 text-sm">
                WhatsApp messages cost money to send. The 3-reminder limit helps us keep 
                the free plan sustainable while providing great value for just 99p/month.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-8 text-gray-500">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>Secure payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}