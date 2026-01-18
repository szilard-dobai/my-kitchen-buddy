"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/recipes" className="text-xl font-bold">
          My Kitchen Buddy
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/recipes"
            className="text-gray-600 hover:text-gray-900"
          >
            Recipes
          </Link>
          <Link
            href="/extract"
            className="text-gray-600 hover:text-gray-900"
          >
            Extract
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {session?.user?.name || session?.user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
