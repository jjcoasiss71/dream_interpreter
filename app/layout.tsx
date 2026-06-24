import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  EB_Garamond,
  IM_Fell_English_SC,
} from "next/font/google";
import "./globals.css";

// Title: an 1800s small-caps revival of the historic Fell printing types.
const title = IM_Fell_English_SC({
  variable: "--font-title",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Headings: thin, quiet, handwritten-adjacent.
const heading = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

// Body / input: readable, unhurried.
const body = EB_Garamond({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dream Interpreter",
  description:
    "Describe a dream and receive a quiet reflection, grounded in dream-psychology frameworks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${title.variable} ${heading.variable} ${body.variable}`}
    >
      {/* data-mode drives every adaptive value below. Nightfall is default. */}
      <body data-mode="nightfall">{children}</body>
    </html>
  );
}
