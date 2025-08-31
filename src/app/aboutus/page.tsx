import React from 'react';
import Head from 'next/head';
import Link from 'next/link'; // Optional: if you link to other pages like Contact or Privacy

// Define a type for the component props if you anticipate any, otherwise it's not strictly needed for a simple page.
// type AboutUsPageProps = {};

const AboutUsPage: React.FC = () => {
  // --- IMPORTANT: Replace placeholders below with YOUR actual information ---
  const legalCompanyName = "NEVER FORGET ONE LIMITED";
  const brandName = "never forget";
  const registeredAddress = "Unit A, 82 James Carter Road, Mildenhall, United Kingdom, IP28 7DE";
  // Optional:
  const companyRegistrationNumber = "16379290";
  const foundingYear = "2025";
  const contactEmail = "charlie@neverforget.one";

  return (
    <>
      <Head>
        <title>About Us - {brandName}</title>
        <meta
          name="description"
          content={`Learn more about ${brandName}, our story, and our commitment to helping you remember what matters most.`}
        />
      </Head>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-black mb-4">
            our story
          </h1>
          <p className="text-xl text-gray-600 italic">
            real change doesn&apos;t come from big leaps - it comes from small, consistent steps.
          </p>
        </header>

        <section className="mb-12 max-w-4xl">
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed text-left">
            <p>
              One morning on my commute, I saw it happen, again - someone hitting their forehead in frustration. They&apos;d forgotten someone&apos;s birthday. Not because they didn&apos;t care, but because life gets busy. No card, no gift, no fix.
            </p>
            
            <p>
              It hit me: we don&apos;t need more productivity hacks, we just need better nudges.
            </p>
            
            <p>
              That moment became never forget - a daily WhatsApp message with the things that matter to you: anniversaries, to-do lists, life admin. Because good habits build good lives - deeper relationships, better routines, and more opportunities to show up.
            </p>
            
            <p>
              We keep things simple. No apps. No fuss. Just one gentle reminder a day. And when things change? Just reply on the chat. Our built-in AI will update your reminders on the spot.
            </p>
            
            <p className="font-medium text-gray-800">
              Because the most important things in life aren&apos;t hard to do - they are just easy to forget.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-700 mb-6 text-left">
            our commitment
          </h2>
          <div className="max-w-4xl space-y-4">
            <p className="text-lg text-gray-600 leading-relaxed">
              Your trust means everything. We take your privacy seriously and protect the reminders you share with us using strong security and clear principles. No surprises. Read more in our{' '}
              <Link href="/privacy" legacyBehavior>
                <a className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</a>
              </Link>.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Got a question or concern? Email me directly — <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:text-blue-800 underline">{contactEmail}</a>.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              We keep things honest, simple, and human. always 💚
            </p>
          </div>
        </section>

        <section className="mb-12 bg-gray-200 p-8 rounded-lg">
          <h2 className="text-3xl font-semibold text-black mb-6 text-left">
            get in touch
          </h2>
          <div className="max-w-4xl">
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Let us know if you have any questions, feedback, ideas, or support. We&apos;re always listening and always happy to help.{' '}
              <Link href="/contact" legacyBehavior>
                <a className="text-blue-600 hover:text-blue-800 underline">Contact us here</a>
              </Link>.
            </p>
            
            <div className="space-y-2 text-gray-600">
              <p className="text-lg font-medium">
                <strong>{legalCompanyName}</strong>
              </p>
              <p className="text-lg">
                Address: {registeredAddress}
              </p>
              {companyRegistrationNumber && (
                <p className="text-lg">
                  Company Registration No: {companyRegistrationNumber}
                </p>
              )}
              <p className="text-lg">
                Email: <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:text-blue-800 underline">{contactEmail}</a>
              </p>
            </div>
          </div>

          <p className="text-lg text-gray-600 leading-relaxed">
              {brandName} is a product of <strong>{legalCompanyName}</strong>, a company registered in the United Kingdom with Companies House.
            </p>
        </section>
      </div>
    </>
  );
};

export default AboutUsPage;