import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import MetricsDashboard from './MetricsDashboard';

function getAdminEmails(): string[] {
  return process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
}

export default async function MetricsPage() {
  const session = await auth();
  
  // Check if user is authenticated
  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/dashboard/metrics');
  }
  
  // Check if user is admin
  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes(session.user.email);
  
  if (!isAdmin) {
    redirect('/?error=access-denied');
  }
  
  return <MetricsDashboard />;
}