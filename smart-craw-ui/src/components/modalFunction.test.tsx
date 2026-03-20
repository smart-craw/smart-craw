import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { isNotEmpty, checkValuesAreValid, showBotModal } from "./modalFunction";
import { App } from "antd";
import type { BotOutput } from "../../../shared/models";
import { useEffect } from "react";
import { userEvent } from "vitest/browser";

describe("isNotEmpty", () => {
  it("returns false if empty string", () => {
    expect(isNotEmpty("")).toBe(false);
  });
  it("returns false if undefined", () => {
    expect(isNotEmpty(undefined)).toBe(false);
  });
  it("returns false if undefined", () => {
    expect(isNotEmpty(null)).toBe(false);
  });
  it("returns true if not empty string", () => {
    expect(isNotEmpty("hello")).toBe(true);
  });
});

describe("checkValuesAreValid", () => {
  it("returns false if bad cron", () => {
    const bot = {
      cron: "somethingdumb",
      name: "hello",
      description: "hi",
      id: "goodbye",
      instructions: "instruct!",
    };
    expect(checkValuesAreValid(bot)).toBe(false);
  });
  it("returns false if empty name", () => {
    const bot = {
      cron: "",
      name: "",
      description: "hi",
      id: "goodbye",
      instructions: "instruct!",
    };
    expect(checkValuesAreValid(bot)).toBe(false);
  });
  it("returns false if empty description", () => {
    const bot = {
      cron: "",
      name: "name",
      description: "",
      id: "goodbye",
      instructions: "instruct!",
    };
    expect(checkValuesAreValid(bot)).toBe(false);
  });
  it("returns false if empty instructions", () => {
    const bot = {
      cron: "",
      name: "name",
      description: "description",
      id: "goodbye",
      instructions: "",
    };
    expect(checkValuesAreValid(bot)).toBe(false);
  });
  it("returns true if cron empty and everything else good", () => {
    const bot = {
      cron: "",
      name: "name",
      description: "description",
      id: "goodbye",
      instructions: "instruct!",
    };
    expect(checkValuesAreValid(bot)).toBe(true);
  });
  it("returns true if cron undefined and everything else good", () => {
    const bot = {
      cron: undefined,
      name: "name",
      description: "description",
      id: "goodbye",
      instructions: "instruct!",
    };
    expect(checkValuesAreValid(bot)).toBe(true);
  });
  it("returns true if cron valid and everything else good", () => {
    const bot = {
      cron: "30 2 * * *",
      name: "name",
      description: "description",
      id: "goodbye",
      instructions: "instruct!",
    };
    expect(checkValuesAreValid(bot)).toBe(true);
  });
});

describe("Modal Bot", () => {
  type Props = {
    isNew: boolean;
    onCreate: (isNew: boolean, bot: BotOutput) => void;
  };

  it("renders initial form correctly", async () => {
    const DummyComponent = ({ onCreate, isNew }: Props) => {
      const { modal } = App.useApp();
      useEffect(() => {
        showBotModal(
          "Create Bot",
          modal,
          {
            id: "",
            name: "",
            instructions: "",
            description: "",
            cron: undefined,
          },
          isNew,
          onCreate,
        );
      }, [isNew, modal, onCreate]);
      return <p></p>;
    };
    const fn = vi.fn();
    const screen = await render(
      <App>
        <DummyComponent onCreate={fn} isNew={true} />
      </App>,
    );

    await expect.element(screen.getByText("Create Bot")).toHaveLength(2);
    await expect.element(screen.getByText("Name (required)")).toHaveLength(1);
  });
  it("submits new values", async () => {
    const DummyComponent = ({ onCreate, isNew }: Props) => {
      const { modal } = App.useApp();
      useEffect(() => {
        showBotModal(
          "Create Bot",
          modal,
          {
            id: "",
            name: "",
            instructions: "",
            description: "",
            cron: undefined,
          },
          isNew,
          onCreate,
        );
      }, [isNew, modal, onCreate]);
      return <p></p>;
    };
    const fn = vi.fn();
    const screen = await render(
      <App>
        <DummyComponent onCreate={fn} isNew={true} />
      </App>,
    );
    await expect.element(screen.getByRole("textbox")).toHaveLength(4);
    const name = screen.getByRole("textbox").nth(0);
    await userEvent.fill(name, "name");
    const description = screen.getByRole("textbox").nth(1);
    await userEvent.fill(description, "description");
    const instructions = screen.getByRole("textbox").nth(2);
    await userEvent.fill(instructions, "instructions");
    await expect
      .element(screen.getByRole("button", { name: "OK" }))
      .toHaveLength(1);
    const okButton = screen.getByRole("button", { name: "OK" });
    //await okButton.click(); //userEvent.click(okButton);
    await userEvent.click(okButton);
    await vi.waitFor(() => {
      expect(fn).toHaveBeenCalledWith(true, {
        name: "name",
        description: "description",
        instructions: "instructions",
        cron: undefined,
        id: "",
      });
    });
  });
  it("submits updated values", async () => {
    const DummyComponent = ({ onCreate, isNew }: Props) => {
      const { modal } = App.useApp();
      useEffect(() => {
        showBotModal(
          "Update Bot",
          modal,
          {
            id: "",
            name: "nm",
            instructions: "inst",
            description: "desc",
            cron: undefined,
          },
          isNew,
          onCreate,
        );
      }, [isNew, modal, onCreate]);
      return <p></p>;
    };
    const fn = vi.fn();
    const screen = await render(
      <App>
        <DummyComponent onCreate={fn} isNew={false} />
      </App>,
    );
    await expect.element(screen.getByRole("textbox")).toHaveLength(4);
    const name = screen.getByRole("textbox").nth(0);
    await userEvent.fill(name, "name");
    const description = screen.getByRole("textbox").nth(1);
    await userEvent.fill(description, "description");
    const instructions = screen.getByRole("textbox").nth(2);
    await userEvent.fill(instructions, "instructions");
    await expect
      .element(screen.getByRole("button", { name: "OK" }))
      .toHaveLength(1);
    const okButton = screen.getByRole("button", { name: "OK" });
    await userEvent.click(okButton);
    await vi.waitFor(() => {
      expect(fn).toHaveBeenCalledWith(false, {
        name: "name",
        description: "description",
        instructions: "instructions",
        cron: undefined,
        id: "",
      });
    });
  });
});
