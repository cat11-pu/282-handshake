// hakerun.js：按整批共用的协商预算推进，用尽则把连接压在账上，收尾不限预算结清
import { rangeOf, negotiate } from "./versions.js";

function raise(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function cloneState(state) {
  const source = state || {};
  return {
    results: Object.assign({}, source.results || {}),
    failed: (source.failed || []).slice(),
    ledger: (source.ledger || []).map(function (row) {
      return [row[0], row[1].slice(), row[2].slice()];
    }),
    applied: (source.applied || []).slice()
  };
}

function isIntPair(value) {
  return Array.isArray(value) && value.length === 2
    && Number.isInteger(value[0]) && Number.isInteger(value[1]);
}

function settle(next, entry) {
  const name = entry[0];
  const verdict = negotiate(entry[1], entry[2]);
  if (verdict[0]) {
    next.results[name] = verdict[1];
  } else {
    next.failed.push(name);
  }
  next.applied.push(name);
}

// 校验单条 conn 事件，返回 [name, client, server]
function admit(event, known) {
  if (!event || typeof event !== "object" || event.kind !== "conn"
      || typeof event.name !== "string" || event.name.length === 0
      || !isIntPair(event.client) || !isIntPair(event.server)) {
    raise("E_BAD_EVENT", "illegal event: " + JSON.stringify(event));
  }
  if (known.has(event.name)) {
    raise("E_DUPLICATE_CONN", "duplicate connection: " + event.name);
  }
  rangeOf(event.client);
  rangeOf(event.server);
  known.add(event.name);
  return [event.name, event.client.slice(), event.server.slice()];
}

export function step(spec) {
  spec = spec || {};
  const next = cloneState(spec.state);

  let events = spec.events;
  if (events == null) {
    events = [];
  } else if (!Array.isArray(events)) {
    raise("E_BAD_EVENT", "events must be an array");
  }

  const budget = Math.max(0, Math.trunc(Number(spec.budget) || 0));

  // 已处理集合由状态推出：重放时整批跳过，不占预算。
  const appliedSet = new Set(next.applied);
  // 其余状态里出现过的名字（results/failed/ledger/applied）都算已知连接。
  const known = new Set(next.applied);
  Object.keys(next.results).forEach(function (name) { known.add(name); });
  next.failed.forEach(function (name) { known.add(name); });
  next.ledger.forEach(function (row) { known.add(row[0]); });

  // 上轮压账的连接排在前面，新承认的事件跟在后面。
  const queue = next.ledger.map(function (row) {
    return [row[0], row[1].slice(), row[2].slice()];
  });
  next.ledger = [];

  for (const event of events) {
    if (event && typeof event === "object" && appliedSet.has(event.name)) {
      continue;
    }
    queue.push(admit(event, known));
  }

  let judged = 0;
  while (judged < budget && judged < queue.length) {
    settle(next, queue[judged]);
    judged += 1;
  }
  for (let i = judged; i < queue.length; i += 1) {
    next.ledger.push(queue[i]);
  }

  return {
    state: next,
    negotiated: judged,
    ledger_before: next.ledger.length,
    ledger: next.ledger.map(function (row) {
      return [row[0], row[1].slice(), row[2].slice()];
    }),
    judged: judged,
    judged_bound: queue.length
  };
}

export function close(spec) {
  spec = spec || {};
  const next = cloneState(spec.state);
  let catchup = 0;
  while (next.ledger.length > 0) {
    settle(next, next.ledger.shift());
    catchup += 1;
  }
  return { state: next, catchup: catchup };
}
