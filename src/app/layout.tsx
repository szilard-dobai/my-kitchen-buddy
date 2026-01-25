import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://mykitchenbuddy.app"
  ),
  title: {
    template: "%s | My Kitchen Buddy",
    default: "My Kitchen Buddy - Turn Cooking Videos Into Recipes",
  },
  description:
    "Transform TikTok, Instagram, and YouTube cooking videos into structured recipes with AI. Get ingredients, steps, and nutrition info in seconds.",
  keywords: [
    "recipe extractor",
    "cooking video to recipe",
    "TikTok recipe",
    "Instagram recipe",
    "YouTube recipe",
    "AI recipe extraction",
    "cooking assistant",
    "recipe converter",
    "video to recipe",
  ],
  authors: [{ name: "My Kitchen Buddy" }],
  creator: "My Kitchen Buddy",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "My Kitchen Buddy",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>

        <Analytics />
      </body>
    </html>
  );
}
