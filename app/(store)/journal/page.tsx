import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { journalPosts } from "@/content/journal";
import { formatPostDate } from "@/components/shared/format";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Styling notes, fabric guides and wardrobe wisdom from the ANILLIÉA editors.",
};

export default function JournalPage() {
  const [featured, ...rest] = journalPosts;

  return (
    <div className="container-x pb-16 md:pb-20">
      <Breadcrumbs trail={[{ label: "Journal" }]} />
      <div className="mb-10 mt-2">
        <SectionHeading
          eyebrow="Notes & guides"
          title="The Journal"
          description="Styling notes, fabric guides and wardrobe wisdom — written slowly, meant to last."
        />
      </div>

      {featured && (
        <Reveal>
          <Link
            href={`/journal/${featured.slug}`}
            className="group grid overflow-hidden rounded-3xl border border-espresso/10 bg-ivory-light md:grid-cols-2"
          >
            <div className="relative aspect-[16/10] bg-ivory-dark md:aspect-auto md:min-h-[320px]">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="font-sans text-xs uppercase tracking-widest2 text-taupe-dark">
                Featured · {formatPostDate(featured.date)}
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-espresso transition-colors group-hover:text-taupe-dark md:text-4xl">
                {featured.title}
              </h2>
              <p className="mt-4 line-clamp-3 font-sans text-sm leading-relaxed text-espresso-muted">
                {featured.excerpt}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso">
                Read article
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </div>
          </Link>
        </Reveal>
      )}

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {rest.map((post, i) => (
          <Reveal key={post.slug} delay={0.06 * i}>
            <Link href={`/journal/${post.slug}`} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ivory-dark">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <p className="mt-4 font-sans text-xs uppercase tracking-widest2 text-taupe-dark">
                {formatPostDate(post.date)}
              </p>
              <h2 className="mt-2 font-serif text-2xl leading-snug text-espresso transition-colors group-hover:text-taupe-dark md:text-3xl">
                {post.title}
              </h2>
              <p className="mt-2 line-clamp-2 font-sans text-sm leading-relaxed text-espresso-muted">
                {post.excerpt}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
