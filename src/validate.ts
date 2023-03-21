export const isSnowflake = (data: string): boolean => {
  if (data === undefined || data === null) {
    return false;
  }
  const regexMatch: RegExpMatchArray|null = data.match(/^\d{10,19}$/);
  return regexMatch?.length == 1;
}