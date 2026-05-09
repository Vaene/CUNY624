import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Tree-Based Models: Squirrels, Trees, and Wildfires",
  description: "Next.js host for the tree-model presentation and interactive Pyodide demos.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
