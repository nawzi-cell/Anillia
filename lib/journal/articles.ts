import { prisma } from "@/lib/db/prisma";
import {
  getJournalPost as getStaticJournalPost,
  journalPosts as staticJournalPosts,
  type JournalPost,
} from "@/content/journal";

type JournalArticleRow = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  content: string[];
  publishedAt: Date;
};

function toJournalPost(article: JournalArticleRow): JournalPost {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    image: article.image,
    date: article.publishedAt.toISOString().slice(0, 10),
    content: article.content,
  };
}

export async function getPublishedJournalPosts(): Promise<JournalPost[]> {
  try {
    const articles = await prisma.journalArticle.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      select: {
        slug: true,
        title: true,
        excerpt: true,
        image: true,
        content: true,
        publishedAt: true,
      },
    });

    // Until the first article is published in the admin panel, keep the
    // bundled editorial content as the storefront's starting library.
    return articles.length > 0 ? articles.map(toJournalPost) : staticJournalPosts;
  } catch {
    return staticJournalPosts;
  }
}

export async function getPublishedJournalPost(
  slug: string,
): Promise<JournalPost | undefined> {
  try {
    const article = await prisma.journalArticle.findFirst({
      where: { slug, published: true },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        image: true,
        content: true,
        publishedAt: true,
      },
    });

    if (article) return toJournalPost(article);
    const publishedCount = await prisma.journalArticle.count({
      where: { published: true },
    });
    return publishedCount === 0 ? getStaticJournalPost(slug) : undefined;
  } catch {
    return getStaticJournalPost(slug);
  }
}
