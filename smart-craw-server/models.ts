import { Agent } from "@strands-agents/sdk";
import nodeCron from "node-cron";
export * from "../shared/models.ts";

export type WebSocketInputServer = {
  path: string;
  input: any; // Allow the server router to narrow types
};

export type AgentWithSchedule = {
  agent: Agent;
  instructions: string;
  cronTask?: nodeCron.ScheduledTask;
};
