# Complete API Integration Guide for ALPR System

## Table of Contents
1. [ALPR Engine Integration](#1-alpr-engine-integration)
2. [Camera/Video Stream Integration](#2-camera-video-stream-integration)
3. [Barrier Control Integration](#3-barrier-control-integration)
4. [Real-time WebSocket Integration](#4-real-time-websocket-integration)
5. [Notification System Integration](#5-notification-system-integration)
6. [External Systems Integration](#6-external-systems-integration)

---

## 1. ALPR Engine Integration

### Option A: OpenALPR (Recommended - Free & Open Source)

#### Installation Steps

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y openalpr openalpr-daemon openalpr-utils libalpr-dev

# Verify installation
alpr --version

# Or build from source for latest version
git clone https://github.com/openalpr/openalpr.git
cd openalpr/src
mkdir build && cd build
cmake -DCMAKE_INSTALL_PREFIX:PATH=/usr -DCMAKE_INSTALL_SYSCONFDIR:PATH=/etc ..
make
sudo make install
```

#### Python Integration

```python
# backend/app/services/alpr_service.py
from openalpr import Alpr
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class ALPRService:
    def __init__(
        self,
        country: str = "us",
        config_file: str = "/etc/openalpr/openalpr.conf",
        runtime_dir: str = "/usr/share/openalpr/runtime_data"
    ):
        self.alpr = Alpr(country, config_file, runtime_dir)
        self.alpr.set_top_n(10)  # Return top 10 results
        self.alpr.set_default_region("md")  # Maryland region

    def recognize_plate(self, image_path: str) -> List[Dict]:
        """
        Recognize license plate from image file
        """
        try:
            results = self.alpr.recognize_file(image_path)

            plates = []
            for plate in results['results']:
                plates.append({
                    'plate': plate['plate'],
                    'confidence': plate['confidence'],
                    'region': plate.get('region', ''),
                    'coordinates': plate['coordinates'],
                    'processing_time_ms': results['processing_time_ms']
                })

            return plates
        except Exception as e:
            logger.error(f"ALPR recognition error: {str(e)}")
            return []

    def recognize_from_array(self, image_array) -> List[Dict]:
        """
        Recognize license plate from numpy array (for video streams)
        """
        try:
            results = self.alpr.recognize_array(image_array)

            plates = []
            for plate in results['results']:
                plates.append({
                    'plate': plate['plate'],
                    'confidence': plate['confidence'],
                    'region': plate.get('region', ''),
                    'coordinates': plate['coordinates'],
                    'processing_time_ms': results['processing_time_ms']
                })

            return plates
        except Exception as e:
            logger.error(f"ALPR recognition error: {str(e)}")
            return []

    def __del__(self):
        if hasattr(self, 'alpr'):
            self.alpr.unload()

# Usage
alpr_service = ALPRService(country="eu")  # or "us", "au", etc.
```

#### REST API Endpoint

```python
# backend/app/api/v1/endpoints/alpr.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.alpr_service import ALPRService
import cv2
import numpy as np

router = APIRouter()
alpr_service = ALPRService()

@router.post("/recognize")
async def recognize_plate(file: UploadFile = File(...)):
    """
    Upload image and recognize license plate
    """
    try:
        # Read uploaded file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Recognize plate
        results = alpr_service.recognize_from_array(img)

        if not results:
            raise HTTPException(status_code=404, detail="No license plate detected")

        return {
            "success": True,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Option B: EasyOCR (Free Alternative)

```bash
pip install easyocr
```

```python
# backend/app/services/alpr_easyocr.py
import easyocr
import re
from typing import List, Dict

class EasyOCRService:
    def __init__(self, languages=['en']):
        self.reader = easyocr.Reader(languages, gpu=True)  # Use GPU if available

    def recognize_plate(self, image_path: str) -> List[Dict]:
        results = self.reader.readtext(image_path)

        plates = []
        for (bbox, text, confidence) in results:
            # Filter for plate-like patterns (customize regex for your region)
            if self._is_valid_plate(text):
                plates.append({
                    'plate': text.upper().replace(' ', ''),
                    'confidence': confidence * 100,
                    'coordinates': bbox
                })

        return plates

    def _is_valid_plate(self, text: str) -> bool:
        # US plate pattern example: 3 letters + 4 numbers or similar
        pattern = r'^[A-Z]{1,3}[0-9]{1,4}[A-Z]{0,2}$'
        clean_text = text.upper().replace(' ', '').replace('-', '')
        return bool(re.match(pattern, clean_text)) and 3 <= len(clean_text) <= 8
```

---

## 2. Camera/Video Stream Integration

### Real-time Video Capture Service

```python
# backend/app/services/camera_service.py
import cv2
import threading
import time
from typing import Optional, Callable
import logging

logger = logging.getLogger(__name__)

class CameraService:
    def __init__(self, camera_url: str, camera_id: str):
        self.camera_url = camera_url
        self.camera_id = camera_id
        self.cap = None
        self.running = False
        self.thread = None
        self.frame = None
        self.lock = threading.Lock()

    def connect(self) -> bool:
        """Connect to camera stream"""
        try:
            self.cap = cv2.VideoCapture(self.camera_url)
            if not self.cap.isOpened():
                logger.error(f"Failed to open camera {self.camera_id}")
                return False

            # Set buffer size to 1 to get latest frame
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            logger.info(f"Camera {self.camera_id} connected")
            return True
        except Exception as e:
            logger.error(f"Camera connection error: {str(e)}")
            return False

    def start_capture(self, frame_callback: Optional[Callable] = None):
        """Start continuous frame capture"""
        if self.running:
            return

        self.running = True
        self.thread = threading.Thread(
            target=self._capture_loop,
            args=(frame_callback,),
            daemon=True
        )
        self.thread.start()

    def _capture_loop(self, frame_callback: Optional[Callable] = None):
        """Continuous capture loop"""
        while self.running:
            ret, frame = self.cap.read()

            if ret:
                with self.lock:
                    self.frame = frame

                if frame_callback:
                    frame_callback(self.camera_id, frame)
            else:
                logger.warning(f"Failed to read from camera {self.camera_id}")
                time.sleep(1)  # Wait before retry

    def get_latest_frame(self):
        """Get the most recent frame"""
        with self.lock:
            return self.frame.copy() if self.frame is not None else None

    def stop_capture(self):
        """Stop capture and release resources"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        if self.cap:
            self.cap.release()
        logger.info(f"Camera {self.camera_id} stopped")

# Camera configuration
CAMERA_CONFIGS = {
    "entry_camera": {
        "url": "rtsp://admin:password@192.168.1.100:554/stream1",
        "id": "entry_camera",
        "type": "entry"
    },
    "exit_camera": {
        "url": "rtsp://admin:password@192.168.1.101:554/stream1",
        "id": "exit_camera",
        "type": "exit"
    }
}
```

### Integration with ALPR

```python
# backend/app/services/monitoring_service.py
from app.services.camera_service import CameraService, CAMERA_CONFIGS
from app.services.alpr_service import ALPRService
from app.db.database import SessionLocal
from app.models import Event, Vehicle
import cv2
import asyncio

class MonitoringService:
    def __init__(self):
        self.cameras = {}
        self.alpr = ALPRService()
        self.min_confidence = 75.0  # Minimum confidence threshold
        self.last_detected = {}  # Prevent duplicate detections

    async def start_monitoring(self):
        """Start monitoring all cameras"""
        for camera_id, config in CAMERA_CONFIGS.items():
            camera = CameraService(config['url'], config['id'])
            if camera.connect():
                camera.start_capture(self.on_frame_captured)
                self.cameras[camera_id] = {
                    'service': camera,
                    'type': config['type']
                }

    def on_frame_captured(self, camera_id: str, frame):
        """Callback when new frame is captured"""
        # Process every Nth frame to reduce load
        if not hasattr(self, '_frame_count'):
            self._frame_count = {}

        self._frame_count[camera_id] = self._frame_count.get(camera_id, 0) + 1

        # Process every 5th frame (adjust based on your needs)
        if self._frame_count[camera_id] % 5 != 0:
            return

        # Recognize plate
        results = self.alpr.recognize_from_array(frame)

        for result in results:
            if result['confidence'] >= self.min_confidence:
                asyncio.create_task(self.process_detection(
                    camera_id,
                    result['plate'],
                    result['confidence'],
                    frame
                ))

    async def process_detection(self, camera_id: str, plate: str, confidence: float, frame):
        """Process detected plate"""
        # Check if we recently detected this plate (prevent duplicates)
        key = f"{camera_id}_{plate}"
        current_time = time.time()

        if key in self.last_detected:
            if current_time - self.last_detected[key] < 10:  # 10 second cooldown
                return

        self.last_detected[key] = current_time

        # Save frame
        image_path = f"data/events/{camera_id}_{plate}_{int(current_time)}.jpg"
        cv2.imwrite(image_path, frame)

        # Get camera info
        camera_info = self.cameras[camera_id]
        event_type = camera_info['type']  # 'entry' or 'exit'

        # Check if vehicle is registered
        db = SessionLocal()
        try:
            vehicle = db.query(Vehicle).filter(
                Vehicle.license_plate == plate
            ).first()

            vehicle_found = vehicle is not None

            # Determine barrier action
            if vehicle_found and vehicle.status == 'active':
                barrier_action = 'opened'
                # Trigger barrier opening
                await self.open_barrier(event_type)
            else:
                barrier_action = 'denied'

            # Create event record
            event = Event(
                plate_number=plate,
                event_type=event_type,
                camera_id=camera_id,
                confidence=confidence,
                vehicle_found=vehicle_found,
                barrier_action=barrier_action,
                image_path=image_path,
                vehicle_id=vehicle.id if vehicle else None
            )
            db.add(event)
            db.commit()

            # Broadcast via WebSocket
            await self.broadcast_event(event)

        finally:
            db.close()

    async def open_barrier(self, barrier_type: str):
        """Trigger barrier opening"""
        # Implement barrier control here
        pass

    async def broadcast_event(self, event):
        """Broadcast event via WebSocket"""
        # Implement WebSocket broadcast
        pass
```

---

## 3. Barrier Control Integration

### GPIO Control (Raspberry Pi)

```python
# backend/app/services/barrier_gpio.py
import RPi.GPIO as GPIO
import time
import asyncio

class GPIOBarrierController:
    def __init__(self, entry_pin: int = 17, exit_pin: int = 27):
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)

        self.entry_pin = entry_pin
        self.exit_pin = exit_pin

        # Setup pins
        GPIO.setup(self.entry_pin, GPIO.OUT)
        GPIO.setup(self.exit_pin, GPIO.OUT)

        # Initialize to closed state
        GPIO.output(self.entry_pin, GPIO.LOW)
        GPIO.output(self.exit_pin, GPIO.LOW)

    async def open_entry_barrier(self, duration: int = 5):
        """Open entry barrier for specified duration (seconds)"""
        GPIO.output(self.entry_pin, GPIO.HIGH)
        await asyncio.sleep(duration)
        GPIO.output(self.entry_pin, GPIO.LOW)

    async def open_exit_barrier(self, duration: int = 5):
        """Open exit barrier for specified duration (seconds)"""
        GPIO.output(self.exit_pin, GPIO.HIGH)
        await asyncio.sleep(duration)
        GPIO.output(self.exit_pin, GPIO.LOW)

    def close_all_barriers(self):
        """Emergency close all barriers"""
        GPIO.output(self.entry_pin, GPIO.LOW)
        GPIO.output(self.exit_pin, GPIO.LOW)

    def cleanup(self):
        """Cleanup GPIO"""
        GPIO.cleanup()
```

### HTTP API Control (Network-enabled barriers)

```python
# backend/app/services/barrier_http.py
import aiohttp
import logging

logger = logging.getLogger(__name__)

class HTTPBarrierController:
    def __init__(self, entry_url: str, exit_url: str, api_key: str = None):
        self.entry_url = entry_url
        self.exit_url = exit_url
        self.headers = {'Authorization': f'Bearer {api_key}'} if api_key else {}

    async def open_entry_barrier(self):
        """Open entry barrier via HTTP API"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.entry_url}/open",
                    headers=self.headers,
                    json={'action': 'open'}
                ) as response:
                    if response.status == 200:
                        logger.info("Entry barrier opened")
                        return True
                    else:
                        logger.error(f"Failed to open entry barrier: {response.status}")
                        return False
            except Exception as e:
                logger.error(f"Barrier HTTP error: {str(e)}")
                return False

    async def open_exit_barrier(self):
        """Open exit barrier via HTTP API"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.exit_url}/open",
                    headers=self.headers,
                    json={'action': 'open'}
                ) as response:
                    if response.status == 200:
                        logger.info("Exit barrier opened")
                        return True
                    else:
                        logger.error(f"Failed to open exit barrier: {response.status}")
                        return False
            except Exception as e:
                logger.error(f"Barrier HTTP error: {str(e)}")
                return False
```

### Modbus/RS-485 Control

```python
# backend/app/services/barrier_modbus.py
from pymodbus.client import ModbusSerialClient
import logging

logger = logging.getLogger(__name__)

class ModbusBarrierController:
    def __init__(self, port: str = '/dev/ttyUSB0', baudrate: int = 9600):
        self.client = ModbusSerialClient(
            port=port,
            baudrate=baudrate,
            parity='N',
            stopbits=1,
            bytesize=8,
            timeout=3
        )
        self.connected = self.client.connect()

    async def open_entry_barrier(self):
        """Open entry barrier (write coil address 1)"""
        if not self.connected:
            logger.error("Modbus not connected")
            return False

        try:
            result = self.client.write_coil(1, True)  # Address 1 = Entry barrier
            if result.isError():
                logger.error("Failed to write to entry barrier coil")
                return False
            return True
        except Exception as e:
            logger.error(f"Modbus error: {str(e)}")
            return False

    async def open_exit_barrier(self):
        """Open exit barrier (write coil address 2)"""
        if not self.connected:
            logger.error("Modbus not connected")
            return False

        try:
            result = self.client.write_coil(2, True)  # Address 2 = Exit barrier
            if result.isError():
                logger.error("Failed to write to exit barrier coil")
                return False
            return True
        except Exception as e:
            logger.error(f"Modbus error: {str(e)}")
            return False

    def close(self):
        """Close Modbus connection"""
        if self.client:
            self.client.close()
```

---

## 4. Real-time WebSocket Integration

### Backend WebSocket Server

```python
# backend/app/api/v1/websocket.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send to client: {str(e)}")
                dead_connections.append(connection)

        # Remove dead connections
        for conn in dead_connections:
            self.active_connections.remove(conn)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Echo back or handle client messages
            await websocket.send_json({"type": "pong", "message": "alive"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Broadcast events
async def broadcast_new_event(event_data: dict):
    await manager.broadcast({
        "type": "new_event",
        "data": event_data
    })

async def broadcast_stats_update(stats_data: dict):
    await manager.broadcast({
        "type": "stats_update",
        "data": stats_data
    })
```

---

## 5. Notification System Integration

### Email Notifications (SMTP)

```python
# backend/app/services/notification_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import logging
from typing import List

logger = logging.getLogger(__name__)

class EmailNotificationService:
    def __init__(
        self,
        smtp_server: str = "smtp.gmail.com",
        smtp_port: int = 587,
        username: str = None,
        password: str = None
    ):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password

    async def send_alert(
        self,
        to_emails: List[str],
        subject: str,
        body: str,
        image_path: str = None
    ):
        """Send email alert"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.username
            msg['To'] = ', '.join(to_emails)
            msg['Subject'] = subject

            # Add text body
            msg.attach(MIMEText(body, 'html'))

            # Add image if provided
            if image_path:
                with open(image_path, 'rb') as f:
                    img = MIMEImage(f.read())
                    img.add_header('Content-ID', '<plate_image>')
                    msg.attach(img)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)

            logger.info(f"Email sent to {to_emails}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    async def send_unauthorized_vehicle_alert(self, plate: str, image_path: str):
        """Send alert for unauthorized vehicle"""
        subject = f"⚠️ Unauthorized Vehicle Detected: {plate}"
        body = f"""
        <html>
          <body>
            <h2>Unauthorized Vehicle Alert</h2>
            <p><strong>License Plate:</strong> {plate}</p>
            <p><strong>Time:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><strong>Action:</strong> Access Denied</p>
            <br>
            <img src="cid:plate_image" alt="Vehicle Image" style="max-width: 600px;">
          </body>
        </html>
        """

        await self.send_alert(
            to_emails=['security@company.com'],
            subject=subject,
            body=body,
            image_path=image_path
        )
```

### Telegram Bot Notifications

```python
# backend/app/services/telegram_service.py
import aiohttp
import logging

logger = logging.getLogger(__name__)

class TelegramNotificationService:
    def __init__(self, bot_token: str, chat_ids: List[str]):
        self.bot_token = bot_token
        self.chat_ids = chat_ids
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    async def send_message(self, message: str):
        """Send text message to all chat IDs"""
        async with aiohttp.ClientSession() as session:
            for chat_id in self.chat_ids:
                try:
                    url = f"{self.base_url}/sendMessage"
                    payload = {
                        'chat_id': chat_id,
                        'text': message,
                        'parse_mode': 'HTML'
                    }
                    async with session.post(url, json=payload) as response:
                        if response.status == 200:
                            logger.info(f"Message sent to {chat_id}")
                        else:
                            logger.error(f"Failed to send to {chat_id}")
                except Exception as e:
                    logger.error(f"Telegram error: {str(e)}")

    async def send_photo(self, photo_path: str, caption: str):
        """Send photo with caption"""
        async with aiohttp.ClientSession() as session:
            for chat_id in self.chat_ids:
                try:
                    url = f"{self.base_url}/sendPhoto"
                    with open(photo_path, 'rb') as photo:
                        data = aiohttp.FormData()
                        data.add_field('chat_id', chat_id)
                        data.add_field('caption', caption, content_type='text/plain')
                        data.add_field('photo', photo, filename='plate.jpg')

                        async with session.post(url, data=data) as response:
                            if response.status == 200:
                                logger.info(f"Photo sent to {chat_id}")
                except Exception as e:
                    logger.error(f"Telegram photo error: {str(e)}")
```

### Webhook Integration

```python
# backend/app/services/webhook_service.py
import aiohttp
import logging

logger = logging.getLogger(__name__)

class WebhookService:
    def __init__(self, webhook_url: str, secret_key: str = None):
        self.webhook_url = webhook_url
        self.secret_key = secret_key

    async def send_event(self, event_data: dict):
        """Send event to webhook endpoint"""
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'ALPR-System/1.0'
        }

        if self.secret_key:
            headers['X-Webhook-Secret'] = self.secret_key

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    self.webhook_url,
                    json=event_data,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        logger.info("Webhook sent successfully")
                        return True
                    else:
                        logger.error(f"Webhook failed: {response.status}")
                        return False
            except Exception as e:
                logger.error(f"Webhook error: {str(e)}")
                return False
```

---

## 6. External Systems Integration

### Example: Integration with existing access control system

```python
# backend/app/services/access_control_integration.py
import aiohttp
import logging

logger = logging.getLogger(__name__)

class AccessControlIntegration:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    async def sync_vehicle(self, license_plate: str, owner_name: str, access_level: str):
        """Sync vehicle to access control system"""
        async with aiohttp.ClientSession() as session:
            try:
                payload = {
                    'credential_id': license_plate,
                    'name': owner_name,
                    'access_level': access_level,
                    'valid_from': datetime.now().isoformat(),
                    'valid_until': (datetime.now() + timedelta(days=365)).isoformat()
                }

                async with session.post(
                    f"{self.api_url}/credentials",
                    json=payload,
                    headers=self.headers
                ) as response:
                    if response.status == 201:
                        logger.info(f"Vehicle {license_plate} synced to access control")
                        return True
                    else:
                        logger.error(f"Failed to sync: {response.status}")
                        return False
            except Exception as e:
                logger.error(f"Access control sync error: {str(e)}")
                return False

    async def check_access(self, license_plate: str) -> bool:
        """Check if vehicle has access"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(
                    f"{self.api_url}/credentials/{license_plate}/access",
                    headers=self.headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get('has_access', False)
                    return False
            except Exception as e:
                logger.error(f"Access check error: {str(e)}")
                return False
```

---

## Environment Configuration

```python
# backend/.env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/alpr_db

# ALPR Configuration
ALPR_COUNTRY=us
ALPR_CONFIG_FILE=/etc/openalpr/openalpr.conf
ALPR_RUNTIME_DIR=/usr/share/openalpr/runtime_data
ALPR_MIN_CONFIDENCE=75.0

# Camera Configuration
ENTRY_CAMERA_URL=rtsp://admin:password@192.168.1.100:554/stream1
EXIT_CAMERA_URL=rtsp://admin:password@192.168.1.101:554/stream1

# Barrier Control
BARRIER_TYPE=gpio  # Options: gpio, http, modbus
BARRIER_ENTRY_PIN=17  # For GPIO
BARRIER_EXIT_PIN=27   # For GPIO
BARRIER_HTTP_ENTRY_URL=http://barrier1.local/api
BARRIER_HTTP_EXIT_URL=http://barrier2.local/api

# Email Notifications
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL_RECIPIENTS=security@company.com,manager@company.com

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_IDS=123456789,987654321

# Webhook
WEBHOOK_URL=https://your-system.com/api/alpr-events
WEBHOOK_SECRET=your-secret-key

# External Systems
ACCESS_CONTROL_API_URL=https://access-control.local/api
ACCESS_CONTROL_API_KEY=your-api-key
```

---

## Next Steps

1. **Test ALPR Engine**: Start with image recognition before live video
2. **Setup Camera Connection**: Test RTSP streams with OpenCV
3. **Implement Barrier Control**: Choose GPIO/HTTP/Modbus based on hardware
4. **Configure WebSocket**: Enable real-time dashboard updates
5. **Setup Notifications**: Configure email/Telegram alerts
6. **Integrate External Systems**: Connect to existing infrastructure

Each integration can be developed and tested independently before combining into the full system.
