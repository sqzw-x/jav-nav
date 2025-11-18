# 多站点聚合插件设计

## 插件整体目标

- 为任意视频网站详情页提供聚合跳转入口，帮助用户快速切换到其他站点查看同一影片。
- 不在代码层硬编码站点规则，所有逻辑通过可配置的站点规则完成，方便非开发者扩展。
- 允许用户自定义匹配条件、唯一识别码提取方式、以及如何渲染跳板 UI。

## 设计原则

1. **配置驱动**：所有站点特性（匹配、提取、链接生成、UI 放置）以声明式 JSON/YAML 形式保存，可在插件 UI 中编辑。
2. **可组合规则**：每类规则（匹配、提取、链接生成、UI）允许配置多个策略并设置优先级；一旦命中停止继续尝试。
3. **幂等与缓存**：同一详情页多次运行只计算一次匹配/提取，结果缓存于内存以减少 DOM/正则开销。
4. **安全沙箱**：用户配置中涉及脚本的部分仅允许受限表达式（正则、模板字符串），避免执行任意 JS。

## 高层架构

```text
content script  <--->  rule engine  <--->  site rules store
        |
        +--> DOM adapters + extractors
        +--> UI renderer (portal/overlay)
```

1. **Rule Engine**：在每次页面加载时读取用户规则，依次执行：站点匹配 → 详情页判定 → 唯一识别码提取 → 交叉站点链接生成。
2. **Site Rules Store**：存储 JSON（`rules.json`），也提供图形化配置面板（Options Page）读写；支持导入/导出备份。
3. **Content Script**：监听 URL 变化（SPA 支持），触发规则引擎并调用 UI 渲染。
4. **UI Renderer**：按照规则中指定的挂载点（CSS selector / 插入策略）创建导航面板。

## 站点规则数据模型（草稿）

```ts
type SiteRule = {
  id: string;
  name: string;
  keywords: string[];            // 全局唯一关键词集合
  matchers: Array<UrlMatcher>;
  detailPageGuards?: Array<PageGuard>;
  identifierExtractors: Array<Extractor>;
  entryPoints?: Array<EntryPointRule>;
  uiPlacement: UiPlacementRule;
};
```

### URL 匹配规则 `UrlMatcher`

- `pattern`: 字符串或正则表达式，支持多域名（含镜像）与路径通配。
- `exclude`: 可选列表，排除不需要注入的路径。
- `matchScope`: `host`, `pathname`, `query` 等，帮助减少不必要测试。
- `spaAware`: 是否在 `history.pushState` 变化时重新执行。
- **关键词预过滤**：在遍历 `SiteRule` 之前，根据 URL 是否包含其注册的 `keywords` 决定是否进一步考察；任何 keyword 必须在所有站点中保持全局唯一，以杜绝多站点同时命中。

### 详情页判定 `PageGuard`

- `type`: `regex`, `selector`, `text-content` 等。
- `rule`: 具体表达式/选择器，确保仅在详情页运行。
- `priority`: 数字，越小越先执行；命中后短路。

### 唯一识别码提取 `Extractor`

属性：

```ts
{
  id: string;
  method: 'url-regex' | 'selector' | 'xpath' | 'meta-tag';
  pattern?: string;          // regex 模式
  selector?: string;         // CSS 选择器
  attribute?: string;        // attr 名称
  identifierType: string;    // 该 extractor 产出的标识类型，例如 'fanhao'
  priority?: number;
}
```

- **多策略**：依优先级执行，返回 `{ type, value, sourceExtractorId }`。
- **回退**：若某个 extractor 失败自动尝试下一个；全部失败则提示无法识别。

#### 影片实体与标识映射

- 引擎维护 `IdentifierRegistry`，把多个 `{ type, value }` 聚合成单个“影片实体”，以 `Map<type, value>` 形式缓存。
- 若只拿到非首选 identifier，可依据 `IdentifierTransform`（声明式替换、模板）转换成其他类型，供后续跳转使用。

### 入站链接描述 `EntryPointRule`

```ts
{
  id: string;
  requiredIdentifierType: string; // 某站“最想要”的 identifier
  urlTemplate: string;            // 如何用该 identifier 打开本站
  identifierTransform?: string;   // 允许简单模板，如 `${番号}`
  queryParams?: Record<string,string>;
  displayName: string;
  priority?: number;              // 多入口时的优先级
}
```

- 每个站只需要声明“别人要怎样访问我”，而不必枚举自己要跳到谁。
- Rule Engine 在某站成功提取 identifier 后，会遍历 **所有其他站的 `EntryPointRule`**，凡是能满足 `requiredIdentifierType` 的即自动加到 UI，真正实现“新增站点 → 全网可跳”。
- `identifierTransform` 可在缺少对应 identifier 时，基于 registry 中的其它类型执行模板转换。

### UI 插入 `UiPlacementRule`

- `anchor`: CSS 选择器或 `body` 默认。
- `position`: `before`, `after`, `append`, `prepend`, 或 `floating`。
- `component`: `list`, `dropdown`, `floating-panel` 等预设样式。
- `styleOverrides`: 自定义 class 或行内样式。

## 匹配与执行流程

1. **页面侦测**：content script 监听 `DOMContentLoaded` 与 URL 变化；并行加载用户规则。
2. **站点定位**：先按 `keywords` 预过滤，只对 URL 中包含对应 keyword 的站点执行 `matchers`；命中后进入下一阶段。
3. **详情页验证**：执行 `detailPageGuards`，若失败则终止；支持缓存 guard 结果。
4. **识别码提取**：按 `identifierExtractors` 优先级执行，向 `IdentifierRegistry` 写入 `{ type, value }`；缓存 key=`hostname+path`。
5. **链接生成**：拿到当前页的 `IdentifierRegistry` 后，遍历“所有站点的 `EntryPointRule`”，凡是要求的 identifier 已在 registry 中，就渲染其模板生成可点击链接（默认跳过不可满足的入口）。
6. **UI 渲染**：根据 `uiPlacement` 指令创建容器组件和交互（如 hover、折叠等）。

### Rule Engine 伪代码

```ts
function runRules(url: string, doc: Document) {
  const ctx = createRuleExecutionContext(url, doc);
  const allSites = matchSiteRules(url);
  for (const site of allSites) {
    if (!site.detailPageGuards?.some((guard) => guard.pass(ctx))) continue;
    const identifiers = resolveIdentifier(site.identifierExtractors, ctx);
    if (!identifiers) continue;
    const links = buildLinks(site, allSites, identifiers);
    renderUi(site.uiPlacement, links, ctx);
  }
}
```

`createRuleExecutionContext` 会预处理 URL 片段、DOM 查询缓存等，供 guard 和 extractor 共享，避免重复计算。

## 配置管理 & UI

- **Options Page**：展示站点卡片列表，可添加/导入/导出。
- **Rule Editor**：分标签（匹配、识别码、链接、UI），使用表单 + JSON 高级模式。
- **验证工具**：提供测试面板，输入 URL & HTML 片段可模拟运行查看匹配/提取结果。
- **同步**：使用浏览器同步存储（如 Chrome storage sync）+ 本地 fallback。
- **优先级管理**：在列表中支持拖拽调整 extractor/guard 顺序，实时写入配置。
- **错误提示**：在规则保存前运行轻量校验（重复域名、正则无法编译等），并在 UI 中标红错误字段。
- **逐站点开关**：提供启用/停用按钮，便于用户调试单个站点。
- **Keyword 管理**：提供唯一性校验与快速检索面板，确保任何 keyword 不会重复并可一键定位到相应站点。

## 安全与性能

- 禁止在配置中写任意 JS；仅允许受控模板与正则。
- 对频繁 DOM 查询的 extractor 结果做节流（MutationObserver 触发时 200ms 聚合）。
- 大量站点规则时，可按域名索引（Map<host, SiteRule[]>）以 O(匹配站点) 而非 O(总站点) 查找。
- 通过统一日志器打印“命中关键词 → 匹配规则 → extractor 结果 → entry point 状态”的流水，方便调试并可在 DevTools 中快速过滤特定站点。

## 未来扩展

- **多识别码支持**：扩展 `identifierExtractors` 返回对象 `{ type, value }`，面向不同站点使用不同 ID。
- **社区规则市场**：提供分享链接一键导入。
- **脚本插件**：在严格沙箱（Web Worker + 限制 API）内运行用户脚本，满足极端定制需求。
- **统计与诊断**：收集匿名失败日志，提示用户更新规则。
- **离线备份**：支持自动定期导出配置为文件，方便迁移。
