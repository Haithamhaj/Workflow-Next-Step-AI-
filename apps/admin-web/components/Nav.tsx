import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/cases", label: "Cases" },
  { href: "/intake-sessions", label: "Intake sessions" },
  { href: "/intake-sources", label: "Intake sources" },
  { href: "/sources", label: "Sources" },
  { href: "/prompts", label: "Prompts" },
  { href: "/sessions", label: "Sessions" },
  { href: "/synthesis", label: "Synthesis" },
  { href: "/evaluations", label: "Evaluations" },
  { href: "/initial-packages", label: "Initial packages" },
  { href: "/issues", label: "Review issues" },
  { href: "/final-packages", label: "Final packages" },
  { href: "/packages", label: "Package preview" },
  { href: "/states", label: "States" },
  { href: "/admin", label: "Admin config" },
];

export function Nav() {
  return (
    <aside className="sidebar">
      <h1>Workflow</h1>
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
  );
}
