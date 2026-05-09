export function fallbackImg(brand) {
  const initial = (brand || '?').charAt(0).toUpperCase();
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' fill='%23e5e7eb'/><text x='50%25' y='55%25' text-anchor='middle' fill='%236b7280' font-size='18' font-family='system-ui' font-weight='600'>${initial}</text></svg>`;
}
