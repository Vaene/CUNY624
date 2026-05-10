import type { ReactNode } from "react";
import "./globals.css";
import StoryPager from "../components/StoryPager";

export const metadata = {
  title: "Grocery Basket Analysis Presentation",
  description:
    "A slide-based Next.js presentation of the grocery basket analysis report, with 3D visuals where depth adds analytical value.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <StoryPager />
      </body>
    </html>
  );
}
