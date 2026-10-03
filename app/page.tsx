import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import "./landing.css";

export default async function Home({ searchParams }: { searchParams: Promise<{ u?: string | string[] }> }) {
  const { u } = await searchParams;
  if (typeof u === "string" && /^[a-zA-Z0-9-]{1,39}$/.test(u)) redirect(`/roast?u=${encodeURIComponent(u)}`);
  return <LandingPage />;
}
