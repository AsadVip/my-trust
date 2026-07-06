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
    default: "My Trust Earn - Daily Rewards & Online Earning Platform",
    template: "%s | My Trust Earn",
  },
  description: "My Trust Earn is the premier online earning platform for daily rewards. Build streak multipliers, manage your secure wallet, and enjoy easy local payouts via JazzCash & EasyPaisa.",
  keywords: [
    "My Trust Earn",
    "my trust earn",
    "mytrustearn",
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
  authors: [{ name: "My Trust Earn Support", url: "https://mytrustearn.online" }],
  creator: "My Trust Earn Team",
  publisher: "My Trust Earn",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mytrustearn.online",
    siteName: "My Trust Earn",
    title: "My Trust Earn - Daily Rewards & Online Earning Platform",
    description: "Earn consistent daily rewards with My Trust Earn. Build check-in streaks and cash out easily using JazzCash or EasyPaisa.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "My Trust Earn Daily Rewards & Earning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My Trust Earn - Daily Rewards & Online Earning Platform",
    description: "Earn consistent daily rewards with My Trust Earn. Build check-in streaks and cash out easily using JazzCash or EasyPaisa.",
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
