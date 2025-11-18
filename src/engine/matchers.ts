import type { SiteRule, UrlMatcher } from "@/rules/types";
import { createLogger } from "@/utils/logger";
import type { RuleExecutionContext } from "./context";

const logger = createLogger("matcher");

const compileRegex = (pattern: string): RegExp => {
  try {
    return new RegExp(pattern, "i");
  } catch (error) {
    logger.warn("Failed to compile matcher regex", { pattern, error });
    return /$^/;
  }
};

const matchesScope = (pattern: string, scopeValue: string): boolean => compileRegex(pattern).test(scopeValue);

const matcherHit = (matcher: UrlMatcher, ctx: RuleExecutionContext): boolean => {
  const scope = matcher.matchScope ?? "full";
  const scopeValue = ctx.getUrlPart(scope);
  if (!matchesScope(matcher.pattern, scopeValue)) {
    return false;
  }
  if (!matcher.exclude) return true;
  return matcher.exclude.every((pattern) => !matchesScope(pattern, scopeValue));
};

export const keywordMatches = (rule: SiteRule, hostname: string): boolean =>
  rule.keywords.some((keyword) => hostname.includes(keyword));

export const siteMatches = (rule: SiteRule, ctx: RuleExecutionContext): boolean =>
  rule.matchers.some((matcher) => matcherHit(matcher, ctx));
