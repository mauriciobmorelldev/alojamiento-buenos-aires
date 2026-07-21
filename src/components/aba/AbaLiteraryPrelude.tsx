'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useSiteMotion } from '@/components/providers/MotionProvider';
import { abaLiteraryImages } from '@/lib/abaMedia';

export default function AbaLiteraryPrelude() {
  const sectionRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useSiteMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const mainScale = useTransform(scrollYProgress, [0, 1], reducedMotion ? [1, 1] : [1.08, 1]);
  const mainY = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['4%', '-4%']);
  const leftCardY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [44, -34]);
  const rightCardY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [-32, 38]);
  const copyY = useTransform(scrollYProgress, [0, 0.55], reducedMotion ? [0, 0] : [34, 0]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.18, 0.58], reducedMotion ? [1, 1, 1] : [0.35, 1, 1]);

  return (
    <section ref={sectionRef} className='aba-literary-prelude text-white'>
      <div className='aba-literary-prelude__stage'>
        <div className='aba-literary-prelude__masthead'>
          <p className='aba-label text-[#d8ae7d]'>Firmas · Crónicas · Ensayo</p>
          <motion.div style={{ y: copyY, opacity: copyOpacity }}>
            <h2 className='mt-5 max-w-[9ch] font-editorial text-[clamp(4rem,8vw,9rem)] leading-[0.82] text-[#f3eee5]'>
              La ciudad escrita.
            </h2>
            <p className='mt-7 max-w-md text-base leading-8 text-[#f3eee5]/66'>
              Escritores, periodistas y artistas argentinos van a narrar Buenos Aires desde sus mesas de café, librerías, barrios y obsesiones.
            </p>
          </motion.div>
          <div className='mt-10 flex items-center gap-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#d8ae7d]'>
            <span>Próxima edición</span>
            <span className='h-px w-14 bg-[#d8ae7d]/70' />
            <span>2026</span>
          </div>
        </div>

        <div className='aba-literary-prelude__visual'>
          <motion.img
            src={encodeURI(abaLiteraryImages[0])}
            alt='Librería porteña repleta de libros'
            className='absolute inset-0 h-full w-full object-cover'
            style={{ scale: mainScale, y: mainY }}
          />
          <div className='absolute inset-0 bg-[linear-gradient(to_top,rgba(16,12,9,0.72),transparent_52%),linear-gradient(90deg,rgba(16,12,9,0.25),transparent_44%)]' />
          <div className='absolute bottom-7 left-7 max-w-sm border-l border-[#d8ae7d]/70 pl-5'>
            <p className='font-editorial text-2xl leading-tight text-[#f3eee5]'>
              “Leer una ciudad es aprender a habitarla.”
            </p>
          </div>
        </div>

        <motion.figure className='aba-literary-prelude__card aba-literary-prelude__card--left' style={{ y: leftCardY }}>
          <img src={encodeURI(abaLiteraryImages[1])} alt='Lectores en una feria de libros de Buenos Aires' className='h-full w-full object-cover' loading='lazy' />
          <figcaption>Libros en la vereda · Microcentro</figcaption>
        </motion.figure>

        <motion.figure className='aba-literary-prelude__card aba-literary-prelude__card--right' style={{ y: rightCardY }}>
          <img src={encodeURI(abaLiteraryImages[2])} alt='Café notable de Buenos Aires' className='h-full w-full object-cover' loading='lazy' />
          <figcaption>Mesa de autor · Café notable</figcaption>
        </motion.figure>

        <div className='aba-literary-prelude__folio' aria-hidden='true'>
          <span>VBA</span>
          <span>01 — 04</span>
        </div>
      </div>

      <div className='aba-literary-prelude__mobile'>
        <div className='px-5 pb-12 pt-20'>
          <p className='aba-label text-[#d8ae7d]'>Firmas · Crónicas · Ensayo</p>
          <h2 className='mt-5 max-w-[8ch] font-editorial text-6xl leading-[0.84] text-[#f3eee5]'>La ciudad escrita.</h2>
          <p className='mt-6 text-base leading-8 text-[#f3eee5]/66'>
            Escritores, periodistas y artistas argentinos narran Buenos Aires desde sus cafés, librerías y barrios.
          </p>
        </div>
        <motion.figure
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className='mx-5 overflow-hidden'
        >
          <img src={encodeURI(abaLiteraryImages[0])} alt='Librería porteña repleta de libros' className='aspect-[4/5] w-full object-cover' />
          <figcaption className='border-l border-[#d8ae7d] py-5 pl-5 font-editorial text-2xl text-[#f3eee5]'>
            “Leer una ciudad es aprender a habitarla.”
          </figcaption>
        </motion.figure>
        <div className='grid grid-cols-2 gap-3 px-5 pb-20 pt-8'>
          {abaLiteraryImages.slice(1, 3).map((image, index) => (
            <motion.img
              key={image}
              src={encodeURI(image)}
              alt=''
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.06 }}
              className={'w-full object-cover ' + (index === 0 ? 'mt-10 aspect-[3/4]' : 'aspect-[3/4]')}
              loading='lazy'
            />
          ))}
        </div>
      </div>
    </section>
  );
}
