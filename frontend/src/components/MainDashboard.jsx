import React, { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Award, FileText, Check, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'

export default function MainDashboard({ activeRecord }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [animatedAtsScore, setAnimatedAtsScore] = useState(0)
  
  const analysis = activeRecord?.analysis
  const score = analysis?.overall_score || 0
  const atsScore = analysis?.ats_score || 0
  const decision = analysis?.recruiter_decision || 'N/A'

  useEffect(() => {
    setAnimatedScore(0)
    setAnimatedAtsScore(0)
    const timeout = setTimeout(() => {
      setAnimatedScore(score)
      setAnimatedAtsScore(atsScore)
    }, 100)
    return () => clearTimeout(timeout)
  }, [score, atsScore, activeRecord])

  if (!activeRecord) {
    return (
      <div className="glass-card no-data-card">
        <div className="no-data-icon">🚀</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Ready to Analyze</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px' }}>
          Upload your resume above to calculate its ATS score, check for missing keywords, and get comprehensive improvement suggestions.
        </p>
      </div>
    )
  }

  const radius = 52
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference
  const strokeDashoffsetAts = circumference - (animatedAtsScore / 100) * circumference

  const getScoreColor = (val) => {
    if (val >= 80) return 'var(--success)'
    if (val >= 60) return 'var(--warning)'
    return 'var(--danger)'
  }

  const getScoreClass = (val) => {
    if (val >= 80) return 'badge-success'
    if (val >= 60) return 'badge-warning'
    return 'badge-danger'
  }

  const getDecisionClass = (dec) => {
    if (dec === 'Shortlist') return 'badge-success'
    if (dec === 'Maybe') return 'badge-warning'
    return 'badge-danger'
  }

  // Core metrics array for progress rendering
  const metrics = [
    { label: 'ATS Formatting (15%)', val: analysis?.formatting_score || 0 },
    { label: 'Resume Structure (15%)', val: analysis?.structure_score || 0 },
    { label: 'Keyword Match (25%)', val: analysis?.keyword_match || 0 },
    { label: 'Skills Match (20%)', val: analysis?.skills_match || 0 },
    { label: 'Projects & Experience (15%)', val: analysis?.project_score || 0 },
    { label: 'Writing Quality (10%)', val: analysis?.writing_score || 0 }
  ]

  // Charts mapping
  const radarData = metrics.map(m => ({
    subject: m.label.split(' (')[0],
    Score: m.val,
    fullMark: 100
  }))

  const pieData = [
    { name: 'Formatting', value: 15, color: '#4F46E5' },
    { name: 'Structure', value: 15, color: '#06B6D4' },
    { name: 'Keywords', value: 25, color: '#8B5CF6' },
    { name: 'Skills', value: 20, color: '#3B82F6' },
    { name: 'Projects', value: 15, color: '#EC4899' },
    { name: 'Writing', value: 10, color: '#10B981' }
  ]

  return (
    <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
      {/* Score Header Card */}
      <div className="glass-card score-header-card" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        <div className="score-gauge">
          <svg>
            <circle className="bg-circle" cx="70" cy="70" r={radius} />
            <circle 
              className="progress-circle" 
              cx="70" 
              cy="70" 
              r={radius} 
              stroke={getScoreColor(score)}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="score-text">
            <span>{animatedScore}</span>
            <span className="score-text-label">Overall</span>
          </div>
        </div>

        <div className="score-gauge">
          <svg>
            <circle className="bg-circle" cx="70" cy="70" r={radius} />
            <circle 
              className="progress-circle" 
              cx="70" 
              cy="70" 
              r={radius} 
              stroke={getScoreColor(atsScore)}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffsetAts}
            />
          </svg>
          <div className="score-text">
            <span>{animatedAtsScore}</span>
            <span className="score-text-label">ATS Score</span>
          </div>
        </div>
        
        <div className="score-summary-details" style={{ flexGrow: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span className={`badge ${getDecisionClass(decision)}`}>Recruiter Decision: {decision}</span>
          </div>
          <h2 style={{ color: 'var(--text-main)', marginTop: '8px' }}>{activeRecord.filename}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>{analysis?.summary}</p>
        </div>
      </div>

      {/* Main Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Strengths & Weaknesses Split Card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="glass-card" style={{ borderColor: 'rgba(34, 197, 94, 0.15)' }}>
            <h3 className="card-title" style={{ color: 'var(--success)', fontSize: '1rem' }}>
              <CheckCircle2 size={16} /> Resume Strengths
            </h3>
            {analysis?.strengths && analysis.strengths.length > 0 ? (
              <ul className="bullet-list" style={{ marginTop: '10px' }}>
                {analysis.strengths.map((str, idx) => (
                  <li key={idx} style={{ fontSize: '0.88rem' }}>{str}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '10px' }}>No explicit strengths highlighted.</p>
            )}
          </div>

          <div className="glass-card" style={{ borderColor: 'rgba(239, 68, 68, 0.15)' }}>
            <h3 className="card-title" style={{ color: 'var(--danger)', fontSize: '1rem' }}>
              <XCircle size={16} /> Resume Weaknesses
            </h3>
            {analysis?.weaknesses && analysis.weaknesses.length > 0 ? (
              <ul className="bullet-list" style={{ marginTop: '10px' }}>
                {analysis.weaknesses.map((weak, idx) => (
                  <li key={idx} style={{ fontSize: '0.88rem' }}>{weak}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--success)', fontSize: '0.88rem', marginTop: '10px' }}>✓ No critical weaknesses detected!</p>
            )}
          </div>
        </div>

        {/* Radar & Pie Visual Analytics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Radar Chart */}
          <div className="glass-card">
            <h3 className="card-title" style={{ fontSize: '1rem' }}><Award size={16} color="var(--primary)" /> Profile Alignment</h3>
            <div style={{ height: '240px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-dim)', fontSize: 9 }} />
                  <Radar name="Candidate" dataKey="Score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart representing ATS Weight */}
          <div className="glass-card">
            <h3 className="card-title" style={{ fontSize: '1rem' }}><FileText size={16} color="var(--accent)" /> Weight Distribution</h3>
            <div style={{ height: '240px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px', color: 'var(--text-muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ATS Core Matrix Progress Scores */}
        <div className="glass-card">
          <h3 className="card-title" style={{ fontSize: '1.05rem' }}>🛡️ Evaluation Breakdown Matrix</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
            Core scoring metrics as defined by strict industry guidelines:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {metrics.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-main)' }}>{m.label}</span>
                  <span className={`badge ${getScoreClass(m.val)}`}>{m.val} %</span>
                </div>
                {/* Progress bar */}
                <div className="progress-track">
                  <div 
                    className="progress-bar"
                    style={{ 
                      width: `${m.val}%`, 
                      background: `linear-gradient(90deg, var(--primary) 0%, ${getScoreColor(m.val)} 100%)`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Matching & Missing Keywords lists (JD compare) */}
        {(analysis?.missing_keywords && analysis.missing_keywords.length > 0) && (
          <div className="glass-card" style={{ borderColor: 'var(--border-color-glow)' }}>
            <h3 className="card-title" style={{ color: 'var(--accent)' }}>
              <TrendingUp size={18} /> Keyword Matches & Gaps
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--danger)', marginBottom: '8px', fontWeight: 600 }}>✕ Missing Keywords</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysis.missing_keywords.map((kw, idx) => (
                    <span key={idx} className="badge badge-danger" style={{ fontSize: '0.72rem' }}>{kw}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 600 }}>Missing Required Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {analysis.missing_skills && analysis.missing_skills.map((sk, idx) => (
                    <span key={idx} className="skill-tag" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>{sk}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="glass-card">
          <h3 className="card-title" style={{ fontSize: '1.05rem' }}><Sparkles size={16} color="var(--primary)" /> Actionable Recommendations</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '12px' }}>
            Follow these recommendations to optimize readability and increase impact:
          </p>
          {analysis?.recommendations && analysis.recommendations.length > 0 ? (
            <ul className="bullet-list">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: '12px', color: 'var(--success)', fontWeight: 500, fontSize: '0.88rem' }}>
              ✓ Your resume meets high-quality standards. No basic recommendations needed!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
