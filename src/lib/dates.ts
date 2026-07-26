const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  if (!DATE_KEY_PATTERN.test(key)) throw new Error("Invalid date key");
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function shiftDateKey(key: string, amount: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + amount);
  return toLocalDateKey(date);
}

export function formatDate(
  key: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long"
  }
): string {
  return new Intl.DateTimeFormat("en-GB", options).format(fromDateKey(key));
}

export function shortDate(key: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short"
  }).format(fromDateKey(key));
}
