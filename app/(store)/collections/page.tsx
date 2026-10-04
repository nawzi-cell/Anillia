import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { serverFetch, type Collection } from "@/lib/api/client";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Layers } from "lucide-react";

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
    <div className="container-x pb-16 md:pb-20">
      <Breadcrumbs trail={[{ label: "Collections" }]} />
      <div className="mb-8 mt-2">
        <SectionHeading
          eyebrow="Curated edits"
          title="Collections"
          description="Small, considered edits — each collection gathers pieces that belong together."
        />
      </div>

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
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-dark"
              >
                {col.image ? (
                  <Image
                    src={col.image}
                    alt={col.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-serif text-3xl text-taupe">{col.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-espresso/30 transition-colors group-hover:bg-espresso/40" aria-hidden />
                <div className="absolute inset-x-0 bottom-0 p-7">
                  <h2 className="font-serif text-3xl text-ivory">{col.name}</h2>
                  {col.description && (
                    <p className="mt-2 line-clamp-2 font-sans text-sm text-ivory/85">
                      {col.description}
                    </p>
                  )}
                  <span className="mt-4 inline-block font-sans text-xs font-semibold uppercase tracking-widest2 text-ivory underline underline-offset-4">
                    Explore
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
