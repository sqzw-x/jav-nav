type Callback = (url: string) => void;

export const observeSpaNavigation = (callback: Callback) => {
  let lastUrl = window.location.href;
  const notify = () => {
    const current = window.location.href;
    if (current === lastUrl) return;
    lastUrl = current;
    callback(current);
  };

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function pushState(...args) {
    originalPushState.apply(this, args);
    Promise.resolve().then(notify);
  } as History["pushState"];

  window.history.replaceState = function replaceState(...args) {
    originalReplaceState.apply(this, args);
    Promise.resolve().then(notify);
  } as History["replaceState"];

  window.addEventListener("popstate", notify);

  return () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", notify);
  };
};
