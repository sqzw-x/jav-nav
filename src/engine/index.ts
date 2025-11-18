import type { IdentifierRegistry, SiteRule } from "@/rules/types";
import { createLogger } from "@/utils/logger";
import { RuleExecutionContext } from "./context";
import { runExtractors } from "./extractors";
import { guardsPass } from "./guards";
import type { BuiltLink } from "./links";
import { buildLinks } from "./links";
import { keywordMatches, siteMatches } from "./matchers";

const logger = createLogger("engine");

export type RuleEngineResult = {
  site: SiteRule;
  identifiers: IdentifierRegistry;
  links: BuiltLink[];
  timestamp: number;
};

export type RuleEngineOptions = {
  loadRules: () => Promise<SiteRule[]>;
};

export class RuleEngine {
  private rules: SiteRule[] = [];
  private resultCache = new Map<string, RuleEngineResult>();

  constructor(private options: RuleEngineOptions) {}

  async hydrate() {
    this.rules = await this.options.loadRules();
    logger.info(`Loaded ${this.rules.length} site rules`);
  }

  invalidate(url?: string) {
    if (!url) {
      this.resultCache.clear();
      return;
    }
    this.resultCache.delete(url);
  }

  async run(url: string, doc: Document): Promise<RuleEngineResult | null> {
    if (!this.rules.length) {
      await this.hydrate();
    }

    const cacheKey = url;
    if (this.resultCache.has(cacheKey)) {
      logger.debug("Using cached rule results", { url });
      return this.resultCache.get(cacheKey) ?? null;
    }

    const ctx = new RuleExecutionContext(url, doc);

    for (const site of this.rules) {
      if (site.enabled === false) continue;
      if (site.keywords.length && !keywordMatches(site, ctx.url.host)) continue;
      if (!siteMatches(site, ctx)) continue;
      if (!guardsPass(site.detailPageGuards, ctx)) continue;

      const identifiers = runExtractors(site.identifierExtractors, ctx);
      if (!identifiers.size) continue;
      const links = buildLinks(site, this.rules, identifiers);
      const res = { site, identifiers, links, timestamp: Date.now() };
      this.resultCache.set(cacheKey, res);
      logger.info("Rule matched", { siteId: site.id, url });
      return res;
    }
    return null;
  }
}
