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

    return articles.map(toJournalPost);
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

    return article ? toJournalPost(article) : undefined;
  } catch {
    return getStaticJournalPost(slug);
  }
}
