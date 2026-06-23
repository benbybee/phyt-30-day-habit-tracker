import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Gotham — Balance of Nature brand font, used for everything (body + headlines).
const gotham = localFont({
  src: [
    { path: "./fonts/Gotham-Book.otf", weight: "400", style: "normal" },
    { path: "./fonts/Gotham-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/Gotham-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/Gotham-Black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-gotham",
  display: "swap",
});

export const metadata: Metadata = {
  title: "30-Day Whole Health System™ Supplement Journey Tracker",
  description:
    "Track your Fruits, Veggies, Fiber & Spice, plus a custom health habit of your choice. Finish to get your reward.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${gotham.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
