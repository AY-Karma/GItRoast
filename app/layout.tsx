import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
