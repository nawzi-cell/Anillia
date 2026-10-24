import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { serverFetch, type Collection } from "@/lib/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Reveal } from "@/components/shared/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { collectionImage } from "@/lib/imagery";
import { ArrowUpRight, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Curated ANILLIÉA collections — everyday essentials, signature pieces and gift edits.",
};

export default async function CollectionsPage() {
  const collections = await serverFetch<Collection[]>("/api/collections").catch(
    () => [] as Collection[]
  );

  return (
    <>
      <PageHeader
        eyebrow="Curated edits"
        title={
          <>
            Curated <em className="text-olive-dark">Collections</em>
          </>
        }
        description="Small, considered edits — each collection gathers pieces that belong together."
        trail={[{ label: "Collections" }]}
        meta={
          collections.length > 0 ? (
            <p className="flex items-baseline gap-2 border-b border-espresso/15 pb-1 font-sans text-[10px] uppercase tracking-widest2 text-taupe-dark">
              <span className="font-serif text-2xl italic text-espresso">
                {collections.length}
              </span>
              edit{collections.length === 1 ? "" : "s"}
            </p>
          ) : undefined
        }
      />

      <div className="container-x py-10 pb-16 md:pb-24">
      {collections.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Collections are on their way"
          description="We're curating something beautiful. Browse the full shop in the meantime."
          action={
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-espresso px-6 py-3 font-sans text-[13px] font-semibold uppercase tracking-widest2 text-ivory hover:bg-espresso-light"
            >
              Shop all
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((col, i) => (
            <Reveal key={col.slug} delay={0.05 * i}>
              <Link
                href={`/collections/${col.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-ivory-dark ring-1 ring-inset ring-espresso/5"
              >
                {collectionImage(col.slug, col.image) ? (
                  <Image
                    src={collectionImage(col.slug, col.image)!}
                    alt={col.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-ivory-dark to-taupe/40">
                    <span className="font-serif text-3xl text-espresso">{col.name}</span>
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/25 to-espresso/5 transition-colors duration-500 group-hover:from-espresso/95"
                  aria-hidden
                />
                <span className="absolute right-5 top-5 flex h-10 w-10 translate-y-1 items-center justify-center rounded-full border border-ivory/30 text-ivory opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-7">
                  <p className="font-sans text-[9px] uppercase tracking-widest2 text-ivory/60">
                    0{i + 1} — Edit
                  </p>
                  <h2 className="mt-1.5 font-serif text-3xl text-ivory">{col.name}</h2>
                  {col.description && (
                    <p className="mt-2 line-clamp-2 font-sans text-sm leading-relaxed text-ivory/75">
                      {col.description}
                    </p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-widest2 text-ivory">
                    Explore
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
