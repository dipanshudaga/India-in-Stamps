import { redirect } from "next/navigation";

// Three design directions live at /a, /b and /c. Start on A.
export default function Home() {
  redirect("/a");
}
