"use client";

import { Tabs, TabList, Tab } from "@/components/ui/tabs";

const LINKS = [
  { href: "index.html", label: "Home" },
  { href: "menu.html", label: "Menu" },
  { href: "gallery.html", label: "Gallery" },
  { href: "faqs.html", label: "FAQs" },
  { href: "about.html", label: "About" },
  { href: "contact.html", label: "Contact" },
] as const;

function currentPage() {
  const file = location.pathname.split("/").pop() || "index.html";
  return LINKS.some((l) => l.href === file) ? file : "index.html";
}

/** Goes through a real <a> click so the site's curtain page-transition runs. */
function navigate(href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
}

/** Desktop navbar links: sketch-underline tabs, one per page. */
export function NavTabs() {
  const page = currentPage();

  return (
    <Tabs
      value={page}
      onValueChange={(href) => href !== page && navigate(href)}
      roughness={1.4}
    >
      <TabList aria-label="Primary" style={{ flexWrap: "nowrap", gap: 2 }}>
        {LINKS.map(({ href, label }) => (
          <Tab
            key={href}
            value={href}
            style={{
              fontSize: "0.78rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              padding: "8px 12px 12px",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
}
