export function formatPrice(price, symbol = '₹') {
  if (price === null || price === undefined || price === '') return '';
  return `${symbol}${Number(price).toLocaleString('en-IN')}`;
}

/** "23:30" -> "11:30 PM" */
export function time12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function hoursLabel(day) {
  if (day.isClosed) return 'Closed';
  if (day.opensAt && day.closesAt) return `${time12(day.opensAt)} – ${time12(day.closesAt)}`;
  if (day.closesAt) return `Until ${time12(day.closesAt)}`;
  return day.note || 'Confirm timing';
}

export const dateTime = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
export const dateOnly = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
