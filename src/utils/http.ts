export const pickRequestIp = (headerValue?: string | string[]) => {
  if (Array.isArray(headerValue)) {
    return headerValue[0] ?? null;
  }

  if (typeof headerValue === "string") {
    return headerValue.split(",")[0]?.trim() ?? null;
  }

  return null;
};
