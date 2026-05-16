"use client";
import { createContext, useContext } from "react";
import { WSClient } from "./client";

export const WSClientContext = createContext<WSClient | null>(null);

export function useWSClient(): WSClient | null {
  return useContext(WSClientContext);
}
