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
      <body className="antialiased" role="application" aria-label="Breach Response Command Center">
        <a href="#main-content" className="skip-to-main">Skip to main content</a>
        <Web3Provider>
          <main id="main-content">{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}
