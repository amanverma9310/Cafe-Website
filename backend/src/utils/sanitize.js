/** Strips Mongo operator keys ($...) and dotted keys from user input to block NoSQL operator injection. */
export function stripOperators(value) {
  if (Array.isArray(value)) return value.map(stripOperators);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = stripOperators(v);
    }
    return out;
  }
  return value;
}

/** Trims strings and removes control characters; angle brackets are escaped by the React renderer, not stripped. */
export function cleanStrings(value) {
  if (typeof value === 'string') return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (Array.isArray(value)) return value.map(cleanStrings);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = /password/i.test(k) ? v : cleanStrings(v);
    return out;
  }
  return value;
}
