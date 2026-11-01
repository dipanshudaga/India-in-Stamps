import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Rozha_One } from "next/font/google";
import "./globals.css";

// Display: Rozha One, a high-contrast poster serif with a real Devanagari companion, so Hindi and
// English headlines share one voice. Body: Inter Tight. Labels: JetBrains Mono.
const display = Rozha_One({ variable: "--font-display", subsets: ["latin", "devanagari"], weight: "400" });
const body = Inter_Tight({ variable: "--font-body", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "India in Stamps",
    template: "%s - India in Stamps",
  },
  description:
    "Every Indian postage stamp since 1947, arranged so you can see the country's history in them: by year, by colour, by theme.",
};

export const viewport: Viewport = {
  themeColor: "#120d0f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
