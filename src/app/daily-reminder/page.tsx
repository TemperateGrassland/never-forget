import { ReminderProvider } from "@/context/ReminderContext";
import AddReminderForm from "../components/ui/AddReminderForm";
import DashboardTable from "../components/ui/DashboardTable";
import OnboardingToast from "../components/ui/OnboardingToast";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function DailyReminder() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/");
    }

    // Fetch user from database to check phone number
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { phoneNumber: true }
    });

    if (!user?.phoneNumber) {
        redirect("/profile?message=phone-required&from=reminders");
    }

    return (
        <div className="min-h-screen px-4 sm:px-6 md:px-8 lg:px-16 pt-20 sm:pt-24 md:pt-28 pb-8">
            <div className="w-full max-w-6xl mx-auto">
                <div className="mb-8 sm:mb-10 md:mb-12">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-black mb-3 sm:mb-4 leading-tight">
                        your daily reminders
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-xl sm:max-w-2xl leading-relaxed">
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