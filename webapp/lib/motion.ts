import type { Variants } from "framer-motion";

/* Shared easing that mirrors the reference site's calm motion language. */
export const EASE = [0.44, 0, 0.56, 1] as const;

/* Generic scroll-reveal: fade + gentle rise. */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.0, ease: EASE },
  },
};

/* Container that staggers its children's reveals. */
export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

/* Per-item reveal used inside a staggered container. */
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE },
  },
};

/* Subtle, slow, mirrored float — used sparingly on hero visual. */
export const float: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      repeatType: "mirror",
      ease: EASE,
    },
  },
};

/* Button arrow slide on hover. */
export const arrowSlide = (offset = 4): Variants => ({
  rest: { x: 0 },
  hover: { x: offset, transition: { duration: 0.4, ease: EASE } },
});

/* Generic viewport config so sections reveal once, in view. */
export const viewportOnce = { once: true, margin: "-80px" } as const;
