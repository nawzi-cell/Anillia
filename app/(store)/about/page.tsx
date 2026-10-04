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
            <p className="eyebrow mb-4">About ANILLIÉA</p>
            <h1 className="font-serif text-5xl leading-[1.05] text-espresso md:text-6xl">
              Modesty, made modern
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
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ivory-dark">
              <Image
                src="/images/brand-story.svg"
                alt="The ANILLIÉA atelier — fabric and craft"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
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
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={0.06 * i}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-olive/10">
                  <v.icon className="h-5 w-5 text-olive-dark" aria-hidden />
                </div>
                <h2 className="mt-4 font-serif text-2xl text-espresso">{v.title}</h2>
                <p className="mt-2 font-sans text-sm leading-relaxed text-espresso-muted">
                  {v.text}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16 text-center md:py-20">
        <Reveal>
          <p className="eyebrow mb-4">Begin</p>
          <h2 className="mx-auto max-w-xl font-serif text-4xl text-espresso md:text-5xl">
            Elegance is in the details
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
