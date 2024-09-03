import chroma from 'chroma-js';

export const hexToHSL = (hex) => {
  const hsl = chroma(hex).hsl();
  return `${Math.round(hsl[0])}, ${Math.round(hsl[1] * 100)}%, ${Math.round(hsl[2] * 100)}%`;
};

export function hslToHex(hsl) {
  if (typeof hsl !== 'string') {
    console.error('Invalid input for hslToHex, expected a string:', hsl);
    return '#000000'; // Default or error color
  }

  try {
    // Split the HSL string and remove the '%' from s and l, then parse them as numbers
    const [h, s, l] = hsl.split(',').map(component => parseFloat(component.replace('%', '')));

    // Use Chroma.js to convert HSL (with s and l as fractions) to HEX
    return chroma.hsl(h, s / 100, l / 100).hex();
  } catch (error) {
    console.error('Error converting HSL to HEX:', error);
    return '#000000'; // Default or error color
  }
}