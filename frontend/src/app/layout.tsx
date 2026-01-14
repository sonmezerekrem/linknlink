import type { Metadata, Viewport } from "next";
import { Google_Sans_Flex } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const fontFamily = Google_Sans_Flex({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-google-sans",
});

export const metadata: Metadata = {
  title: {
    default: "LinknLink - Your Link Management App",
    template: "%s | LinknLink",
  },
  description: "Save, organize, and manage all your important bookmarks in one place. Tag, search, and access them from anywhere.",
  keywords: ["bookmarks", "links", "organization", "productivity", "link management"],
  authors: [{ name: "LinknLink" }],
  creator: "LinknLink",
  applicationName: "LinknLink",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://linknlink.app",
    title: "LinknLink - Your Link Management App",
    description: "Save, organize, and manage all your important bookmarks in one place.",
    siteName: "LinknLink",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LinknLink - Your Link Management App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinknLink - Your Link Management App",
    description: "Save, organize, and manage all your important bookmarks in one place.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontFamily.className} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
