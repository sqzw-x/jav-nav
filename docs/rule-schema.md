# Rule Schema Overview

| Section | Purpose | Key Fields |
| --- | --- | --- |
| `keywords` | URL 预过滤，避免全量匹配 | `string[]`，必须全局唯一 |
| `matchers` | 命中 host/path/query | `pattern`, `matchScope`, `exclude`, `spaAware` |
| `detailPageGuards` | 二次校验详情页 | type (regex / selector / text-content), `rule`, `priority` |
| `identifierExtractors` | 提取影片标识 | `method`, `pattern/selector`, `normalize`, `identifierType`, `priority` |
| `entryPoints` | 描述“如何跳转到我” | `requiredIdentifierType`, `urlTemplate`, `identifierTransform`, `queryParams`, `color`, `priority` |
| `uiPlacement` | 插入 UI | `anchor`, `position`, `component`, `styleOverrides` |

## JSON Example

```jsonc
{
  "id": "onejav",
  "name": "OneJAV",
  "keywords": ["onejav"],
  "matchers": [
    { "id": "onejav-default", "pattern": "onejav\\.", "matchScope": "hostname" }
  ],
  "detailPageGuards": [
    { "id": "detail", "type": "selector", "rule": ".video-info" }
  ],
  "identifierExtractors": [
    {
      "id": "fanhao-url",
      "method": "url-regex",
      "pattern": "/video/([a-z0-9-]+)/",
      "identifierType": "fanhao"
    }
  ],
  "entryPoints": [
    {
      "id": "search-javdb",
      "requiredIdentifierType": "fanhao",
      "color": "#1677ff",
      "urlTemplate": "https://javdb.com/search?q=${identifier:upper}"
    }
  ],
  "uiPlacement": { "anchor": "body", "position": "append", "component": "floating-panel" }
}
```

## Validation Rules

1. 每个 keyword 仅能属于一个站点。
2. `pattern` 与 `exclude` 正则需可成功编译。
3. Extractor 必须声明 `identifierType`，`selector` 方法需要 `selector`（可选 `attribute`）。
4. 若希望被其他站点链接，至少配置一个 `entryPoint`，并确保 `requiredIdentifierType` 与 extractor 对应。
5. UI `anchor` 需为合法 CSS Selector，找不到时默认挂到 `body`。
