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
          content={`Learn more about ${brandName}, our mission, our team, and our commitment to helping you manage your memories securely and efficiently.`}
        />
      </Head>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Your Whatsapp powered daily reminder service.

          </h1>
          <p className="text-xl text-gray-600">
            Reminding you about what matters most.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-700 mb-4">
            Who We Are
          </h2>
          <p className="text-lg text-gray-600 mb-4 leading-relaxed">
            {brandName} is a product of <strong>{legalCompanyName}</strong>. 
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            {brandName}, delivers daily reminders to you via Whatsapp. {brandName} is designed to help individuals capture, organise, and recieve important information with unprecedented ease and utility.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-700 mb-4">
            Our Mission
          </h2>
          <p className="text-lg text-gray-600 mb-4 leading-relaxed">
            {brandName}&apos;s mission is to empower people to remember the important things by ensuring that no valuable thought, idea, or piece of information is lost or forgotten. {brandName} strives to make daily reminders intuitive, efficient, and accessible to everyone.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-700 mb-4">
            Our Commitment to You
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium text-gray-700">Privacy & Security</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Your trust is paramount. {brandName} is committed to protecting your personal information and the memories you entrust to {brandName}. We employ robust security measures and adhere to strict data privacy principles. To learn more about how we handle your data, please review our{' '}
                <Link href="/privacy-policy" legacyBehavior>
                  <a className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</a>
                </Link>.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-gray-700">Transparency</h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                We believe in clear and honest communication - email me directly at {contactEmail}. Our terms of service and operational policies are designed to be understandable.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12 bg-gray-100 p-6 rounded-lg">
          <h2 className="text-3xl font-semibold text-gray-700 mb-4">
            Get in Touch
          </h2>
          <p className="text-lg text-gray-600 mb-4 leading-relaxed">
            We value your feedback and are here to help. Whether you have a question about {brandName}, a suggestion, or require support, please do not hesitate to reach out.
          </p>
          <p className="text-lg text-gray-600 mb-2 leading-relaxed">
            <strong>{legalCompanyName}</strong>
          </p>
          <p className="text-lg text-gray-600 mb-2 leading-relaxed">
            Address: {registeredAddress}
          </p>
           
          {companyRegistrationNumber && (
            <p className="text-lg text-gray-600 mb-2 leading-relaxed">
              Company Registration No: {companyRegistrationNumber}
            </p>
          )}
          {contactEmail && (
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              Email: <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:text-blue-800 underline">{contactEmail}</a>
            </p>
          )}
        </section>
      </div>
    </>
  );
};

export default AboutUsPage;