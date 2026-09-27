// hakerun.js：按协商预算协商并留账（基线：一律给空表）
import { rangeOf, negotiate } from "./versions.js";

export function step(spec) {
  return { state: spec.state, negotiated: 0, ledger_before: 0, ledger: [], judged: 0, judged_bound: 0 };
}

export function close(spec) {
  return { state: spec.state, catchup: 0 };
}
