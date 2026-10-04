import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ANILLIÉA — Premium Modest Fashion & Everyday Essentials",
    short_name: "ANILLIÉA",
    description:
      "Thoughtfully curated modest essentials designed for everyday elegance. Delivered across Pakistan.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F0E8",
    theme_color: "#2A2521",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "64x64",
        type: "image/png",
      },
    ],
  };
}
