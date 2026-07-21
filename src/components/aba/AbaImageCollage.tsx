'use client';

import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { useMemo, useRef, type ReactNode } from 'react';
import { useSiteMotion } from '@/components/providers/MotionProvider';

type CollageImage = {
  src: string;
  alt: string;
  label?: string;
};

type AbaImageCollageProps = {
  eyebrow: string;
  title: string;
  text: string;
  images: CollageImage[];
  cta?: ReactNode;
  className?: string;
};

type CollageTileProps = {
  image: CollageImage;
  index: number;
  reducedMotion: boolean;
};

const placements = [
  'aba-image-collage__tile--wide',
  'aba-image-collage__tile--tall',
  'aba-image-collage__tile--small',
  'aba-image-collage__tile--medium',
  'aba-image-collage__tile--letterbox',
  'aba-image-collage__tile--portrait',
];

export default function AbaImageCollage({
  eyebrow,
  title,
  text,
  images,
  cta,
  className = '',
}: AbaImageCollageProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useSiteMotion();
  const displayImages = useMemo(() => images.filter((image) => image.src).slice(0, 6), [images]);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 58, damping: 24, mass: 0.42 });
  const titleY = useTransform(smoothProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['2%', '-3%']);
  const railY = useTransform(smoothProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['-2%', '3%']);

  if (!displayImages.length) return null;

  return (
    <section ref={sectionRef} className={'aba-image-collage text-white ' + className}>
      <div className='aba-image-collage__inner'>
        <motion.div className='aba-image-collage__copy' style={{ y: titleY }}>
          <p className='aba-label text-[#e2c19b]'>{eyebrow}</p>
          <h2 className='mt-5 max-w-[11ch] font-editorial text-[clamp(3.3rem,7vw,7.4rem)] leading-[0.86] text-white'>
            {title}
          </h2>
          <p className='mt-7 max-w-xl text-base leading-8 text-white/64'>{text}</p>
          {cta ? <div className='mt-9'>{cta}</div> : null}
        </motion.div>

        <motion.div className='aba-image-collage__grid' style={{ y: railY }}>
          {displayImages.map((image, index) => (
            <CollageTile key={image.src + index} image={image} index={index} reducedMotion={reducedMotion} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CollageTile({ image, index, reducedMotion }: CollageTileProps) {
  const tileRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: tileRef, offset: ['start end', 'end start'] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 54, damping: 22, mass: 0.45 });
  const imageY = useTransform(smoothProgress, [0, 1], reducedMotion ? ['0%', '0%'] : index % 2 ? ['3.5%', '-3.5%'] : ['-3.5%', '3.5%']);
  const imageScale = useTransform(smoothProgress, [0, 0.5, 1], reducedMotion ? [1, 1, 1] : [1.035, 1.015, 1.025]);

  return (
    <motion.figure
      ref={tileRef}
      className={'aba-image-collage__tile ' + placements[index % placements.length]}
      initial={reducedMotion ? false : { opacity: 0, y: 34, scale: 0.97, clipPath: 'inset(8% 0% 8% 0%)' }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ amount: 0.24, once: true }}
      transition={{ duration: 0.85, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img
        src={encodeURI(image.src)}
        alt={image.alt}
        loading={index < 2 ? 'eager' : 'lazy'}
        decoding='async'
        style={{ y: imageY, scale: imageScale }}
      />
      {image.label ? <figcaption>{image.label}</figcaption> : null}
    </motion.figure>
  );
}