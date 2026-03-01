export type CreateBotInput = {
  description: string;
  instructions: string;
  name: string;
};
export type BotIdInput = {
  id: string;
};

export type ApprovalInput = {
  approved: boolean;
  toolName: string;
  id: string;
};

export type WebSocketInput = {
  path: string;
  input: CreateBotInput | BotIdInput | ApprovalInput; //plus more in the future
};
