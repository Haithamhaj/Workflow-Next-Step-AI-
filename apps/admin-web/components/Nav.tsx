"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/workspace", label: "Workspace" },
  { href: "/cases", label: "Cases" },
  { href: "/intake-sessions", label: "Intake sessions" },
  { href: "/intake-sources", label: "Intake sources" },
  { href: "/sources", label: "Sources" },
  { href: "/prompts", label: "Prompts" },
  { href: "/targeting-rollout", label: "Targeting rollout" },
  { href: "/participant-sessions", label: "Participant sessions" },
  { href: "/sessions", label: "Sessions" },
  { href: "/synthesis", label: "Synthesis" },
  { href: "/pass6/configuration", label: "Pass 6 config" },
  { href: "/pass6/prompts", label: "Pass 6 prompts" },
  { href: "/pass6/synthesis-input-bundles", label: "Pass 6 bundles" },
  { href: "/pass6/methods", label: "Pass 6 methods" },
  { href: "/pass6/evaluation", label: "Pass 6 evaluation" },
  { href: "/pass6/pre6c-gates", label: "Pass 6 Pre-6C" },
  { href: "/pass6/interfaces", label: "Pass 6 interfaces" },
  { href: "/pass6/packages", label: "Pass 6 packages" },
  { href: "/evaluations", label: "Evaluations" },
  { href: "/initial-packages", label: "Initial packages" },
  { href: "/issues", label: "Review issues" },
  { href: "/final-packages", label: "Final packages" },
  { href: "/packages", label: "Package preview" },
  { href: "/states", label: "States" },
  { href: "/admin", label: "Admin config" },
];

export function Nav({
  initialDirection = "ltr",
}: {
  initialDirection?: "ltr" | "rtl";
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<"ltr" | "rtl">(initialDirection);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateDirection = () => {
      const workspaceRoot = document.querySelector<HTMLElement>("[class*='workspaceRoot']");
      setDirection(workspaceRoot?.dir === "rtl" ? "rtl" : "ltr");
    };

    updateDirection();

    const observer = new MutationObserver(updateDirection);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["dir", "class"],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [pathname]);

  const isRtl = direction === "rtl";

  return (
    <>
      <button
        type="button"
        className={`mainNavToggle ${isRtl ? "mainNavToggleRtl" : ""}`}
        aria-expanded={isOpen}
        aria-controls="main-navigation"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span aria-hidden="true">☰</span>
        <strong>Menu</strong>
      </button>

      {isOpen ? (
        <button
          type="button"
          className="mainNavBackdrop"
          aria-label="Close main navigation"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        id="main-navigation"
        className={`sidebar ${isRtl ? "sidebarRtl" : ""} ${isOpen ? "sidebarOpen" : ""}`}
        aria-hidden={!isOpen}
        dir={direction}
      >
        <div className="sidebarHeader">
          <h1>Workflow</h1>
          <button
            type="button"
            className="sidebarClose"
            aria-label="Close main navigation"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>
        <nav>
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
