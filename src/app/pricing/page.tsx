"use client";

import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/subscription-plans';
import CheckoutButton from '@/app/components/ui/CheckoutButton';
import { Check, Star } from 'lucide-react';

export default function PricingPage() {
  const plans = Object.values(SUBSCRIPTION_PLANS);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Never forget another birthday with our simple, affordable reminder service. 
            Start free and upgrade when you need more.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
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
                  <div className="bg-[#25d366] text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
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

              {/* Introductory Pricing Notice for Pro Plan */}
              {plan.id === 'pro' && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 text-center">
                    <span className="font-medium">Limited Time:</span> This introductory price of 99p will increase to £1.99 in March 2025. 
                    Sign up now to lock in this rate forever!
                  </p>
                </div>
              )}

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
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What counts as a birthday reminder?
              </h3>
              <p className="text-gray-600 text-sm">
                Each WhatsApp message sent to remind you of someone&apos;s birthday counts as one delivery. 
                Creating reminders is unlimited on both plans.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                When does my monthly limit reset?
              </h3>
              <p className="text-gray-600 text-sm">
                Your delivery count resets on the first day of each month, giving you a fresh start 
                with your monthly allowance.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes! You can upgrade to Pro anytime. Changes take effect immediately, 
                and you&apos;ll only be charged for the time you use.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Why limit free users?
              </h3>
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
  );
}