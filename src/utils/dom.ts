export type DocumentLike = Document;

export const isBrowser = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

export const resolveDocument = (): DocumentLike | null => (isBrowser() ? document : null);
