export type Scope = "workspace" | "project" | "task";

export interface WSSubscribeMsg {
  type: "subscribe" | "unsubscribe";
  scope: Scope;
  id: string;
}
