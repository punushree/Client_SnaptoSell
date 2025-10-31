export function delay(delay: number, value?: unknown) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay, value);
  });
}
