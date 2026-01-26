import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Kitchen Buddy",
    short_name: "Kitchen Buddy",
    description:
      "Transform TikTok, Instagram, and YouTube cooking videos into structured recipes with AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f6",
    theme_color: "#e85d2d",
    icons: [
      {
        src: "/icon_svg.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
