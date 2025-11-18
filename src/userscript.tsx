import { GM_registerMenuCommand } from "vite-plugin-monkey/dist/client";
import { RuleEngine } from "./engine";
import { SiteRuleStore } from "./rules/store";
import { LinksRenderer } from "./ui/LinksRenderer";
import { OptionsPortal } from "./ui/options/OptionsPortal";
import { debounce } from "./utils/debounce";
import { createLogger } from "./utils/logger";
import { observeSpaNavigation } from "./utils/spaObserver";

const logger = createLogger("userscript");

const store = new SiteRuleStore();
const engine = new RuleEngine({ loadRules: () => store.load() });
const renderer = new LinksRenderer();

const run = async () => {
  try {
    const url = window.location.href;
    const result = await engine.run(url, document);
    if (!result) return;
    renderer.render(result, document);
  } catch (error) {
    logger.error("Rule engine execution failed", error);
  }
};

const debouncedRun = debounce(run, 200);

const optionsPortal = new OptionsPortal({
  store,
  onRulesUpdated: () => {
    engine.invalidate();
    debouncedRun();
  },
});
renderer.setOptionsHandler(() => optionsPortal.open());

const setupObservers = () => {
  observeSpaNavigation(() => {
    engine.invalidate();
    debouncedRun();
  });

  const mutationObserver = new MutationObserver(
    debounce(() => {
      engine.invalidate(window.location.href);
      debouncedRun();
    }, 200),
  );

  if (document.body) {
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }
};

const bootstrap = () => {
  setupObservers();
  debouncedRun();

  if (typeof GM_registerMenuCommand === "function") {
    GM_registerMenuCommand("设置", () => optionsPortal.open());
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
