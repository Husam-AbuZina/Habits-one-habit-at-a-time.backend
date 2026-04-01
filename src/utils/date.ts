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
