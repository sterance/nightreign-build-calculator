export const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2
});

export const getRelativeLuminance = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const rsrgb = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsrgb = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsrgb = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsrgb + 0.7152 * gsrgb + 0.0722 * bsrgb;
};

export const shouldUseDarkText = (hexColor) => {
  const luminance = getRelativeLuminance(hexColor);
  return luminance > 0.5;
};
