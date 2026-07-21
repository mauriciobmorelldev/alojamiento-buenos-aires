'use client';

import { motion } from 'motion/react';
import { useSiteMotion } from '@/components/providers/MotionProvider';

type CinemaFrameData = {
  image: string;
  eyebrow: string;
  title: string;
  text: string;
};

type AbaScrollCinemaProps = {
  frames: CinemaFrameData[];
  kicker?: string;
  title?: string;
  description?: string;
  className?: string;
};

export default function AbaScrollCinema({
  frames,
  kicker = 'Secuencia cinematográfica',
  title = 'Una web que se mueve como la ciudad.',
  description = 'Ciudad, interiores y cultura conectados en una misma llegada.',
  className = '',
}: AbaScrollCinemaProps) {
  const { reducedMotion } = useSiteMotion();

  if (!frames.length) return null;

  return (
    <section className={'aba-scroll-cinema text-white ' + className}>
      <div className='aba-scroll-cinema__layout'>
        <motion.div
          className='aba-scroll-cinema__intro'
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className='aba-label text-[#e2c19b]'>{kicker}</p>
          <h2 className='mt-5 max-w-[10ch] font-editorial text-[clamp(3.4rem,6vw,7rem)] leading-[0.88] text-white'>
            {title}
          </h2>
          <p className='mt-7 max-w-sm text-base leading-7 text-white/64'>{description}</p>
          <div className='aba-scroll-cinema__progress mt-9'>
            <span>03 escenas</span>
            <i><b /></i>
          </div>
        </motion.div>

        <div className='aba-scroll-cinema__frames'>
          {frames.map((frame, index) => (
            <CinemaFrame
              key={frame.title}
              frame={frame}
              index={index}
              total={frames.length}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CinemaFrame({
  frame,
  index,
  total,
  reducedMotion,
}: {
  frame: CinemaFrameData;
  index: number;
  total: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.article
      className='aba-scroll-cinema__frame'
      initial={reducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ amount: 0.28, once: true }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
    >
      <img
        src={encodeURI(frame.image)}
        alt=''
        className='absolute inset-0 h-full w-full object-cover'
        loading='lazy'
        decoding='async'
      />
      <div className='aba-scroll-cinema__veil' />
      <div className='aba-scroll-cinema__copy'>
        <div className='flex items-center justify-between gap-5'>
          <p className='aba-label text-[#e2c19b]'>{frame.eyebrow}</p>
          <span className='text-[0.62rem] font-black uppercase tracking-[0.2em] text-white/56'>
            0{index + 1} / 0{total}
          </span>
        </div>
        <h3 className='mt-4 max-w-[8ch] font-editorial text-[clamp(3rem,5vw,5.8rem)] leading-[0.9] text-white'>{frame.title}</h3>
        <p className='mt-6 max-w-md text-base leading-7 text-white/74'>{frame.text}</p>
      </div>
    </motion.article>
  );
}
