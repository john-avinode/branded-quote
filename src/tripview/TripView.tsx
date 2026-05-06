import React from 'react';
import {
  Bell,
  Copy,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  PlaneTakeoff,
  Link,
  Route,
  Globe,
  MessageCircle,
  Search,
  Sparkles
} from 'lucide-react';
import './tripview.css';

type CSSVariableStyle = React.CSSProperties & Record<`--${string}`, string | number>;

type TripCard = {
  id: string;
  name: string;
  route: string;
  date: string;
  source: string;
  sourceIcon: 'globe';
  updatedAt: string;
  tripId?: string;
  avatar?: string;
  hasMessage?: boolean;
  active?: boolean;
};

const FIGMA_LOGO_URL = 'https://www.figma.com/api/mcp/asset/8f265cf0-c0f0-41d9-b452-d9134e3ecdd5';
const MAP_BG_URL = 'https://www.figma.com/api/mcp/asset/991badd3-2cf8-4912-9680-3b2683c0df44';

const tripCards: TripCard[] = [
  {
    id: '1',
    name: 'brad pitt',
    route: 'EGPF ➔ EGJJ',
    date: '22 Feb 2026',
    source: 'Web App & API',
    sourceIcon: 'globe',
    updatedAt: '11:28'
  },
  {
    id: '2',
    name: '',
    route: 'EGPF ➔ EGJJ',
    date: '22 Feb 2026',
    source: 'Web App & API',
    sourceIcon: 'globe',
    tripId: '2Y2DZH',
    updatedAt: '11:28',
    avatar: 'EB'
  },
  {
    id: '3',
    name: 'Gama Aviation Ltd',
    route: 'EGPF ➔ EGJJ',
    date: '22 Feb 2026',
    source: 'Avinode RFQ',
    sourceIcon: 'globe',
    tripId: '2Y2DZH',
    updatedAt: '11:28',
    hasMessage: true
  }
];

function NavItem({ label }: { label: string }) {
  return (
    <span className="tv-nav-item">
      {label}
      <ChevronDown size={12} strokeWidth={2} />
    </span>
  );
}

export function TripView({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="trip-page">
      <header className="tv-topbar">
        <div className="tv-top-left">
          <img className="tv-logo" src={FIGMA_LOGO_URL} alt="Avinode" />
          <NavItem label="Search" />
          <NavItem label="Trips" />
          <NavItem label="Schedule" />
          <NavItem label="Aircraft" />
          <NavItem label="Company" />
        </div>

        <div className="tv-top-center-sep" />

        <div className="tv-switcher" aria-hidden="true">
          <span className="active">M</span>
          <span>S</span>
          <span>P</span>
          <span>F</span>
          <span>AP</span>
        </div>

        <div className="tv-top-center-sep" />

        <div className="tv-top-right">
          <Search size={18} />
          <Bell size={18} />
          <CircleHelp size={18} />
          <div className="tv-user" />
        </div>
      </header>

      <div className="tv-subnav">
        <span className="active">Aircraft</span>
        <span>Trip Board</span>
        <span>Empty Legs</span>
        <span>Helipters</span>
        <span>By Location</span>
        <span>Directory</span>
        <span>Airport</span>
      </div>

      <main className="tv-layout">
        <aside className="tv-sidebar">
          <h1>Trips</h1>
          <div className="tv-cards">
            {tripCards.map((trip) => (
              <article key={trip.id} className={`tv-card ${trip.active ? 'is-active' : ''}`}>
                {trip.name ? <p className="tv-list-name">{trip.name}</p> : null}
                <div className="tv-list-itinerary">
                  <p className="tv-list-route">{trip.route}</p>
                  <p className="tv-list-date">{trip.date}</p>
                </div>
                <div className="tv-badge">
                  {trip.sourceIcon === 'globe' ? <Globe size={12} /> : null}
                  <span>{trip.source}</span>
                </div>
                <div className="tv-list-footer">
                  <div className="tv-list-footer-left">
                    {trip.tripId ? (
                      <>
                        <span className="tv-list-trip-id">
                          <Link size={13} />
                          {trip.tripId}
                        </span>
                        <span className="tv-list-updated">Updated</span>
                        <span className="tv-list-updated">{trip.updatedAt}</span>
                      </>
                    ) : (
                      <>
                        <span className="tv-list-updated">Updated</span>
                        <span className="tv-list-updated">{trip.updatedAt}</span>
                      </>
                    )}
                    {trip.hasMessage ? <MessageCircle size={14} className="tv-list-message" /> : null}
                  </div>
                  {trip.avatar ? <span className="tv-list-avatar">{trip.avatar}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className="tv-main">
          <div className="tv-map" style={{ '--tv-map-image': `url(${MAP_BG_URL})` } as CSSVariableStyle}>
            <button className="tv-close" type="button" aria-label="Close">
              ×
            </button>
          </div>

          <div className="tv-body">
            <div className="tv-client-row">
              <div className="tv-avatar">EB</div>
              <div>
                <p className="tv-client-name">Emma Suddaby-Brown</p>
                <p className="tv-client-org">Gama Aviation Ltd</p>
              </div>
              <ChevronRight size={18} className="tv-right-icon" />
            </div>

            <div className="tv-summary-card">
              <div className="tv-summary-top">
                <span className="tv-rfq">RFQ</span>
                <div className="tv-rfq-row">
                  <span className="tv-data-item">
                    <PlaneTakeoff size={14} />
                    Departure in <strong>35 days</strong>
                  </span>
                  <span className="tv-data-item">
                    <Route size={14} />
                    One way
                  </span>
                  <span className="tv-soft">Updated 18 Jan 2026</span>
                </div>
              </div>

              <div className="tv-summary-break" />

              <div className="tv-linked-row">
                <div>
                  <p className="tv-soft tv-ref-label">Linked Trip</p>
                  <div className="tv-linked-code-wrap">
                    <Link size={14} />
                    <p className="tv-linked-code">2Y2DZH</p>
                    <Copy size={14} />
                  </div>
                </div>
                <div className="tv-tripid-col">
                  <p className="tv-ref-label">Trip ID</p>
                  <span className="tv-muted-pill">No trip created yet</span>
                </div>
              </div>
            </div>

            <div className="tv-tabs">
              <span>Overview</span>
              <span className="active">Client</span>
              <span>Aircraft</span>
            </div>

            <button className="tv-setup" type="button" onClick={onSetup}>
              <span className="tv-setup-icon">
                <Sparkles size={16} />
              </span>
              <span className="tv-setup-copy">
                <span className="tv-setup-title">You haven&apos;t customized your template for quote yet.</span>
                <span className="tv-setup-sub">Do that now to keep every quote ready and consistent.</span>
              </span>
              <strong>Set up →</strong>
            </button>

            <section className="tv-itinerary">
              <div className="tv-it-head">
                <strong>Requested Itinerary</strong>
                <ChevronUp size={16} />
              </div>

              <div className="tv-it-row">
                <div>
                  <p className="tv-airport">EGPF</p>
                  <p>Glasgow</p>
                  <p>United Kingdom</p>
                </div>
                <p className="tv-dashes">----- <ChevronRight size={14} /> -----</p>
                <div className="tv-right-align">
                  <p className="tv-airport">EGJJ</p>
                  <p>Jersey, Jersey (channel Is.)</p>
                  <p>Jersey</p>
                </div>
              </div>

              <div className="tv-it-row tv-it-detail">
                <div>
                  <p className="tv-label">Departure</p>
                  <p>22 Feb 2026</p>
                  <p>12:00 (12:00 UTC)</p>
                </div>
                <div className="tv-pax">
                  <p className="tv-label">PAX: 3</p>
                </div>
                <div className="tv-right-align">
                  <p className="tv-label">Arrival</p>
                </div>
              </div>
            </section>

            <section className="tv-messages">
              <div className="tv-msg-icon">
                <MessageCircle size={18} />
              </div>
              <div>
                <p className="tv-label">Messages</p>
                <p className="tv-soft">You have unread messages</p>
              </div>
              <ChevronRight size={18} className="tv-right-icon" />
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
