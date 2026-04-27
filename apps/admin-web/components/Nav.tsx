import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
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
