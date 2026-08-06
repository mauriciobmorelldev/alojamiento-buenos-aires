'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';

const PRELOADER_KEY = 'aba_preloader_seen_v5';
const FULL_DURATION = 2200;
const REDUCED_DURATION = 450;
const AMBIENT_AUDIO_REQUEST_EVENT = 'aba:ambient-audio-request';

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function AbaPreloader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioRequested, setAudioRequested] = useState(false);
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!isClient || pathname?.startsWith('/admin')) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isHome = pathname === '/';
    const alreadySeen = !isHome && window.sessionStorage.getItem(PRELOADER_KEY) === 'true';

    if (alreadySeen) return;

    const duration = reduceMotion ? REDUCED_DURATION : FULL_DURATION;
    let frame = 0;
    let timer = 0;
    let startedAt = 0;

    const tick = (time: number) => {
      const elapsed = Math.min(time - startedAt, duration);
      const eased = 1 - Math.pow(1 - elapsed / duration, 3);
      setProgress(Math.min(100, Math.round(eased * 100)));
      if (elapsed < duration) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame((time) => {
      startedAt = time;
      setVisible(true);
      setProgress(0);
      if (!isHome) window.sessionStorage.setItem(PRELOADER_KEY, 'true');
      frame = window.requestAnimationFrame(tick);
      timer = window.setTimeout(() => setVisible(false), duration + 90);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isClient, pathname]);

  const enableTango = () => {
    window.dispatchEvent(new Event(AMBIENT_AUDIO_REQUEST_EVENT));
    setAudioRequested(true);
  };
  const soundLabel = audioRequested ? 'Tango activo' : 'Activar tango';

  if (!isClient) return null;

  return (
    <>
      <AnimatePresence>
        {visible ? (
          <motion.div
            className="aba-entry-preloader"
            role="status"
            aria-live="polite"
            aria-label="Cargando Alojamiento Buenos Aires"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.018, filter: 'blur(10px)' }}
            transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="aba-entry-preloader__film" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="aba-entry-preloader__orbital" aria-hidden="true">
              <i />
              <b />
            </div>

            <div className="aba-entry-preloader__meta" aria-hidden="true">
              <span>{'34\u00b036\u2032 S \u00b7 58\u00b022\u2032 W'}</span>
              <span>{String(progress).padStart(3, '0')}</span>
            </div>

            <button
              className="aba-entry-preloader__sound"
              type="button"
              onClick={enableTango}
              aria-label="Activar tango suave durante la carga"
            >
              <span aria-hidden="true" className="aba-entry-preloader__sound-icon">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M9 18.5a2.5 2.5 0 1 1-1.2-2.14V5.75l9.7-2.2v11.2a2.5 2.5 0 1 1-1.2-2.14V7.05l-7.3 1.66v9.79Z" />
                </svg>
              </span>
              {soundLabel}
            </button>

            <motion.div
              className="aba-entry-preloader__mark"
              initial={{ clipPath: 'inset(0 100% 0 0)', y: 18 }}
              animate={{ clipPath: 'inset(0 0% 0 0)', y: 0 }}
              transition={{ duration: 0.72, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              Alojamiento<br />Buenos Aires
            </motion.div>

            <div className="aba-entry-preloader__line" aria-hidden="true">
              <motion.i
                style={{ scaleX: progress / 100 }}
                transition={{ duration: 0.16, ease: 'linear' }}
              />
            </div>

            <div className="aba-entry-preloader__sequence" aria-hidden="true">
              <span>Barrios</span>
              <span>{'Caf\u00e9s'}</span>
              <span>Propiedades</span>
              <span>Llave</span>
            </div>

            <p>{'La ciudad se est\u00e1 abriendo'}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}