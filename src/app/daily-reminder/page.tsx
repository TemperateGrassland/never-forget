import { Elements } from "@stripe/react-stripe-js";
import AddReminderForm from "../components/ui/AddReminderForm";
import DashboardTable from "../components/ui/DashboardTable";
import CheckoutButton from "../components/ui/CheckoutButton";
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