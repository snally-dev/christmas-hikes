import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import App from "./App";
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
    fireEvent.click(screen.getByRole("button", { name: "Earn My Badge" }));

    await waitFor(() => expect(screen.getByText("You earned a badge!")).toBeInTheDocument());
    const records = loadRecords().records;
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hikeId: 1, completed: true, actualDistanceMiles: 2 });

    first.unmount();
    window.location.hash = "#adventures";
    renderApp();
    expect(screen.getByAltText("Appalachian Adventurer badge")).toBeInTheDocument();
    expect(screen.getByLabelText("1 of 6 hikes completed")).toBeInTheDocument();
    expect(screen.getByText("2.0")).toBeInTheDocument();
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
