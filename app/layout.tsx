import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Load Inter via next/font so it is self-hosted and always available — no silent
// fallback to system-ui on servers or environments without the font pre-installed.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "GitRoast",
  description: "A brutally honest AI performance review of your GitHub habits.",
  openGraph: {
    title: "GitRoast",
    description: "Your GitHub has been talking behind your back.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
