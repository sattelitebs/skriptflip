import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Datenschutz – skriptflip",
};

export default function DatenschutzPage() {
  return <LegalPage title="Datenschutzerklärung" filename="datenschutz.md" />;
}
