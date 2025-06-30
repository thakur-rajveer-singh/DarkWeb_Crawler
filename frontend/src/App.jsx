import { useState } from 'react';
import './App.css';

const BACKEND_URL = 'http://localhost:8000';

function App() {
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // State for VPN check
  const [expectedIp, setExpectedIp] = useState('');
  const [vpnStatus, setVpnStatus] = useState(null);
  const [vpnLoading, setVpnLoading] = useState(false);
  const [vpnError, setVpnError] = useState('');

  // State for scraping
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [scrapeSuccess, setScrapeSuccess] = useState('');

  // Search .onion links
  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const res = await fetch(`${BACKEND_URL}/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.links) setSearchResults(data.links);
      else setSearchError(data.error || 'No results');
    } catch (err) {
      setSearchError('Failed to fetch results');
    }
    setSearchLoading(false);
  };

  // VPN check
  const handleVpnCheck = async (e) => {
    e.preventDefault();
    setVpnLoading(true);
    setVpnError('');
    setVpnStatus(null);
    try {
      const res = await fetch(`${BACKEND_URL}/vpn-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expected_ip: expectedIp })
      });
      const data = await res.json();
      setVpnStatus(data);
      if (data.error) setVpnError(data.error);
    } catch (err) {
      setVpnError('Failed to check VPN');
    }
    setVpnLoading(false);
  };

  // Scrape for offline viewing
  const handleScrape = async (e) => {
    e.preventDefault();
    setScrapeLoading(true);
    setScrapeError('');
    setScrapeSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/scrape-offline-selenium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      });
      if (!res.ok) throw new Error('Scrape failed');
      const blob = await res.blob();
      // Download the ZIP
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'offline_site.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setScrapeSuccess('Download started!');
    } catch (err) {
      setScrapeError('Failed to scrape or download.');
    }
    setScrapeLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: 800, margin: '0 auto', padding: 32, fontFamily: 'Segoe UI, Arial, sans-serif', background: '#181c24', color: '#f3f3f3', borderRadius: 16, boxShadow: '0 4px 32px #0002' }}>
      <header style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: 1, color: '#7ee787', marginBottom: 8 }}>Darkweb Crawler</h1>
        <p style={{ color: '#b3b3b3', fontSize: 18 }}>Search, check VPN, and scrape .onion or clearnet sites for offline viewing.</p>
      </header>

      {/* VPN Check */}
      <section style={{ marginBottom: 40, background: '#23283a', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
        <h2 style={{ color: '#7ee787', fontSize: 22 }}>VPN Status</h2>
        <form onSubmit={handleVpnCheck} style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <input
            type="text"
            placeholder="Expected VPN IP (e.g. 1.2.3.4)"
            value={expectedIp}
            onChange={e => setExpectedIp(e.target.value)}
            required
            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#222', color: '#fff' }}
          />
          <button type="submit" disabled={vpnLoading} style={{ padding: '8px 18px', borderRadius: 6, background: '#7ee787', color: '#222', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Check VPN</button>
        </form>
        {vpnLoading && <p style={{ color: '#b3b3b3', marginTop: 8 }}>Checking VPN...</p>}
        {vpnStatus && (
          <div style={{ marginTop: 10, fontSize: 16 }}>
            <span>Current IP: <b style={{ color: '#58a6ff' }}>{vpnStatus.current_ip}</b></span><br />
            <span>VPN OK: <b style={{ color: vpnStatus.vpn_ok ? '#7ee787' : '#ff6b6b' }}>{vpnStatus.vpn_ok ? 'Yes' : 'No'}</b></span>
          </div>
        )}
        {vpnError && <p style={{ color: '#ff6b6b', marginTop: 8 }}>{vpnError}</p>}
      </section>

      {/* Onion Search */}
      <section style={{ marginBottom: 40, background: '#23283a', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
        <h2 style={{ color: '#7ee787', fontSize: 22 }}>Search .onion Links</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <input
            type="text"
            placeholder="Search query (e.g. forum drugs)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            required
            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#222', color: '#fff' }}
          />
          <button type="submit" disabled={searchLoading} style={{ padding: '8px 18px', borderRadius: 6, background: '#7ee787', color: '#222', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Search</button>
        </form>
        {searchLoading && <p style={{ color: '#b3b3b3', marginTop: 8 }}>Searching...</p>}
        {searchError && <p style={{ color: '#ff6b6b', marginTop: 8 }}>{searchError}</p>}
        {searchResults.length > 0 && (
          <ul style={{ marginTop: 16, paddingLeft: 20 }}>
            {searchResults.map(link => (
              <li key={link} style={{ marginBottom: 6, fontSize: 16, background: '#181c24', padding: '6px 10px', borderRadius: 6, wordBreak: 'break-all' }}>
                <code>{link}</code>
                <button style={{ marginLeft: 12, fontSize: 13, background: '#23283a', color: '#7ee787', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '2px 8px' }} onClick={() => navigator.clipboard.writeText(link)}>Copy</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Scrape for Offline Viewing */}
      <section style={{ marginBottom: 40, background: '#23283a', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
        <h2 style={{ color: '#7ee787', fontSize: 22 }}>Scrape Site for Offline Viewing</h2>
        <form onSubmit={handleScrape} style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <input
            type="text"
            placeholder="Full URL (http/https/onion)"
            value={scrapeUrl}
            onChange={e => setScrapeUrl(e.target.value)}
            required
            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #333', background: '#222', color: '#fff' }}
          />
          <button type="submit" disabled={scrapeLoading} style={{ padding: '8px 18px', borderRadius: 6, background: '#7ee787', color: '#222', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Scrape & Download ZIP</button>
        </form>
        {scrapeLoading && <p style={{ color: '#b3b3b3', marginTop: 8 }}>Scraping and packaging site...</p>}
        {scrapeSuccess && <p style={{ color: '#7ee787', marginTop: 8 }}>{scrapeSuccess}</p>}
        {scrapeError && <p style={{ color: '#ff6b6b', marginTop: 8 }}>{scrapeError}</p>}
      </section>

      <footer style={{ fontSize: 14, color: '#b3b3b3', marginTop: 40, textAlign: 'center' }}>
        <p>Backend must be running at <code style={{ color: '#7ee787' }}>{BACKEND_URL}</code>.<br />
        For .onion scraping, ensure Tor is running and VPN is active.<br />
        <span style={{ color: '#444' }}>© {new Date().getFullYear()} Darkweb Crawler</span></p>
      </footer>
    </div>
  );
}

export default App;
