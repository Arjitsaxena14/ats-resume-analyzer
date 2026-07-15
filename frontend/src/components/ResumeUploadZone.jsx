import React, { useState, useRef } from 'react'
import { UploadCloud } from 'lucide-react'

export default function ResumeUploadZone({ jobDescription, onUploadStart, onUploadSuccess, onUploadError }) {
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const uploadFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'pdf' && ext !== 'docx') {
      onUploadError('Unsupported file type. Please upload a PDF or DOCX file.')
      return
    }

    setFileName(file.name)
    setLoading(true)
    onUploadStart()

    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_description', jobDescription || '')

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (response.ok) {
        onUploadSuccess(data)
      } else {
        onUploadError(data.error || 'Failed to analyze resume.')
      }
    } catch (err) {
      onUploadError('Connection to server failed. Please check if Flask server is running.')
    } finally {
      setLoading(false)
      setFileName('')
    }
  }

  return (
    <div className="glass-card">
      <div 
        className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        style={{ pointerEvents: loading ? 'none' : 'auto' }}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          style={{ display: 'none' }} 
          accept=".pdf,.docx" 
          onChange={handleFileChange}
          disabled={loading}
        />
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-main)' }}>Uploading {fileName}...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Transmitting file to recruiter analytics database...</p>
          </div>
        ) : (
          <>
            <UploadCloud size={48} color="var(--accent)" className="upload-icon" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Drag & Drop your resume here
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Supports PDF and DOCX formats (Max 16MB)
            </p>
            <button type="button" className="btn btn-secondary" style={{ marginTop: '8px' }}>
              Select Document
            </button>
          </>
        )}
      </div>
    </div>
  )
}
