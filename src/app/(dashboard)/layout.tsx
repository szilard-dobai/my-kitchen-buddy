import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LapsedUserBanner } from "@/components/upgrade/lapsed-user-banner";
import { LapsedUserModal } from "@/components/upgrade/lapsed-user-modal";
import { getSession } from "@/lib/session";
import { getOrCreateSubscription } from "@/models/subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  let isLapsedPro = false;

  if (session?.user) {
    const subscription = await getOrCreateSubscription(session.user.id);
    isLapsedPro =
      subscription.planTier === "free" && !!subscription.stripeCustomerId;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isLapsedPro && <LapsedUserBanner />}
      {isLapsedPro && <LapsedUserModal />}
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">{children}</main>
      <Footer compact />
    </div>
  );
}
