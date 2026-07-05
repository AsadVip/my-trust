import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mytrustearn.online"),
  title: {
    default: "My Trust - Daily Rewards & Online Earning Platform",
    template: "%s | My Trust",
  },
  description: "Earn consistent daily rewards, build streaks for multipliers, and manage earnings with a secure, transparent wallet. Easy JazzCash & EasyPaisa cash-outs.",
  keywords: [
    "My Trust",
    "My Trust Earning",
    "Daily check-in reward",
    "Online earning Pakistan",
    "JazzCash earning app",
    "EasyPaisa earning app",
    "mytrustearn.online",
    "Earn rewards daily",
    "Trust wallet earning",
    "Passive rewards checkin",
    "Daily reward streaks"
  ],
  authors: [{ name: "My Trust Support", url: "https://mytrustearn.online" }],
  creator: "My Trust Team",
  publisher: "My Trust",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mytrustearn.online",
    siteName: "My Trust",
    title: "My Trust - Daily Rewards & Online Earning Platform",
    description: "Earn consistent daily rewards, build check-in streaks, and cash out using JazzCash or EasyPaisa.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "My Trust Daily Rewards & Earning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Trust - Daily Rewards & Online Earning Platform",
    description: "Earn consistent daily rewards, build check-in streaks, and cash out using JazzCash or EasyPaisa.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
