import { useState, useEffect } from "react";
import { ShieldAlert, Clock, AlertTriangle, RefreshCw, Lock, ExternalLink } from "lucide-react";

export default function BlockedScreen({ blockData, onRecheck }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [checking, setChecking] = useState(false);

  const durationType = blockData?.duration_type || "permanent";
  const blockedUntil = blockData?.blocked_until ? new Date(blockData.blocked_until) : null;
  const isPermanent = durationType === "permanent" || !blockedUntil;
  const reason = blockData?.reason || "Administrative security restriction";
  const sessionId = blockData?.session_id || "Active Session";

  // Realtime Countdown Timer
  useEffect(() => {
    if (isPermanent) return;

    const calculateRemaining = () => {
      const now = new Date();
      const diff = blockedUntil.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("00:00:00");
        onRecheck?.();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const pad = (n) => String(n).padStart(2, "0");
      if (days > 0) {
        setTimeLeft(`${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
      } else {
        setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil, isPermanent, onRecheck]);

  const handleManualRecheck = async () => {
    setChecking(true);
    try {
      await onRecheck?.();
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  return (
    <div className="blocked-screen-root" role="alert" aria-live="assertive">
      <div className="blocked-screen-backdrop" />
      <div className="blocked-screen-card">
        {/* Pulsing Red Shield Icon */}
        <div className="blocked-icon-container">
          <div className="blocked-icon-ring ring-1" />
          <div className="blocked-icon-ring ring-2" />
          <div className="blocked-icon-badge">
            <ShieldAlert size={48} className="blocked-icon-svg" />
          </div>
        </div>

        {/* Header */}
        <div className="blocked-header">
          <span className="blocked-tag">
            <Lock size={12} /> RESTRICTED ACCESS
          </span>
          <h1 className="blocked-title">ACCESS BLOCKED BY ADMINISTRATOR</h1>
          <p className="blocked-subtitle">
            Your connection and session have been blocked from browsing or interacting with this website by the Super User (Manohar).
          </p>
        </div>

        {/* Reason Box */}
        <div className="blocked-reason-card">
          <div className="blocked-reason-label">
            <AlertTriangle size={15} /> Reason for Block:
          </div>
          <div className="blocked-reason-text">"{reason}"</div>
        </div>

        {/* Live Timer or Permanent Notice */}
        <div className="blocked-status-section">
          {isPermanent ? (
            <div className="blocked-permanent-notice">
              <span className="blocked-pill is-permanent">🚫 PERMANENT BAN ENFORCED</span>
              <p>
                This access restriction is indefinite. If you believe this action was made in error or wish to request reinstatement, contact Manohar directly.
              </p>
            </div>
          ) : (
            <div className="blocked-timer-notice">
              <span className="blocked-pill is-temp">
                <Clock size={13} /> TEMPORARY SUSPENSION ({durationType.toUpperCase()})
              </span>
              <div className="blocked-countdown-box">
                <span className="blocked-countdown-label">Access will be automatically restored in:</span>
                <span className="blocked-countdown-timer">{timeLeft || "Calculating..."}</span>
              </div>
              {isExpired && (
                <p className="blocked-expired-msg">
                  Block period completed. Click "Re-check Access" below to refresh.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Session Dossier Meta */}
        <div className="blocked-meta-grid">
          <div className="blocked-meta-item">
            <span className="meta-key">Session ID:</span>
            <span className="meta-val"><code>{sessionId}</code></span>
          </div>
          <div className="blocked-meta-item">
            <span className="meta-key">Enforced By:</span>
            <span className="meta-val">{blockData?.blocked_by || "Super User"}</span>
          </div>
          <div className="blocked-meta-item">
            <span className="meta-key">Blocked Since:</span>
            <span className="meta-val">
              {blockData?.created_at ? new Date(blockData.created_at).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="blocked-actions">
          <button
            type="button"
            className="blocked-btn blocked-btn-primary"
            onClick={handleManualRecheck}
            disabled={checking}
          >
            <RefreshCw size={15} className={checking ? "spin" : ""} />
            {checking ? "Checking Access Status..." : "Re-check Access"}
          </button>
        </div>
      </div>
    </div>
  );
}

