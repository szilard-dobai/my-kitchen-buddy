import { ChefHat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { PageTracker } from "@/components/tracking/page-tracker";

export const metadata: Metadata = {
  title: "Terms of Service | My Kitchen Buddy",
  description: "Terms of Service for My Kitchen Buddy",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PageTracker event="terms_view" />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ChefHat className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">My Kitchen Buddy</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using My Kitchen Buddy, you agree to be bound by
              these Terms of Service. If you do not agree, please do not use our
              service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              2. Description of Service
            </h2>
            <p>
              My Kitchen Buddy is a web application that extracts recipes from
              cooking videos on platforms like TikTok, Instagram, and YouTube
              using AI technology. We provide tools to save, organize, and
              manage your extracted recipes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              3. User Accounts
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You must provide accurate information when creating an account
              </li>
              <li>
                You are responsible for maintaining the security of your account
              </li>
              <li>You must be at least 13 years old to use this service</li>
              <li>One person may not maintain more than one account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              4. Subscription and Payments
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Free Tier:</strong> 10 recipe extractions per month
              </li>
              <li>
                <strong>Pro Tier:</strong> 100 recipe extractions per month for
                $5/month or $50/year
              </li>
              <li>Payments are processed securely through Stripe</li>
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>
                You may cancel your subscription at any time through your
                account settings
              </li>
              <li>Refunds are handled on a case-by-case basis</li>
              <li>
                <strong>Subscription End:</strong> When your Pro subscription
                ends, your account reverts to the Free tier. All your recipes,
                collections, and tags are retained. You can continue to view,
                edit, and delete existing content. However, creating new
                collections or tags beyond Free tier limits (3 collections, 5
                tags) will require resubscribing to Pro.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              5. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to circumvent usage limits or access controls</li>
              <li>Share your account credentials with others</li>
              <li>
                Use automated tools to access the service beyond normal use
              </li>
              <li>
                Reproduce, duplicate, or resell the service without permission
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              6. Content and Intellectual Property
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Recipe content extracted from videos remains subject to original
                creators&apos; rights
              </li>
              <li>You are responsible for your use of extracted recipes</li>
              <li>
                The My Kitchen Buddy service, branding, and code are our
                intellectual property
              </li>
              <li>
                You retain ownership of any recipes you manually create or edit
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              7. Third-Party Services
            </h2>
            <p>
              Our service relies on third-party platforms (TikTok, Instagram,
              YouTube) for video content. We are not responsible for changes to
              these platforms that may affect our service. Video availability
              and extraction accuracy depend on these external services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              8. Disclaimer of Warranties
            </h2>
            <p>
              The service is provided &quot;as is&quot; without warranties of
              any kind. We do not guarantee the accuracy of extracted recipes.
              Always use your judgment when following recipes, especially
              regarding food safety, allergies, and dietary restrictions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for
              any indirect, incidental, special, or consequential damages
              arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account for
              violations of these terms. You may delete your account at any
              time. Upon termination, your right to use the service ceases
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              11. Changes to Terms
            </h2>
            <p>
              We may modify these terms at any time. Continued use of the
              service after changes constitutes acceptance of the new terms. We
              will notify users of significant changes via email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              12. Governing Law
            </h2>
            <p>
              These terms are governed by the laws of Romania. Any disputes
              shall be resolved in the courts of Romania.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">13. Contact</h2>
            <p>
              For questions about these terms, contact us at:{" "}
              <a
                href="mailto:support@"
                className="text-primary hover:underline"
              >
                support@
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
