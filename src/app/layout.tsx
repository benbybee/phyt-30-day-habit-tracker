import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Body / default font for all copy.
const sprigSans = localFont({
  src: "./fonts/FAIRE-SprigSans-Regular.woff2",
  variable: "--font-sprig",
  weight: "400",
  display: "swap",
});

// Display font for headlines and the "Phyt" branding.
const romie = localFont({
  src: "./fonts/Romie-Medium.otf",
  variable: "--font-romie",
  weight: "500",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Join the Phyt — 30 Day Habit Tracker",
  description: "Track 30 days of Fruits, Veggies, and Fiber & Spice.",
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
      className={`${sprigSans.variable} ${romie.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
