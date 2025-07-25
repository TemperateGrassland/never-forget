import AddReminderForm from "../components/ui/AddReminderForm";
import DashboardTable from "../components/ui/DashboardTable";
import OnboardingToast from "../components/ui/OnboardingToast";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DailyReminder() {
    const session = await auth();

    if (!session?.user?.phoneNumber) {
        redirect("/profile");
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4">
            <h1 className="block font-medium text-secondary text-black mb-2 text-center">
          never forget sends you a daily WhatsApp nudge when a reminder is due within 7 days or less
        </h1>
            <div className="mt-6">
                <AddReminderForm />
            </div>

            <div className="mt-6">
                <DashboardTable />
            </div>

            <div className="mt-6">
                <OnboardingToast />
            </div>
        </div>
    );
}