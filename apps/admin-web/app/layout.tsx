import "./globals.css";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Nav } from "../components/Nav";

export const metadata = {
  title: "Workflow",
  description: "Workflow Analysis Document Engine",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const workspaceLanguage = cookies().get("workflow_workspace_language")?.value;
  const initialDirection = workspaceLanguage === "ar" ? "rtl" : "ltr";

  return (
    <html lang="en">
      <body>
        <div className="layout">
          <Nav initialDirection={initialDirection} />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
