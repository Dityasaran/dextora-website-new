import type { Metadata } from "next";
import { Sora, Instrument_Serif, Fira_Code } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dextora Studio — Cinematic Engine",
  description: "Create AI videos and reels instantly. Vapor Clinic 2.0.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${sora.variable} ${instrumentSerif.variable} ${firaCode.variable} bg-[#0A0A14] text-[#F0EFF4] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
