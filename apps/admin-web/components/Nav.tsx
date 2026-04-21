import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/cases", label: "Cases" },
  { href: "/sources", label: "Sources" },
  { href: "/prompts", label: "Prompts" },
  { href: "/sessions", label: "Sessions" },
  { href: "/issues", label: "Review issues" },
  { href: "/packages", label: "Package preview" },
  { href: "/states", label: "States" },
  { href: "/admin", label: "Admin config" },
];

export function Nav() {
  return (
    <aside className="sidebar">
      <h1>Workflow Admin</h1>
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
