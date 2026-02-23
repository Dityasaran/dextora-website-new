import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dextora — AI Video Generator",
  description: "Generate stunning videos from text prompts using Dextora's AI-powered video generation with native audio, TTS narration, and Remotion composition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
