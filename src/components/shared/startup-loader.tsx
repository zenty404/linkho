"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useLoader } from "./loader-context";

type StartupLoaderProps = {
  logoSrc?: string;
  logoAlt?: string;
  /** Total duration of the progress animation, in ms. */
  duration?: number;
  /** sessionStorage key used to remember that this loader has already played. */
  storageKey?: string;
};

export function StartupLoader({
  logoSrc = "/logo.png",
  logoAlt = "Logo",
  duration = 2500,
  storageKey = "hasVisited",
}: StartupLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const { setLoaderFinished } = useLoader();

  useEffect(() => {
    let start = 0;
    const intervalTime = 20;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= 100) {
        setProgress(100);
        clearInterval(timer);
        setTimeout(() => {
          setIsVisible(false);
          sessionStorage.setItem(storageKey, "true");
        }, 500); // Longer pause at 100% to appreciate it
      } else {
        // Ease-out curve: starts fast, slows down towards 100%
        const easeOutQuad = 1 - (1 - start / 100) * (1 - start / 100);
        setProgress(easeOutQuad * 100);
      }
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [duration, setLoaderFinished, storageKey]);

  // Format the progress as "0 9 9" with leading zeros and spaces
  const formattedProgress = Math.floor(progress)
    .toString()
    .padStart(3, "0")
    .split("")
    .join(" ");

  return (
    <AnimatePresence onExitComplete={() => setLoaderFinished(true)}>
      {isVisible && (
        <motion.div
          initial={{ y: 0 }}
          exit={{ opacity: 0, y: "-100%" }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-navy text-white"
        >
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="flex justify-center flex-col items-center w-full"
            >
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={80}
                height={80}
                priority
                className="object-contain mb-8 md:mb-16"
              />
            </motion.div>

            {/* Deflating Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex items-center gap-3 text-xs md:text-sm font-light text-white/60 font-mono tracking-widest">
                <span className="tabular-nums tracking-[0.2em] text-white font-medium">
                  {formattedProgress}
                </span>
                <span className="text-white/40">%</span>
              </div>

              {/* Progress bar */}
              <div className="w-40 md:w-56 h-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
