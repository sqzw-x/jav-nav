import type { PageGuard } from "@/rules/types";
import { createLogger } from "@/utils/logger";
import type { RuleExecutionContext } from "./context";

const logger = createLogger("guard");

const guardEvaluators: Record<PageGuard["type"], (guard: PageGuard, ctx: RuleExecutionContext) => boolean> = {
  "url-regex": (guard, ctx) => {
    try {
      const regex = new RegExp(guard.rule, "i");
      return regex.test(ctx.url.href);
    } catch (error) {
      logger.warn("Invalid guard regex", { guard, error });
      return false;
    }
  },
  selector: (guard, ctx) => ctx.querySelector(guard.rule) !== null,
  "text-content": (guard, ctx) =>
    ctx.memoize(`guard:text:${guard.id}`, () => ctx.document.body?.textContent ?? "").includes(guard.rule),
};

export const guardsPass = (guards: PageGuard[] | undefined, ctx: RuleExecutionContext): boolean => {
  if (!guards?.length) return true;
  const sorted = [...guards].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  for (const guard of sorted) {
    const passed = guardEvaluators[guard.type]?.(guard, ctx) ?? false;
    logger.debug(`Guard ${guard.id} => ${passed}`);
    if (passed) {
      return true;
    }
  }
  return false;
};
