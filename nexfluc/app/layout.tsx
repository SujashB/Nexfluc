import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600"], // Semibold
});

export const metadata: Metadata = {
  title: "Nexfluc",
  description: "Voice agent interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} font-semibold antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
