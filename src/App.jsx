import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Clock3,
  Image,
  LayoutGrid,
  Loader2,
  Palette,
  Plane,
  RefreshCcw,
  Route,
  Shuffle,
  Type,
  Wand2
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { sampleQuote } from './data/sampleQuote.js';

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
  imageLayout: 'feature',
  commentPlacement: 'callout',
  itineraryStyle: 'timeline',
  dataStyle: 'grid'
};

const LAYOUT_OPTIONS = {
  imageLayout: [
    { value: 'feature', label: 'Feature + rail', icon: Image },
    { value: 'mosaic', label: 'Mosaic', icon: LayoutGrid },
    { value: 'stack', label: 'Stacked strips', icon: Plane }
  ],
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
  const [url, setUrl] = useState('vistajet.com');
  const [guide, setGuide] = useState(DEFAULT_GUIDE);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const quoteVars = useMemo(
    () => ({
      '--brand-primary': guide.colors.primary,
      '--brand-secondary': guide.colors.secondary,
      '--quote-radius': `${guide.radius}px`,
      '--heading-font': `"${guide.typography.heading}", sans-serif`,
      '--body-font': `"${guide.typography.body}", sans-serif`
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
      imageLayout: nextRandomValue(LAYOUT_OPTIONS.imageLayout, current.imageLayout),
      commentPlacement: nextRandomValue(LAYOUT_OPTIONS.commentPlacement, current.commentPlacement),
      itineraryStyle: nextRandomValue(LAYOUT_OPTIONS.itineraryStyle, current.itineraryStyle),
      dataStyle: nextRandomValue(LAYOUT_OPTIONS.dataStyle, current.dataStyle)
    }));
  }

  return (
    <>
      {fontImport ? <link href={fontImport} rel="stylesheet" /> : null}
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-mark">
            <Plane size={18} />
            <span>Style Guide</span>
            <strong>Builder</strong>
          </div>
          <div className="topbar-meta">Charter quote branding</div>
        </header>

        <main>
          <section className="hero">
            <div className="hero-summary">
              <h1>AI assisted style guide generation</h1>
              <p className="hero-copy">
                Analyze a charter broker website, tune the brand signals, and preview how the quote
                experience changes for the end client.
              </p>
            </div>

            <form className="analyze-panel" onSubmit={analyzeWebsite}>
              <label htmlFor="website-url">Website URL</label>
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
              <div className="analysis-status">
                <BadgeCheck size={16} />
                <span>{Math.round(guide.confidence * 100)}% confidence</span>
                <span>{guide.sourceUrl || 'Awaiting website analysis'}</span>
              </div>
            </form>
          </section>

          <section className="workspace">
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

              <div className="style-grid">
                <LogoCard guide={guide} updateGuide={updateGuide} />
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
                  buttonStyle={guide.buttonStyle}
                  updateGuide={updateGuide}
                />
                <LayoutControl
                  label="Image layout"
                  value={layout.imageLayout}
                  options={LAYOUT_OPTIONS.imageLayout}
                  onChange={(value) => setLayout((current) => ({ ...current, imageLayout: value }))}
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

function LogoCard({ guide, updateGuide }) {
  return (
    <div className="panel logo-card">
      <div className="panel-heading">
        <span>Logo</span>
        <span className="lock-dot">Editable</span>
      </div>
      <div className="logo-preview">
        {guide.logoUrl ? <img src={guide.logoUrl} alt={`${guide.brandName} logo`} /> : <Plane size={34} />}
      </div>
      <label>
        Brand name
        <input value={guide.brandName} onChange={(event) => updateGuide('brandName', event.target.value)} />
      </label>
      <label>
        Logo URL
        <input value={guide.logoUrl} onChange={(event) => updateGuide('logoUrl', event.target.value)} />
      </label>
    </div>
  );
}

function ColorCard({ label, value, onChange }) {
  return (
    <div className="color-card" style={{ background: value }}>
      <div className="color-card-top">
        <span>{label}</span>
        <Palette size={18} />
      </div>
      <div className="color-card-bottom">
        <input
          aria-label={`${label} color picker`}
          type="color"
          value={normalizeHexForInput(value)}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
        <input
          aria-label={`${label} hex value`}
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          maxLength={7}
        />
      </div>
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

function RadiusControl({ radius, buttonStyle, updateGuide }) {
  return (
    <div className="control-group radius-control">
      <div>
        <span>Border radius</span>
        <strong>{radius}px</strong>
      </div>
      <input
        type="range"
        min="0"
        max="28"
        value={radius}
        onChange={(event) => updateGuide('radius', Number(event.target.value))}
      />
      <div className="segmented">
        {['solid', 'outline'].map((style) => (
          <button
            key={style}
            className={buttonStyle === style ? 'active' : ''}
            type="button"
            onClick={() => updateGuide('buttonStyle', style)}
          >
            {style}
          </button>
        ))}
      </div>
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

function QuotePreview({ guide, layout, style }) {
  return (
    <aside className="quote-preview-shell">
      <div className="quote-toolbar">
        <span>Live Quote Preview</span>
        <div>
          <span style={{ background: guide.colors.primary }} />
          <span style={{ background: guide.colors.secondary }} />
        </div>
      </div>

      <div className="quote-page" style={style}>
        <header className="quote-header">
          <div className="quote-logo">
            {guide.logoUrl ? <img src={guide.logoUrl} alt={`${guide.brandName} logo`} /> : <Plane size={24} />}
          </div>
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
            <AircraftOption
              key={option.id}
              option={option}
              index={index}
              layout={layout}
              buttonStyle={guide.buttonStyle}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function AircraftOption({ option, index, layout, buttonStyle }) {
  return (
    <article className="aircraft-option">
      <AircraftImages images={option.images} title={option.title} layout={layout.imageLayout} />

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

        <div className="option-actions">
          <button className={buttonStyle === 'outline' ? 'quote-button outline' : 'quote-button'} type="button">
            Request to book
            <ArrowRight size={16} />
          </button>
          <button className="text-button" type="button">
            Ask a question
          </button>
        </div>
      </div>
    </article>
  );
}

function AircraftImages({ images, title, layout }) {
  if (layout === 'mosaic') {
    return (
      <div className="aircraft-images mosaic-layout">
        {images.map((image, index) => (
          <AircraftVisual key={`${image.kind}-${index}`} image={image} title={title} />
        ))}
      </div>
    );
  }

  if (layout === 'stack') {
    return (
      <div className="aircraft-images stack-layout">
        {images.map((image, index) => (
          <AircraftVisual key={`${image.kind}-${index}`} image={image} title={title} />
        ))}
      </div>
    );
  }

  return (
    <div className="aircraft-images feature-layout">
      <AircraftVisual image={images[0]} title={title} featured />
      <div>
        {images.slice(1).map((image, index) => (
          <AircraftVisual key={`${image.kind}-${index}`} image={image} title={title} />
        ))}
      </div>
    </div>
  );
}

function AircraftVisual({ image, title, featured = false }) {
  return (
    <div className={`aircraft-visual tone-${image.tone} ${featured ? 'featured' : ''}`}>
      <div className="aircraft-shape" aria-hidden="true">
        <span />
      </div>
      <p>{image.kind}</p>
      <strong>{title}</strong>
    </div>
  );
}

function Itinerary({ option, styleName }) {
  if (styleName === 'compact') {
    return (
      <div className="itinerary compact-itinerary">
        <Route size={16} />
        <span>
          {option.itinerary[0].code} {option.itinerary[0].time}
        </span>
        <ArrowRight size={14} />
        <span>
          {option.itinerary[1].code} {option.itinerary[1].time}
        </span>
        <Clock3 size={16} />
        <span>{option.flightTime}</span>
      </div>
    );
  }

  if (styleName === 'route-card') {
    return (
      <div className="itinerary route-cards">
        {option.itinerary.map((stop) => (
          <div key={stop.label}>
            <p>{stop.label}</p>
            <strong>{stop.code}</strong>
            <span>{stop.airport}</span>
            <em>{stop.time}</em>
          </div>
        ))}
        <div>
          <p>Flight time</p>
          <strong>{option.flightTime}</strong>
          <span>{option.departureDate}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="itinerary timeline">
      {option.itinerary.map((stop) => (
        <div key={stop.label}>
          <span className="timeline-dot" />
          <p>{stop.label}</p>
          <strong>{stop.code}</strong>
          <span>{stop.airport}</span>
          <em>{stop.time}</em>
        </div>
      ))}
      <div>
        <Clock3 size={16} />
        <p>Flight time</p>
        <strong>{option.flightTime}</strong>
        <span>{option.departureDate}</span>
      </div>
    </div>
  );
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

function normalizeHexForInput(value) {
  return /^#[0-9A-F]{6}$/i.test(value) ? value : '#111111';
}
