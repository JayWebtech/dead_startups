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

      {/* Lightning flash */}
      <div className="lightning" />

      {/* 3D Canvas */}
      <GraveyardCanvas
        startups={filteredStartups}
        onHover={handleHover}
        onClick={handleClick}
      />

      {/* Overlay UI */}
      <div className="overlay-ui">
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
        <div className="sector-filters">
          {sectors.map((s) => (
            <button
              key={s}
              className={`sector-btn ${activeSector === s ? "active" : ""}`}
              onClick={() => setActiveSector(s)}
            >
              {s}
            </button>
          ))}
        </div>

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

      {/* Instructions */}
      <div className="instructions">
        ✦ &nbsp; WASD / Arrow keys to walk &nbsp;|&nbsp; Mouse drag to look &nbsp;|&nbsp; Scroll to zoom &nbsp;|&nbsp; Click a grave to read its story &nbsp; ✦
      </div>
    </>
  );
}
