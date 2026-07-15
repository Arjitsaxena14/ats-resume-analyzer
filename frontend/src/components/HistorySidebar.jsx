import React from 'react'
import { History, Trash2 } from 'lucide-react'

export default function HistorySidebar({ history, activeId, onSelect, onDelete }) {
  const getBadgeClass = (score) => {
    if (score >= 80) return 'badge-success'
    if (score >= 60) return 'badge-warning'
    return 'badge-danger'
  }

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return dateStr
    }
  }

  return (
    <aside className="sidebar">
      <div>
        <h2>
          <History size={18} color="var(--primary)" />
          <span>Scan History</span>
        </h2>
      </div>

      <div className="sidebar-scroll">
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No records. Upload a resume to initialize history.
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id} 
              className={`history-item ${activeId === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item)}
            >
              <div className="history-item-header">
                <span className="history-filename" title={item.filename}>
                  {item.filename}
                </span>
                <span className={`badge ${getBadgeClass(item.analysis?.ats_score || 0)}`}>
                  {item.analysis?.ats_score || 0}
                </span>
              </div>
              <div className="history-meta">
                <span>{formatDate(item.uploaded_at)}</span>
                <button 
                  className="btn-delete-small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item.id)
                  }}
                  title="Delete scan"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
