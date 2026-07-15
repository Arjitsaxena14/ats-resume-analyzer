import React, { useState, useEffect } from 'react'
import ResumeUploadZone from './components/ResumeUploadZone'
import HistorySidebar from './components/HistorySidebar'
import MainDashboard from './components/MainDashboard'
import { Sparkles, FileText, ArrowRight } from 'lucide-react'

const LOADING_STEPS = [
  "Reading Resume...",
  "Extracting Content...",
  "Analyzing Skills...",
  "Checking ATS Compatibility...",
  "Comparing Keywords...",
  "Generating Suggestions..."
]

export default function App() {
  const [history, setHistory] = useState([])
  const [activeRecord, setActiveRecord] = useState(null)
  const [error, setError] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  
  // Loading state machine
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
        if (data.length > 0 && !activeRecord) {
          setActiveRecord(data[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    }
  }

  // Timer simulation for loading steps
  useEffect(() => {
    let interval = null
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => {
          if (prev >= LOADING_STEPS.length - 1) {
            clearInterval(interval)
            return prev
          }
          return prev + 1
        })
      }, 700)
    } else {
      setLoadingStep(0)
    }
    return () => clearInterval(interval)
  }, [loading])

  const handleUploadStart = () => {
    setError(null)
    setLoading(true)
    setLoadingStep(0)
  }

  const handleUploadSuccess = (data) => {
    const delay = (LOADING_STEPS.length - loadingStep) * 700 + 300
    setTimeout(() => {
      const newRecord = {
        id: data.id,
        filename: data.filename,
        uploaded_at: new Date().toISOString(),
        analysis: data.analysis
      }
      setHistory(prev => [newRecord, ...prev])
      setActiveRecord(newRecord)
      setLoading(false)
      setError(null)
    }, delay)
  }

  const handleUploadError = (errMessage) => {
    setLoading(false)
    setError(errMessage)
  }

  const handleDeleteRecord = async (id) => {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== id))
        if (activeRecord && activeRecord.id === id) {
          setActiveRecord(null)
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete record.')
      }
    } catch (err) {
      setError('Connection error during deletion.')
    }
  }

  const handleTryDemo = async () => {
    handleUploadStart()
    try {
      // We load the dummy_resume.docx file created earlier at the project root
      const docResponse = await fetch('/dummy_resume.docx')
      if (!docResponse.ok) {
        throw new Error('Demo file dummy_resume.docx was not found in static folder.')
      }
      const blob = await docResponse.blob()
      
      const formData = new FormData()
      formData.append('file', blob, 'dummy_resume.docx')
      formData.append('job_description', 'Looking for a Senior Python Developer. Must have experience with Flask, SQL database, Git, Docker containerization, AWS Cloud services. JavaScript/React is a plus.')
      
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      })
      const data = await analyzeResponse.json()
      if (analyzeResponse.ok) {
        handleUploadSuccess(data)
      } else {
        handleUploadError(data.error || 'Failed to load demo.')
      }
    } catch (err) {
      handleUploadError('Failed to initialize demo files. Please upload a PDF or DOCX manually.')
    }
  }

  const scrollToUpload = () => {
    document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <Sparkles size={20} color="var(--accent)" />
          <span>ResumeAI</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status: Active</span>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={handleTryDemo}>
            Try Demo
          </button>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="app-layout">
        {/* Sidebar */}
        <HistorySidebar 
          history={history}
          activeId={activeRecord?.id}
          onSelect={setActiveRecord}
          onDelete={handleDeleteRecord}
        />

        <main className="main-content">
          {/* Landing/Hero Section */}
          {!activeRecord && !loading && (
            <div className="hero-container">
              <span className="hero-badge">FUTURISTIC ATS EVALUATION ENGINE</span>
              <h1 className="hero-title">Analyze Your Resume Like a Top Recruiter</h1>
              <p className="hero-subtitle">
                Deploying state-of-the-art recruiter models to parse headings, extract keywords, check soft skills, and optimize alignment.
              </p>
              <div className="hero-actions">
                <button className="btn" onClick={scrollToUpload}>
                  Upload Resume <ArrowRight size={16} />
                </button>
                <button className="btn btn-secondary" onClick={handleTryDemo}>
                  Load Live Demo
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="stats-grid">
                <div className="stat-card glass-card">
                  <div className="stat-number">50k+</div>
                  <div className="stat-label">Resumes Analyzed</div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-number">92%</div>
                  <div className="stat-label">User Satisfaction</div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-number">95%</div>
                  <div className="stat-label">ATS Accuracy</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Screen */}
          {loading && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px', maxWidth: '600px', margin: '40px auto' }}>
              <div className="spinner" style={{ margin: '0 auto 24px auto' }}></div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                Analyzing Profile Structure
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
                Wait while the recruiter networks parse and align data points...
              </p>
              
              <div className="loading-steps">
                {LOADING_STEPS.map((step, idx) => {
                  let stepClass = ""
                  if (loadingStep > idx) stepClass = "done"
                  else if (loadingStep === idx) stepClass = "active"
                  
                  return (
                    <div key={idx} className={`loading-step-item ${stepClass}`}>
                      <div className="loading-step-indicator">
                        {loadingStep > idx ? "✓" : idx + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="glass-card" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.04)', color: '#fca5a5', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span> {error}
                </span>
                <button 
                  onClick={() => setError(null)} 
                  style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1.1rem' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Upload Section */}
          {!loading && (
            <div id="upload-section">
              {/* Job Description Text Area */}
              <div className="glass-card" style={{ marginBottom: '24px' }}>
                <h3 className="card-title" style={{ color: 'var(--text-main)' }}>
                  <FileText size={18} color="var(--primary)" /> Job Description (Optional)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '12px' }}>
                  Paste job requirements below to unlock target match-score, keyword overlays, and required adjustments.
                </p>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste target job specification details here..."
                  style={{
                    width: '100%',
                    height: '100px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>

              <ResumeUploadZone 
                jobDescription={jobDescription}
                onUploadStart={handleUploadStart}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            </div>
          )}

          {/* Result Dashboard */}
          {!loading && <MainDashboard activeRecord={activeRecord} />}
        </main>
      </div>
    </div>
  )
}
