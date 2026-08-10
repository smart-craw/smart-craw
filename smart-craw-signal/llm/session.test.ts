import { mkdir, rm } from "node:fs/promises";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createSessionManager } from "./session.ts";

describe("createSessionManager", () => {
  beforeAll(async () => {
    await mkdir("temptest_session", { recursive: true });
    await mkdir("temptest_working", { recursive: true });
  });
  afterAll(async () => {
    await rm("temptest_session", { recursive: true, force: true });
    await rm("temptest_working", { recursive: true, force: true });
  });
  it("correctly creates files", async () => {
    const sm = createSessionManager(
      "testllmurl",
      "temptest_session",
      "temptest_working",
      [],
      (s, x) => {},
    );
    const initSessionId = sm.getSessionId(); //uuid
    await sm.loadLastSessionOrCreateInitial(); //run a typical init
    const sessionFolders = await sm.getSessionFolders("temptest_working"); //ensure folder was correctly created
    expect(sessionFolders).toHaveLength(1);
    expect(sessionFolders[0].sessionId).toEqual(initSessionId); //folder should be named same as uuid
    //create a separate instance which wouldn't share the same random init uuid
    const sm2 = createSessionManager(
      "testllmurl",
      "temptest_session",
      "temptest_working",
      [],
      (s, x) => {},
    );
    await sm2.loadLastSessionOrCreateInitial();
    //expect the actual sessionId to come from the folder rather than the random generated
    expect(sm2.getSessionId()).toEqual(initSessionId);
  });
});
