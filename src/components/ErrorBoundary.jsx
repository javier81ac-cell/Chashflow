import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error atrapado por ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          background: '#151515', border: '1px solid #2a1010', borderRadius: 10,
          padding: '24px 28px', color: '#ede9e1', fontFamily: "'Syne',sans-serif",
        }}>
          <div style={{ color: '#f05c5c', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
            Algo falló al mostrar esta sección
          </div>
          <div style={{ color: '#5a5a5a', fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
            {this.state.error.message || 'Error desconocido'}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8,
              color: '#ede9e1', padding: '8px 16px', fontSize: 13, cursor: 'pointer',
              fontFamily: "'Syne',sans-serif",
            }}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
