import * as cheerio from 'cheerio';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const GOOGLE_FONT_ALTERNATES = [
  { match: /avenir|proxima|gotham|circular|sohne|graphik|gilroy/i, font: 'Montserrat' },
  { match: /helvetica|arial|sf pro|system-ui|-apple-system|roboto/i, font: 'Inter' },
  { match: /futura|century gothic|brandon|geometric/i, font: 'Poppins' },
  { match: /freight|garamond|baskerville|didot|caslon|times/i, font: 'Cormorant Garamond' },
  { match: /trade gothic|franklin|din|univers|akzidenz/i, font: 'Barlow Condensed' },
  { match: /source sans/i, font: 'Source Sans 3' }
];

const FALLBACK_RESULT = {
  brandName: 'Charter brand',
  sourceUrl: '',
  logoUrl: '',
  colors: {
    primary: '#111111',
    secondary: '#B9915E'
  },
  typography: {
    heading: 'Inter',
    headingSource: 'Suggested Google font',
    headingOriginal: 'System sans',
    body: 'Inter',
    bodySource: 'Suggested Google font',
    bodyOriginal: 'System sans'
  },
  radius: 10,
  buttonStyle: 'solid',
  confidence: 0.28,
  notes: ['Started from conservative defaults because no strong brand signals were found.']
};

export async function analyzeBrand(inputUrl) {
  const targetUrl = normalizeUrl(inputUrl);
  let html;

  try {
    html = await fetchText(targetUrl);
  } catch (error) {
    return createFetchFallback(targetUrl, error);
  }

  const $ = cheerio.load(html);
  const base = new URL(targetUrl);

  const cssTexts = [];
  const stylesheetUrls = getStylesheetUrls($, base).slice(0, 10);
  const inlineCss = collectInlineCss($);

  if (inlineCss) {
    cssTexts.push(inlineCss);
  }

  const externalCss = await Promise.allSettled(stylesheetUrls.map((url) => fetchText(url, 6500)));
  for (const result of externalCss) {
    if (result.status === 'fulfilled' && result.value) {
      cssTexts.push(result.value);
    }
  }

  const css = cssTexts.join('\n').slice(0, 1_400_000);
  const googleFonts = extractGoogleFonts($, stylesheetUrls);
  const fontAnalysis = analyzeFonts(css, googleFonts);
  const colorAnalysis = analyzeColors($, css);
  const radius = analyzeRadius(css);
  const logoUrl = findLogoUrl($, base);
  const brandName = inferBrandName($, base);

  const notes = [
    colorAnalysis.note,
    fontAnalysis.note,
    radius.note,
    logoUrl
      ? 'Logo candidate found from the website markup.'
      : 'No clear logo image was found; add one manually in the editor.'
  ].filter(Boolean);

  return {
    ...FALLBACK_RESULT,
    sourceUrl: targetUrl,
    brandName,
    logoUrl,
    colors: {
      primary: colorAnalysis.primary || FALLBACK_RESULT.colors.primary,
      secondary: colorAnalysis.secondary || FALLBACK_RESULT.colors.secondary
    },
    typography: {
      heading: fontAnalysis.heading.font,
      headingSource: fontAnalysis.heading.source,
      headingOriginal: fontAnalysis.heading.original,
      body: fontAnalysis.body.font,
      bodySource: fontAnalysis.body.source,
      bodyOriginal: fontAnalysis.body.original
    },
    radius: radius.value,
    buttonStyle: colorAnalysis.hasOutlinedButtons ? 'outline' : 'solid',
    confidence: calculateConfidence({
      colors: colorAnalysis,
      fonts: fontAnalysis,
      logoUrl,
      radius
    }),
    notes
  };
}

function createFetchFallback(targetUrl, error) {
  const base = new URL(targetUrl);
  const hostName = base.hostname.replace(/^www\./i, '');
  const brandName = hostName
    .split('.')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    ...FALLBACK_RESULT,
    sourceUrl: targetUrl,
    brandName: brandName || FALLBACK_RESULT.brandName,
    confidence: 0.18,
    notes: [
      `Unable to fetch the website directly (${formatFetchError(error)}). Started from editable defaults.`,
      'Some websites block server-side scraping; paste logo and colors manually if needed.'
    ]
  };
}

function formatFetchError(error) {
  if (error instanceof Error) {
    return error.name === 'AbortError' ? 'request timed out' : error.message;
  }

  return 'request failed';
}

function normalizeUrl(inputUrl) {
  const trimmed = inputUrl.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  return url.toString();
}

async function fetchText(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml,application/xml,text/css,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status} for ${url}`);
    }

    const text = await response.text();
    return text.slice(0, 850_000);
  } finally {
    clearTimeout(timer);
  }
}

function getStylesheetUrls($, base) {
  const urls = [];

  $('link').each((_, el) => {
    const rel = ($(el).attr('rel') || '').toLowerCase();
    const href = $(el).attr('href');

    if (!href || !rel.includes('stylesheet')) {
      return;
    }

    const absolute = toAbsoluteUrl(href, base);
    if (absolute) {
      urls.push(absolute);
    }
  });

  return [...new Set(urls)];
}

function collectInlineCss($) {
  const chunks = [];

  $('style').each((_, el) => {
    chunks.push($(el).html() || '');
  });

  $('[style]').each((_, el) => {
    chunks.push(`${$(el).attr('class') || $(el).prop('tagName') || 'inline'} { ${$(el).attr('style')} }`);
  });

  return chunks.join('\n');
}

function extractGoogleFonts($, stylesheetUrls) {
  const fonts = new Set();
  const candidates = [...stylesheetUrls];

  $('link').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      candidates.push(href);
    }
  });

  for (const href of candidates) {
    if (!/fonts\.googleapis\.com/i.test(href)) {
      continue;
    }

    let url;
    try {
      url = new URL(href, 'https://fonts.googleapis.com');
    } catch {
      continue;
    }

    const familyParams = url.searchParams.getAll('family');
    for (const familyParam of familyParams) {
      const family = familyParam.split(':')[0].replace(/\+/g, ' ').trim();
      if (family) {
        fonts.add(family);
      }
    }
  }

  return [...fonts];
}

function analyzeFonts(css, googleFonts) {
  const declarations = [...css.matchAll(/font-family\s*:\s*([^;{}]+)/gi)].map((match) => match[1]);
  const scores = new Map();

  for (const declaration of declarations) {
    const families = declaration
      .split(',')
      .map((font) => cleanFontName(font))
      .filter(Boolean);

    families.forEach((family, index) => {
      if (isGenericFont(family)) {
        return;
      }

      const current = scores.get(family) || 0;
      scores.set(family, current + Math.max(1, 6 - index));
    });
  }

  for (const font of googleFonts) {
    scores.set(font, (scores.get(font) || 0) + 18);
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([font]) => font);
  const headingOriginal = ranked[0] || googleFonts[0] || 'System sans';
  const bodyOriginal = ranked.find((font) => font !== headingOriginal) || ranked[1] || headingOriginal;

  const heading = normalizeToGoogleFont(headingOriginal, googleFonts);
  const body = normalizeToGoogleFont(bodyOriginal, googleFonts);
  const foundGoogle = googleFonts.length > 0;

  return {
    heading: {
      font: heading.font,
      source: heading.source,
      original: headingOriginal
    },
    body: {
      font: body.font,
      source: body.source,
      original: bodyOriginal
    },
    foundGoogle,
    detectedCount: ranked.length,
    note: foundGoogle
      ? `Detected Google font${googleFonts.length > 1 ? 's' : ''}: ${googleFonts.slice(0, 3).join(', ')}.`
      : 'No Google Font import was found; typography uses the closest free Google Font suggestion.'
  };
}

function normalizeToGoogleFont(original, googleFonts) {
  const googleMatch = googleFonts.find((font) => font.toLowerCase() === original.toLowerCase());
  if (googleMatch) {
    return { font: googleMatch, source: 'Google font detected' };
  }

  const alternate = GOOGLE_FONT_ALTERNATES.find((candidate) => candidate.match.test(original));
  return {
    font: alternate?.font || 'Inter',
    source: original === 'System sans' ? 'Suggested Google font' : 'Suggested Google alternative'
  };
}

function cleanFontName(font) {
  return font
    .replace(/["']/g, '')
    .replace(/\!important/gi, '')
    .trim();
}

function isGenericFont(font) {
  return /^(serif|sans-serif|monospace|system-ui|inherit|initial|unset|emoji|math|fangsong)$/i.test(font);
}

function analyzeColors($, css) {
  const themeColor = $('meta[name="theme-color"]').attr('content');
  const colorScores = new Map();
  let hasOutlinedButtons = false;

  if (themeColor) {
    addColorScore(colorScores, themeColor, 140);
  }

  const buttonCssBlocks = css.match(/[^{}]*(button|btn|cta|primary|secondary|nav|header|brand)[^{}]*\{[^{}]+\}/gi) || [];
  for (const block of buttonCssBlocks) {
    const colors = extractColors(block);
    const weight = /button|btn|cta|primary/i.test(block) ? 30 : 14;

    for (const color of colors) {
      addColorScore(colorScores, color, weight);
    }

    if (/border\s*:\s*[^;]*(#[0-9a-f]|rgb|hsl)/i.test(block) && /background(?:-color)?\s*:\s*(transparent|none)/i.test(block)) {
      hasOutlinedButtons = true;
    }
  }

  const allColors = extractColors(css);
  for (const color of allColors.slice(0, 1800)) {
    addColorScore(colorScores, color, 4);
  }

  $('svg [fill], svg [stroke]').each((_, el) => {
    addColorScore(colorScores, $(el).attr('fill'), 12);
    addColorScore(colorScores, $(el).attr('stroke'), 8);
  });

  const ranked = [...colorScores.entries()]
    .map(([hex, score]) => ({ hex, score, ...rgbToHsl(hexToRgb(hex)) }))
    .filter((color) => color.score > 0)
    .sort((a, b) => b.score - a.score);

  const brandCandidates = ranked.filter((color) => {
    if (color.l > 0.96 || color.l < 0.03) {
      return false;
    }

    if (color.s < 0.08) {
      return color.score > 80 && color.l < 0.35;
    }

    return true;
  });

  const primary = brandCandidates[0] || ranked.find((color) => color.l < 0.35) || ranked[0];
  const secondary =
    brandCandidates.find((color) => primary && color.hex !== primary.hex && colorDistance(color.hex, primary.hex) > 78) ||
    ranked.find((color) => primary && color.hex !== primary.hex && colorDistance(color.hex, primary.hex) > 58);

  return {
    primary: primary?.hex,
    secondary: secondary?.hex,
    detectedCount: ranked.length,
    hasOutlinedButtons,
    note:
      ranked.length > 0
        ? `Detected ${ranked.length} reusable color values from styles and metadata.`
        : 'No reusable color values were found; colors use editable defaults.'
  };
}

function extractColors(text) {
  if (!text) {
    return [];
  }

  const matches = [
    ...text.matchAll(/#[0-9a-f]{3,8}\b/gi),
    ...text.matchAll(/rgba?\([^)]+\)/gi),
    ...text.matchAll(/hsla?\([^)]+\)/gi)
  ];

  return matches.map((match) => match[0]);
}

function addColorScore(map, rawColor, weight) {
  const hex = parseColor(rawColor);

  if (!hex) {
    return;
  }

  const rgb = hexToRgb(hex);
  const { s, l } = rgbToHsl(rgb);
  let adjustedWeight = weight;

  if (l > 0.92 || l < 0.04) {
    adjustedWeight *= 0.2;
  }

  if (s < 0.06) {
    adjustedWeight *= 0.42;
  }

  map.set(hex, (map.get(hex) || 0) + adjustedWeight);
}

function parseColor(rawColor) {
  if (!rawColor || /transparent|currentColor|inherit|initial|unset|none/i.test(rawColor)) {
    return null;
  }

  const color = rawColor.trim();

  if (/^#[0-9a-f]{3,8}$/i.test(color)) {
    return normalizeHex(color);
  }

  const rgbMatch = color.match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1]
      .split(',')
      .map((part) => part.trim())
      .map((part) => (part.endsWith('%') ? Math.round((Number.parseFloat(part) / 100) * 255) : Number.parseFloat(part)));

    if (parts.length >= 4 && parts[3] < 0.2) {
      return null;
    }

    return rgbToHex({
      r: clamp(Math.round(parts[0]), 0, 255),
      g: clamp(Math.round(parts[1]), 0, 255),
      b: clamp(Math.round(parts[2]), 0, 255)
    });
  }

  const hslMatch = color.match(/hsla?\(([^)]+)\)/i);
  if (hslMatch) {
    const parts = hslMatch[1].split(',').map((part) => part.trim());
    const h = Number.parseFloat(parts[0]);
    const s = Number.parseFloat(parts[1]) / 100;
    const l = Number.parseFloat(parts[2]) / 100;

    if (parts.length >= 4 && Number.parseFloat(parts[3]) < 0.2) {
      return null;
    }

    return rgbToHex(hslToRgb({ h, s, l }));
  }

  return null;
}

function normalizeHex(hex) {
  let value = hex.replace('#', '').trim();

  if (value.length === 3 || value.length === 4) {
    value = value
      .slice(0, 3)
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
  }

  if (value.length >= 6) {
    value = value.slice(0, 6);
  }

  return `#${value.toUpperCase()}`;
}

function analyzeRadius(css) {
  const values = [];
  const buttonBlocks = css.match(/[^{}]*(button|btn|cta|primary)[^{}]*\{[^{}]+\}/gi) || [];

  for (const block of buttonBlocks) {
    values.push(...extractRadiusValues(block), ...extractRadiusValues(block));
  }

  values.push(...extractRadiusValues(css));

  const numericValues = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);

  if (numericValues.length === 0) {
    return {
      value: FALLBACK_RESULT.radius,
      found: false,
      note: 'No border radius values were detected; using an editable default.'
    };
  }

  const common = mode(numericValues);
  return {
    value: clamp(common, 0, 28),
    found: true,
    note: `Detected border radius values and selected ${clamp(common, 0, 28)}px as the quote UI radius.`
  };
}

function extractRadiusValues(css) {
  const matches = [...css.matchAll(/border-radius\s*:\s*([^;{}]+)/gi)];
  const values = [];

  for (const match of matches) {
    const raw = match[1].trim();
    const px = raw.match(/(-?\d*\.?\d+)px/i);
    const rem = raw.match(/(-?\d*\.?\d+)rem/i);

    if (px) {
      values.push(Math.round(Number.parseFloat(px[1])));
    } else if (rem) {
      values.push(Math.round(Number.parseFloat(rem[1]) * 16));
    }
  }

  return values;
}

function findLogoUrl($, base) {
  const scored = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
    const alt = $(el).attr('alt') || '';
    const className = $(el).attr('class') || '';
    const parentClass = $(el).parent().attr('class') || '';

    if (!src) {
      return;
    }

    const text = `${src} ${alt} ${className} ${parentClass}`;
    let score = 0;

    if (/logo/i.test(text)) {
      score += 70;
    }

    if (/brand|site|header|nav/i.test(text)) {
      score += 20;
    }

    if ($(el).parents('header,nav').length > 0) {
      score += 25;
    }

    const width = Number.parseFloat($(el).attr('width') || '0');
    const height = Number.parseFloat($(el).attr('height') || '0');
    if (width > 0 && height > 0 && width / Math.max(height, 1) > 1.6) {
      score += 14;
    }

    scored.push({ url: toAbsoluteUrl(src, base), score });
  });

  $('link').each((_, el) => {
    const rel = ($(el).attr('rel') || '').toLowerCase();
    const href = $(el).attr('href');

    if (href && /icon|apple-touch-icon|mask-icon/i.test(rel)) {
      scored.push({ url: toAbsoluteUrl(href, base), score: rel.includes('apple') ? 25 : 16 });
    }
  });

  return scored
    .filter((candidate) => candidate.url)
    .sort((a, b) => b.score - a.score)[0]?.url || '';
}

function inferBrandName($, base) {
  const siteName = $('meta[property="og:site_name"]').attr('content');
  const appName = $('meta[name="application-name"]').attr('content');
  const title = $('title').text();
  const fromTitle = title
    .split(/[|–-]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .sort((a, b) => a.length - b.length)[0];

  return siteName || appName || fromTitle || base.hostname.replace(/^www\./, '');
}

function toAbsoluteUrl(value, base) {
  try {
    return new URL(value, base).toString();
  } catch {
    return '';
  }
}

function calculateConfidence({ colors, fonts, logoUrl, radius }) {
  let score = 0.16;

  if (colors.primary) score += 0.22;
  if (colors.secondary) score += 0.13;
  if (fonts.detectedCount > 0) score += 0.18;
  if (fonts.foundGoogle) score += 0.08;
  if (logoUrl) score += 0.15;
  if (radius.found) score += 0.08;

  return Number(Math.min(score, 0.94).toFixed(2));
}

function hexToRgb(hex) {
  const value = normalizeHex(hex).replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => clamp(value, 0, 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function rgbToHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case red:
        h = (green - blue) / d + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / d + 2;
        break;
      default:
        h = (red - green) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  const hue = (((h % 360) + 360) % 360) / 360;

  if (s === 0) {
    const value = Math.round(l * 255);
    return { r: value, g: value, b: value };
  }

  const hueToRgb = (p, q, t) => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255)
  };
}

function colorDistance(a, b) {
  const colorA = hexToRgb(a);
  const colorB = hexToRgb(b);

  return Math.sqrt((colorA.r - colorB.r) ** 2 + (colorA.g - colorB.g) ** 2 + (colorA.b - colorB.b) ** 2);
}

function mode(values) {
  const counts = new Map();

  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
