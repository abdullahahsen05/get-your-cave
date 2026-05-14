import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GETYOURCAVE",
  description: "Architectural Serenity in Storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1"
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
