import React, { createContext, useContext, useEffect, useState } from 'react'
import websocketService from '../services/websocket'

interface WebSocketContextType {
  isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let mounted = true

    // Connect to WebSocket service only if not already connected
    if (!websocketService.isConnected()) {
      websocketService.connect()
    }

    // Subscribe to connection status changes
    const checkConnection = setInterval(() => {
      if (mounted) {
        setIsConnected(websocketService.isConnected())
      }
    }, 1000)

    return () => {
      mounted = false
      clearInterval(checkConnection)
      // Don't disconnect on unmount in dev mode (React strict mode double-mounting)
      // The service will handle reconnection automatically
    }
  }, [])

  return (
    <WebSocketContext.Provider value={{ isConnected }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}
