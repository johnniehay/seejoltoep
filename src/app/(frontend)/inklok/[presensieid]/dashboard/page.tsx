
import { notFound, redirect } from 'next/navigation';
import { auth } from "@/auth";
import DashboardClient from './DashboardClient';
import { fetchDashboardData } from '@/lib/inklok'; // Import the server action

type Args = {
  params: {
    presensieid: string
  }
}

export default async function InklokDashboardPage({ params }: Args) {
  const { presensieid } = params;
  const user = (await auth())?.user;

  if (!user) {
    return redirect('/signin');
  }

  // Fetch initial data using the server action
  const { presensie, inklokke, error } = await fetchDashboardData(presensieid);

  if (error) {
    if (error.includes("Toegang verbode")) {
      return <h1>Toegang verbode: Jy het nie toestemming om inklokke te sien nie.</h1>;
    }
    return notFound(); // Or handle other errors as needed
  }

  if (!presensie) {
    return notFound();
  }

  return (
    <DashboardClient
      initialPresensie={presensie}
      initialInklokke={inklokke}
      presensieId={presensieid}
    />
  );
}
