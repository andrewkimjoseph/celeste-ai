import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Celeste AI",
  description: "A DeFAI copilot for Celo wallets.",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: "/logo.svg",
  },
  other: {
    "talentapp:project_verification":
      "7398652af3489ea6a588f59047a82cb350fd6bd30d2b2a7406d2f705c6b4c8940be39182412de3ddf1783283398149bb6ecd77d63a2a65b4d8897d425b268f16",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  colorScheme: "light",
  themeColor: "#ffffff",
};

const THEME_SCRIPT = `(function(){try{var stored=localStorage.getItem('celeste-color-scheme');document.documentElement.classList.toggle('dark',stored==='dark');}catch(e){document.documentElement.classList.remove('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="text-[var(--text-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
