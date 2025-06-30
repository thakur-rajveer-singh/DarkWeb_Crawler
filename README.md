# Darkweb Crawler Fullstack Project

A full-stack application for searching, scraping, and previewing dark web (.onion) and clearnet sites. Built with a FastAPI backend and a Vite React frontend.

---

## Features
- **Search .onion links** via Ahmia search engine
- **VPN status check** before scraping .onion sites
- **Scrape and download** any site (including JS-rendered content, images, CSS, JS) for offline viewing as a ZIP (with screenshot)
- **Modern React UI** for interactive use
- **Tor proxy support** for .onion scraping
- **CORS enabled** for frontend-backend communication

---

## Project Structure
- `backend/` — FastAPI backend (Python)
- `frontend/` — Vite React frontend (JavaScript)

---

## Getting Started

### 1. Backend Setup (FastAPI)

1. Open a terminal in the `backend/` directory.
2. (Optional but recommended) Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .venv\Scripts\activate
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   pip install selenium webdriver-manager
   ```
4. Start the backend server:
   ```powershell
   uvicorn main:app --reload
   ```
5. The API will be available at `http://127.0.0.1:8000`

> **Note:** For .onion scraping, ensure Tor is running locally (default: `socks5://127.0.0.1:9050`).

### 2. Frontend Setup (Vite + React)

1. Open a terminal in the `frontend/` directory.
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the frontend dev server:
   ```powershell
   npm run dev
   ```
4. The app will be available at the URL shown in the terminal (usually `http://localhost:5173`)

---

## Usage
- Use the frontend UI to:
  - Search for .onion links
  - Check VPN status
  - Scrape and download any site for offline viewing
- The backend will handle crawling, scraping, and packaging content as a ZIP (with screenshot).

---

## API Endpoints
- `GET /search?query=...` — Search for .onion links
- `POST /vpn-check` — Check VPN status (body: `{ "expected_ip": "..." }`)
- `POST /scrape-offline-selenium` — Scrape a site for offline viewing (body: `{ "url": "..." }`)

---

## Troubleshooting
- **Tor not running:** Ensure Tor is running and listening on port 9050 for .onion scraping.
- **VPN check fails:** Double-check your expected IP and VPN connection.
- **Selenium/Chrome errors:** Make sure Chrome is installed and compatible with `webdriver-manager`.
- **CORS issues:** The backend enables CORS for all origins by default.

---

## Contributing
Pull requests and suggestions are welcome! Please open an issue or PR.

## License
MIT License

---

For any issues, check this README or ask for help!
