import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/shared/JsonLd";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { getPublishedJournalPost, getPublishedJournalPosts } from "@/lib/journal/articles";
import { formatPostDate } from "@/components/shared/format";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPublishedJournalPost(params.slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.image, alt: post.title }],
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function JournalPostPage({ params }: { params: { slug: string } }) {
  const [post, journalPosts] = await Promise.all([
    getPublishedJournalPost(params.slug),
    getPublishedJournalPosts(),
  ]);
  if (!post) notFound();

  const idx = journalPosts.findIndex((p) => p.slug === post.slug);
  const nextPost =
    journalPosts.length > 1 ? journalPosts[(idx + 1) % journalPosts.length] : null;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.image.startsWith("http") ? post.image : `${siteUrl}${post.image}`,
    datePublished: post.date,
    author: { "@type": "Organization", name: "ANILLIÉA" },
    publisher: { "@type": "Organization", name: "ANILLIÉA" },
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <article className="container-x max-w-3xl pb-16 md:pb-20">
        <Breadcrumbs
          trail={[{ label: "Journal", href: "/journal" }, { label: post.title }]}
        />
        <header className="mt-4 text-center">
          <p className="eyebrow mb-4">{formatPostDate(post.date)}</p>
          <h1 className="font-serif text-4xl leading-tight text-espresso md:text-5xl">
            {post.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-sans text-base leading-relaxed text-espresso-muted">
            {post.excerpt}
          </p>
        </header>

        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl bg-ivory-dark">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>

        <div className="mx-auto mt-10 max-w-2xl space-y-6">
          {post.content.map((para, i) => (
            <p
              key={i}
              className={`font-sans leading-relaxed text-espresso-muted ${
                i === 0 ? "text-lg text-espresso" : "text-base"
              }`}
            >
              {para}
            </p>
          ))}
        </div>

        <div className="hairline mx-auto mt-12 max-w-2xl pt-8 text-center">
          <p className="eyebrow mb-3">The ANILLIÉA letter</p>
          <p className="font-serif text-2xl text-espresso">
            More notes like this, monthly
          </p>
          <NewsletterForm className="mx-auto mt-5 max-w-md" />
        </div>

        {nextPost && nextPost.slug !== post.slug && (
          <Link
            href={`/journal/${nextPost.slug}`}
            className="group mt-12 flex items-center justify-between gap-4 rounded-2xl border border-espresso/10 bg-ivory-light p-6"
          >
            <span className="flex items-center gap-3">
              <ArrowLeft className="h-4 w-4 text-espresso-muted transition-transform group-hover:-translate-x-1" aria-hidden />
              <span>
                <span className="block font-sans text-xs uppercase tracking-widest2 text-espresso-muted">
                  Next article
                </span>
                <span className="mt-1 block font-serif text-xl text-espresso">
                  {nextPost.title}
                </span>
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-espresso-muted" aria-hidden />
          </Link>
        )}
      </article>
    </>
  );
}
