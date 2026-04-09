import { describe, it, expect } from "vitest";
import { handleMessage, isStreamThinking } from "./responses.ts";

describe("handleMessage", () => {
  it("returns message and reasoning if end think", () => {
    expect(
      handleMessage("<think>", "</think>")("hello world </think>"),
    ).toEqual({
      reasoning: "hello world",
      message: "",
    });
  });
  it("returns message and reasoning if total think", () => {
    expect(
      handleMessage(
        "<think>",
        "</think>",
      )("<think>hello world </think>my message"),
    ).toEqual({
      reasoning: "hello world",
      message: "my message",
    });
  });
  it("returns message if no think", () => {
    expect(handleMessage("<think>", "</think>")("my message")).toEqual({
      reasoning: "",
      message: "my message",
    });
  });
});

describe("isStreamThinking", () => {
  it("returns true in start token with different think words", () => {
    expect(isStreamThinking("<think>", "</think>")("<think>", false)).toEqual(
      true,
    );
  });
  it("returns false in end token with different think words", () => {
    expect(isStreamThinking("<think>", "</think>")("</think>", false)).toEqual(
      false,
    );
  });
  it("returns input with non think words", () => {
    expect(
      isStreamThinking("<think>", "</think>")("hello world", false),
    ).toEqual(false);
    expect(
      isStreamThinking("<think>", "</think>")("hello world", true),
    ).toEqual(true);
  });
  it("returns true if start token is same as end but isthinking is false", () => {
    //at beginning of thinking
    expect(isStreamThinking("<think>", "<think>")("<think>", false)).toEqual(
      true,
    );
  });
  it("returns false if start token is same as end but isthinking is true", () => {
    //at end of thinking
    expect(isStreamThinking("<think>", "<think>")("<think>", true)).toEqual(
      false,
    );
  });
});
