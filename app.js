// app.js：渲染结果
import { rangeOf, negotiate } from "./versions.js";
import { step, close } from "./hakerun.js";

export function render(spec) {
  const events = spec.events || [];
  const half = Math.ceil(events.length / 2);
  const first = step(spec);
  const closed = close(Object.assign({}, spec, { state: first.state }));
  const r1 = step(Object.assign({}, spec, { events: events.slice(0, half) }));
  const r2 = step(Object.assign({}, spec, { state: r1.state, events: events.slice(half) }));
  const closedTwo = close(Object.assign({}, spec, { state: r2.state }));
  const replay = step(Object.assign({}, spec, { state: closed.state }));
  const wide = step(Object.assign({}, spec, { budget: spec.budget + 2 }));
  const full = step(Object.assign({}, spec, { events: events, budget: events.length + 2 }));
  const fullClosed = close(Object.assign({}, spec, { state: full.state }));
  const fingerprint = function (state) {
    return JSON.stringify({
      results: state.results, failed: state.failed.slice().sort(), ledger: state.ledger,
      applied: state.applied.length
    });
  };
  const names = Object.keys(closed.state.results).sort();
  return { results: names.map(function (name) { return [name, closed.state.results[name]]; }),
           failed: closed.state.failed.slice(),
           negotiated_first: first.negotiated, negotiated_wide: wide.negotiated,
           pair_differs: first.negotiated !== wide.negotiated,
           ledger_before: first.ledger_before, ledger: first.ledger,
           catchup: closed.catchup, ledger_after: closed.state.ledger.length,
           mid_differs: fingerprint(r2.state) !== fingerprint(first.state),
           closed_equal: fingerprint(closedTwo.state) === fingerprint(closed.state),
           replay_new: replay.negotiated, judged: first.judged, judged_bound: first.judged_bound,
           full_diff: fingerprint(closed.state) === fingerprint(fullClosed.state) ? 0 : 1,
           count: events.length,
           tail: rangeOf([1, 2])[1] + (negotiate([1, 2], [3, 4])[0] ? 1 : 0) };
}
