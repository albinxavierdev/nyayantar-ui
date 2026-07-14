import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nyayantar Beta — AI for legal research & case intelligence",
  description:
    "Nyayantar is the calm, intelligent workspace for legal research, document analysis, and case intelligence. Built for lawyers, not bots.",
  metadataBase: new URL("https://nyayantar.example"),
  openGraph: {
    title: "Nyayantar Beta — AI for legal research & case intelligence",
    description:
      "The calm, intelligent workspace for legal research, document analysis, and case intelligence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="page-bg antialiased">{children}</body>
    </html>
  );
}
