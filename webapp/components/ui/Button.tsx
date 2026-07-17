"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { memo } from "react";
import { arrowSlide } from "@/lib/motion";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  className?: string;
  onClick?: () => void;
  showArrow?: boolean;
  type?: "button" | "submit";
};

const base =
  "group inline-flex items-center justify-center gap-2 font-medium framer-transition rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent1/40";

const sizes: Record<string, string> = {
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-5 py-3.5",
};

const variants: Record<string, string> = {
  primary:
    "primary-gradient text-white shadow-[0_12px_30px_rgba(141,75,44,0.20)] hover:shadow-[0_16px_40px_rgba(141,75,44,0.28)] hover:-translate-y-0.5",
  secondary:
    "bg-surface text-text border border-border-strong hover:border-text/30 hover:-translate-y-0.5",
  ghost: "text-text-muted hover:text-text",
};

const ButtonInner = memo(function ButtonInner({
  children,
  showArrow,
}: {
  children: ReactNode;
  showArrow?: boolean;
}) {
  return (
    <motion.span
      className="inline-flex items-center gap-2"
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <span>{children}</span>
      {showArrow && (
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          variants={arrowSlide(4)}
          className="opacity-90"
          aria-hidden
        >
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      )}
    </motion.span>
  );
});

export const Button = memo(function Button({
  children,
  href = "#",
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  showArrow = false,
  type = "button",
}: ButtonProps) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (href && (href.startsWith("#") || href.startsWith("/") || href.startsWith("http"))) {
    if (href.startsWith("http")) {
      return (
        <a href={href} className={cls} onClick={onClick}>
          <ButtonInner showArrow={showArrow}>{children}</ButtonInner>
        </a>
      );
    }

    if (href.startsWith("/")) {
      return (
        <Link href={href} className={cls} onClick={onClick}>
          <ButtonInner showArrow={showArrow}>{children}</ButtonInner>
        </Link>
      );
    }

    return (
      <a href={href} className={cls} onClick={onClick}>
        <ButtonInner showArrow={showArrow}>{children}</ButtonInner>
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick}>
      <ButtonInner showArrow={showArrow}>{children}</ButtonInner>
    </button>
  );
});
