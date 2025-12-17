"""
WebSocket server for real-time event streaming.
"""
import asyncio
import json
import logging
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis

from core.config import settings

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and broadcasts."""

    def __init__(self):
        """Initialize connection manager."""
        self.active_connections: Set[WebSocket] = set()
        self.redis_client: aioredis.Redis = None
        self.pubsub_task = None

    async def connect(self, websocket: WebSocket):
        """
        Accept and register a new WebSocket connection.

        Args:
            websocket: WebSocket connection to register
        """
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """
        Remove a WebSocket connection.

        Args:
            websocket: WebSocket connection to remove
        """
        self.active_connections.discard(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """
        Send message to a specific client.

        Args:
            message: Message dictionary to send
            websocket: Target WebSocket connection
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def broadcast(self, message: dict):
        """
        Broadcast message to all connected clients.

        Args:
            message: Message dictionary to broadcast
        """
        if not self.active_connections:
            return

        # Create list of tasks for concurrent sending
        tasks = []
        disconnected = set()

        for connection in self.active_connections:
            try:
                tasks.append(connection.send_json(message))
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.add(connection)

        # Remove disconnected clients
        for conn in disconnected:
            self.active_connections.discard(conn)

        # Send messages concurrently
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def initialize_redis(self):
        """Initialize Redis connection for pub/sub."""
        try:
            self.redis_client = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("Redis client initialized for WebSocket")

            # Start Redis subscription task
            self.pubsub_task = asyncio.create_task(self.subscribe_to_redis())

        except Exception as e:
            logger.error(f"Failed to initialize Redis for WebSocket: {e}")

    async def subscribe_to_redis(self):
        """Subscribe to Redis channels for real-time updates."""
        try:
            pubsub = self.redis_client.pubsub()
            await pubsub.subscribe(
                'events',
                'occupancy',
                'camera_status',
                'barrier_status',
                'system_alerts'
            )

            logger.info("Subscribed to Redis channels")

            async for message in pubsub.listen():
                if message['type'] == 'message':
                    try:
                        # Parse and broadcast message
                        data = json.loads(message['data'])
                        channel = message['channel']

                        await self.broadcast({
                            'type': channel,
                            'data': data,
                            'timestamp': data.get('timestamp')
                        })
                    except Exception as e:
                        logger.error(f"Error processing Redis message: {e}")

        except Exception as e:
            logger.error(f"Redis subscription error: {e}")

    async def close(self):
        """Close Redis connection and cleanup."""
        if self.pubsub_task:
            self.pubsub_task.cancel()

        if self.redis_client:
            await self.redis_client.close()


# Global connection manager instance
manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates.

    Clients can subscribe to:
    - events: New vehicle detection events
    - occupancy: Parking occupancy updates
    - camera_status: Camera health status
    - barrier_status: Barrier state changes
    - system_alerts: System notifications
    """
    await manager.connect(websocket)

    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_json()

            # Handle client commands
            action = data.get('action')

            if action == 'subscribe':
                channels = data.get('channels', [])
                await manager.send_personal_message({
                    'type': 'subscription_confirmed',
                    'channels': channels
                }, websocket)

            elif action == 'ping':
                await manager.send_personal_message({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }, websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected normally")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


async def publish_event(event_type: str, data: dict):
    """
    Publish event to Redis for broadcasting via WebSocket.

    Args:
        event_type: Type of event (events, occupancy, etc.)
        data: Event data dictionary
    """
    try:
        if manager.redis_client:
            await manager.redis_client.publish(
                event_type,
                json.dumps(data)
            )
    except Exception as e:
        logger.error(f"Failed to publish event: {e}")
