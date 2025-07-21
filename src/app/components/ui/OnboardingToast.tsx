"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function OnboardingToast() {
    const { data: session, status } = useSession();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
    const checkUserProfile = async () => {
        if (status !== "authenticated" || !session?.user?.email || checked){

          console.log("Check skipped")
          return;
        } 

        try {
        const res = await fetch(`/api/user/profile?email=${session.user.email}`);
        const data = await res.json();
        console.log(`phone number ${data.phoneNumber}`)

        if (!data.phoneNumber) {
            toast.custom((t) => (
                <div className="bg-[#25d366] px-4 py-3 text-black rounded shadow-md border border-green-700 max-w-md flex justify-between items-center gap-4 font-agrandir">
                    <span className="text-sm md:text-base">
                        Add your phone number to your Profile and receive WhatsApp reminders.
                    </span>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="ml-auto text-sm text-black font-semibold hover:underline"
                    >
                        Dismiss
                    </button>
                </div>
            ), {
                id: "missing-phone-toast-inline",
                position: "top-center"
            });
        }

        if (data.phoneNumber && data.reminderCount === 0) {
            toast.custom((t) => (
                <div className="bg-white px-4 py-3 text-black rounded shadow-md border max-w-md flex justify-between items-center gap-4">
                  <span>📱 Add a reminder to start receiving daily WhatsApp reminders :D</span>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-auto text-sm text-blue-600 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              ), {
                id: "missing-reminder-toast"
              });
        }

        setChecked(true);
        } catch (err) {
        console.error("Error checking user profile:", err);
        }
    };

    checkUserProfile();
    }, [session, status, checked]);

    return null;
    }