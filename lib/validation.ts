export const isValidEmail = (s: string): boolean =>
  typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export const isValidPassword = (s: string): boolean =>
  typeof s === "string" && s.length >= 8;

export const isValidUuid = (s: string): boolean =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
