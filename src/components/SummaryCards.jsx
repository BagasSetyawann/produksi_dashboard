import React from 'react';
import { formatIDR } from '../utils/format';

const SummaryCards = ({ totalHonor, totalKegiatan, status }) => {
  const isAman = status.toUpperCase() === 'AMAN';

  return (
    <div className="summary-grid">
      <div className="card">
        <h3 className="card-title">Total Honorarium</h3>
        <div className="card-value" style={{ color: 'var(--primary)' }}>
          {formatIDR(totalHonor)}
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title">Total Kegiatan</h3>
        <div className="card-value">{totalKegiatan}</div>
      </div>
      
      <div className="card" style={{ borderLeft: `4px solid ${isAman ? 'var(--success)' : 'var(--danger)'}` }}>
        <h3 className="card-title">Status Kontrak</h3>
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <span className={`badge ${isAman ? 'success' : 'danger'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              {isAman ? (
                <polyline points="20 6 9 17 4 12"></polyline>
              ) : (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              )}
            </svg>
            {status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
