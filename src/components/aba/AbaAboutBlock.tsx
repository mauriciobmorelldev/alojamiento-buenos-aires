"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { abaCultureImages } from "@/lib/abaMedia";

const aboutPoints = [
  "Departamentos amoblados de calidad en barrios emblemáticos.",
  "Contratos seguros y acompañamiento profesional.",
  "Una puerta de entrada a librerías, cafés, teatros, tango, arquitectura y arte.",
];

export default function AbaAboutBlock() {
  return (
    <section id="sobre-nosotros" className="aba-about-contrast">
      <div className="aba-about-contrast__prelude">
        <p className="aba-label text-[#7d5d3f]">Acerca de Alojamiento Buenos Aires</p>
        <h2>Más que metros cuadrados. Un modo de habitar Buenos Aires.</h2>
      </div>

      <motion.div
        className="aba-about-contrast__image"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.22 }}
        transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={abaCultureImages[24]}
          alt="Café notable porteño como escena cultural de Buenos Aires"
          loading="lazy"
          decoding="async"
        />
        <div className="aba-about-contrast__quote">
          <blockquote>
            “La ciudad era esta incertidumbre, la eterna pregunta - quién soy - dicho de otro modo: quién sos”.
          </blockquote>
          <cite>Cristina Peri Rossi</cite>
          <Link href="/contacto" className="aba-about-contrast__button">
            Empezar consulta
          </Link>
        </div>
      </motion.div>

      <div className="aba-about-contrast__body">
        <div>
          <p>
            Alojamiento Buenos Aires nació de una convicción poderosa: nadie va a las grandes ciudades del mundo - París, Nueva York, Buenos Aires - solo en busca de un lugar donde vivir.
          </p>
          <p>
            Creemos que elegir dónde vivir es también elegir qué historia, qué arte y qué ritmo de vida va a dejar que te transforme.
          </p>
        </div>
        <div>
          <p>
            El corazón de este proyecto es la combinación de lo inmobiliario con lo cultural. El espacio físico es solo el inicio.
          </p>
          <p>
            Te abrimos la puerta a una ciudad que tiene historias en cada esquina: barrios, música, librerías, cafetines antiguos, vida nocturna, gastronomía, teatros, arquitectura, tango y arte.
          </p>
        </div>
      </div>

      <div className="aba-about-contrast__points">
        {aboutPoints.map((point, index) => (
          <motion.div
            key={point}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, delay: index * 0.04 }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{point}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
