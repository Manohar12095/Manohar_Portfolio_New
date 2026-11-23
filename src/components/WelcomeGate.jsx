import { useState } from "react";
import { recordVisitorLogin, logVisitorAction } from "../lib/telemetry";

export default function WelcomeGate({ onEnter }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setError("Please enter your name (at least 2 characters) to explore the portfolio");
      return;
    }
    setError("");
    recordVisitorLogin(trimmed);
    logVisitorAction(`Visitor unlocked portfolio with name: ${trimmed}`, "login");
    onEnter(trimmed);
  };

  return (
    <div className="welcome-gate-overlay">
      <div className="welcome-gate-card">
        {/* Top-right Live status indicator */}
        <div className="welcome-gate-status" title="Site is live" aria-label="System status online">
          <span className="welcome-gate-dot" />
        </div>

        {/* Manohar Profile Avatar */}
        <div className="welcome-gate-avatar-wrap">
          <img
            src="/images/profile.jpg"
            alt="S. Manohar"
            className="welcome-gate-avatar"
            onError={(e) => {
              // fallback if image not present yet
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling.style.display = "grid";
            }}
          />
          <div className="welcome-gate-avatar-fallback">SM</div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="welcome-gate-title">Welcome</h1>
        <p className="welcome-gate-sub">Enter your name to explore S. Manohar's portfolio</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="welcome-gate-form" autoComplete="off">
          <div className="welcome-gate-field">
            <label htmlFor="visitor-name" className="welcome-gate-label">
              Your Name
            </label>
            <input
              id="visitor-name"
              type="text"
              className="welcome-gate-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Alex Kumar"
              autoFocus
              maxLength={60}
              required
            />
          </div>

          {error && <p className="welcome-gate-err">{error}</p>}

          <button
            type="submit"
            className="welcome-gate-btn"
            disabled={name.trim().length < 2}
          >
            ENTER PORTFOLIO →
          </button>
        </form>
      </div>
    </div>
  );
}

