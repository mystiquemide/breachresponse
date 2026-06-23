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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[#10B981] focus:text-black focus:px-4 focus:py-2 focus:rounded focus:font-bold focus:text-sm"
        >
          Skip to main content
        </a>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
