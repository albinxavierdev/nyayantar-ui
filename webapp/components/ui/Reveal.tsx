"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { viewportOnce } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "span";
};

const defaultVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.0, ease: [0.44, 0, 0.56, 1] },
  },
} as const;

export const Reveal = memo(function Reveal({
  children,
  className,
  delay = 0,
  y,
  as = "div",
}: RevealProps) {
  const MotionTag = motion[as];
  const variants = y !== undefined
    ? {
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 1.0, ease: [0.44, 0, 0.56, 1], delay },
        },
      }
    : {
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 1.0, ease: [0.44, 0, 0.56, 1], delay },
        },
      };

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
});
