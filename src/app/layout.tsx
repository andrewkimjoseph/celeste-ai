import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CELINA_LOGO_PATH } from "@/components/celina-logo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Celina Agent",
  description: "Chat with Celina — your Celo wallet assistant",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: CELINA_LOGO_PATH, type: "image/png" },
    ],
    apple: CELINA_LOGO_PATH,
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="text-white">{children}</body>
    </html>
  );
}
