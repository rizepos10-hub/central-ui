import chroma from 'chroma-js';

// Converts a HEX color to an HSL string "h s% l%"
export const hexToHSL = (hex) => {
  const hsl = chroma(hex).hsl();
  return `${hsl[0].toFixed(1)} ${hsl[1] * 100} ${hsl[2] * 100}%`;
};

// Converts an HSL string "h s% l%" to a HEX color
export function hslToHex(hsl) {
  if (typeof hsl !== 'string') {
    console.error('Invalid input for hslToHex, expected a string in format "h s% l%":', hsl);
    return '#000000'; // Default or error color
  }

  try {
    const [h, s, l] = hsl.split(' ').map((component, index) =>
      index > 0 ? parseFloat(component) / 100 : parseFloat(component)
    );

    return chroma.hsl(h, s, l).hex();
  } catch (error) {
    console.error('Error converting HSL to HEX:', error);
    return '#000000'; // Default or error color
  }
}
