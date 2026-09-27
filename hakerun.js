// hakerun.js：按协商预算协商并留账
import { rangeOf, negotiate } from "./versions.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function copyState(prev) {
  const state = prev || {};
  return {
    results: Object.assign({}, state.results),
    failed: (state.failed || []).slice(),
    ledger: (state.ledger || []).map(function (row) {
      return [row[0], row[1].slice(), row[2].slice()];
    }),
    applied: (state.applied || []).slice()
  };
}

function copyLedger(ledger) {
  return ledger.map(function (row) {
    return [row[0], row[1].slice(), row[2].slice()];
  });
}

function checkEvent(event) {
  if (!event || typeof event !== "object" || event.kind !== "conn" ||
      typeof event.name !== "string" || event.name === "" ||
      !Array.isArray(event.client) || !Array.isArray(event.server)) {
    fail("E_BAD_EVENT", "事件不合法");
  }
}

function knownConn(state, name) {
  return Object.prototype.hasOwnProperty.call(state.results, name) ||
    state.failed.indexOf(name) !== -1 ||
    state.ledger.some(function (row) { return row[0] === name; });
}

export function step(spec) {
  const events = spec.events || [];
  const state = copyState(spec.state);
  let budget = spec.budget == null ? 0 : spec.budget;
  let negotiated = 0;
  let judged = 0;
  for (const event of events) {
    checkEvent(event);
    const name = event.name;
    if (state.applied.indexOf(name) !== -1) {
      continue;
    }
    if (knownConn(state, name)) {
      fail("E_DUPLICATE_CONN", "连接名已经出现过: " + name);
    }
    const client = rangeOf(event.client);
    const server = rangeOf(event.server);
    if (budget > 0) {
      budget -= 1;
      const outcome = negotiate(client, server);
      if (outcome[0]) {
        state.results[name] = outcome[1];
      } else {
        state.failed.push(name);
      }
      negotiated += 1;
      judged += 1;
    } else {
      state.ledger.push([name, client, server]);
    }
    state.applied.push(name);
  }
  return {
    state: state,
    negotiated: negotiated,
    ledger_before: state.ledger.length,
    ledger: copyLedger(state.ledger),
    judged: judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = copyState(spec.state);
  let catchup = 0;
  for (const row of state.ledger) {
    const outcome = negotiate(row[1], row[2]);
    if (outcome[0]) {
      state.results[row[0]] = outcome[1];
    } else {
      state.failed.push(row[0]);
    }
    if (state.applied.indexOf(row[0]) === -1) {
      state.applied.push(row[0]);
    }
    catchup += 1;
  }
  state.ledger = [];
  return { state: state, catchup: catchup };
}
