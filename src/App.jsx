import React, { useState, useEffect } from 'react';
import { fetchSheetData } from './utils/sheets';
import SummaryCards from './components/SummaryCards';
import ActivityTable from './components/ActivityTable';
import EarningsChart from './components/EarningsChart';
import { RefreshCw, Search } from 'lucide-react';
import './index.css';

const MONTHS = ['JANUARI 2026', 'FEBRUARI 2026', 'MARET 2026', 'APRIL 2026', 'MEI 2026', 'JUNI 2026', 'JULI 2026', 'AGUSTUS 2026', 'SEPTEMBER 2026', 'OKTOBER 2026', 'NOVEMBER 2026', 'DESEMBER 2026'];

function App() {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetugas, setSelectedPetugas] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (month) => {
    setLoading(true);
    try {
      const parsedData = await fetchSheetData(month);
      setData(parsedData);

      if (selectedPetugas) {
        const stillExists = parsedData.find(p => p.nama === selectedPetugas.nama);
        if (stillExists) {
          setSelectedPetugas(stillExists);
        } else {
          setSelectedPetugas(parsedData.length > 0 ? parsedData[0] : null);
        }
      } else {
        setSelectedPetugas(parsedData.length > 0 ? parsedData[0] : null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMonth);
  }, [selectedMonth]);

  const handleRefresh = () => {
    loadData(selectedMonth);
  };

  const filteredPetugas = data.filter(p =>
    p.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M21 3L13 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 8V3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard Produksi
        </h1>

        <div className="header-controls">
          <select
            className="select-modern"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <button className="btn-refresh" onClick={handleRefresh} disabled={loading} title="Refresh Data">
            <RefreshCw size={16} className={loading ? "spinner-icon" : ""} />
            <span className="text">{loading ? 'Memuat...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Split */}
      <div className="main-wrapper">
        {/* Sidebar / Petugas List */}
        <aside className="sidebar">
          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Cari Petugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="petugas-list">
            {loading ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat...</div>
            ) : filteredPetugas.length > 0 ? (
              filteredPetugas.map((petugas, index) => (
                <div
                  key={index}
                  className={`petugas-item ${selectedPetugas?.nama === petugas.nama ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPetugas(petugas);
                    // On mobile, if they click a user, we could theoretically scroll down smoothly to dashboard area
                    if (window.innerWidth <= 900) {
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }
                  }}
                >
                  <div>
                    <h3>{petugas.nama}</h3>
                    <p>{petugas.activities.length} Kegiatan</p>
                  </div>
                  {/* Subtle arrow to indicate selection */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: selectedPetugas?.nama === petugas.nama ? 1 : 0 }}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Petugas tidak ditemukan.
              </div>
            )}
          </div>
        </aside>

        {/* Dashboard Area */}
        <main className="dashboard-area">
          {loading ? (
            <div className="loading-screen">
              <div className="spinner"></div>
              <p>Sedang Mengambil Data...</p>
            </div>
          ) : selectedPetugas ? (
            <>
              <div className="dashboard-header">
                <h2>{selectedPetugas.nama}</h2>
                <p>Rincian performa dan honorarium bulan {selectedMonth}</p>
              </div>

              <SummaryCards
                totalHonor={selectedPetugas.totalHonor}
                totalKegiatan={selectedPetugas.activities.length}
                status={selectedPetugas.status}
              />

              <div className="content-grid">
                <ActivityTable activities={selectedPetugas.activities} />
                <EarningsChart activities={selectedPetugas.activities} />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <p>Silakan pilih Petugas dari daftar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
