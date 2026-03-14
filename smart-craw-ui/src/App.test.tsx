import { render } from "vitest-browser-react";
import { describe, expect, test } from "vitest";
import App from "./App";

describe("page renders", () => {
  test("it renders Bot Inventory", async () => {
    const screen = await render(<App />);
    await expect
      .element(screen.getByText(/Bot Inventory/i))
      .toBeInTheDocument();
  });
  test("it renders Bot Playground", async () => {
    const screen = await render(<App />);
    await expect
      .element(screen.getByText(/Bot Playground/i))
      .toBeInTheDocument();
  });
});
