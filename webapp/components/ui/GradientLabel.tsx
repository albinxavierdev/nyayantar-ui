"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type GradientLabelProps = {
  children: ReactNode;
  className?: string;
};

export function GradientLabel({ children, className = "" }: GradientLabelProps) {
  return (
    <span
      className={`accent-border-wrap inline-flex rounded-2xl ${className}`}
      style={{ borderRadius: 16 }}
    >
      <span className="inline-flex items-center gap-2 rounded-2xl bg-page px-3 py-1.5 text-xs font-medium">
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          animate={{ rotate: [0, 18, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M12 2.5l1.8 5.2L19 9.5l-5.2 1.8L12 16.5l-1.8-5.2L5 9.5l5.2-1.8L12 2.5z"
            fill="url(#spark)"
          />
          <path
            d="M19 4l.9 2.4L22 7l-1.9.7L19 10l-.9-2.3L16 7l2.1-.6L19 4z"
            fill="url(#spark)"
          />
          <defs>
            <linearGradient id="spark" x1="0" y1="0" x2="24" y2="24">
              <stop stopColor="#8d4b2c" />
              <stop offset="0.5" stopColor="#a8663f" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </motion.svg>
        <span className="gradient-text">{children}</span>
      </span>
    </span>
  );
}
