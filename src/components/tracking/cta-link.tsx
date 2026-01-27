"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/tracking";

interface CTALinkProps {
  href: string;
  cta: "hero" | "features" | "bottom";
  children: ReactNode;
  className?: string;
}

export function CTALink({ href, cta, children, className }: CTALinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent("homepage_cta_click", { cta })}
    >
      {children}
    </Link>
  );
}
