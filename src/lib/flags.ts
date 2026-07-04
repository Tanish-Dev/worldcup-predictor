/** FIFA flag CDN. Sizes 1-5, square crop. Safe to import from client components. */
export function flagUrl(code: string, size: 2 | 3 | 4 = 2): string {
  return `https://api.fifa.com/api/v3/picture/flags-sq-${size}/${code}`;
}
