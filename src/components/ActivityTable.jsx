import React from 'react';
import { formatIDR } from '../utils/format';

const ActivityTable = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="table-container" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Tidak ada aktivitas yang tercatat untuk bulan ini.
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Rincian Kegiatan</h2>
      </div>
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Nama Kegiatan</th>
              <th style={{ textAlign: 'right' }}>Volume</th>
              <th style={{ textAlign: 'right' }}>Honor per Kegiatan</th>
              <th style={{ textAlign: 'right' }}>Subtotal Honor</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act, index) => (
              <tr key={index}>
                <td>{act.name}</td>
                <td className="numeric" style={{ textAlign: 'right' }}>{act.volume}</td>
                <td className="numeric" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatIDR(act.honorPerActivity)}</td>
                <td className="numeric" style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>{formatIDR(act.nominal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityTable;
