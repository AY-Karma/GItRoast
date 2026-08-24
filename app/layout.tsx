import type { Metadata } from "next";
import "./globals.css";

function resolveHttpUrl(value: string | undefined, assumeHttps = false) {
  const candidate = value?.trim();
  if (!candidate || candidate === "-") return null;

  try {
    const url = new URL(assumeHttps && !candidate.includes("://") ? `https://${candidate}` : candidate);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname ? url : null;
  } catch {
    return null;
  }
}

const metadataBase =
  resolveHttpUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  resolveHttpUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL, true) ??
  resolveHttpUrl(process.env.VERCEL_URL, true) ??
  new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "GitRoast - GitHub profile review",
    template: "%s - GitRoast"
  },
  description: "Turn a public GitHub profile into a funny, data-backed code review.",
  keywords: ["GitHub", "developer tools", "AI roast", "coding stats", "open source"],
  openGraph: {
    title: "GitRoast - GitHub profile review",
    description: "A funny, data-backed review of your public GitHub activity.",
    type: "website",
    siteName: "GitRoast"
  },
  twitter: {
    card: "summary_large_image",
    title: "GitRoast - GitHub profile review",
    description: "A funny, data-backed review of your public GitHub activity."
  },
  robots: { index: true, follow: true }
};

export const viewport = {
  themeColor: "#0d1117",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <a href="#main-content" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-md bg-[#238636] px-4 py-2 font-semibold text-white transition focus:translate-y-0">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
