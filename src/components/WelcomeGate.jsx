import { useState } from "react";
import { recordVisitorLogin } from "../lib/telemetry";

export default function WelcomeGate({ onEnter }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await recordVisitorLogin(trimmed);
      onEnter(trimmed);
    } catch {
      onEnter(trimmed);
    } finally {
      setLoading(false);
    }
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
              placeholder=""
              autoFocus
              maxLength={60}
              disabled={loading}
            />
          </div>

          {error && <p className="welcome-gate-err">{error}</p>}

          <button
            type="submit"
            className="welcome-gate-btn"
            disabled={loading || !name.trim()}
          >
            {loading ? "PREPARING PORTFOLIO..." : "ENTER PORTFOLIO →"}
          </button>
        </form>
      </div>
    </div>
  );
}

