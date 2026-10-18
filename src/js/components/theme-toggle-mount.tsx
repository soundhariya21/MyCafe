import { createRoot } from "react-dom/client";
import { SunMoonThemeToggle } from "@/components/ui/sun-moon-theme-toggle";
import "../../styles/tailwind.css";

/**
 * Mounts the React <SunMoonThemeToggle /> into every [data-theme-toggle-host] placeholder (the navbar partial has one).
 * The component toggles the `.dark` class on <html> and saves the choice under the same
 * localStorage key the <head> script reads, so first paint and the toggle always agree.
 * theme.js mirrors `.dark` into `data-theme`, which is what the site's CSS variables listen to.
 */
export function mountThemeToggle() {
  document.querySelectorAll("[data-theme-toggle-host]").forEach((host) => {
    createRoot(host).render(<SunMoonThemeToggle size={44} storageKey="mycafe-theme" data-theme-toggle="" />);
  });
}
