import type { Metadata } from "next";
import { Urbanist, Google_Sans_Flex } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const fontFamily = Google_Sans_Flex({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinknLink",
  description: "Your link management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontFamily.className} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
