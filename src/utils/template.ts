type TemplateContext = Record<string, string | undefined>;

const tokenRegex = /\{([^}]+)\}/g;

export const renderTemplate = (template: string, context: TemplateContext): string =>
  template.replace(tokenRegex, (_, rawKey: string) => {
    const [key, transform] = rawKey.split(":");
    const base = context[key.trim()] ?? "";
    if (!transform) return base;
    switch (transform.trim()) {
      case "upper":
        return base.toUpperCase();
      case "lower":
        return base.toLowerCase();
      case "encodeURIComponent":
        return encodeURIComponent(base);
      default:
        return base;
    }
  });
