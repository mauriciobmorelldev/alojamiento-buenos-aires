"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import FrontHeader from "@/components/inmo/FrontHeader";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";
import { parseVideoUrl } from "@/lib/video";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const accordionTextVariants = {
  collapsed: {
    opacity: 0,
    maxHeight: 0,
    y: 8,
    filter: "blur(6px)",
  },
  expanded: {
    opacity: 1,
    maxHeight: 132,
    y: 0,
    filter: "blur(0px)",
  },
};

const accordionDetailVariants = {
  collapsed: {
    opacity: 0,
    maxHeight: 0,
    y: 12,
    filter: "blur(8px)",
  },
  expanded: {
    opacity: 1,
    maxHeight: 280,
    y: 0,
    filter: "blur(0px)",
  },
};

const fallbackBuenosAiresImage =
  "https://images.unsplash.com/photo-1599167758481-83f550bb49b3?auto=format&fit=crop&w=2200&q=85";

export default function BuenosAiresPage() {
  const { state } = useInmoStore();
  const themeStyles = buildThemeStyles(state.theme);
  const content = state.homeContent.buenosAires;
  const sections = (content.sections ?? []).filter((section) => section.active);
  const heroVideo = content.heroVideo ? parseVideoUrl(content.heroVideo)?.fileUrl : "";
  const [activeAccordionIndex, setActiveAccordionIndex] = useState(0);

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <FrontHeader active="detail" />
      <main className="overflow-hidden pt-20">
        <section className="relative min-h-[calc(100svh-5rem)]">
          {heroVideo ? (
            <video
              src={heroVideo}
              autoPlay
              muted
              loop
              playsInline
              poster={content.heroImage || undefined}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Image
              src={content.heroImage || fallbackBuenosAiresImage}
              alt={content.menuLabel || "Buenos Aires"}
              fill
              priority
              sizes="100vw"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,28,50,0.94),rgba(27,54,93,0.62),rgba(27,54,93,0.06))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,243,194,0.22),transparent_34%),radial-gradient(circle_at_18%_78%,rgba(47,93,161,0.28),transparent_30%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background via-background/44 to-transparent" />

          <div className="relative mx-auto flex min-h-[calc(100svh-5rem)] max-w-screen-2xl items-end px-6 pb-10 pt-20 lg:px-8 lg:pb-14">
            <div className="w-full">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ type: "spring", stiffness: 120, damping: 24 }}
                className="max-w-5xl text-white"
              >
                <p className="text-xs font-bold uppercase tracking-[0.38em] text-primary-fixed">
                  {content.eyebrow}
                </p>
                <h1 className="mt-6 max-w-5xl font-headline text-5xl font-black leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl">
                  {content.title}
                </h1>
                <p className="mt-7 max-w-3xl text-base leading-8 text-white/84 sm:text-lg">
                  {content.subtitle}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={content.primaryCtaHref || "#guia-ba"}
                    className="inline-flex rounded-full bg-primary-fixed px-6 py-3 text-sm font-black text-primary transition hover:-translate-y-1"
                  >
                    {content.primaryCtaLabel}
                  </a>
                  <Link
                    href={content.secondaryCtaHref || "/propiedades"}
                    target={content.secondaryCtaHref?.startsWith("/propiedades") ? "_blank" : undefined}
                    rel={content.secondaryCtaHref?.startsWith("/propiedades") ? "noreferrer" : undefined}
                    className="inline-flex rounded-full border border-white/35 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/18"
                  >
                    {content.secondaryCtaLabel}
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.14 } },
                }}
                className="mt-12 grid gap-px overflow-hidden rounded-[1.6rem] border border-white/14 bg-white/16 text-white shadow-[0_35px_90px_-58px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4"
              >
                {content.quickFacts.slice(0, 4).map((fact, index) => (
                  <motion.div
                    key={fact}
                    variants={fadeUp}
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="group bg-white/8 p-5 transition hover:bg-white/16"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-primary-fixed/85">
                      0{index + 1}
                    </span>
                    <p className="mt-3 text-sm font-bold leading-6 text-white/88">{fact}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section id="guia-ba" className="relative bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-screen-2xl px-6 lg:px-8">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-end"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.34em] text-primary">
                  {content.introEyebrow}
                </p>
                <h2 className="mt-4 max-w-2xl font-headline text-4xl font-black leading-tight text-primary sm:text-6xl">
                  {content.introTitle}
                </h2>
              </div>
              <p className="max-w-3xl text-lg leading-9 text-on-surface-variant">
                {content.introText}
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              className="mt-14 flex flex-col gap-4 lg:h-[30rem] lg:flex-row"
            >
              {sections.map((section, index) => {
                const isActive = activeAccordionIndex === index;

                return (
                  <motion.button
                    key={section.id}
                    type="button"
                    variants={fadeUp}
                    animate={{ flexGrow: isActive ? 2.35 : 0.78 }}
                    onMouseEnter={() => setActiveAccordionIndex(index)}
                    onFocus={() => setActiveAccordionIndex(index)}
                    onClick={() => setActiveAccordionIndex(index)}
                    aria-expanded={isActive}
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 190, damping: 34, mass: 1 }}
                    className="group relative min-h-[20rem] overflow-hidden rounded-[1.75rem] bg-primary text-left text-white outline-none ring-primary-fixed/0 transition focus-visible:ring-4 lg:min-h-full lg:basis-0"
                  >
                    <Image
                      src={section.image || fallbackBuenosAiresImage}
                      alt={section.title}
                      fill
                      sizes="(min-width: 1024px) 42vw, 100vw"
                      className="object-cover opacity-72 transition duration-700 group-hover:scale-105 group-hover:opacity-88"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(27,54,93,0.05),rgba(27,54,93,0.42)_38%,rgba(13,28,50,0.94))]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(255,243,194,0.28),transparent_34%)] opacity-80" />
                    <div className="relative flex h-full min-h-[20rem] flex-col justify-end p-6 lg:min-h-full">
                      <span className="material-symbols-outlined w-fit rounded-2xl bg-primary-fixed p-3 text-3xl text-primary transition group-hover:scale-105">
                        {section.icon}
                      </span>
                      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white/58">
                        {section.eyebrow}
                      </p>
                      <h3 className="mt-2 text-3xl font-black leading-tight text-primary-fixed lg:text-4xl">
                        {section.title}
                      </h3>
                      <motion.p
                        variants={accordionTextVariants}
                        initial="collapsed"
                        animate={isActive ? "expanded" : "collapsed"}
                        transition={{
                          duration: isActive ? 0.34 : 0.16,
                          delay: isActive ? 0.08 : 0,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="mt-3 max-w-xl overflow-hidden text-sm font-semibold leading-6 text-white/82"
                      >
                        {section.text}
                      </motion.p>
                      <motion.div
                        variants={accordionDetailVariants}
                        initial="collapsed"
                        animate={isActive ? "expanded" : "collapsed"}
                        transition={{
                          duration: isActive ? 0.36 : 0.14,
                          delay: isActive ? 0.14 : 0,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
                          {section.detail}
                        </p>
                        <span className="mt-5 inline-flex rounded-full bg-primary-fixed px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary">
                          Ver capítulo
                        </span>
                      </motion.div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section className="relative bg-primary py-16 text-on-primary sm:py-24">
          <div className="absolute inset-x-0 top-0 h-px bg-primary-fixed/35" />
          <div className="mx-auto grid max-w-screen-2xl gap-20 px-6 lg:px-8">
            {sections.map((section, index) => (
              <motion.article
                id={`ba-${slugify(section.title)}`}
                key={section.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
                className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center"
              >
                <motion.div
                  whileHover={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  className={`relative min-h-[28rem] overflow-hidden rounded-[2rem] ${
                    index % 2 ? "lg:order-2" : ""
                  }`}
                >
                  <Image
                    src={section.image || fallbackBuenosAiresImage}
                    alt={section.title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/82 via-primary/12 to-transparent" />
                  <div className="absolute bottom-5 left-5 rounded-full border border-white/18 bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-white backdrop-blur">
                    Capítulo {String(index + 1).padStart(2, "0")}
                  </div>
                </motion.div>
                <div className="max-w-2xl">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined rounded-2xl bg-primary-fixed p-3 text-3xl text-primary shadow-[0_22px_50px_-30px_rgba(255,243,194,0.8)]">
                      {section.icon}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-on-primary/55">
                        {section.eyebrow}
                      </p>
                      <h2 className="mt-2 font-headline text-4xl font-black leading-tight text-primary-fixed sm:text-5xl">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <p className="mt-8 text-2xl font-semibold leading-9 text-white">
                    {section.text}
                  </p>
                  <p className="mt-5 text-base leading-8 text-on-primary/74">
                    {section.detail}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="bg-primary-fixed py-16 text-primary sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto grid max-w-screen-2xl gap-8 px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary/60">
                {content.finalEyebrow}
              </p>
              <h2 className="mt-3 max-w-3xl font-headline text-4xl font-black leading-tight sm:text-5xl">
                {content.finalTitle}
              </h2>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-primary/72">
                {content.finalText}
              </p>
            </div>
            <Link
              href={content.finalCtaHref || "/propiedades"}
              target={content.finalCtaHref?.startsWith("/propiedades") ? "_blank" : undefined}
              rel={content.finalCtaHref?.startsWith("/propiedades") ? "noreferrer" : undefined}
              className="inline-flex justify-center rounded-full bg-primary px-7 py-4 text-sm font-black uppercase tracking-widest text-on-primary transition hover:-translate-y-1"
              style={{ color: "var(--color-on-primary)" }}
            >
              {content.finalCtaLabel}
            </Link>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
