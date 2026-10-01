export function formatDate(iso: string | null | undefined, locale = 'en'): string {
  if (!iso) return 'Not available';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const localeTag = locale === 'ta' ? 'ta-IN' : locale === 'hi' ? 'hi-IN' : 'en-IN';
  try {
    return new Intl.DateTimeFormat(localeTag, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
}

export function formatScore(n: number | null | undefined): string {
  if (n === null || n === undefined || typeof n !== 'number' || Number.isNaN(n)) {
    return 'Not scored';
  }
  if (n === 0) return '0';
  return Math.round(n).toString();
}

export function formatPercent(n: number | null | undefined): string {
  if (n === null || n === undefined || typeof n !== 'number' || Number.isNaN(n)) {
    return '0%';
  }
  return `${Math.round(n * 100)}%`;
}

export function formatNumber(n: number | null | undefined, locale = 'en'): string {
  if (n === null || n === undefined || typeof n !== 'number' || Number.isNaN(n)) {
    return '0';
  }
  const localeTag = locale === 'ta' ? 'ta-IN' : locale === 'hi' ? 'hi-IN' : 'en-IN';
  try {
    return new Intl.NumberFormat(localeTag).format(n);
  } catch {
    return n.toLocaleString('en-IN');
  }
}
