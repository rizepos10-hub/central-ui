/** The readable message of a failed central call: the alert title (for example "Factory name is required"), else the detail. */
export const wholesaleErrorMessage = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  const candidates = [data?.title, data?.detail, typeof data?.message === 'string' && !data.message.startsWith('error.') ? data.message : null];
  return candidates.find(c => typeof c === 'string' && c.trim() !== '') ?? fallback;
};
