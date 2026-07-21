"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { abaCultureImages, abaPropertyMoodImages } from "@/lib/abaMedia";

const focusItems = [
  {
    title: "Agenda de la semana",
    eyebrow: "Qué pasa ahora",
    text: "Una selección curada de planes, muestras, noches, cafés y recorridos para entrar rápido en ritmo porteño.",
    href: "/vivir-buenos-aires?categoria=agenda",
    image: abaCultureImages[21],
  },
  {
    title: "Editorial",
    eyebrow: "La ciudad escrita",
    text: "Crónicas, ensayos y miradas de autores sobre barrios, arquitectura, rituales y escenas de Buenos Aires.",
    href: "/vivir-buenos-aires",
    image: abaCultureImages[10],
  },
  {
    title: "Descubrí Buenos Aires",
    eyebrow: "Barrios y guías",
    text: "Palermo, Recoleta, San Telmo y otros mapas sensibles para elegir dónde vivir con contexto real.",
    href: "/barrios",
    image: abaCultureImages[7],
  },
  {
    title: "Vida porteña",
    eyebrow: "Vivir desde adentro",
    text: "Cafés, librerías, bodegones, transporte, costumbres y pequeñas decisiones que hacen hogar una estadía.",
    href: "/vivir-buenos-aires?categoria=vida-portena",
    image: abaPropertyMoodImages[1],
  },
];

export default function AbaHomeFocusMenu() {
  return (
    <section className="aba-home-focus" aria-labelledby="aba-home-focus-title">
      <div className="aba-home-focus__header">
        <p className="aba-label">Cuatro entradas a la ciudad</p>
        <h2 id="aba-home-focus-title">Elegí por dónde empezar Buenos Aires.</h2>
      </div>

      <div className="aba-home-focus__grid">
        {focusItems.map((item, index) => (
          <motion.article
            key={item.title}
            className="aba-home-focus__card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 0.62, delay: index * 0.055, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href={item.href} className="aba-home-focus__link" aria-label={item.title}>
              <img src={item.image} alt="" loading={index < 2 ? "eager" : "lazy"} decoding="async" />
              <div className="aba-home-focus__shade" />
              <div className="aba-home-focus__copy">
                <span>{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <i>Entrar</i>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
