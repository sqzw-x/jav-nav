import type { Extractor, IdentifierRegistry, IdentifierValue } from "@/rules/types";
import { createLogger } from "@/utils/logger";
import { applyPattern } from "@/utils/regex";
import type { RuleExecutionContext } from "./context";

const logger = createLogger("extractor");

type ExtractorHandler = (extractor: Extractor, ctx: RuleExecutionContext) => string | null;

const extractorHandlers: Record<Extractor["method"], ExtractorHandler> = {
  "url-regex": (extractor, ctx) => applyPattern(ctx.url.href, extractor.pattern, extractor.replaceWith),
  selector: (extractor, ctx) => {
    if (!extractor.selector) return null;
    const baseValue = extractor.attribute
      ? (ctx.querySelector(extractor.selector)?.getAttribute(extractor.attribute) ?? null)
      : ctx.textContent(extractor.selector);
    if (!baseValue) return null;
    return applyPattern(baseValue, extractor.pattern, extractor.replaceWith);
  },
  xpath: (extractor, ctx) => {
    if (!extractor.selector) return null;
    try {
      const documentEval = ctx.document.evaluate(extractor.selector, ctx.document, null, XPathResult.STRING_TYPE, null);
      return applyPattern(documentEval.stringValue, extractor.pattern, extractor.replaceWith);
    } catch (error) {
      logger.warn("XPath extractor failed", { extractor, error });
      return null;
    }
  },
};

export const runExtractors = (extractors: Extractor[], ctx: RuleExecutionContext): IdentifierRegistry => {
  const registry: IdentifierRegistry = new Map();
  const sorted = [...extractors].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  for (const extractor of sorted) {
    const handler = extractorHandlers[extractor.method];
    if (!handler) continue;
    const value = handler(extractor, ctx);
    if (!value) continue;
    if (!registry.has(extractor.identifierType)) {
      const identifierValue: IdentifierValue = {
        type: extractor.identifierType,
        value,
        sourceExtractorId: extractor.id,
      };
      registry.set(extractor.identifierType, identifierValue);
      logger.info(`Extractor ${extractor.id} produced ${value}`);
    }
  }
  return registry;
};
