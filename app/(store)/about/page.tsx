import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Feather, HeartHandshake, Leaf, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "About",
  description:
    "The ANILLIÉA story — premium modest fashion thoughtfully curated in Pakistan.",
};

const VALUES = [
  {
    icon: Leaf,
    title: "Considered curation",
    text: "A small range, chosen slowly. Every piece earns its place through fabric, drape and longevity — never noise.",
  },
  {
    icon: Feather,
    title: "Comfort as luxury",
    text: "Breathable, opaque fabrics that sit softly and stay put. Modest dressing should feel effortless, not fussy.",
  },
  {
    icon: HeartHandshake,
    title: "Honest craft",
    text: "Fair sourcing, careful finishing and pricing that respects both maker and wearer.",
  },
  {
    icon: Truck,
    title: "Made for Pakistan",
    text: "Designed for our climate and our lives, delivered to every corner of the country.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="container-x py-14 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow flex items-center gap-3">
              <span className="h-px w-8 bg-taupe/80" aria-hidden />
              About ANILLIÉA
            </p>
            <h1 className="mt-5 text-balance font-serif text-5xl leading-[1.02] text-espresso md:text-6xl">
              Modesty, <em className="text-olive-dark">made modern</em>
            </h1>
            <p className="mt-6 font-sans text-base leading-relaxed text-espresso-muted">
              ANILLIÉA began in Karachi with a simple observation: modest
              dressing deserves the same thoughtfulness as any other kind of
              dressing. Too often, the essentials — the everyday hijab, the
              reliable underscarf, the pins that hold it all together — are an
              afterthought. We set out to change that.
            </p>
            <p className="mt-4 font-sans text-base leading-relaxed text-espresso-muted">
              Today we curate a considered range of hijabs, underscarves and
              accessories, each chosen for its fabric, its drape, and the quiet
              confidence it gives the woman wearing it. No excess, no noise —
              just everyday elegance, delivered across Pakistan.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-ivory-dark shadow-soft">
              <Image
                src="/images/brand-story.webp"
                alt="Folded ivory, sage and taupe fabrics with gold pins in the ANILLIÉA atelier"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-espresso/20 via-transparent to-transparent"
                aria-hidden
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section aria-label="Our values" className="bg-ivory-light">
        <div className="container-x py-16 md:py-20">
          <Reveal>
            <SectionHeading
              eyebrow="What we stand for"
              title="Our Values"
            />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={0.06 * i} className="h-full">
                <div className="group relative h-full rounded-[1.35rem] border border-espresso/10 bg-ivory/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-espresso/20 hover:bg-ivory hover:shadow-lift">
                  <span className="absolute right-5 top-5 font-serif text-2xl italic text-taupe/50 transition-colors group-hover:text-gold-dark">
                    0{i + 1}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-olive/20 bg-olive/[0.08]">
                    <v.icon className="h-[18px] w-[18px] text-olive-dark" aria-hidden />
                  </div>
                  <h2 className="mt-6 font-serif text-2xl text-espresso">{v.title}</h2>
                  <p className="mt-2.5 font-sans text-sm leading-relaxed text-espresso-muted">
                    {v.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16 text-center md:py-20">
        <Reveal>
          <span className="mx-auto mb-6 block h-px w-14 bg-taupe/60" aria-hidden />
          <p className="eyebrow mb-4">Begin</p>
          <h2 className="mx-auto max-w-xl text-balance font-serif text-4xl text-espresso md:text-5xl">
            Elegance is in the <em className="text-olive-dark">details</em>
          </h2>
          <p className="mx-auto mt-4 max-w-md font-sans text-base text-espresso-muted">
            Explore the collection and find the pieces your everyday has been
            waiting for.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/shop">
              <Button size="lg">Shop the collection</Button>
            </Link>
            <Link href="/journal">
              <Button size="lg" variant="secondary">
                Read the journal
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
