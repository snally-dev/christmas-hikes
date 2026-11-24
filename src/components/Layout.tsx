import { BookOpenText, Compass, LibraryBig, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { useRecords } from "../context/RecordsContext";
import { navigate, type Route } from "../lib/router";

const navItems = [
  { page: "adventures", label: "Adventures", icon: Compass, href: "#adventures" },
  { page: "collection", label: "Collection", icon: LibraryBig, href: "#collection" },
  { page: "journal", label: "Journal", icon: BookOpenText, href: "#journal" },
] as const;

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const { warning, error, clearMessage } = useRecords();
  const activePage =
    route.page === "adventure" || route.page === "record" ? "adventures" : route.page;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigate("adventures")}
          aria-label="Go to Adventures"
        >
          <span className="brand-mark" aria-hidden="true">
            6
          </span>
          <span>
            <strong>Six Hikes</strong>
            <small>Christmas · 2026</small>
          </span>
        </button>
        <a
          className={`icon-button ${activePage === "settings" ? "is-active" : ""}`}
          href="#settings"
          aria-label="Settings"
        >
          <Settings size={21} />
        </a>
      </header>
      {(warning || error) && (
        <div className={`notice ${error ? "notice--error" : ""}`} role="status">
          <span>{error ?? warning}</span>
          <button onClick={clearMessage}>Dismiss</button>
        </div>
      )}
      <main id="main-content">{children}</main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.page}
              href={item.href}
              className={activePage === item.page ? "is-active" : ""}
              aria-current={activePage === item.page ? "page" : undefined}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
