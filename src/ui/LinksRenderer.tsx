import { Card, List, Typography } from "antd";
import { type CSSProperties, useState } from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import type { RuleEngineResult } from "@/engine";
import type { BuiltLink } from "@/engine/links";
import type { UiPlacementRule } from "@/rules/types";

const { Text } = Typography;

type MountEntry = {
  root: Root;
  container: HTMLElement;
};

const attachContainer = (placement: UiPlacementRule, anchor: Element, container: HTMLElement) => {
  switch (placement.position) {
    case "before":
      anchor.parentElement?.insertBefore(container, anchor);
      break;
    case "after":
      anchor.parentElement?.insertBefore(container, anchor.nextSibling);
      break;
    case "prepend":
      anchor.prepend(container);
      break;
    case "floating":
      container.style.position = "fixed";
      container.style.top = "80px";
      container.style.right = "16px";
      anchor.append(container);
      break;
    case "append":
      anchor.append(container);
      break;
    default:
      anchor.append(container);
  }
};

const itemBaseStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  border: "1px solid #f5f5f5",
  borderRadius: 8,
  padding: "4px 6px",
  minHeight: 20,
  background: "#fff",
  textAlign: "center",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
  cursor: "pointer",
  textDecoration: "none",
  color: "inherit",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
};

const hoverStateStyle: CSSProperties = {
  boxShadow: "0 6px 14px rgba(22, 119, 255, 0.18)",
  transform: "translateY(-2px)",
};

const LinkItem = ({ link }: { link: BuiltLink }) => {
  const [hovered, setHovered] = useState(false);
  const borderColor = hovered ? "#a6c8ff" : "#f5f5f5";
  const textColor = link.color ?? "inherit";
  const linkStyle: CSSProperties = {
    ...itemBaseStyle,
    ...(hovered ? hoverStateStyle : {}),
    borderColor,
    color: textColor,
  };

  return (
    <List.Item style={{ padding: 0 }}>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        style={linkStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Text strong ellipsis style={{ fontSize: 16, color: "inherit" }}>
          {link.displayName}
        </Text>
      </a>
    </List.Item>
  );
};

const formatIdentifierSummary = (result: RuleEngineResult) =>
  Array.from(result.identifiers.values())
    .map((identifier) => `${identifier.type}: ${identifier.value}`)
    .join(" · ");

const Panel = ({ result, onOpenSettings }: { result: RuleEngineResult; onOpenSettings?: () => void }) => {
  return (
    <Card
      size="small"
      title={
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Text strong>{`当前: ${result.site.name}`}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatIdentifierSummary(result)}
          </Text>
        </div>
      }
      headStyle={{ padding: "8px 12px" }}
      bodyStyle={{ padding: "8px" }}
      style={{ marginBottom: 6, minWidth: 220, maxWidth: 500 }}
      extra={
        onOpenSettings && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenSettings();
            }}
            style={{ border: "none", background: "transparent", color: "#1677ff", cursor: "pointer" }}
          >
            设置
          </button>
        )
      }
    >
      <List
        size="small"
        grid={{ gutter: 4, column: 5 }}
        dataSource={result.links}
        locale={{ emptyText: "暂无可用链接" }}
        renderItem={(link) => <LinkItem link={link} />}
      />
    </Card>
  );
};

export class LinksRenderer {
  private mounts = new Map<string, MountEntry>();
  private openOptions?: () => void;

  setOptionsHandler(handler: () => void) {
    this.openOptions = handler;
  }

  render(result: RuleEngineResult, doc: Document) {
    const activeSites = new Set<string>();
    const placement = result.site.uiPlacement;
    const mount = this.mounts.get(result.site.id) ?? this.createMount(result.site.id, placement, doc);
    activeSites.add(result.site.id);
    mount.root.render(<Panel result={result} onOpenSettings={this.openOptions} />);
    this.cleanupInactive(activeSites);
  }

  private createMount(siteId: string, placement: UiPlacementRule, doc: Document): MountEntry {
    const anchor = doc.querySelector(placement.anchor) ?? doc.body;
    const container = doc.createElement("div");
    container.dataset.javNav = siteId;
    container.style.zIndex = "100000";
    container.style.fontSize = "13px";
    container.style.padding = "6px 0";
    attachContainer(placement, anchor, container);

    const root = createRoot(container);
    const mountEntry = { container, root };
    this.mounts.set(siteId, mountEntry);
    return mountEntry;
  }

  private cleanupInactive(activeSites: Set<string>) {
    for (const [siteId, mount] of this.mounts.entries()) {
      if (!activeSites.has(siteId)) {
        mount.root.unmount();
        mount.container.remove();
        this.mounts.delete(siteId);
      }
    }
  }
}
