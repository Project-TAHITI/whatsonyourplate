import React from 'react';

export default function ThemeToggleButton({ mode, onToggle, color }) {
  return (
    <button
      onClick={onToggle}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        width: 40,
        height: 40,
        padding: 0,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
      }}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {/* Modern sun/moon toggle icon, rotates 360deg for smooth effect */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        width="28"
        height="28"
        fill="none"
        viewBox="0 0 24 24"
        style={{
          display: 'block',
          margin: 'auto',
          transform: mode === 'dark' ? 'rotate(360deg)' : 'rotate(0deg)',
          transition: 'transform 0.75s cubic-bezier(.4,2,.6,1)',
        }}
      >
        {/* Show sun (circle and rays) only in light mode */}
        {mode !== 'dark' && (
          <>
            <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
            <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
              <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
              <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
            </g>
          </>
        )}
        {/* Show moon only in dark mode */}
        {mode === 'dark' && (
          <path
            d="M21 12.79A9 9 0 0 1 11.21 3c0 .13 0 .26.01.39A7 7 0 1 0 20.61 12.8c.13.01.26.01.39.01Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
        )}
      </svg>
    </button>
  );
}
