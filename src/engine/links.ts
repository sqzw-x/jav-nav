import type { EntryPoint, IdentifierRegistry, SiteRule } from "@/rules/types";
import { applyPattern } from "@/utils/regex";
import { renderTemplate } from "@/utils/template";

export type BuiltLink = {
  id: string;
  targetSiteId: string;
  displayName: string;
  url: string;
  reason?: string;
  color?: string;
};

const buildContext = (registry: IdentifierRegistry): Record<string, string> => {
  const context: Record<string, string> = {};
  registry.forEach((identifier) => {
    context[identifier.type] = identifier.value;
  });
  return context;
};

const resolveIdentifier = (entryPoint: EntryPoint, registry: IdentifierRegistry): string | null =>
  registry.get(entryPoint.requiredIdentifierType)?.value ?? null;

const sortEntryPoints = (entryPoints: EntryPoint[] = []) =>
  [...entryPoints].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

export const buildLinks = (currentSite: SiteRule, allSites: SiteRule[], registry: IdentifierRegistry): BuiltLink[] => {
  const context = buildContext(registry);
  const links: BuiltLink[] = [];

  for (const targetSite of allSites) {
    if (targetSite.id === currentSite.id) continue;
    if (targetSite.enabled === false) continue;
    const entryPoints = sortEntryPoints(targetSite.entryPoints ?? []);
    for (const entry of entryPoints) {
      const identifierValue = resolveIdentifier(entry, registry);
      if (!identifierValue) {
        continue;
      }
      const converted = applyPattern(identifierValue, entry.pattern, entry.replaceWith);

      const linkContext = { ...context, id: converted };
      const url = renderTemplate(entry.urlTemplate, linkContext);

      links.push({
        id: `${currentSite.id}->${targetSite.id}:${entry.id}`,
        targetSiteId: targetSite.id,
        displayName: entry.displayName,
        url,
        color: entry.color,
      });
      break;
    }
  }

  return links;
};
