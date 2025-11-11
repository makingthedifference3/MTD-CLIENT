// Logo.dev API Integration
// Publishable Key: pk_TWFfI7LzSyOkJp3PACHx6A

const LOGO_DEV_API_KEY = 'pk_TWFfI7LzSyOkJp3PACHx6A';
const LOGO_DEV_BASE_URL = 'https://img.logo.dev';

export interface LogoOptions {
  size?: number;
  format?: 'webp' | 'png' | 'jpg';
  theme?: 'light' | 'dark';
  quality?: number;
  greyscale?: boolean;
}

/**
 * Get company logo URL from Logo.dev
 * @param domain - Company domain (e.g., 'amazon.com', 'tcs.com')
 * @param options - Logo customization options
 * @returns Logo URL
 */
export function getCompanyLogo(
  domain: string,
  options: LogoOptions = {}
): string {
  const {
    size = 200,
    format = 'webp',
    theme = 'light',
    quality = 80,
    greyscale = false,
  } = options;

  // Special case: Use interiseworld.com for Interise
  let finalDomain = domain;
  if (domain.includes('interise')) {
    finalDomain = 'interiseworld.com';
  }

  const params = new URLSearchParams({
    token: LOGO_DEV_API_KEY,
    format,
    size: size.toString(),
    ...(quality && { quality: quality.toString() }),
    ...(greyscale && { greyscale: 'true' }),
    ...(theme === 'dark' && { theme: 'dark' }),
  });

  return `${LOGO_DEV_BASE_URL}/${finalDomain}?${params.toString()}`;
}

/**
 * Get fallback logo (placeholder)
 * @param companyName - Company name for placeholder
 * @returns Data URL for placeholder
 */
export function getFallbackLogo(companyName: string): string {
  const initials = companyName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Create SVG placeholder with company initials
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#6366f1"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Extract domain from website URL
 * @param website - Full website URL or domain
 * @returns Clean domain name
 */
export function extractDomain(website: string): string {
  try {
    // Remove protocol if present
    let domain = website.replace(/^https?:\/\//, '');
    // Remove www. if present
    domain = domain.replace(/^www\./, '');
    // Remove trailing slash and path
    domain = domain.split('/')[0];
    return domain;
  } catch {
    return website;
  }
}

/**
 * Get brand color from hex and generate gradient
 * @param primaryColor - Hex color code
 * @returns Object with color variations
 */
export function getBrandColors(primaryColor: string) {
  // Convert hex to RGB for manipulation
  const hex = primaryColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Create lighter and darker variations
  const lighten = (val: number) => Math.min(255, Math.floor(val + (255 - val) * 0.3));
  const darken = (val: number) => Math.max(0, Math.floor(val * 0.7));

  const lighter = `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
  const darker = `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;

  return {
    primary: primaryColor,
    lighter,
    darker,
    gradient: `linear-gradient(135deg, ${primaryColor}, ${darker})`,
    gradientReverse: `linear-gradient(135deg, ${lighter}, ${primaryColor})`,
  };
}
