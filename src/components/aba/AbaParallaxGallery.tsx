'use client';

import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSiteMotion } from '@/components/providers/MotionProvider';

type AbaParallaxGalleryProps = {
  images: string[];
  eyebrow?: string;
  title?: string;
  text?: string;
  className?: string;
};

export default function AbaParallaxGallery({
  images,
  eyebrow = 'Archivo visual',
  title = 'La ciudad tambi\u00e9n se recorre con los ojos.',
  text = 'Una secuencia de barrios, caf\u00e9s, librer\u00edas, avenidas y departamentos para que la web respire Buenos Aires.',
  className = '',
}: AbaParallaxGalleryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useSiteMotion();
  const [isMobile, setIsMobile] = useState(false);
  const motionDisabled = reducedMotion || isMobile;
  const normalizedImages = useMemo(() => images.slice(0, 8), [images]);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 48,
    damping: 24,
    mass: 0.45,
    restDelta: 0.001,
  });
  const introY = useTransform(smoothProgress, [0, 1], motionDisabled ? ['0%', '0%'] : ['4%', '-4%']);
  const ySoft = useTransform(smoothProgress, [0, 1], motionDisabled ? ['0%', '0%'] : ['-5%', '5%']);
  const yReverse = useTransform(smoothProgress, [0, 1], motionDisabled ? ['0%', '0%'] : ['5%', '-5%']);
  const ySmall = useTransform(smoothProgress, [0, 1], motionDisabled ? ['0%', '0%'] : ['-2.5%', '2.5%']);
  const scaleSoft = useTransform(smoothProgress, [0, 0.5, 1], motionDisabled ? [1, 1, 1] : [1.01, 1.035, 1.015]);
  const scaleStill = useTransform(smoothProgress, [0, 1], motionDisabled ? [1, 1] : [1.015, 1.025]);

  const motionStyles = [
    { y: ySoft, scale: scaleSoft },
    { y: yReverse, scale: scaleStill },
    { y: ySmall, scale: scaleSoft },
    { y: yReverse, scale: scaleStill },
  ];

  if (!normalizedImages.length) return null;

  return (
    <section
      ref={sectionRef}
      className={'aba-parallax-section aba-parallax-section--light relative overflow-hidden text-white ' + className}
    >
      <motion.div
        className='aba-parallax-section__intro'
        style={motionDisabled ? undefined : { y: introY }}
      >
        <div className='max-w-4xl'>
          <p className='aba-label text-[#e2c19b]'>{eyebrow}</p>
          <h2 className='mt-5 max-w-[13ch] font-editorial text-[clamp(3.2rem,6vw,7rem)] leading-[0.9] text-white'>{title}</h2>
          <p className='mt-7 max-w-2xl text-base leading-8 text-white/66'>{text}</p>
        </div>
        <span className='aba-parallax-section__index'>Archivo / escenas</span>
      </motion.div>

      <div className='aba-editorial-image-wall'>
        {normalizedImages.map((src, index) => (
          <motion.figure
            key={src + index}
            className={'aba-editorial-image-wall__item aba-editorial-image-wall__item--' + ((index % 4) + 1)}
            style={motionDisabled ? undefined : motionStyles[index % motionStyles.length]}
            initial={motionDisabled ? false : { opacity: 0, filter: 'blur(10px)' }}
            whileInView={motionDisabled ? undefined : { opacity: 1, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.62, delay: Math.min(index * 0.035, 0.16), ease: [0.16, 1, 0.3, 1] }}
          >
            <img src={encodeURI(src)} alt='' loading='lazy' decoding='async' />
            <figcaption>Buenos Aires {String(index + 1).padStart(2, '0')}</figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
