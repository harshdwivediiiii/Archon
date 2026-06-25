import Link from "next/link";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "GitHub", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant">
      <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-8 py-12 max-w-7xl mx-auto">
        <div className="mb-8 md:mb-0">
          <span className="text-xs uppercase tracking-widest text-on-surface font-bold">ARCHON SYSTEMS</span>
          <p className="text-muted-foreground text-xs mt-2">
            &copy; {new Date().getFullYear()} Archon Systems. All rights reserved.
          </p>
        </div>
        <div className="grid grid-cols-2 md:flex gap-x-12 gap-y-4">
          {footerLinks.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <span className="text-on-surface font-bold text-xs">{group.title}</span>
              {group.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground text-xs hover:text-primary-container transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
