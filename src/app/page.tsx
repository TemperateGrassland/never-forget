"use server";

import { auth } from "@/auth";
import { LoginButton } from "./components/ui/SignIn";
import { LogoutButton } from "./components/ui/Signout";

export default async function Page() {
  const session = await auth();

  return (
    <>
    <h1 className="text-3xl font-bold text-center mt-4">
       Do not remember the important dates in your life, <span className="italic underline">Never Forget</span> 
    </h1>
      <div className="flex flex-col items-center mt-4">
        {session?.user ? (
          <>
            <p className="text-lg text-green-600 font-semibold bg-green-100 px-4 py-2 rounded-md shadow-md">
              ✅ You are signed in: {session?.user?.email}
            </p>
            <LogoutButton />
          </>
        ) : (
          <>
            <p className="text-lg text-red-600 font-semibold bg-red-100 px-4 py-2 rounded-md shadow-md">
              🙈 You are not signed in
            </p>
            <LoginButton />
          </>
        )}
      </div>

      {/* New Reminder Form */}
      <div className="mt-6 max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-center mb-4 text-black">Set a Reminder</h2>
        
        {/* Event Name Input */}
        <label className="block text-gray-700 font-medium mb-1 text-black">Event Details</label>
        <input
          type="text"
          placeholder="Enter event details..."
          className="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-black"
        />

        {/* Date Input */}
        <label className="block text-gray-700 font-medium mb-1 text-black">Select Date</label>
        <input
          type="date"
          className="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
        />

        {/* Phone Number Input */}
        <label className="block text-gray-700 font-medium mb-1 text-black">Phone Number</label>
        <input
          type="tel"
          placeholder="Enter phone number..."
          className="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-black"
        />

        {/* Submit Button */}
        <button
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600"
        >
          Submit Reminder
        </button>
      </div>
    </>
)
};

// import { getServerSession } from "next-auth/next"
// import { authOptions } from "./api/auth/[...nextauth]";

// export default async function Home() {
//   const session = await getServerSession(authOptions)
//   return (
//   <div>
//   {/* <pre>{JSON.stringify(session, null, 2)}</pre> */}
//   {/* <h1 style={{ color: "white", fontWeight: "bold" }}>Home</h1> */}
//   </div>
//   )
// }


// // export default function Home() {
//   // return (
    
//     // <div className="bg-gray-100 min-h-screen">
//     //   {/* Header */}
//     //   <header className="bg-white shadow">
//     //     <div className="container mx-auto px-4 py-6 flex justify-between items-center">
//     //       <h1 className="text-2xl font-bold text-indigo-600">NeverForget</h1>
//     //       <nav className="space-x-4">
//     //         <Link href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
//     //           Login/Sign Up
//     //         </Link>
//     //         <Link href="#features" className="text-gray-700 hover:text-indigo-600">
//     //           Features
//     //         </Link>
//     //         <Link href="#pricing" className="text-gray-700 hover:text-indigo-600">
//     //           Pricing
//     //         </Link>
//     //         <Link href="#contact" className="text-gray-700 hover:text-indigo-600">
//     //           Contact
//     //         </Link>
//     //       </nav>
//     //     </div>
//     //   </header>

//     //   {/* Hero Section */}
//     //   <section className="bg-indigo-600 text-white py-20">
//     //     <div className="container mx-auto px-4 text-center">
//     //       <h1 className="text-4xl font-bold mb-4">
//     //         Never Forget Important Events Again
//     //       </h1>
//     //       <p className="text-lg mb-8">
//     //         Schedule reminders to be sent directly to your Email inbox, WhatsApp and/or Mobile.
//     //       </p>
//     //       <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
//     //         Get Started for Free
//     //       </button>
//     //     </div>
//     //   </section>

//     //   {/* Features Section */}
//     //   <section id="features" className="py-16 bg-gray-100">
//     //     <div className="container mx-auto px-4 text-center">
//     //       <h2 className="text-3xl font-bold text-gray-800 mb-6">Features</h2>
//     //       <div className="grid md:grid-cols-3 gap-8">
//     //         <div className="p-6 bg-white rounded-lg shadow flex flex-col items-center">
//     //           <Image src="/email.svg" width={100} height={100} alt="Email" />
//     //           <h3 className="text-xl font-bold text-gray-800 mt-4">Email Reminders</h3>
//     //           <p className="text-gray-600 mt-2">
//     //             Schedule email reminders to never miss an important event.
//     //           </p>
//     //         </div>
//     //         <div className="p-6 bg-white rounded-lg shadow flex flex-col items-center">
//     //           <Image src="/whatsapp.svg" width={100} height={100} alt="WhatsApp" />
//     //           <h3 className="text-xl font-bold text-gray-800 mt-4">
//     //             WhatsApp Reminders
//     //           </h3>
//     //           <p className="text-gray-600 mt-2">
//     //             Get reminders delivered directly to your WhatsApp chat.
//     //           </p>
//     //         </div>
//     //         <div className="p-6 bg-white rounded-lg shadow flex flex-col items-center">
//     //           <Image src="/sms.svg" width={100} height={100} alt="SMS" />
//     //           <h3 className="text-xl font-bold text-gray-800 mt-4">SMS Reminders</h3>
//     //           <p className="text-gray-600 mt-2">
//     //             Get reminders for specific times, recurring tasks, or one-time events direct to your mobile.
//     //           </p>
//     //         </div>
//     //       </div>
//     //     </div>
//     //   </section>

//     //   {/* Pricing Section */}
//     //   <section id="pricing" className="py-16 bg-white">
//     //     <div className="container mx-auto px-4 text-center">
//     //       <h2 className="text-3xl font-bold text-gray-800 mb-6">Pricing</h2>
//     //       <div className="grid md:grid-cols-3 gap-8">
//     //         <div className="p-6 bg-gray-100 rounded-lg shadow">
//     //           <h3 className="text-xl font-bold text-gray-800 mb-4">Free</h3>
//     //           <p className="text-gray-600">Basic email reminders for personal use.</p>
//     //           <p className="text-2xl font-bold text-gray-800 mt-4">$0/month</p>
//     //         </div>
//     //         <div className="p-6 bg-gray-100 rounded-lg shadow">
//     //           <h3 className="text-xl font-bold text-gray-800 mb-4">Pro</h3>
//     //           <p className="text-gray-600">
//     //             Unlimited email and WhatsApp reminders for professionals.
//     //           </p>
//     //           <p className="text-2xl font-bold text-gray-800 mt-4">$10/month</p>
//     //         </div>
//     //         <div className="p-6 bg-gray-100 rounded-lg shadow">
//     //           <h3 className="text-xl font-bold text-gray-800 mb-4">Enterprise</h3>
//     //           <p className="text-gray-600">
//     //             Custom solutions for businesses with bulk reminders.
//     //           </p>
//     //           <p className="text-2xl font-bold text-gray-800 mt-4">Contact us</p>
//     //         </div>
//     //       </div>
//     //     </div>
//     //   </section>

//     //   {/* Contact Section */}
//     //   <section id="contact" className="py-16 bg-indigo-600 text-white">
//     //     <div className="container mx-auto px-4 text-center">
//     //       <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
//     //       <p className="text-lg mb-8">Have questions? We are here to help!</p>
//     //       <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
//     //         Contact Support
//     //       </button>
//     //     </div>
//     //   </section>
//     //   {/* <SignIn /> */}

//     //   {/* Footer */}
//     //   <footer className="bg-gray-800 text-white py-4">
//     //     <div className="container mx-auto px-4 text-center">
//     //       <p>&copy; 2024 NeverForget. All rights reserved.</p>
//     //     </div>
//     //   </footer>
//     // </div>
//   // );
// // }