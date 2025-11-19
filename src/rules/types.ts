type LabelMapEntries = ReadonlyArray<readonly [string, string]>;

const createLabelMap = <Entries extends LabelMapEntries>(entries: Entries) =>
  new Map(entries) as ReadonlyMap<Entries[number][0], Entries[number][1]>;

type LabelMapKeys<M extends ReadonlyMap<string, unknown>> = M extends ReadonlyMap<infer K, unknown> ? K : never;

export const matchScopeLabelMap = createLabelMap([
  ["host", "主机+端口"],
  ["hostname", "主机名"],
  ["pathname", "路径"],
  ["query", "查询参数"],
  ["hash", "哈希片段"],
  ["full", "完整 URL"],
] as const);

export type MatchScope = LabelMapKeys<typeof matchScopeLabelMap>;

export const guardTypeLabelMap = createLabelMap([
  ["selector", "CSS 选择器"],
  ["url-regex", "URL 正则"],
  ["text-content", "网页文本"],
] as const);

export type GuardType = LabelMapKeys<typeof guardTypeLabelMap>;

export const extractorMethodLabelMap = createLabelMap([
  ["url-regex", "URL 正则"],
  ["selector", "CSS 选择器"],
  ["xpath", "XPath"],
] as const);

export type ExtractorMethod = LabelMapKeys<typeof extractorMethodLabelMap>;

export const uiPositionLabelMap = createLabelMap([
  ["before", "before"],
  ["after", "after"],
  ["append", "append"],
  ["prepend", "prepend"],
  ["floating", "floating"],
] as const);

export type UiPosition = LabelMapKeys<typeof uiPositionLabelMap>;

export type UrlMatcher = {
  id: string;
  pattern: string;
  exclude?: string[];
  matchScope?: MatchScope;
  spaAware?: boolean;
};

export type PageGuard = {
  id: string;
  type: GuardType;
  rule: string;
  priority?: number;
};

export type Extractor = {
  id: string;
  method: ExtractorMethod;
  pattern?: string;
  replaceWith?: string;
  selector?: string;
  attribute?: string;
  identifierType: string;
  priority?: number;
};

export type IdentifierValue = {
  type: string;
  value: string;
  sourceExtractorId: string;
};

export type IdentifierRegistry = Map<string, IdentifierValue>;

export type EntryPoint = {
  id: string;
  requiredIdentifierType: string;
  pattern?: string;
  replaceWith?: string;
  urlTemplate: string;
  queryParams?: Record<string, string>;
  displayName: string;
  color?: string;
  priority?: number;
};

export type UiPlacementRule = {
  anchor: string;
  position?: UiPosition;
};

export type SiteRule = {
  id: string;
  name: string;
  keywords: string[];
  enabled?: boolean;
  matchers: UrlMatcher[];
  detailPageGuards?: PageGuard[];
  identifierExtractors: Extractor[];
  entryPoints?: EntryPoint[];
  uiPlacement: UiPlacementRule;
};

export type RuleValidationError = {
  type: "keyword-dup" | "invalid-regex" | "missing-field";
  siteId: string;
  message: string;
};
