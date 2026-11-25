import { useEffect, useState } from "react";
import { Celebration } from "./components/Celebration";
import { Layout } from "./components/Layout";
import { AdventureDetailPage } from "./pages/AdventureDetailPage";
import { AdventuresPage } from "./pages/AdventuresPage";
import { CertificatePage } from "./pages/CertificatePage";
import { CollectionPage } from "./pages/CollectionPage";
import { MissionsPage } from "./pages/MissionsPage";
import { JournalPage } from "./pages/JournalPage";
import { RecordPage } from "./pages/RecordPage";
import { SettingsPage } from "./pages/SettingsPage";
import { parseHash } from "./lib/router";

export default function App() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, "", "#adventures");
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const scrollReset = window.setTimeout(
      () => window.scrollTo({ top: 0, left: 0, behavior: "instant" }),
      0,
    );
    return () => window.clearTimeout(scrollReset);
  }, [route]);

  let page;
  switch (route.page) {
    case "missions":
      page = <MissionsPage />;
      break;
    case "collection":
      page = <CollectionPage />;
      break;
    case "certificate":
      page = <CertificatePage />;
      break;
    case "journal":
      page = <JournalPage />;
      break;
    case "settings":
      page = <SettingsPage />;
      break;
    case "adventure":
      page = <AdventureDetailPage key={route.slug} slug={route.slug} />;
      break;
    case "record":
      page = <RecordPage key={route.slug} slug={route.slug} />;
      break;
    default:
      page = <AdventuresPage />;
  }

  return (
    <Layout route={route}>
      {page}
      <Celebration />
    </Layout>
  );
}
