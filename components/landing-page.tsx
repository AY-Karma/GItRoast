import { ArrowUpRight } from "lucide-react";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import { LandingPreview } from "@/components/landing-preview";
import { LandingRoastForm } from "@/components/landing-roast-form";

const plex = localFont({
  src: [
    { path: "../app/fonts/IBMPlexSans-Regular.woff2", weight: "400" },
    { path: "../app/fonts/IBMPlexSans-Medium.woff2", weight: "500" }
  ],
  display: "swap"
});

const display = localFont({
  src: "../app/fonts/BricolageGrotesque-ExtraBold.woff2",
  weight: "800",
  display: "swap",
  variable: "--landing-display-font"
});

export function LandingPage() {
  return (
    <div className={`landing-page ${plex.className} ${display.variable}`}>
      <header className="landing-header">
        <nav className="landing-nav" aria-label="Main navigation">
          <Link href="/" className="landing-logo" aria-label="GitRoast home">
            <Image src="/icon.svg" alt="" width={32} height={32} />
            <span>GitRoast</span>
          </Link>
          <Link href="/roast" className="landing-app-link">
            Open app <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </nav>
      </header>
      <main id="main-content" className="landing-main" tabIndex={-1}>
        <div className="landing-copy">
          <p className="landing-eyebrow mono-type">Code review. With a mean streak.</p>
          <h1>Your GitHub.<span className="landing-roasted-word">Roasted.</span></h1>
          <p className="landing-description">
            A brutally honest roast of your public repos and commits.
            The jokes come with receipts.
          </p>
          <LandingRoastForm />
          <p className="landing-aside">You wrote the code. You can take the heat.</p>
        </div>
        <div className="landing-visual">
          <LandingPreview />
        </div>
      </main>
    </div>
  );
}
