"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function OnboardingToast() {
    const { data: session, status } = useSession();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
    const checkUserProfile = async () => {
        if (status !== "authenticated" || !session?.user?.email || checked) return;

        try {
        const res = await fetch(`/api/user/profile?email=${session.user.email}`);
        const data = await res.json();

        if (!data.phoneNumber) {
            // toast("📱 Add your phone number to start receiving WhatsApp reminders.", {
            // icon: "🔔",
            // duration: 6000,
            // position: "top-center",
            // });
            toast.custom((t) => (
                <div className="bg-white px-4 py-3 text-black rounded shadow-md border max-w-md flex justify-between items-center gap-4">
                  <span>📱 Add your phone number to receive WhatsApp reminders.</span>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-auto text-sm text-blue-600 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              ), {
                id: "missing-phone-toast"
              });
        }

        if (data.reminderCount === 0) {
            toast("⏰ Set your first reminder to start building better habits.", {
            icon: "📝",
            duration: 6000,
            position: "top-center",
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