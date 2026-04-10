import { describe, it, expect, vi } from "vitest";
import { handleStreamingMessage } from "./utils.ts";

describe("parseCompleteMessage", () => {
  const result = handleStreamingMessage(vi.fn(), "<think>", "</think>");
  it("returns message and reasoning if end think", () => {
    expect(result.parseCompleteMessage("hello world </think>")).toEqual({
      reasoning: "hello world",
      message: "",
    });
  });
  it("returns message and reasoning if total think", () => {
    expect(
      result.parseCompleteMessage("<think>hello world </think>my message"),
    ).toEqual({
      reasoning: "hello world",
      message: "my message",
    });
  });
  it("returns message if no think", () => {
    expect(result.parseCompleteMessage("my message")).toEqual({
      reasoning: "",
      message: "my message",
    });
  });
});

describe("detectThinking", () => {
  it("returns true in start token with different think words", () => {
    const result = handleStreamingMessage(vi.fn(), "<think>", "</think>");
    expect(result.detectThinking("<think>", false)).toEqual(true);
  });
  it("returns false in end token with different think words", () => {
    const result = handleStreamingMessage(vi.fn(), "<think>", "</think>");
    expect(result.detectThinking("</think>", false)).toEqual(false);
  });
  it("returns input with non think words", () => {
    const result = handleStreamingMessage(vi.fn(), "<think>", "</think>");
    expect(result.detectThinking("hello world", false)).toEqual(false);
    expect(result.detectThinking("hello world", true)).toEqual(true);
  });
  it("returns true if start token is same as end but isthinking is false", () => {
    const result = handleStreamingMessage(vi.fn(), "<think>", "<think>");
    //at beginning of thinking
    expect(result.detectThinking("<think>", false)).toEqual(true);
  });
  it("returns false if start token is same as end but isthinking is true", () => {
    const result = handleStreamingMessage(vi.fn(), "<think>", "<think>");
    //at end of thinking
    expect(result.detectThinking("<think>", true)).toEqual(false);
  });
});
