"use client";

import { ChefHat, ChevronDown, Menu, Settings, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { signOut, useSession } from "@/lib/auth-client";

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/recipes" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-110">
            <ChefHat className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg hidden sm:inline-block">
            My Kitchen Buddy
          </span>
        </Link>

        <div className="hidden md:flex items-center">
          {session?.user && (
            <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  {session.user.name || session.user.email}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-2">
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <button
          className="md:hidden cursor-pointer p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-4 space-y-3">
            {session?.user && (
              <>
                <p className="text-sm text-muted-foreground py-2">
                  {session.user.name || session.user.email}
                </p>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Settings
                </Link>
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign out
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
