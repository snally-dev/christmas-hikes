import type { ReactNode } from "react";
import { useRecords } from "../context/RecordsContext";
import { assetUrl } from "../data/hikes";
import type { Route } from "../lib/router";

const navItems = [
  { page: "adventures", label: "Adventures" },
  { page: "collection", label: "Collection" },
  { page: "journal", label: "Journal" },
  { page: "settings", label: "Settings" },
] as const;

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const { warning, error, clearMessage } = useRecords();
  const activePage =
    route.page === "adventure" || route.page === "record" || route.page === "missions"
      ? "adventures"
      : route.page === "certificate"
        ? "collection"
        : route.page;

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#adventures">
          <img src={assetUrl("branding/favicon-32.png")} width={26} height={26} alt="" />
          <strong>Christmas Hikes</strong>
        </a>
      </header>
      {(warning || error) && (
        <div className={`notice ${error ? "notice--error" : ""}`} role="status">
          <span>{error ?? warning}</span>
          <button onClick={clearMessage}>Dismiss</button>
        </div>
      )}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a
            key={item.page}
            href={`#${item.page}`}
            className={activePage === item.page ? "is-active" : ""}
            aria-current={activePage === item.page ? "page" : undefined}
          >
            <span className="tab-icon">
              <img src={assetUrl(`branding/${item.page}.webp`)} width={34} height={30} alt="" />
            </span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
