# Hardware Setup Guide

## Required Components

### 1. Edge Computing Unit (Choose One)

#### Option A: Raspberry Pi 4
- **Model**: Raspberry Pi 4 Model B
- **RAM**: 4GB minimum (8GB recommended)
- **Pros**: Excellent community support, stable, well-documented
- **Cost**: ~$75-100

#### Option B: Orange Pi 5
- **Model**: Orange Pi 5 (8GB/16GB)
- **Pros**: More powerful, better performance for ALPR
- **Cost**: ~$100-150

### 2. Cameras (2x Required)

#### Recommended Specifications:
- **Resolution**: 1080p minimum (1920x1080)
- **Frame Rate**: 30 FPS minimum
- **Interface**: USB 3.0 or CSI (Raspberry Pi camera module)
- **Features**: Auto-focus, good low-light performance
- **Lens**: Wide angle (60-90 degrees)

#### Recommended Models:
- **Logitech C920/C922**: USB, excellent quality, widely supported
- **Raspberry Pi Camera Module v2**: CSI interface, compact
- **Arducam**: Various models with auto-focus support

### 3. Barrier Control Hardware

#### Relay Module:
- **Type**: 2-Channel 5V relay module
- **Switching Capacity**: 10A 250VAC / 10A 30VDC
- **Trigger**: Low-level trigger
- **Isolation**: Optocoupler isolation
- **Model Recommendation**: SainSmart 2-channel relay

#### Barrier Motor:
- **Type**: DC motor or servo-based barrier arm
- **Voltage**: 12V DC (with external power supply)
- **Control**: Via relay switching
- **Safety**: Include manual override mechanism

### 4. Additional Components

- **Power Supply**: 5V 3A+ for Raspberry Pi (USB-C or GPIO)
- **microSD Card**: 32GB Class 10 minimum (64GB recommended)
- **Network**: Ethernet cable (Cat 5e/6) or WiFi dongle
- **Case**: Protective case with cooling (fan recommended)
- **Mounting**: Camera mounts, weatherproof enclosures
- **Cables**: USB cables for cameras, jumper wires for GPIO
- **Optional Sensors**: IR sensors for vehicle detection

## Hardware Assembly

### Step 1: Prepare the Edge Device

1. **Install Heat Sinks** (if not pre-installed):
   - Attach heat sinks to CPU and RAM chips
   - Ensure proper thermal management

2. **Insert microSD Card**:
   - Use card reader to flash OS (see software setup)
   - Insert into edge device

3. **Mount in Protective Case**:
   - Ensure adequate ventilation
   - Consider weatherproofing for outdoor installation

### Step 2: Camera Installation

#### Entry Point Camera:

1. **Mounting Position**:
   - Height: 2-3 meters above ground
   - Angle: 15-30 degrees downward
   - Distance: 3-5 meters from barrier
   - Coverage: Clear view of license plate area

2. **Considerations**:
   - Avoid direct sunlight glare
   - Ensure adequate lighting (add LED lights if needed)
   - Weatherproof housing for outdoor installation
   - Secure cable routing

#### Exit Point Camera:
- Follow same guidelines as entry camera
- Position to capture plates as vehicles approach

### Step 3: GPIO Connections (Raspberry Pi Example)

#### Pin Layout Reference:
```
Raspberry Pi GPIO (BCM Mode)
┌─────────────────────────────────┐
│  3V3  (1) (2)  5V               │
│  GP2  (3) (4)  5V               │
│  GP3  (5) (6)  GND              │
│  GP4  (7) (8)  GP14             │
│  GND  (9) (10) GP15             │
│  GP17 (11)(12) GP18             │
│  GP27 (13)(14) GND              │
│  GP22 (15)(16) GP23             │
│  3V3  (17)(18) GP24             │
│  ...                            │
└─────────────────────────────────┘
```

#### Relay Module Connections:

**Entry Barrier Relay:**
- VCC → 5V (Pin 2 or 4)
- GND → Ground (Pin 6, 9, 14, 20, 25, 30, 34, or 39)
- IN1 → GPIO 17 (Pin 11)

**Exit Barrier Relay:**
- VCC → 5V (Pin 2 or 4)
- GND → Ground (Pin 6, 9, 14, 20, 25, 30, 34, or 39)
- IN2 → GPIO 27 (Pin 13)

#### Optional Sensor Connections:

**Entry Sensor (IR/Ultrasonic):**
- VCC → 3.3V (Pin 1 or 17)
- GND → Ground
- OUT → GPIO 22 (Pin 15)

**Exit Sensor:**
- VCC → 3.3V
- GND → Ground
- OUT → GPIO 23 (Pin 16)

#### Wiring Diagram:
```
┌─────────────────┐
│  Raspberry Pi   │
│                 │
│  GPIO 17 ────────────→ Relay CH1 ───→ Entry Barrier Motor
│  GPIO 27 ────────────→ Relay CH2 ───→ Exit Barrier Motor
│  GPIO 22 ←──────────── Entry Sensor
│  GPIO 23 ←──────────── Exit Sensor
│                 │
│  5V ──────────────────→ Relay VCC
│  GND ─────────────────→ Relay GND
│                 │
└─────────────────┘
```

### Step 4: Barrier Motor Connection

#### Safety Warning:
- **Never connect high-voltage AC directly to GPIO pins**
- **Always use relay module for isolation**
- **Include manual override for safety**
- **Add emergency stop button**

#### Wiring:
```
Power Supply (12V DC)
     │
     ├──→ Motor (+) ←─── Relay NO (Normally Open)
     │
     └──→ Motor (-) ←─── Direct GND

Relay Common (COM) ←─── 12V (+)
```

### Step 5: Camera Connection

#### USB Cameras:
1. Connect entry camera to USB 3.0 port (blue) - `/dev/video0`
2. Connect exit camera to second USB 3.0 port - `/dev/video1`
3. Verify detection: `ls /dev/video*`

#### CSI Cameras (Raspberry Pi):
1. Open CSI connector on Pi
2. Insert ribbon cable (contacts facing away from Ethernet port)
3. Close connector
4. Enable camera in `raspi-config`

### Step 6: Network Connection

#### Ethernet (Recommended):
- Connect Cat5e/6 cable to RJ45 port
- Configure static IP for stability

#### WiFi:
- Use built-in WiFi or dongle
- Ensure strong signal strength
- Configure in OS network settings

### Step 7: Power Supply

#### Raspberry Pi 4:
- Use official 5V 3A USB-C power supply
- Or power via GPIO pins 2/4 (5V) and 6 (GND)

#### Orange Pi 5:
- Use provided power adapter
- Ensure sufficient amperage for peripherals

## Testing Hardware Setup

### 1. Boot Test
```bash
# Power on device
# Watch for green LED activity
# Wait for boot completion (30-60 seconds)
```

### 2. Camera Test
```bash
# List video devices
ls -l /dev/video*

# Test camera with fswebcam
fswebcam -d /dev/video0 test_entry.jpg
fswebcam -d /dev/video1 test_exit.jpg

# Or use v4l2-ctl
v4l2-ctl --list-devices
v4l2-ctl -d /dev/video0 --all
```

### 3. GPIO Test
```bash
# Install GPIO tools
sudo apt-get install python3-gpiozero

# Test with Python
python3 << EOF
from gpiozero import LED
from time import sleep

# Test relay on GPIO 17
relay = LED(17)
relay.on()
sleep(2)
relay.off()
EOF
```

### 4. Network Test
```bash
# Check network connection
ip addr show

# Test internet connectivity
ping -c 4 google.com

# Check SSH access (from another computer)
ssh pi@<raspberry-pi-ip>
```

## Physical Installation Guidelines

### Outdoor Installation

1. **Weatherproofing**:
   - IP65 rated enclosures minimum
   - Cable glands for wire entry
   - Ventilation to prevent condensation
   - Desiccant packs for moisture

2. **Mounting**:
   - Secure poles or walls
   - Anti-vibration mounting
   - Cable management and strain relief

3. **Power**:
   - Surge protection
   - UPS backup (recommended)
   - Proper grounding

4. **Lighting**:
   - Add LED illumination for night operation
   - Position to avoid glare on cameras
   - Consider IR illuminators

### Indoor Installation

1. **Ventilation**: Ensure adequate airflow
2. **Cable Management**: Organize and secure cables
3. **Accessibility**: Allow easy maintenance access
4. **Power**: Use surge-protected outlets

## Maintenance Schedule

### Daily:
- Visual inspection of cameras
- Check barrier operation

### Weekly:
- Clean camera lenses
- Verify system logs
- Test manual overrides

### Monthly:
- Check all connections
- Verify GPIO functionality
- Update firmware/software
- Review backup systems

### Quarterly:
- Deep clean all hardware
- Replace any worn components
- Test disaster recovery
- Calibrate sensors

## Troubleshooting

### Camera Issues:
- **Not detected**: Check USB connection, try different port
- **Poor quality**: Clean lens, check focus, adjust lighting
- **Lag**: Reduce resolution, check USB bandwidth

### GPIO Issues:
- **Relay not responding**: Check wiring, verify GPIO pin, test with multimeter
- **Intermittent operation**: Check power supply, secure connections

### Barrier Issues:
- **Won't open**: Check power supply, test relay, verify motor
- **Stays open**: Check timeout settings, verify sensor
- **Slow operation**: Check motor voltage, lubricate mechanism

## Safety Considerations

1. **Emergency Stop**: Always have manual override
2. **Obstruction Detection**: Add safety sensors
3. **Timeout Protection**: Set maximum open duration
4. **Visual Indicators**: LED lights for barrier status
5. **Signage**: Clear instructions for users
6. **Regular Testing**: Weekly safety system checks

## Bill of Materials (BOM)

| Item | Quantity | Est. Price | Notes |
|------|----------|------------|-------|
| Raspberry Pi 4 (4GB) | 1 | $75 | Or Orange Pi 5 |
| USB Cameras (1080p) | 2 | $50 ea | Logitech C920 |
| 2-Ch Relay Module | 1 | $8 | 5V trigger |
| Barrier Motors | 2 | $150 ea | 12V DC |
| Power Supply (Pi) | 1 | $10 | 5V 3A USB-C |
| Power Supply (Motors) | 1 | $20 | 12V 5A |
| microSD Card 64GB | 1 | $15 | Class 10 |
| Ethernet Cable | 1 | $10 | Cat6, 10m |
| Weatherproof Enclosure | 2 | $30 ea | IP65 rated |
| Camera Mounts | 2 | $15 ea | Adjustable |
| Jumper Wires | 1 set | $5 | GPIO connections |
| LED Lights | 2 | $20 ea | Night illumination |
| Misc (cables, screws) | - | $50 | Various |
| **Total Estimate** | - | **$678-800** | Varies by region |

## Additional Resources

- [Raspberry Pi GPIO Documentation](https://www.raspberrypi.org/documentation/hardware/raspberrypi/)
- [OpenALPR Camera Positioning Guide](http://doc.openalpr.com/camera_placement.html)
- [GPIO Zero Documentation](https://gpiozero.readthedocs.io/)
- Community forums for troubleshooting
