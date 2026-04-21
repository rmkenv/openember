import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  componentDidCatch(e, info) { console.error('EMBER crash:', e, info) }
  render() {
    if (this.state.error) return (
      <div style={{ background:'#07090d', color:'#f87171', fontFamily:'monospace', padding:40, minHeight:'100vh', whiteSpace:'pre-wrap' }}>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>🚨 EMBER — Runtime Error</div>
        <div style={{ color:'#facc15', marginBottom:8 }}>{String(this.state.error)}</div>
        <div style={{ color:'#334', fontSize:11 }}>{this.state.error?.stack}</div>
        <button onClick={() => window.location.reload()} style={{ marginTop:24, padding:'8px 20px', background:'#e8372c', color:'#fff', border:'none', borderRadius:4, fontFamily:'monospace', fontWeight:700, cursor:'pointer' }}>Reload</button>
      </div>
    )
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary><App /></ErrorBoundary>
)
