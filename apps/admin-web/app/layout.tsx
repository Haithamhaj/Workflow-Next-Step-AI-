import "./globals.css";
import type { ReactNode } from "react";
import { Nav } from "../components/Nav";

export const metadata = {
  title: "Workflow",
  description: "Workflow Analysis Document Engine",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <Nav />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
