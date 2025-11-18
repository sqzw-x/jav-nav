import { GM_getValue, GM_setValue } from "vite-plugin-monkey/dist/client";
import { createDefaultSiteRules } from "./defaultRules";
import type { SiteRule } from "./types";
import { validateRules } from "./validate";

const STORAGE_KEY = "jav-nav:site-rules";

const gmAvailable = typeof GM_getValue === "function" && typeof GM_setValue === "function";

interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const gmStorage: StorageAdapter = {
  async getItem(key) {
    const value = GM_getValue<string | null>(key, null);
    return value;
  },
  async setItem(key, value) {
    GM_setValue(key, value);
  },
};

const localStorageAdapter: StorageAdapter = {
  async getItem(key) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
};

const storageAdapter = gmAvailable ? gmStorage : localStorageAdapter;

export class SiteRuleStore {
  private cache: SiteRule[] | null = null;

  async load(): Promise<SiteRule[]> {
    if (this.cache) return this.cache;
    const raw = await storageAdapter.getItem(STORAGE_KEY);
    if (!raw) {
      this.cache = createDefaultSiteRules();
      return this.cache;
    }
    try {
      const parsed = JSON.parse(raw) as SiteRule[];
      this.cache = parsed;
      return parsed;
    } catch (error) {
      console.warn("Failed to parse stored rules; using sample", error);
      this.cache = createDefaultSiteRules();
      return this.cache;
    }
  }

  async save(rules: SiteRule[]): Promise<void> {
    const validationErrors = validateRules(rules);
    if (validationErrors.length) {
      throw new Error(`验证失败: ${validationErrors.map((e) => e.message).join(", ")}`);
    }
    const payload = JSON.stringify(rules);
    await storageAdapter.setItem(STORAGE_KEY, payload);
    this.cache = rules;
  }

  async export(): Promise<string> {
    const rules = await this.load();
    return JSON.stringify(rules, null, 2);
  }

  async import(json: string): Promise<SiteRule[]> {
    const data = JSON.parse(json) as SiteRule[];
    await this.save(data);
    return data;
  }

  invalidate() {
    this.cache = null;
  }
}
