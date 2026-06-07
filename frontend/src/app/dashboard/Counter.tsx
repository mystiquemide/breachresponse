'use client';

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function Counter({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) {
  const spring = useSpring(0, { stiffness: 45, damping: 15 });
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  const display = useTransform(spring, (current) => {
    const formatted = Number.isInteger(value) 
      ? Math.floor(current).toLocaleString()
      : current.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${prefix}${formatted}${suffix}`;
  });


  return <motion.span>{display}</motion.span>;
}
