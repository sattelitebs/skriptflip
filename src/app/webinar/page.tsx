import { redirect } from "next/navigation";

// Die Webinar-Einladung ist jetzt die Startseite (skriptflip.com).
// Alte /webinar-Links bleiben gültig und landen dort.
export default function WebinarRedirect() {
  redirect("/");
}
