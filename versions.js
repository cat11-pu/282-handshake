// versions.js：区间校验与协商
function badRange(message) {
  const error = new Error(message);
  error.code = "E_BAD_RANGE";
  return error;
}

export function rangeOf(pair) {
  if (!Array.isArray(pair) || pair.length !== 2 ||
      !Number.isInteger(pair[0]) || !Number.isInteger(pair[1])) {
    throw badRange("版本区间必须是两个整数");
  }
  if (pair[0] > pair[1]) {
    throw badRange("版本区间左端大于右端");
  }
  return [pair[0], pair[1]];
}

export function negotiate(client, server) {
  const clientRange = rangeOf(client);
  const serverRange = rangeOf(server);
  const lo = Math.max(clientRange[0], serverRange[0]);
  const hi = Math.min(clientRange[1], serverRange[1]);
  if (lo > hi) {
    return [false, 0];
  }
  return [true, hi];
}
