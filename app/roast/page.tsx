import type { Metadata } from "next";
import { RoastExperience } from "@/components/roast-experience";

export const metadata: Metadata = {
  title: "Roast your profile",
  robots: { index: false, follow: true }
};

export default function RoastPage() {
  return <RoastExperience />;
}
