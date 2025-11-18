import type { DocumentLike } from "@/utils/dom";

type QueryCache = Map<string, Element | null>;
type TextCache = Map<string, string | null>;
type MemoCache = Map<string, unknown>;

export class RuleExecutionContext {
  readonly url: URL;
  readonly document: DocumentLike;
  private readonly queryCache: QueryCache = new Map();
  private readonly textCache: TextCache = new Map();
  private readonly memoCache: MemoCache = new Map();

  constructor(targetUrl: string, doc: DocumentLike) {
    this.url = new URL(targetUrl, doc.baseURI);
    this.document = doc;
  }

  getUrlPart(scope: "host" | "hostname" | "pathname" | "query" | "hash" | "full"): string {
    switch (scope) {
      case "host":
        return this.url.host;
      case "hostname":
        return this.url.hostname;
      case "pathname":
        return this.url.pathname;
      case "query":
        return this.url.search;
      case "hash":
        return this.url.hash;
      default:
        return this.url.href;
    }
  }

  querySelector(selector: string): Element | null {
    if (this.queryCache.has(selector)) {
      return this.queryCache.get(selector) ?? null;
    }
    const node = this.document.querySelector(selector);
    this.queryCache.set(selector, node);
    return node;
  }

  textContent(selector: string): string | null {
    if (this.textCache.has(selector)) {
      return this.textCache.get(selector) ?? null;
    }
    const node = this.querySelector(selector);
    const text = node?.textContent?.trim() ?? null;
    this.textCache.set(selector, text);
    return text;
  }

  memoize<T>(key: string, factory: () => T): T {
    if (this.memoCache.has(key)) {
      return this.memoCache.get(key) as T;
    }
    const value = factory();
    this.memoCache.set(key, value);
    return value;
  }
}
