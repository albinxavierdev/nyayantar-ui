"use client";

import Image from "next/image";

type LogoProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function Logo({ className = "h-8 w-8", width = 32, height = 32 }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Nyayantar"
      width={width}
      height={height}
      className={`${className} rounded-md object-contain`}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
