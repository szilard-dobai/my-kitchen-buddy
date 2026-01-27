import { ChefHat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { PageTracker } from "@/components/tracking/page-tracker";

export const metadata: Metadata = {
  title: "Privacy Policy | My Kitchen Buddy",
  description: "Privacy Policy for My Kitchen Buddy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PageTracker event="privacy_view" />
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
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

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
              1. Information We Collect
            </h2>
            <p>When you use My Kitchen Buddy, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account information:</strong> Email address, name, and
                password when you create an account
              </li>
              <li>
                <strong>Recipe data:</strong> URLs you submit for extraction and
                the resulting recipes saved to your library
              </li>
              <li>
                <strong>Usage data:</strong> How you interact with our service,
                including extraction counts and feature usage
              </li>
              <li>
                <strong>Payment information:</strong> Processed securely by
                Stripe; we do not store your card details
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              2. How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve the recipe extraction service</li>
              <li>Process your subscription and payments</li>
              <li>Send service-related communications</li>
              <li>Enforce our usage limits and terms of service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              3. Third-Party Services
            </h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Stripe:</strong> For payment processing
              </li>
              <li>
                <strong>OpenAI:</strong> For AI-powered recipe extraction
              </li>
              <li>
                <strong>Supadata:</strong> For video transcript retrieval
              </li>
              <li>
                <strong>MongoDB:</strong> For data storage
              </li>
              <li>
                <strong>Telegram:</strong> For optional bot integration
              </li>
            </ul>
            <p className="mt-4">
              Each service has its own privacy policy governing their use of
              your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              4. Data Retention
            </h2>
            <p>
              We retain your account and recipe data for as long as your account
              is active. You can delete your account and associated data by
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              5. Data Security
            </h2>
            <p>
              We implement appropriate security measures to protect your
              personal information. However, no method of transmission over the
              Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your recipe data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and session
              management. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">
              8. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will
              notify you of significant changes by email or through the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">9. Contact</h2>
            <p>
              For privacy-related questions, contact us at:{" "}
              <a
                href="mailto:privacy@"
                className="text-primary hover:underline"
              >
                privacy@
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
