import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "./Web3Provider";

export const metadata: Metadata = {
  title: "Breach Response Command Center",
  description: "Active Defense Node for Mantle Smart Contracts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
