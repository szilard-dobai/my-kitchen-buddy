"use client";

import Image from "next/image";
import { useState } from "react";

interface AuthorAvatarProps {
  src: string;
  alt: string;
}

export function AuthorAvatar({ src, alt }: AuthorAvatarProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={24}
      height={24}
      className="rounded-full"
      onError={() => setImageError(true)}
    />
  );
}
