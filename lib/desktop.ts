// Bridge to the Electron main process (desktop/preload.js's window.brainrot).
//
// At runtime this only resolves inside the Electron shell; in the regular
// browser the bridge is undefined and every helper here becomes a no-op. The
// rest of the app should treat desktop-managed daemons as a *capability* that
// might not be available, not a hard dependency.

export interface DesktopWorkspaceItem {
  wsId: string;
  token?: string;
  name?: string;
}

export interface DesktopWorkspacePayload {
  workspaces: DesktopWorkspaceItem[];
}

export interface DesktopBootstrapResult {
  registered: string[];
  started: string[];
  failed: Array<{ wsId: string; error: string }>;
}

export interface DesktopSyncResult {
  added: string[];
  removed: string[];
  failed: Array<{ wsId: string; error: string }>;
}

export interface DesktopListResult {
  registered: string[];
  running: string[];
}

export interface DesktopOpenAssetPayload {
  projectId: string;
  assetId: string;
  filename: string;
  sha256: string;
}

export interface DesktopOpenAssetResult {
  ok: boolean;
  error?: string;
}

interface DesktopBridge {
  bootstrap: (payload: DesktopWorkspacePayload) => Promise<DesktopBootstrapResult>;
  sync: (payload: DesktopWorkspacePayload) => Promise<DesktopSyncResult>;
  stopAll: () => Promise<{ ok: boolean }>;
  getDaemonLogs: (wsId?: string) => Promise<string | Record<string, string>>;
  listDaemons: () => Promise<DesktopListResult>;
  getServerUrl: () => Promise<string>;
  openAsset: (payload: DesktopOpenAssetPayload) => Promise<DesktopOpenAssetResult>;
}

declare global {
  interface Window {
    brainrot?: DesktopBridge;
  }
}

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === "undefined") return null;
  return window.brainrot ?? null;
}

export function isDesktop(): boolean {
  return getDesktopBridge() !== null;
}
