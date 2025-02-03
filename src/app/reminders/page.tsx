import CalendarView from "@/app/components/ui/CalendarView";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <CalendarView />
    </div>
  );
}