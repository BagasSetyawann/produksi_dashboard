import React from 'react';
import { formatIDR } from '../utils/format';

const SummaryCards = ({ totalHonor, totalKegiatan }) => {
  const LIMIT = 3108000;
  const diff = totalHonor - LIMIT;
  const isAman = diff <= 0;

  let statusText = '';
  if (diff > 0) {
    statusText = `Kelebihan ${formatIDR(diff)}`;
  } else if (diff < 0) {
    statusText = `Terpakai ${formatIDR(Math.abs(diff))}`;
  } else {
    statusText = `PAS (Rp 0)`;
  }

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
        <h3 className="card-title">Batas Honorarium per Bulan (3.108.000)</h3>
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
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
