"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import startupsData from "../../dead_startups.json";

const GraveyardCanvas = dynamic(() => import("./GraveyardCanvas"), {
  ssr: false,
  loading: () => (
    <div className="loading-overlay">
      <div className="loading-text">Startup Graveyard</div>
      <div className="loading-sub">Unearthing the dead...</div>
    </div>
  ),
});

interface Startup {
  id: number;
  name: string;
  description: string;
  sector: string;
  country: string;
  founders: string[];
  investors: string[];
  start_year: number;
  end_year: number;
  total_funding: number;
  cause_of_death: string;
  the_loot: string[];
}

function formatFunding(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

export default function HomePage() {
  const allStartups = useMemo(() => (startupsData as Startup[]), []);

  const [search, setSearch] = useState("");
  const [activeSector, setActiveSector] = useState("all");
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [hoveredStartup, setHoveredStartup] = useState<Startup | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const sectors = useMemo(() => {
    const s = new Set(allStartups.map((st) => st.sector?.toLowerCase() || "unknown"));
    return ["all", ...Array.from(s).sort()];
  }, [allStartups]);

  const filteredStartups = useMemo(() => {
    let result = allStartups;
    if (activeSector !== "all") {
      result = result.filter((s) => (s.sector?.toLowerCase() || "unknown") === activeSector);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.sector?.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allStartups, activeSector, search]);

  const handleHover = useCallback(
    (startup: Startup | null, screenPos: { x: number; y: number } | null) => {
      setHoveredStartup(startup);
      setTooltipPos(screenPos);
    },
    []
  );

  const handleClick = useCallback((startup: Startup) => {
    setSelectedStartup(startup);
  }, []);

  const totalFunding = useMemo(
    () => filteredStartups.reduce((sum, s) => sum + (s.total_funding || 0), 0),
    [filteredStartups]
  );

  return (
    <>
      {/* Loading */}
      <div className={`loading-overlay ${!loading ? "fade-out" : ""}`}>
        <div className="loading-text">Startup Graveyard</div>
        <div className="loading-sub">Unearthing the dead...</div>
      </div>

      {/* Support banner */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "linear-gradient(90deg, rgba(200,184,120,0.12) 0%, rgba(139,26,26,0.15) 50%, rgba(200,184,120,0.12) 100%)",
        borderBottom: "1px solid rgba(200,184,120,0.15)",
        padding: "7px 20px",
        textAlign: "center",
        fontFamily: "'Special Elite', cursive",
        fontSize: "0.72rem",
        color: "#9a9070",
        letterSpacing: "1.5px",
        backdropFilter: "blur(10px)",
        pointerEvents: "all",
      }}>
        ⚡ Support this project by trading on{" "}
        <a href="https://bags.fm/EFXXFqSmU1XssioWEh6w7QafvuhW4t8FZoXRypTmBAGS" target="_blank" rel="noopener noreferrer" style={{
          color: "#c8b878",
          textDecoration: "none",
          borderBottom: "1px solid rgba(200,184,120,0.4)",
        }}>
          Bags.FM
        </a>
        {" "}— CA:{" "}
        <span style={{ color: "#6a8a6a", fontFamily: "monospace", fontSize: "0.65rem" }}>
          EFXXFqSmU1XssioWEh6w7QafvuhW4t8FZoXRypTmBAGS
        </span>
      </div>

      {/* Lightning flash */}
      <div className="lightning" />

      {/* 3D Canvas */}
      <GraveyardCanvas
        startups={filteredStartups}
        onHover={handleHover}
        onClick={handleClick}
      />

      {/* Overlay UI */}
      <div className="overlay-ui mt-20!">
        {/* Header */}
        <header className="header">
          <h1 className="title-main">Startup Graveyard</h1>
          <p className="title-sub">Where Ventures Come to Rest</p>
          <div className="rip-count">
            ⚰️ &nbsp; {filteredStartups.length} Startups Laid to Rest &nbsp;|&nbsp;{" "}
            {formatFunding(totalFunding)} Burned &nbsp; ⚰️
          </div>
        </header>

        {/* Sector filters */}
        {/* <div className="sector-filters">
          {sectors.map((s) => (
            <button
              key={s}
              className={`sector-btn ${activeSector === s ? "active" : ""}`}
              onClick={() => setActiveSector(s)}
            >
              {s}
            </button>
          ))}
        </div> */}

        {/* Search */}
        {/* <div className="search-container">
          <input
            className="search-input"
            placeholder="🔍 Search the dead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div> */}

        {/* Hover tooltip */}
        {hoveredStartup && tooltipPos && (
          <div
            className={`hover-tooltip ${hoveredStartup ? "visible" : ""}`}
            style={{
              left: Math.min(tooltipPos.x - 120, window.innerWidth - 260),
              top: Math.max(tooltipPos.y - 220, 10),
            }}
          >
            <div className="tooltip-name">{hoveredStartup.name}</div>
            <div className="tooltip-row">
              <span className="tooltip-label">Sector:</span>
              <span className="tooltip-value">{hoveredStartup.sector}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Years:</span>
              <span className="tooltip-value">
                {hoveredStartup.start_year} — {hoveredStartup.end_year}
              </span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Funding:</span>
              <span className="tooltip-value">{formatFunding(hoveredStartup.total_funding)}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Country:</span>
              <span className="tooltip-value">{hoveredStartup.country}</span>
            </div>
            <div className="tooltip-cause">
              💀 {hoveredStartup.cause_of_death?.substring(0, 150)}...
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      <div className={`detail-panel ${selectedStartup ? "open" : ""}`}>
        {selectedStartup && (
          <>
            <button className="detail-close" onClick={() => setSelectedStartup(null)}>
              ✕
            </button>

            <div className="detail-rip">R.I.P</div>
            <div className="detail-name">{selectedStartup.name}</div>
            <div className="detail-dates">
              {selectedStartup.start_year} — {selectedStartup.end_year}
            </div>

            <div className="detail-funding">{formatFunding(selectedStartup.total_funding)}</div>
            <div style={{ textAlign: "center", fontSize: "0.7rem", color: "#7a7a8a", letterSpacing: "2px", fontFamily: "Special Elite, cursive" }}>
              TOTAL FUNDING BURNED
            </div>

            <hr className="detail-divider" />

            <div className="detail-meta-row">
              <span className="detail-meta-label">Sector</span>
              <span className="detail-meta-value">{selectedStartup.sector}</span>
            </div>
            <div className="detail-meta-row">
              <span className="detail-meta-label">Country</span>
              <span className="detail-meta-value">{selectedStartup.country}</span>
            </div>
            <div className="detail-meta-row">
              <span className="detail-meta-label">Lifespan</span>
              <span className="detail-meta-value">
                {selectedStartup.end_year - selectedStartup.start_year} years
              </span>
            </div>

            <div className="detail-section-title">Founders</div>
            <div>
              {selectedStartup.founders?.map((f, i) => (
                <span className="detail-tag" key={i}>{f}</span>
              ))}
            </div>

            <div className="detail-section-title">Investors</div>
            <div>
              {selectedStartup.investors?.map((inv, i) => (
                <span className="detail-tag" key={i}>{inv}</span>
              ))}
            </div>

            <div className="detail-section-title">Description</div>
            <p className="detail-text">{selectedStartup.description}</p>

            <div className="detail-section-title">💀 Cause of Death</div>
            <div className="detail-cause">{selectedStartup.cause_of_death}</div>

            {selectedStartup.the_loot && selectedStartup.the_loot.length > 0 && (
              <>
                <div className="detail-section-title">📜 Lessons (The Loot)</div>
                {selectedStartup.the_loot.map((l, i) => (
                  <p className="detail-text" key={i} style={{ fontSize: "0.8rem" }}>
                    • {l}
                  </p>
                ))}
              </>
            )}

            <div style={{ height: 40 }} />
          </>
        )}
      </div>

      {/* Footer with GitHub */}
      <footer className="site-footer">
        <a
          href="https://github.com/JayWebtech"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-github-link"
          aria-label="JayWebtech on GitHub"
        >
          <svg className="footer-github-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span className="footer-github-text">Built by JayWebtech</span>
          <span className="footer-github-handle">@JayWebtech</span>
        </a>
      </footer>

      {/* Instructions */}
      <div className="instructions">
        ✦ &nbsp; WASD / Arrow keys to walk &nbsp;|&nbsp; Mouse drag to look &nbsp;|&nbsp; Scroll to zoom &nbsp;|&nbsp; Click a grave to read its story &nbsp; ✦
      </div>
    </>
  );
}
