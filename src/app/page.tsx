import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">My Kitchen Buddy</span>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Save recipes from social media
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Paste a TikTok, Instagram, or YouTube link and we&apos;ll extract
            the recipe for you. No more losing recipes in your saved posts.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Start saving recipes</Button>
            </Link>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            Works with TikTok, Instagram Reels, and YouTube videos
          </p>
        </div>
      </main>
    </div>
  );
}
