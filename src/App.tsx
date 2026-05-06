import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Expand,
  Image,
  Images,
  LayoutGrid,
  Loader2,
  Rows3,
  Palette,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  RefreshCcw,
  Shuffle,
  PanelsTopLeft,
  Type,
  X,
  Wand2
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { sampleQuote } from './data/sampleQuote';
import { TripView } from './tripview/TripView';

type CSSVariableStyle = React.CSSProperties & Record<`--${string}`, string | number>;

const GOOGLE_FONT_CHOICES = [
  'Inter',
  'Montserrat',
  'Poppins',
  'Source Sans 3',
  'Roboto',
  'Lato',
  'Open Sans',
  'Nunito Sans',
  'Cormorant Garamond',
  'Barlow Condensed',
  'DM Sans'
];

const DEFAULT_GUIDE = {
  brandName: 'Northstar Aviation',
  sourceUrl: '',
  logoUrl: '',
  logoBackground: 'auto',
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
  confidence: 0.36,
  notes: ['Enter a website to populate brand signals, then override anything before styling the quote preview.']
};

const DEFAULT_LAYOUT = {
  imageStyle: 'showcase',
  commentPlacement: 'callout',
  itineraryStyle: 'timeline',
  dataStyle: 'grid'
};

const IMAGE_STYLE_OPTIONS = [
  {
    value: 'showcase',
    label: 'Showcase',
    icon: Image,
    description: 'Hero first, thumbnails adapt by count'
  },
  {
    value: 'gallery',
    label: 'Gallery',
    icon: Images,
    description: 'Hero with a horizontal thumbnail story'
  },
  {
    value: 'comparison',
    label: 'Comparison',
    icon: Rows3,
    description: 'Balanced image blocks for quick scanning'
  },
  {
    value: 'editorial',
    label: 'Editorial',
    icon: PanelsTopLeft,
    description: 'Modern floating hero collage'
  }
];

const IMAGE_PATTERN_BY_STYLE = {
  showcase: {
    0: 'empty',
    1: 'single',
    2: 'two-up',
    3: 'hero-side',
    4: 'hero-side',
    5: 'hero-grid'
  },
  gallery: {
    0: 'empty',
    1: 'single',
    2: 'two-stack',
    3: 'hero-bottom',
    4: 'hero-bottom',
    5: 'hero-bottom'
  },
  comparison: {
    0: 'empty',
    1: 'single',
    2: 'two-up',
    3: 'even-grid',
    4: 'even-grid',
    5: 'hero-grid'
  },
  editorial: {
    0: 'empty',
    1: 'modern-hero',
    2: 'modern-hero',
    3: 'modern-hero',
    4: 'modern-hero',
    5: 'modern-hero'
  }
};

const LAYOUT_OPTIONS = {
  commentPlacement: [
    { value: 'callout', label: 'Callout' },
    { value: 'below-title', label: 'Below title' },
    { value: 'after-data', label: 'After details' }
  ],
  itineraryStyle: [
    { value: 'timeline', label: 'Timeline' },
    { value: 'route-card', label: 'Route cards' },
    { value: 'compact', label: 'Compact line' }
  ],
  dataStyle: [
    { value: 'grid', label: 'Specs grid' },
    { value: 'split', label: 'Split panel' },
    { value: 'badges', label: 'Badges' }
  ]
};

const SURPRISE_GUIDES = [
  {
    brandName: 'VistaJet inspired',
    colors: { primary: '#171717', secondary: '#B79A68' },
    typography: { heading: 'Cormorant Garamond', body: 'Inter' },
    radius: 2,
    buttonStyle: 'solid'
  },
  {
    brandName: 'Modern charter',
    colors: { primary: '#123C69', secondary: '#58B4AE' },
    typography: { heading: 'Montserrat', body: 'Source Sans 3' },
    radius: 14,
    buttonStyle: 'outline'
  },
  {
    brandName: 'Boutique broker',
    colors: { primary: '#4B2E83', secondary: '#D88955' },
    typography: { heading: 'DM Sans', body: 'Lato' },
    radius: 8,
    buttonStyle: 'solid'
  }
];

export function App() {
  const [screen, setScreen] = useState('trip');
  const [url, setUrl] = useState('vistajet.com');
  const [guide, setGuide] = useState(DEFAULT_GUIDE);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [mobileWorkspaceView, setMobileWorkspaceView] = useState('editor');

  const quoteVars = useMemo(
    () => ({
      '--brand-primary': guide.colors.primary,
      '--brand-secondary': guide.colors.secondary,
      '--quote-radius': `${guide.radius}px`,
      '--heading-font': `"${guide.typography.heading}", sans-serif`,
      '--body-font': `"${guide.typography.body}", sans-serif`,
      ...createNeutralTintVars(guide.colors.secondary)
    }),
    [guide]
  );

  const fontImport = useMemo(() => {
    const families = [guide.typography.heading, guide.typography.body]
      .filter(Boolean)
      .filter((font, index, array) => array.indexOf(font) === index)
      .map((font) => `family=${font.replace(/\s+/g, '+')}:wght@400;500;600;700`);

    return families.length > 0
      ? `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
      : '';
  }, [guide.typography.heading, guide.typography.body]);

  if (screen === 'trip') {
    return <TripView onSetup={() => setScreen('builder')} />;
  }

  async function analyzeWebsite(event) {
    event.preventDefault();
    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to analyze this URL.');
      }

      setGuide(mergeAnalyzedGuide(payload));
      setMobileWorkspaceView('preview');
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Unable to analyze this URL.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function updateGuide(path, value) {
    setGuide((current) => {
      const next = structuredClone(current);
      const parts = path.split('.');
      let node = next;

      for (const part of parts.slice(0, -1)) {
        node = node[part];
      }

      node[parts.at(-1)] = value;
      return next;
    });
  }

  function randomizeGuide() {
    const preset = SURPRISE_GUIDES[Math.floor(Math.random() * SURPRISE_GUIDES.length)];
    setGuide((current) => ({
      ...current,
      brandName: preset.brandName,
      colors: preset.colors,
      typography: {
        ...current.typography,
        heading: preset.typography.heading,
        headingSource: 'Creative preset',
        body: preset.typography.body,
        bodySource: 'Creative preset'
      },
      radius: preset.radius,
      buttonStyle: preset.buttonStyle,
      notes: ['Creative preset applied. Website analysis remains editable.']
    }));
  }

  function randomizeLayout() {
    setLayout((current) => ({
      imageStyle: nextRandomValue(IMAGE_STYLE_OPTIONS, current.imageStyle),
      commentPlacement: nextRandomValue(LAYOUT_OPTIONS.commentPlacement, current.commentPlacement),
      itineraryStyle: nextRandomValue(LAYOUT_OPTIONS.itineraryStyle, current.itineraryStyle),
      dataStyle: nextRandomValue(LAYOUT_OPTIONS.dataStyle, current.dataStyle)
    }));
  }

  return (
    <>
      {fontImport ? <link href={fontImport} rel="stylesheet" /> : null}
      <div className="app-shell">
        <main>
          <div className="mobile-workspace-toggle" role="tablist" aria-label="Workspace view">
            <button
              className={mobileWorkspaceView === 'editor' ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={mobileWorkspaceView === 'editor'}
              onClick={() => setMobileWorkspaceView('editor')}
            >
              Editor
            </button>
            <button
              className={mobileWorkspaceView === 'preview' ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={mobileWorkspaceView === 'preview'}
              onClick={() => setMobileWorkspaceView('preview')}
            >
              Preview
            </button>
          </div>

          <section className="workspace" data-mobile-view={mobileWorkspaceView}>
            <div className="editor">
              <SectionHeader
                icon={Palette}
                title="Brand Styleguide"
                action={
                  <button className="ghost-action" onClick={randomizeGuide} type="button">
                    <Shuffle size={16} />
                    Surprise
                  </button>
                }
              />

              <AnalyzeBrandEntry
                url={url}
                setUrl={setUrl}
                isAnalyzing={isAnalyzing}
                error={error}
                confidence={guide.confidence}
                sourceUrl={guide.sourceUrl}
                onSubmit={analyzeWebsite}
              />

              <BrandKitCard guide={guide} updateGuide={updateGuide} />

              <div className="two-column">
                <FontCard
                  title="Heading"
                  value={guide.typography.heading}
                  original={guide.typography.headingOriginal}
                  source={guide.typography.headingSource}
                  onChange={(value) => updateGuide('typography.heading', value)}
                />
                <FontCard
                  title="Body"
                  value={guide.typography.body}
                  original={guide.typography.bodyOriginal}
                  source={guide.typography.bodySource}
                  onChange={(value) => updateGuide('typography.body', value)}
                />
              </div>

              <SectionHeader
                icon={LayoutGrid}
                title="Quote Building Blocks"
                action={
                  <button className="ghost-action" onClick={randomizeLayout} type="button">
                    <RefreshCcw size={16} />
                    Randomize
                  </button>
                }
              />

              <div className="controls-panel">
                <RadiusControl
                  radius={guide.radius}
                  updateGuide={updateGuide}
                />
                <ImageStyleControl
                  value={layout.imageStyle}
                  onChange={(value) => setLayout((current) => ({ ...current, imageStyle: value }))}
                />
                <LayoutControl
                  label="Comments"
                  value={layout.commentPlacement}
                  options={LAYOUT_OPTIONS.commentPlacement}
                  onChange={(value) => setLayout((current) => ({ ...current, commentPlacement: value }))}
                />
                <LayoutControl
                  label="Itinerary"
                  value={layout.itineraryStyle}
                  options={LAYOUT_OPTIONS.itineraryStyle}
                  onChange={(value) => setLayout((current) => ({ ...current, itineraryStyle: value }))}
                />
                <LayoutControl
                  label="Aircraft data"
                  value={layout.dataStyle}
                  options={LAYOUT_OPTIONS.dataStyle}
                  onChange={(value) => setLayout((current) => ({ ...current, dataStyle: value }))}
                />
              </div>

              <div className="notes-panel">
                {guide.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>

            <QuotePreview guide={guide} layout={layout} style={quoteVars} />
          </section>
        </main>
      </div>
    </>
  );
}

function mergeAnalyzedGuide(payload) {
  return {
    ...DEFAULT_GUIDE,
    ...payload,
    colors: {
      ...DEFAULT_GUIDE.colors,
      ...payload.colors
    },
    typography: {
      ...DEFAULT_GUIDE.typography,
      ...payload.typography
    },
    notes: payload.notes?.length ? payload.notes : DEFAULT_GUIDE.notes
  };
}

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="section-header">
      <div>
        <Icon size={20} />
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function AnalyzeBrandEntry({ url, setUrl, isAnalyzing, error, confidence, sourceUrl, onSubmit }) {
  return (
    <section className="brand-analyze-card">
      <div className="brand-analyze-copy">
        <h3>Bring your branding from your website</h3>
      </div>

      <form className="brand-analyze-form" onSubmit={onSubmit}>
        <label htmlFor="website-url">Website</label>
        <div className="url-row">
          <input
            id="website-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="vistajet.com"
            inputMode="url"
          />
          <button className="primary-action" type="submit" disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
            {isAnalyzing ? 'Analyzing' : 'Analyze'}
          </button>
        </div>
        {error ? <p className="error-message">{error}</p> : null}
      </form>

      <div className="brand-analyze-status">
        <BadgeCheck size={16} />
        <span>{Math.round(confidence * 100)}% confidence</span>
        <span>{sourceUrl || 'Awaiting website analysis'}</span>
      </div>
    </section>
  );
}

function BrandKitCard({ guide, updateGuide }) {
  return (
    <div className="panel brand-kit-card">
      <div className="panel-heading">
        <span>Brand kit</span>
        <span className="lock-dot">Editable</span>
      </div>
      <div className="brand-kit-layout">
        <SmartLogo
          className="logo-preview"
          logoUrl={guide.logoUrl}
          brandName={guide.brandName}
          backgroundMode={guide.logoBackground}
          brandPrimary={guide.colors.primary}
          brandSecondary={guide.colors.secondary}
          iconSize={34}
        />
        <div className="brand-kit-fields">
          <label>
            Brand name
            <input value={guide.brandName} onChange={(event) => updateGuide('brandName', event.target.value)} />
          </label>
          <label>
            Logo URL
            <input value={guide.logoUrl} onChange={(event) => updateGuide('logoUrl', event.target.value)} />
          </label>
        </div>
        <div className="brand-kit-colors">
          <ColorCard
            label="Primary"
            value={guide.colors.primary}
            onChange={(value) => updateGuide('colors.primary', value)}
          />
          <ColorCard
            label="Secondary"
            value={guide.colors.secondary}
            onChange={(value) => updateGuide('colors.secondary', value)}
          />
        </div>
      </div>
    </div>
  );
}

function ColorCard({ label, value, onChange }) {
  return (
    <div className="color-card" style={{ '--swatch': value } as CSSVariableStyle}>
      <div className="color-card-top">
        <span>{label}</span>
        <Palette size={18} />
      </div>
      <div className="color-card-bottom">
        <input
          aria-label={`${label} hex value`}
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          maxLength={7}
        />
        <input
          aria-label={`${label} color picker`}
          type="color"
          value={normalizeHexForInput(value)}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
      </div>
    </div>
  );
}

function SmartLogo({
  className,
  logoUrl,
  brandName,
  backgroundMode,
  brandPrimary,
  brandSecondary,
  iconSize,
  variant = 'editor'
}) {
  const [autoBackground, setAutoBackground] = useState(variant === 'quote' ? 'none' : 'dark');
  const resolvedBackground = backgroundMode === 'auto' ? autoBackground : backgroundMode;

  useEffect(() => {
    if (!logoUrl) {
      setAutoBackground(variant === 'quote' ? 'none' : 'dark');
      return;
    }

    let isCancelled = false;
    const image = new window.Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context) {
          setAutoBackground(variant === 'quote' ? 'none' : 'dark');
          return;
        }

        context.clearRect(0, 0, size, size);
        const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);

        const pixels = context.getImageData(0, 0, size, size).data;
        let red = 0;
        let green = 0;
        let blue = 0;
        let count = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3];
          if (alpha < 24) {
            continue;
          }

          red += pixels[index];
          green += pixels[index + 1];
          blue += pixels[index + 2];
          count += 1;
        }

        if (!count) {
          setAutoBackground(variant === 'quote' ? 'none' : 'dark');
          return;
        }

        const averageColor = {
          red: red / count,
          green: green / count,
          blue: blue / count
        };
        const luminance = relativeLuminance(averageColor.red, averageColor.green, averageColor.blue);

        if (!isCancelled) {
          setAutoBackground(
            variant === 'quote'
              ? resolveQuoteLogoBackground(luminance, brandPrimary, brandSecondary)
              : contrastRatio(luminance, 1) >= 3
                ? 'light'
                : 'dark'
          );
        }
      } catch {
        if (!isCancelled) {
          setAutoBackground(variant === 'quote' ? 'none' : 'dark');
        }
      }
    };

    image.onerror = () => {
      if (!isCancelled) {
        setAutoBackground(variant === 'quote' ? 'none' : 'dark');
      }
    };

    image.src = logoUrl;

    return () => {
      isCancelled = true;
    };
  }, [brandPrimary, brandSecondary, logoUrl, variant]);

  return (
    <div
      className={`${className} logo-bg-${resolvedBackground}`}
      style={{ '--logo-brand-bg': brandSecondary } as CSSVariableStyle}
    >
      {logoUrl ? <img src={logoUrl} alt={`${brandName} logo`} /> : <Plane size={iconSize} />}
    </div>
  );
}

function FontCard({ title, value, original, source, onChange }) {
  return (
    <div className="panel font-card">
      <div className="panel-heading">
        <span>{title}</span>
        <Type size={18} />
      </div>
      <label>
        Google font
        <div className="select-wrap">
          <select value={value} onChange={(event) => onChange(event.target.value)}>
            {GOOGLE_FONT_CHOICES.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
          <ChevronDown size={16} />
        </div>
      </label>
      <div className="font-sample" style={{ fontFamily: `"${value}", sans-serif` }}>
        {value}
      </div>
      <p>
        {source}
        {original && original !== value ? ` from ${original}` : ''}
      </p>
    </div>
  );
}

function RadiusControl({ radius, updateGuide }) {
  return (
    <div className="control-group radius-control">
      <span>Border radius</span>
      <input
        type="range"
        min="0"
        max="28"
        value={radius}
        onChange={(event) => updateGuide('radius', Number(event.target.value))}
      />
      <strong>{radius}px</strong>
    </div>
  );
}

function LayoutControl({ label, value, options, onChange }) {
  return (
    <div className="control-group">
      <span>{label}</span>
      <div className="segmented layout-segment">
        {options.map((option) => {
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              className={value === option.value ? 'active' : ''}
              type="button"
              onClick={() => onChange(option.value)}
            >
              {Icon ? <Icon size={15} /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImageStyleControl({ value, onChange }) {
  return (
    <div className="control-group image-style-control">
      <span>Image layout style</span>
      <div className="image-style-options">
        {IMAGE_STYLE_OPTIONS.map((option) => {
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              className={value === option.value ? 'image-style-option active' : 'image-style-option'}
              type="button"
              onClick={() => onChange(option.value)}
            >
              <span className="image-style-label">
                <span className="image-style-icon">
                  <Icon size={17} />
                </span>
                <span>{option.label}</span>
              </span>
              <ImageStylePreview styleName={option.value} />
              <small>{option.description}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ImageStylePreview({ styleName }) {
  return (
    <div className={`wireframe-preview wireframe-${styleName}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function QuotePreview({ guide, layout, style }) {
  const [isFullView, setIsFullView] = useState(false);

  const previewDocument = (
    <div className="quote-page" style={style}>
      <header className="quote-header">
        <SmartLogo
          className="quote-logo"
          logoUrl={guide.logoUrl}
          brandName={guide.brandName}
          backgroundMode={guide.logoBackground}
          brandPrimary={guide.colors.primary}
          brandSecondary={guide.colors.secondary}
          iconSize={24}
          variant="quote"
        />
        <div>
          <p>Private aviation quote</p>
          <h2>{guide.brandName}</h2>
        </div>
      </header>

      <section className="quote-intro">
        <div>
          <p className="quote-kicker">Prepared for {sampleQuote.client}</p>
          <h3>{sampleQuote.route}</h3>
        </div>
        <p>{sampleQuote.note}</p>
      </section>

      <div className="option-list">
        {sampleQuote.options.map((option, index) => (
          <AircraftOption key={option.id} option={option} index={index} layout={layout} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <aside className="quote-preview-shell">
        <div className="quote-preview-stage">
          <div className="quote-toolbar">
            <span>Preview</span>
            <div>
              <button
                className="preview-fullview-trigger"
                type="button"
                onClick={() => setIsFullView(true)}
                aria-label="Open full preview"
              >
                <Expand size={14} />
              </button>
            </div>
          </div>
          <div className="quote-page-viewport">
            <div className="quote-page-scale">{previewDocument}</div>
          </div>
        </div>
      </aside>

      {isFullView ? (
        <div className="preview-modal-overlay" role="dialog" aria-modal="true">
          <div className="preview-modal">
            <div className="preview-modal-bar">
              <span>Full Preview</span>
              <button
                className="preview-modal-close"
                type="button"
                onClick={() => setIsFullView(false)}
                aria-label="Close full preview"
              >
                <X size={16} />
              </button>
            </div>
            <div className="preview-modal-canvas">
              <div className="quote-page-scale modal-scale">{previewDocument}</div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AircraftOption({ option, index, layout }) {
  return (
    <article className="aircraft-option">
      <AircraftImages images={option.images} title={option.title} styleName={layout.imageStyle} />

      <div className="option-content">
        <div className="option-heading">
          <div>
            <p>Option {index + 1}</p>
            <h4>{option.title}</h4>
          </div>
          <div className="price-box">
            <strong>{option.price}</strong>
            <span>{option.priceNote}</span>
          </div>
        </div>

        {layout.commentPlacement === 'below-title' ? <Comment text={option.comment} /> : null}

        <Itinerary option={option} styleName={layout.itineraryStyle} />
        <AircraftData option={option} styleName={layout.dataStyle} />

        {layout.commentPlacement === 'after-data' ? <Comment text={option.comment} /> : null}

        <div className="amenity-row">
          {option.amenities.map((amenity) => (
            <span key={amenity}>{amenity}</span>
          ))}
        </div>

        {layout.commentPlacement === 'callout' ? <Comment text={option.comment} /> : null}

      </div>
    </article>
  );
}

function AircraftImages({ images, title, styleName }) {
  const visibleImages = images.slice(0, 5);
  const pattern = resolveImagePattern(styleName, visibleImages.length);
  const [featuredImage, ...thumbnailImages] = visibleImages;

  if (pattern === 'empty') {
    return (
      <div className="aircraft-images image-layout-empty">
        <div className="image-empty-state">
          <Plane size={24} />
          <span>Images pending</span>
        </div>
      </div>
    );
  }

  if (pattern === 'hero-side' || pattern === 'hero-bottom' || pattern === 'hero-grid') {
    return (
      <div className={`aircraft-images image-layout-${pattern}`} data-image-count={visibleImages.length}>
        <AircraftVisual image={featuredImage} title={title} featured />
        <div className="thumbnail-group">
          {thumbnailImages.map((image, index) => (
            <AircraftVisual key={`${image.kind}-${index}`} image={image} title={title} compact />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`aircraft-images image-layout-${pattern}`} data-image-count={visibleImages.length}>
      {visibleImages.map((image, index) => (
        <AircraftVisual
          key={`${image.kind}-${index}`}
          image={image}
          title={title}
          featured={visibleImages.length === 1}
        />
      ))}
    </div>
  );
}

function AircraftVisual({ image, title, featured = false, compact = false }) {
  const hasPhoto = Boolean(image.src);

  return (
    <div
      className={`aircraft-visual tone-${image.tone} ${hasPhoto ? 'has-photo' : ''} ${featured ? 'is-featured' : ''} ${
        compact ? 'is-thumbnail' : ''
      }`}
    >
      {hasPhoto ? (
        <img
          className="aircraft-photo"
          src={image.src}
          alt={`${title} ${image.kind.toLowerCase()}`}
          loading="lazy"
          style={{ objectPosition: image.objectPosition || 'center' }}
          onError={(event) => {
            event.currentTarget.hidden = true;
            event.currentTarget.closest('.aircraft-visual')?.classList.remove('has-photo');
          }}
        />
      ) : null}
      <div className="aircraft-shape" aria-hidden="true">
        <span />
      </div>
      <p>{image.kind}</p>
      <strong>{title}</strong>
      {image.credit && image.sourceUrl ? (
        <a className="image-credit" href={image.sourceUrl} target="_blank" rel="noreferrer">
          {image.credit}
        </a>
      ) : null}
    </div>
  );
}

function resolveImagePattern(styleName, imageCount) {
  const normalizedCount = Math.min(Math.max(imageCount, 0), 5);
  const styleMap = IMAGE_PATTERN_BY_STYLE[styleName] || IMAGE_PATTERN_BY_STYLE.showcase;
  return styleMap[normalizedCount] || styleMap[5];
}

function Itinerary({ option, styleName }) {
  const legs = getItineraryLegs(option);

  if (styleName === 'compact') {
    return (
      <div className="itinerary itinerary-compact-line">
        {legs.map((leg, index) => (
          <React.Fragment key={`${leg.departure.code}-${leg.arrival.code}-${index}`}>
            <span>
              <strong>{leg.departure.code}</strong>
              {leg.departure.time ? ` ${leg.departure.time}` : ''}
            </span>
            <ChevronRight size={14} />
            <span>
              <strong>{leg.arrival.code}</strong>
              {leg.arrival.time ? ` ${leg.arrival.time}` : ''}
            </span>
            {leg.totalTime ? <em>{leg.totalTime}</em> : null}
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (styleName === 'route-card') {
    return (
      <div className="itinerary itinerary-route-cards">
        {legs.map((leg, index) => (
          <div className="itinerary-route-card" key={`${leg.departure.code}-${leg.arrival.code}-${index}`}>
            {legs.length > 1 ? <p className="itinerary-leg-label">Leg {index + 1}</p> : null}
            <div className="route-card-codes">
              <strong>{leg.departure.code}</strong>
              <ChevronRight size={16} />
              <strong>{leg.arrival.code}</strong>
            </div>
            <div className="route-card-meta">
              <span>{leg.departure.city}</span>
              <span>{leg.arrival.city}</span>
            </div>
            <div className="route-card-footer">
              <span>{leg.departure.time || leg.departure.date}</span>
              <span>{leg.totalTime || 'Time pending'}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`itinerary itinerary-card itinerary-${styleName}`}>
      {legs.map((leg, index) => (
        <ItineraryLeg
          key={`${leg.departure.code}-${leg.arrival.code}-${index}`}
          leg={leg}
          index={index}
          totalLegs={legs.length}
        />
      ))}
    </div>
  );
}

function ItineraryLeg({ leg, index, totalLegs }) {
  return (
    <div className="itinerary-leg">
      {totalLegs > 1 ? <p className="itinerary-leg-label">Leg {index + 1}</p> : null}
      <div className="itinerary-route-row">
        <AirportBlock stop={leg.departure} align="start" />
        <div className="itinerary-route-visual" aria-hidden="true">
          <span />
          <ChevronRight size={15} />
          <span />
        </div>
        <AirportBlock stop={leg.arrival} align="end" />
      </div>

      <div className="itinerary-detail-row">
        <TimeBlock
          icon={PlaneTakeoff}
          label="Departure"
          date={leg.departure.date}
          time={leg.departure.time}
          align="start"
        />
        <div className="itinerary-pax">
          <strong>PAX:</strong>
          <span>{leg.pax}</span>
          {leg.totalTime ? <em>{leg.totalTime}</em> : null}
        </div>
        <TimeBlock icon={PlaneLanding} label="Arrival" date={leg.arrival.date} time={leg.arrival.time} align="end" />
      </div>
    </div>
  );
}

function AirportBlock({ stop, align }) {
  return (
    <div className={`itinerary-airport itinerary-align-${align}`}>
      <strong>{stop.code}</strong>
      <span>{stop.city}</span>
      {stop.region ? <span>{stop.region}</span> : null}
    </div>
  );
}

function TimeBlock({ icon: Icon, label, date, time, align }) {
  return (
    <div className={`itinerary-time itinerary-align-${align}`}>
      <div>
        <Icon size={15} />
        <strong>{label}</strong>
      </div>
      {date ? <span>{date}</span> : null}
      {time ? <span>{time}</span> : null}
    </div>
  );
}

function getItineraryLegs(option) {
  if (Array.isArray(option.legs) && option.legs.length > 0) {
    return option.legs.map((leg, index) => ({
      departure: normalizeItineraryStop(leg.departure, option.departureDate),
      arrival: normalizeItineraryStop(leg.arrival, leg.arrivalDate || option.departureDate),
      pax: String(leg.pax || option.pax || sampleQuote.passengers || 3),
      totalTime: leg.totalTime || leg.flightTime || (option.legs.length === 1 ? option.flightTime : '')
    }));
  }

  const stops = option.itinerary || [];

  if (stops.length <= 1) {
    const stop = normalizeItineraryStop(stops[0] || {}, option.departureDate);
    return [
      {
        departure: stop,
        arrival: normalizeItineraryStop({}, option.departureDate),
        pax: String(option.pax || sampleQuote.passengers || 3),
        totalTime: option.flightTime
      }
    ];
  }

  return stops.slice(0, -1).map((departure, index) => ({
    departure: normalizeItineraryStop(departure, departure.date || option.departureDate),
    arrival: normalizeItineraryStop(stops[index + 1], stops[index + 1].date || option.departureDate),
    pax: String(option.pax || sampleQuote.passengers || 3),
    totalTime: stops.length === 2 ? option.flightTime : departure.flightTime || stops[index + 1].flightTime || ''
  }));
}

function normalizeItineraryStop(stop: any = {}, fallbackDate = '') {
  return {
    code: stop.code || 'TBD',
    city: stop.city || stop.airport || 'Airport pending',
    region: stop.region || stop.country || '',
    date: stop.date || fallbackDate,
    time: stop.time || ''
  };
}

function AircraftData({ option, styleName }) {
  if (styleName === 'badges') {
    return (
      <div className="data-badges">
        {option.data.map(([label, value]) => (
          <span key={label}>
            {label}: <strong>{value}</strong>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={styleName === 'split' ? 'aircraft-data split-data' : 'aircraft-data'}>
      {option.data.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function Comment({ text }) {
  return <p className="option-comment">{text}</p>;
}

function nextRandomValue(options, currentValue) {
  const candidates = options.map((option) => option.value).filter((value) => value !== currentValue);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function createNeutralTintVars(color) {
  const { hue, saturation, lightness } = hexToHsl(color);
  const neutralChroma = Math.round(Math.min(saturation * 0.07, 3));
  const borderChroma = Math.min(neutralChroma + 1, 5);
  const textChroma = Math.min(neutralChroma + 1, 4);
  const shadowChroma = Math.min(neutralChroma + 2, 6);
  const lightnessBias = Math.round(Math.max(-2, Math.min(1, (lightness - 55) / 26)));

  return {
    '--quote-surface': `hsl(${hue} ${neutralChroma}% ${Math.min(99, 98 + lightnessBias)}%)`,
    '--quote-surface-muted': `hsl(${hue} ${neutralChroma}% ${Math.min(97, 95 + lightnessBias)}%)`,
    '--quote-surface-soft': `hsl(${hue} ${neutralChroma}% ${Math.min(95, 93 + lightnessBias)}%)`,
    '--quote-border': `hsl(${hue} ${borderChroma}% ${Math.min(89, 87 + lightnessBias)}%)`,
    '--quote-border-strong': `hsl(${hue} ${borderChroma}% ${Math.min(83, 81 + lightnessBias)}%)`,
    '--quote-text': `hsl(${hue} ${textChroma}% 17%)`,
    '--quote-muted-text': `hsl(${hue} ${textChroma}% 42%)`,
    '--quote-shadow': `hsl(${hue} ${shadowChroma}% 18% / 0.11)`
  };
}

function relativeLuminance(red, green, blue) {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(firstLuminance, secondLuminance) {
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function resolveQuoteLogoBackground(logoLuminance, brandPrimary, brandSecondary) {
  const primary = hexToRgb(brandPrimary);
  const secondary = hexToRgb(brandSecondary);
  const primaryLuminance = primary ? relativeLuminance(primary.red, primary.green, primary.blue) : 0.02;
  const secondaryLuminance = secondary ? relativeLuminance(secondary.red, secondary.green, secondary.blue) : null;
  const contrastOnHeader = contrastRatio(logoLuminance, primaryLuminance);

  if (contrastOnHeader >= 3) {
    return 'none';
  }

  if (logoLuminance >= 0.72 && secondaryLuminance !== null && secondaryLuminance <= 0.24) {
    const contrastOnSecondary = contrastRatio(logoLuminance, secondaryLuminance);

    if (contrastOnSecondary >= 3.5) {
      return 'accent';
    }
  }

  return logoLuminance >= 0.55 ? 'dark' : 'light';
}

function hexToRgb(hex) {
  if (!/^#[0-9A-F]{6}$/i.test(hex)) {
    return null;
  }

  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16)
  };
}

function hexToHsl(hex) {
  const fallback = { hue: 220, saturation: 8, lightness: 50 };

  if (!/^#[0-9A-F]{6}$/i.test(hex)) {
    return fallback;
  }

  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { hue: 220, saturation: 0, lightness: Math.round(lightness * 100) };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue;

  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  return {
    hue: Math.round(hue * 60),
    saturation: Math.round(saturation * 100),
    lightness: Math.round(lightness * 100)
  };
}

function normalizeHexForInput(value) {
  return /^#[0-9A-F]{6}$/i.test(value) ? value : '#111111';
}
