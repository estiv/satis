import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/core/app-version";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: "Occasional and bridesmaid dress rental — browse, check dates, and enquire.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Satis", statusBarStyle: "default" },
  icons: { icon: [{ url: "/logo.png" }, { url: "/icon.png" }], apple: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#f5bfcc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}
