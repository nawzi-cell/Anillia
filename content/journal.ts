export interface JournalPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  content: string[];
}

export const journalPosts: JournalPost[] = [
  {
    slug: "art-of-layering-modest-wardrobe",
    title: "The Art of Layering: Building a Modest Wardrobe That Works",
    excerpt:
      "A few considered layers can carry you from morning errands to evening gatherings. Here is how to build a modest wardrobe around pieces that work hard, together.",
    date: "2026-09-18",
    image: "/images/journal-1.webp",
    content: [
      "Layering is the quiet foundation of modest dressing. Rather than chasing trends, it is about choosing a small set of pieces that move with you through the day — a breathable underscarf that stays put, a hijab in a fabric that drapes rather than slips, and an outer layer that finishes the silhouette.",
      "Start with your base. A well-fitted jersey underscarf keeps everything in place and protects finer fabrics from daily wear. Over it, choose your hijab by occasion: crinkle georgette for everyday polish, a heavier weave when the weather turns, and something with a little structure for formal evenings.",
      "The rule we return to at ANILLIÉA is simple: every piece should earn its place. If a layer does not work with at least three outfits you already own, it does not belong in the wardrobe. Build slowly, choose fabrics that last, and let the layers do the quiet work of elegance.",
    ],
  },
  {
    slug: "choosing-hijab-fabric-every-season",
    title: "Choosing the Right Hijab Fabric for Every Season",
    excerpt:
      "Georgette, jersey, chiffon, cotton — each fabric has its moment. A practical guide to matching your hijab fabric to Pakistan's changing seasons.",
    date: "2026-08-30",
    image: "/images/journal-2.webp",
    content: [
      "Pakistan's seasons ask a lot of a wardrobe. The humid stretch of summer calls for fabrics that breathe — lightweight cotton and open-weave georgette that keep you cool without constant adjusting. These are the months when a simple jersey underscarf becomes indispensable, absorbing moisture and holding your style in place.",
      "As the air cools, reach for fabrics with more body. Crinkle georgette drapes beautifully over winter layers and needs little ironing, while medium-weight weaves add warmth without bulk. This is also the season to invest in richer, deeper tones that pair with outerwear.",
      "Whatever the season, a few principles hold: natural-feel fibres sit more comfortably against the skin, opaque weaves save you an extra layer, and quality fabric keeps its shape far longer than its cheaper counterpart. Buy fewer, buy better, and your hijabs will reward you for years.",
    ],
  },
  {
    slug: "five-timeless-pieces-modest-closet",
    title: "Five Timeless Pieces Every Modest Closet Needs",
    excerpt:
      "Trends come and go; these five essentials stay. Our editors' shortlist of the pieces that anchor a modest wardrobe year after year.",
    date: "2026-08-02",
    image: "/images/journal-3.webp",
    content: [
      "Every enduring wardrobe is built on a handful of pieces that never ask for attention but always deliver it. For the modest dresser, our editors return to the same five: a neutral everyday hijab, a reliable underscarf, a set of quality pins, a lightweight niqab for those who wear one, and one elevated piece reserved for special occasions.",
      "The everyday hijab does the heaviest lifting, so choose it in a forgiving neutral — warm taupe, soft stone, or deep espresso — that pairs with everything you own. The underscarf is the unsung hero: invisible when it works, noticeable the moment it does not. Invest here without hesitation.",
      "Finally, keep one piece that feels special. A signature bundle or a finely finished hijab in a fabric you love turns an ordinary day into an occasion. Modesty, done well, is never about having less — it is about choosing with intention.",
    ],
  },
];

export function getJournalPost(slug: string): JournalPost | undefined {
  return journalPosts.find((p) => p.slug === slug);
}
