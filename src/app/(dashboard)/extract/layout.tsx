import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Extract Recipe",
  description:
    "Paste a TikTok, Instagram, or YouTube cooking video URL and let AI extract a complete, structured recipe for you.",
};

export default function ExtractLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
