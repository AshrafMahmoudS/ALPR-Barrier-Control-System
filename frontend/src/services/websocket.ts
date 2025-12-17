import toast from 'react-hot-toast'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'

export type WebSocketMessage = {
  type: 'event' | 'session' | 'system' | 'stats'
  data: any
}

export type WebSocketCallback = (message: WebSocketMessage) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private callbacks: Set<WebSocketCallback> = new Set()
  private reconnectInterval: number = 5000
  private reconnectTimer: NodeJS.Timeout | null = null
  private isIntentionallyClosed: boolean = false

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    try {
      this.ws = new WebSocket(WS_URL)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.isIntentionallyClosed = false
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.callbacks.forEach((callback) => callback(message))

          // Handle specific message types
          if (message.type === 'event') {
            this.handleEventMessage(message.data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.ws = null

        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed) {
          this.reconnect()
        }
      }
    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.reconnectTimer || this.isIntentionallyClosed) {
      return
    }

    console.log(`Attempting to reconnect in ${this.reconnectInterval / 1000}s...`)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.reconnectInterval)
  }

  disconnect() {
    this.isIntentionallyClosed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  subscribe(callback: WebSocketCallback) {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
    }
  }

  private handleEventMessage(data: any) {
    // Show toast notifications for important events
    switch (data.event_type) {
      case 'entry':
        toast.success(`Vehicle entered: ${data.license_plate}`, {
          icon: '🚗',
          duration: 3000,
        })
        break
      case 'exit':
        toast.success(`Vehicle exited: ${data.license_plate}`, {
          icon: '🚙',
          duration: 3000,
        })
        break
      case 'denied':
        toast.error(`Access denied: ${data.license_plate}`, {
          icon: '🚫',
          duration: 5000,
        })
        break
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const websocketService = new WebSocketService()
export default websocketService
