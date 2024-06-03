export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const capitalizeString = (string) => {
  return string.toUpperCase();
}

export function camelToTitle(camelCase: string): string {
  const result = camelCase.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}
