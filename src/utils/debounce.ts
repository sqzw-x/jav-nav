export const debounce = <T extends (...args: never[]) => void>(fn: T, wait = 200) => {
  let timer: number | undefined;
  return (...args: Parameters<T>) => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      fn(...args);
    }, wait);
  };
};
