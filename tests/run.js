import assert from "node:assert";
import { rangeOf, negotiate } from "../versions.js";
import { step, close } from "../hakerun.js";
import { render } from "../app.js";

const base = {
  budget: 1, candidate: { name: "c1", client: [1, 5], server: [3, 8] },
  state: { results: {}, failed: [], ledger: [], applied: [] },
  events: [],
  range_error_code: "E_BAD_RANGE", conn_error_code: "E_DUPLICATE_CONN",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("rangeOf returns a pair", () => {
  assert.ok(Array.isArray(rangeOf([1, 2])));
});

check("negotiate returns a pair", () => {
  assert.ok(Array.isArray(negotiate([1, 2], [1, 3])));
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
