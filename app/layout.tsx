import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gabriel Vian - Internal tools for small teams",
  description:
    "Custom admin panels and internal tools for ops teams outgrowing spreadsheets, Airtable, or Retool. Shipped in two weeks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-slate-900"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
