// versions.js：区间校验与版本协商（交集里取最大版本）
export function rangeOf(pair) {
  const isPair = Array.isArray(pair) && pair.length === 2
    && Number.isInteger(pair[0]) && Number.isInteger(pair[1]);
  if (!isPair) {
    const error = new Error("illegal range: " + JSON.stringify(pair));
    error.code = "E_BAD_RANGE";
    throw error;
  }
  const lo = pair[0];
  const hi = pair[1];
  if (lo > hi) {
    const error = new Error("range left greater than right: " + lo + " > " + hi);
    error.code = "E_BAD_RANGE";
    throw error;
  }
  return [lo, hi];
}

export function negotiate(client, server) {
  const c = rangeOf(client);
  const s = rangeOf(server);
  const lo = Math.max(c[0], s[0]);
  const hi = Math.min(c[1], s[1]);
  if (lo > hi) {
    return [false, null];
  }
  return [true, hi];
}
