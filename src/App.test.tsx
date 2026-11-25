import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import App from "./App";
import { AllTrailsMap } from "./components/AllTrailsMap";
import { RecordsProvider } from "./context/RecordsContext";
import { hikes } from "./data/hikes";
import { loadRecords, saveRecords } from "./lib/storage";

let scrollToSpy: ReturnType<typeof vi.spyOn>;

const renderApp = () =>
  render(
    <RecordsProvider>
      <App />
    </RecordsProvider>,
  );

beforeEach(() => {
  localStorage.clear();
  window.location.hash = "#adventures";
  scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  scrollToSpy.mockRestore();
});

describe("challenge flow", () => {
  it("renders every supplied adventure in dataset order", () => {
    renderApp();
    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual(hikes.map((hike) => hike.name));
    expect(screen.getByLabelText("0 of 6 hikes completed")).toBeInTheDocument();
  });

  it("earns the correct badge and preserves it across a remount", async () => {
    window.location.hash = "#record/weverton-cliffs";
    const first = renderApp();
    const mission = screen.getByRole("checkbox", {
      name: "Trail mission · Spot a white trail blaze.",
    });
    expect(screen.queryByText(/junior ranger/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /i collected a passport stamp/i }),
    ).not.toBeChecked();
    fireEvent.click(mission);
    const secondMission = screen.getByRole("checkbox", {
      name: "Trail mission · Spot a bend in the Potomac.",
    });
    expect(secondMission).not.toBeChecked();
    fireEvent.click(secondMission);
    const squirrels = screen.getByRole("checkbox", { name: "Spot four squirrels" });
    expect(squirrels).not.toBeChecked();
    fireEvent.click(squirrels);
    fireEvent.change(screen.getByRole("spinbutton", { name: /actual distance/i }), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Earn My Badge" }));

    await waitFor(() => expect(screen.getByText("You earned a badge!")).toBeInTheDocument());
    const close = screen.getByRole("button", { name: "Close celebration" });
    const finish = screen.getByRole("button", { name: "Add it to my collection" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(finish).toHaveFocus();
    fireEvent.keyDown(finish, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveFocus();
    const records = loadRecords().records;
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      hikeId: 1,
      completed: true,
      actualDistanceMiles: 2,
      missionCompleted: true,
      secondMissionCompleted: true,
      spottedFourSquirrels: true,
      passportStampCollected: false,
    });

    first.unmount();
    window.location.hash = "#adventures";
    renderApp();
    expect(screen.getByAltText("Appalachian Adventurer badge")).toBeInTheDocument();
    expect(screen.getByLabelText("1 of 6 hikes completed")).toBeInTheDocument();
    expect(screen.getByText("2.00")).toBeInTheDocument();
  });

  it("resets scroll position after primary navigation", async () => {
    renderApp();
    scrollToSpy.mockClear();

    fireEvent.click(screen.getByRole("link", { name: "Collection" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Badge Collection" })).toBeVisible(),
    );
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
  });

  it("focuses, traps and dismisses the earned badge dialog", async () => {
    const now = new Date().toISOString();
    saveRecords([
      {
        hikeId: 1,
        completed: true,
        completedDate: "2026-12-01",
        actualDistanceMiles: 2,
        weather: [],
        discoveries: [],
        passportStampCollected: false,
        juniorRangerBadgeEarned: false,
        completedEntireHike: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    window.location.hash = "#collection";
    renderApp();

    const badge = screen.getByRole("button", { name: /Appalachian Adventurer/i });
    fireEvent.click(badge);
    const close = await screen.findByRole("button", { name: "Close badge details" });
    expect(close).toHaveFocus();

    const openAdventure = screen.getByRole("link", { name: "Open adventure" });
    openAdventure.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(badge).toHaveFocus();
  });
});

it("refreshes the countdown when reopened after the Eastern calendar date changes", () => {
  vi.setSystemTime(new Date("2026-11-26T04:59:59Z"));
  try {
    renderApp();
    expect(screen.getByText("1 day until Thanksgiving")).toBeVisible();
    vi.setSystemTime(new Date("2026-11-26T05:00:00Z"));
    fireEvent(window, new Event("pageshow"));
    expect(screen.getByRole("heading", { name: "Your winter adventure awaits!" })).toBeVisible();
    expect(screen.getByText("36")).toBeVisible();
  } finally {
    vi.useRealTimers();
  }
});

it("opens the printable certificate for six on-time hikes recorded after the season", async () => {
  vi.setSystemTime(new Date("2027-01-08T12:00:00Z"));
  try {
    const timestamp = new Date().toISOString();
    saveRecords(
      hikes.map(({ id }) => ({
        hikeId: id,
        completed: true,
        completedDate: id === 6 ? "2026-12-31" : "2026-12-12",
        actualDistanceMiles: 2,
        weather: [],
        discoveries: [],
        passportStampCollected: false,
        juniorRangerBadgeEarned: false,
        completedEntireHike: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    );
    renderApp();
    expect(screen.getByRole("heading", { name: "Christmas Trail Master!" })).toBeVisible();
    fireEvent.click(screen.getByRole("link", { name: "View your certificate" }));
    expect(
      await screen.findByRole("heading", { name: "Certificate of Achievement" }),
    ).toBeVisible();
    expect(screen.getByText("December 31, 2026")).toBeVisible();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Print certificate" }));
    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  } finally {
    vi.useRealTimers();
  }
});

it("validates a journal file and waits for confirmation before restoring", async () => {
  window.location.hash = "#settings";
  const timestamp = "2026-12-12T15:00:00Z";
  const journal = [
    {
      hikeId: 1,
      completed: true,
      completedDate: "2026-12-12",
      weather: [],
      discoveries: [],
      passportStampCollected: false,
      juniorRangerBadgeEarned: false,
      completedEntireHike: true,
      missionCompleted: true,
      notes: "A white trail blaze!",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
  renderApp();
  const file = new File([""], "journal.json", { type: "application/json" });
  Object.defineProperty(file, "text", {
    value: async () => JSON.stringify({ schemaVersion: 1, challengeYear: 2026, records: journal }),
  });
  fireEvent.change(screen.getByLabelText("Backup JSON file"), { target: { files: [file] } });
  const restore = await screen.findByRole("button", { name: "Restore backup" });
  expect(loadRecords().records).toHaveLength(0);
  fireEvent.click(restore);
  expect(loadRecords().records).toEqual(journal);
});

it.each(hikes)("links $name to directions and its public AllTrails route", (hike) => {
  window.location.hash = `#adventure/${hike.slug}`;
  renderApp();

  const directions = screen.getByRole<HTMLAnchorElement>("link", {
    name: "Get Directions",
  });
  const destination = new URL(directions.href);
  const { latitude, longitude } = hike.trailhead.coordinates;
  expect(destination.origin).toBe("https://maps.apple.com");
  expect(destination.searchParams.get("daddr")).toBe(`${latitude},${longitude}`);
  expect(destination.searchParams.get("dirflg")).toBe("d");

  const link = screen.getByRole("link", { name: "Open in AllTrails" });
  expect(link).toHaveAttribute("href", hike.allTrails?.url);
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByText("Open in AllTrails to explore the route map.")).toBeVisible();
});

it("loads an official AllTrails widget only on request", () => {
  const hike = hikes[0];
  const embedUrl = "https://www.alltrails.com/widget/trail/example";
  render(<AllTrailsMap hike={{ ...hike, allTrails: { url: hike.allTrails!.url, embedUrl } }} />);
  const title = `AllTrails map of ${hike.name}`;
  expect(screen.queryByTitle(title)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Load AllTrails map" }));
  expect(screen.getByTitle(title)).toHaveAttribute("src", embedUrl);
  expect(screen.getByTitle(title)).toHaveAttribute("referrerpolicy", "no-referrer");
  fireEvent.click(screen.getByRole("button", { name: "Hide AllTrails map" }));
  expect(screen.queryByTitle(title)).toBeNull();
});

it("keeps an ordinary route URL out of the embed frame", () => {
  const hike = hikes[0];
  const routeUrl = hike.allTrails!.url;
  render(<AllTrailsMap hike={{ ...hike, allTrails: { url: routeUrl, embedUrl: routeUrl } }} />);
  expect(screen.queryByRole("button", { name: "Load AllTrails map" })).toBeNull();
  expect(screen.getByText("Open in AllTrails to explore the route map.")).toBeVisible();
});

it("opens a field guide with both missions for every hike without recording progress", async () => {
  renderApp();
  fireEvent.click(screen.getByRole("link", { name: "Trail missions" }));

  expect(await screen.findByRole("heading", { name: "Trail missions" })).toBeVisible();
  expect(screen.getByText(/spot four squirrels/i)).toBeVisible();
  for (const hike of hikes) {
    expect(screen.getByRole("heading", { name: hike.name })).toBeVisible();
    expect(screen.getByText(hike.mission)).toBeVisible();
    expect(screen.getByText(hike.secondMission)).toBeVisible();
  }
  expect(loadRecords().records).toEqual([]);
});
