import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "🍳 AI Recipe Generator - Create Delicious Recipes with AI",
  description: "Transform your ingredients into amazing recipes with AI. Generate personalized cooking instructions, save favorites, and discover new culinary adventures.",
};

// Modern, clean sans-serif for UI elements
const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

// Elegant serif for recipe titles and headers
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Clean, readable font for recipe content
const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${playfairDisplay.variable} ${inter.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
