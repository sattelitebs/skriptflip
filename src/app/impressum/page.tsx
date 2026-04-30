import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Impressum – skriptflip",
};

export default function ImpressumPage() {
  return <LegalPage title="Impressum" filename="impressum.md" />;
}
