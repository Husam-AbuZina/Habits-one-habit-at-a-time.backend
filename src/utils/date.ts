export const isValidDateString = (value: string) => !Number.isNaN(Date.parse(value));

export const toDateOnlyString = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
};

export const toIsoDateOrNull = (value?: string | null) => {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
};

export const startOfUtcDay = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export const diffUtcDays = (from: string | Date, to: string | Date) => {
  const fromDay = startOfUtcDay(from).getTime();
  const toDay = startOfUtcDay(to).getTime();
  return Math.floor((toDay - fromDay) / 86400000);
};

export const weekdayName = (value: string | Date) =>
  ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    startOfUtcDay(value).getUTCDay()
  ]!;
