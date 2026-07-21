'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useSiteMotion } from '@/components/providers/MotionProvider';

export type AbaRevealItem = {
  title: string;
  eyebrow: string;
  text: string;
  image: string;
  href: string;
};

type AbaImageRevealListProps = {
  eyebrow: string;
  title: string;
  items: AbaRevealItem[];
  className?: string;
};

export default function AbaImageRevealList({
  eyebrow,
  title,
  items,
  className = '',
}: AbaImageRevealListProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { reducedMotion } = useSiteMotion();
  const activeItem = items[activeIndex] ?? items[0];

  if (!items.length || !activeItem) return null;

  return (
    <section className={'aba-reveal-list text-white ' + className}>
      <div className='aba-reveal-list__inner'>
        <div className='aba-reveal-list__intro'>
          <p className='aba-label text-[#e2c19b]'>{eyebrow}</p>
          <h2 className='mt-5 max-w-[9ch] font-editorial text-[clamp(3.3rem,7vw,7.2rem)] leading-[0.86] text-white'>
            {title}
          </h2>
        </div>

        <div className='aba-reveal-list__visual' aria-hidden='true'>
          <motion.img
            key={activeItem.image}
            src={encodeURI(activeItem.image)}
            alt=''
            initial={reducedMotion ? false : { opacity: 0, scale: 1.04, y: 18 }}
            animate={reducedMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          />
          <span>{String(activeIndex + 1).padStart(2, '0')}</span>
        </div>

        <div className='aba-reveal-list__items'>
          {items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={index === activeIndex ? 'aba-reveal-list__item is-active' : 'aba-reveal-list__item'}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            >
              <div>
                <p className='aba-label text-[#e2c19b]'>{item.eyebrow}</p>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <img src={encodeURI(item.image)} alt='' loading='lazy' />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
