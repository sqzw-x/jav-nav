import type { EntryPoint, Extractor, PageGuard, RuleValidationError, SiteRule, UrlMatcher } from "./types";

const validateRegex = (pattern: string, siteId: string, errors: RuleValidationError[]) => {
  try {
    new RegExp(pattern);
  } catch (error) {
    errors.push({
      type: "invalid-regex",
      siteId,
      message: `无效的正则表达式: ${pattern} (${String(error)})`,
    });
  }
};

const validateMatcher = (matcher: UrlMatcher, siteId: string, errors: RuleValidationError[]) => {
  if (!matcher.pattern) {
    errors.push({ type: "missing-field", siteId, message: `Matcher ${matcher.id} missing pattern` });
    return;
  }
  validateRegex(matcher.pattern, siteId, errors);
  if (matcher.exclude) {
    for (const excludePattern of matcher.exclude) {
      validateRegex(excludePattern, siteId, errors);
    }
  }
};

const validateExtractor = (extractor: Extractor, siteId: string, errors: RuleValidationError[]) => {
  if (!extractor.identifierType) {
    errors.push({
      type: "missing-field",
      siteId,
      message: `Extractor ${extractor.id} missing identifierType`,
    });
  }
  if (["url-regex", "xpath"].includes(extractor.method) && !extractor.pattern) {
    errors.push({
      type: "missing-field",
      siteId,
      message: `Extractor ${extractor.id} requires pattern`,
    });
  }
  if (extractor.pattern) validateRegex(extractor.pattern, siteId, errors);
  if (extractor.replaceWith) validateRegex(extractor.replaceWith, siteId, errors);
  if (extractor.method === "selector" && !extractor.selector) {
    errors.push({
      type: "missing-field",
      siteId,
      message: `Extractor ${extractor.id} requires selector`,
    });
  }
};

const validateGuard = (guard: PageGuard, siteId: string, errors: RuleValidationError[]) => {
  if (!guard.rule) {
    errors.push({ type: "missing-field", siteId, message: `Guard ${guard.id} missing rule` });
    return;
  }
  if (guard.type === "url-regex") {
    validateRegex(guard.rule, siteId, errors);
  }
};

const validateEntryPoint = (entryPoint: EntryPoint, siteId: string, errors: RuleValidationError[]) => {
  if (!entryPoint.requiredIdentifierType) {
    errors.push({
      type: "missing-field",
      siteId,
      message: `EntryPoint ${entryPoint.id} missing requiredIdentifierType`,
    });
  }
  if (!entryPoint.urlTemplate) {
    errors.push({ type: "missing-field", siteId, message: `EntryPoint ${entryPoint.id} missing urlTemplate` });
  }
};

export const validateRules = (rules: SiteRule[]): RuleValidationError[] => {
  const errors: RuleValidationError[] = [];
  const keywordMap = new Map<string, string>();

  for (const rule of rules) {
    if (!rule.keywords?.length) {
      errors.push({ type: "missing-field", siteId: rule.id, message: "keywords cannot be empty" });
    }
    rule.keywords?.forEach((keyword) => {
      const existing = keywordMap.get(keyword);
      if (existing && existing !== rule.id) {
        errors.push({
          type: "keyword-dup",
          siteId: rule.id,
          message: `Keyword ${keyword} already used by ${existing}`,
        });
      } else {
        keywordMap.set(keyword, rule.id);
      }
    });

    for (const matcher of rule.matchers) {
      validateMatcher(matcher, rule.id, errors);
    }
    for (const extractor of rule.identifierExtractors) {
      validateExtractor(extractor, rule.id, errors);
    }
    if (rule.detailPageGuards) {
      for (const guard of rule.detailPageGuards) {
        validateGuard(guard, rule.id, errors);
      }
    }
    if (rule.entryPoints) {
      for (const entryPoint of rule.entryPoints) {
        validateEntryPoint(entryPoint, rule.id, errors);
      }
    }
  }

  return errors;
};
