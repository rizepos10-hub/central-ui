import chroma from 'chroma-js';

// Converts a HEX color to an HSL string "h s% l%"
export const hexToHSL = (hex) => {
  const hsl = chroma(hex).hsl();
  // Handle NaN hue (achromatic colors like white, black, gray)
  const hue = isNaN(hsl[0]) ? 0 : hsl[0].toFixed(1);
  const saturation = (hsl[1] * 100).toFixed(1);
  const lightness = (hsl[2] * 100).toFixed(1);
  return `${hue} ${saturation}% ${lightness}%`;
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
