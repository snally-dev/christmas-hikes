export type Route =
  | { page: "adventures" }
  | { page: "missions" }
  | { page: "collection" }
  | { page: "journal" }
  | { page: "settings" }
  | { page: "certificate" }
  | { page: "adventure"; slug: string }
  | { page: "record"; slug: string };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, "").split("?")[0];
  const [first, second] = path.split("/");
  if (first === "missions") return { page: "missions" };
  if (first === "collection") return { page: "collection" };
  if (first === "certificate") return { page: "certificate" };
  if (first === "journal") return { page: "journal" };
  if (first === "settings") return { page: "settings" };
  if (first === "adventure" && second) return { page: "adventure", slug: second };
  if (first === "record" && second) return { page: "record", slug: second };
  return { page: "adventures" };
}

export const navigate = (path: string) => {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: "instant" });
};
