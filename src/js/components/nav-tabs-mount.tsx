import { createRoot } from "react-dom/client";
import { NavTabs } from "@/components/layout/nav-tabs";
import "../../styles/tailwind.css";

/** Mounts the React navbar tabs into the placeholder rendered by the navbar partial. */
export function mountNavTabs() {
  const host = document.querySelector("[data-nav-tabs]");
  if (!host) return;
  createRoot(host).render(<NavTabs />);
}
