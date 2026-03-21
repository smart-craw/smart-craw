import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMessage } from "./responses.ts";

describe("handleMessage", () => {
  it("returns message and reasoning if end think", () => {
    expect(handleMessage("hello world </think>")).toEqual({
      reasoning: "hello world",
      message: "",
    });
  });
  it("returns message and reasoning if total think", () => {
    expect(handleMessage("<think>hello world </think>my message")).toEqual({
      reasoning: "hello world",
      message: "my message",
    });
  });
  it("returns message if no think", () => {
    expect(handleMessage("my message")).toEqual({
      reasoning: "",
      message: "my message",
    });
  });
});
