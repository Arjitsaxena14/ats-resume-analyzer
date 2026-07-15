# 🚀 AI Resume Analyzer

An evidence-based, premium-quality Full-Stack ATS (Applicant Tracking System) Resume Analyzer. Built like a modern, professional SaaS product with a dark-mode glassmorphic dashboard, interactive data analytics, and strict recruiter evaluation metrics powered by the **Google Gemini API**.

---

## 🎨 Key Features

- **Linear-inspired Premium Design**: Modern dark mode, glassmorphism panels, glowing indicator borders, and custom background mesh gradients.
- **Dynamic Loading Workflow**: A step-by-step parsing loading progress system simulating real recruiter scanning stages.
- **Evidence-Based Evaluation Metric**: Strict 6-metric scoring rubric:
  1. *ATS Formatting (15% weight)* — Headings, fonts, layouts.
  2. *Resume Structure (15% weight)* — Standard section presence.
  3. *Keyword Match (25% weight)* — Exact keyword matching against target job description.
  4. *Skills Match (20% weight)* — Explicit technical/soft skills check (no inferences).
  5. *Experience & Projects (15% weight)* — Outcome complexity and quantifiable metrics.
  6. *Writing Quality (10% weight)* — Readability, grammar, conciseness.
- **Interactive Analytics Panels**: Circular progress gauges, **Radar Charts** (overall category scores), **Pie Charts** (evaluation weight distribution), and **Bar Charts** (section-wise rating).
- **OWASP-Hardened Security**:
  - Thread-safe IP-based **Rate Limiting** (graceful `429 Too Many Requests` JSON response).
  - Strict input schemas, media validation, size caps (10MB max upload), and HTML stripping (XSS prevention).
  - Parameterized SQLite query drivers avoiding SQL Injections.

---

## 📂 Project Architecture

```text
├── backend/
│   ├── app.py             # Flask API server & Rate Limiting logic
│   ├── ai_analyzer.py     # Gemini AI evaluator & Mock fallbacks
│   ├── resume_parser.py   # PDF and DOCX text extractors
│   ├── database.py        # Parameterized SQLite model queries
│   ├── .env.example       # Environment placeholder instructions
│   └── requirements.txt   # Backend dependency modules
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MainDashboard.jsx     # Recharts visual panels
│   │   │   ├── HistorySidebar.jsx    # Scanning history controller
│   │   │   └── ResumeUploadZone.jsx  # Drag-and-drop upload logic
│   │   ├── App.jsx                   # Global layouts & states
│   │   └── index.css                 # Premium custom design CSS variables
│   ├── package.json
│   └── vite.config.js     # React dev configuration and CORS proxy
└── .gitignore             # Safe credential and temporary cache ignore definitions
```

---

## 🛠️ Local Setup & Configuration

### Prerequisites
- Node.js (v18+)
- Python (3.9+)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the `.env.example` file to create your own configuration:
   ```bash
   copy .env.example .env
   ```
5. Edit `backend/.env` and paste your Gemini API Key:
   ```text
   GEMINI_API_KEY=your_actual_gemini_key_here
   ```
6. Start the Flask API:
   ```bash
   python app.py
   ```
   *(Running locally on `http://127.0.0.1:5000`)*

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *(Running locally on `http://localhost:5173`)*

---

## 🔒 Security Specifications
This application enforces strict rate-limits to protect against brute-force/Dos vectors:
- **Analyze Route (`/api/analyze`)**: Max 5 requests per minute.
- **Read/Delete History (`/api/history`)**: Max 30 requests per minute.
- Returns a clean JSON payload on violation:
  ```json
  {
    "error": "Too Many Requests",
    "message": "Rate limit exceeded. Maximum 5 requests per 60 seconds."
  }
  ```
