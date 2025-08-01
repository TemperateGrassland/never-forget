import { ReminderProvider } from "@/context/ReminderContext";
import AddReminderForm from "../components/ui/AddReminderForm";
import DashboardTable from "../components/ui/DashboardTable";
import OnboardingToast from "../components/ui/OnboardingToast";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function DailyReminder() {
    const session = await auth();

    if (!session?.user?.phoneNumber) {
        redirect("/profile?message=phone-required&from=reminders");
    }

    return (
        <div className="min-h-screen px-4 md:px-8 lg:px-16 pt-28 pb-8">
            <div className="w-full max-w-6xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold text-black mb-4">
                        your daily reminders
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
                        never forget sends you a daily whatsapp nudge when a reminder is due within 7 days or less
                    </p>
                </div>
                
                <ReminderProvider>
                    <div className="space-y-8">
                        <AddReminderForm />
                        <DashboardTable />
                    </div>
                </ReminderProvider>

                <OnboardingToast />
            </div>
        </div>
    );
}