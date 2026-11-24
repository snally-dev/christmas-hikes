import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import App from "./App";
import { RecordsProvider } from "./context/RecordsContext";
import { hikes } from "./data/hikes";
import { loadRecords } from "./lib/storage";

const renderApp = () =>
  render(
    <RecordsProvider>
      <App />
    </RecordsProvider>,
  );

beforeEach(() => {
  localStorage.clear();
  window.location.hash = "#adventures";
});

afterEach(cleanup);

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
});
