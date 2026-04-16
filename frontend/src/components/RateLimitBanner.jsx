import React, { useEffect, useState } from 'react';

/**
 * Rate Limit Overlay component.
 * Shown as a full-screen blur overlay when the API returns 429.
 * Props:
 *   retryAfter   – seconds until the rate limit resets
 *   onDismiss    – called when countdown reaches 0 or user clicks dismiss
 */
const RateLimitBanner = ({ retryAfter = 60, onDismiss }) => {
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfter, onDismiss]);

  return (
    <div className="rate-limit-overlay" role="dialog" aria-modal="true" aria-label="Rate limited">
      <div className="rate-limit-card">
        <span className="rate-limit-icon" aria-hidden="true">🚦</span>

        <h2 className="rate-limit-title">Slow Down!</h2>

        <p className="rate-limit-msg">
          You've sent too many requests in a short time.<br />
          Our servers are protecting themselves from overload.<br />
          Please wait and try again.
        </p>

        <div className="rate-limit-countdown" aria-live="polite">
          <span>⏱</span>
          <span>{countdown}s until you can try again</span>
        </div>

        {countdown === 0 && (
          <button
            className="btn btn-primary mt-2"
            style={{ marginTop: '1.5rem' }}
            onClick={onDismiss}
            id="rate-limit-dismiss-btn"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default RateLimitBanner;
