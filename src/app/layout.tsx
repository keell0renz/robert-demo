import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// Inter (the mirror-ui body font) + Geist Mono, exposed as the CSS vars the
// token system reads. `mirror-ui` on <body> activates the whole design system.
const inter = Inter({
  variable: "--font-mirror-inter",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "robert-demo",
  description: "Self-generating macOS-style generative UI demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="mirror-ui font-sans antialiased min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
