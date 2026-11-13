"use client";

import { useEffect, useRef, useState } from "react";

import {
  AnimatedCounter,
  type AnimatedCounterProps,
} from "@/components/ui/animated-counter";

/**
 * Angka yang mulai berputar saat masuk viewport, sekali saja.
 *
 * `AnimatedCounter` menganimasikan perubahan nilai; angka statis di landing
 * butuh pemicu scroll, jadi nilai awal ditahan di 0 sampai elemen terlihat.
 */
export default function ScrollCounter({
  value,
  ...props
}: Omit<AnimatedCounterProps, "value"> & { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [target, setTarget] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setTarget(value);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="inline-flex">
      <AnimatedCounter value={target} {...props} />
    </span>
  );
}
