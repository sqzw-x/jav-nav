import { StyleProvider } from "@ant-design/cssinjs";
import { App as AntApp, ConfigProvider } from "antd";
import resetCss from "antd/dist/reset.css?inline";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import type { SiteRuleStore } from "@/rules/store";
import type { SiteRule } from "@/rules/types";
import OptionsApp from "./OptionsApp";

export type OptionsPortalDeps = {
  store: SiteRuleStore;
  onClose?: () => void;
  onRulesUpdated?: (rules: SiteRule[]) => void;
};

export class OptionsPortal {
  private container: HTMLElement | null = null;
  private root: Root | null = null;
  private isOpen = false;
  private handleBackdropClick?: (event: MouseEvent) => void;
  private shadowHost: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private mountNode: HTMLDivElement | null = null;
  private overlayRoot: HTMLDivElement | null = null;

  constructor(private readonly deps: OptionsPortalDeps) {}

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.container = document.createElement("div");
    this.container.dataset.javNavOptions = "true";
    this.container.style.position = "fixed";
    this.container.style.inset = "0";
    this.container.style.zIndex = "100000";
    this.container.style.background = "rgba(0,0,0,0.55)";
    this.container.style.backdropFilter = "blur(2px)";
    this.container.style.display = "flex";
    this.container.style.alignItems = "center";
    this.container.style.justifyContent = "center";
    this.container.style.padding = "32px";

    this.shadowHost = document.createElement("div");
    this.shadowHost.style.display = "block";
    this.shadowHost.style.maxWidth = "100%";
    this.shadowHost.style.pointerEvents = "auto";
    this.container.append(this.shadowHost);

    this.shadowRoot = this.shadowHost.attachShadow({ mode: "open" });

    const resetStyle = document.createElement("style");
    resetStyle.textContent = resetCss;
    this.shadowRoot.append(resetStyle);

    this.mountNode = document.createElement("div");
    this.mountNode.style.display = "block";
    this.shadowRoot.append(this.mountNode);

    this.overlayRoot = document.createElement("div");
    this.overlayRoot.style.position = "relative";
    this.overlayRoot.style.zIndex = "100020";
    this.shadowRoot.append(this.overlayRoot);

    this.handleBackdropClick = (event: MouseEvent) => {
      if (event.target === this.container) {
        this.close();
      }
    };
    this.container.addEventListener("mousedown", this.handleBackdropClick);

    document.body.append(this.container);

    this.root = createRoot(this.mountNode);
    this.root.render(
      <StyleProvider container={(this.shadowRoot ?? undefined) as ShadowRoot} hashPriority="high">
        <ConfigProvider
          theme={{
            token: { colorBgLayout: "#fff", colorPrimary: "#1677ff" },
            components: { Message: { zIndexPopup: 100050 } },
          }}
          getPopupContainer={() => this.overlayRoot ?? this.mountNode ?? document.body}
        >
          <AntApp>
            <OptionsApp
              store={this.deps.store}
              overlayContainer={this.overlayRoot ?? this.container ?? undefined}
              onClose={() => this.close()}
              onRulesUpdated={(rules: SiteRule[]) => {
                this.deps.onRulesUpdated?.(rules);
              }}
            />
          </AntApp>
        </ConfigProvider>
      </StyleProvider>,
    );
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.container && this.handleBackdropClick) {
      this.container.removeEventListener("mousedown", this.handleBackdropClick);
      this.handleBackdropClick = undefined;
    }
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.mountNode = null;
    this.overlayRoot = null;
    this.shadowRoot = null;
    this.shadowHost = null;
    this.container?.remove();
    this.container = null;
    this.deps.onClose?.();
  }
}
