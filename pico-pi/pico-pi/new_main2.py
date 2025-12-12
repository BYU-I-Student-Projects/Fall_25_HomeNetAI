"""
Simple two-phase approach:
Phase 1: Get WiFi credentials via AP, save to JSON, restart
Phase 2: After restart, register device and send data
"""
from machine import Pin, I2C
import dht
import network
import time
import json
import machine
import os
import usocket as socket
import ubinascii
from pico_i2c_lcd import I2cLcd
from ap_config import listen_for_credentials

# LED setup
led = machine.Pin("LED", machine.Pin.OUT)

# Set up pins for DHT22
sensor = dht.DHT22(Pin(2))

# Set up pins and create LCD object
i2c = I2C(0, sda=Pin(0), scl=Pin(1), freq=400000)
I2C_ADDR = i2c.scan()[0]
lcd = I2cLcd(i2c, I2C_ADDR, 2, 16)

# TLS support (detect at runtime, not import time)
ssl_mod = None
HAVE_USSL = False

def check_tls():
    """Check TLS availability at runtime"""
    global ssl_mod, HAVE_USSL
    try:
        import ussl as ssl_mod
        HAVE_USSL = True
        print("[DEBUG] Using ussl module")
        return True
    except ImportError:
        try:
            import ssl as ssl_mod
            HAVE_USSL = True
            print("[DEBUG] Using ssl module")
            return True
        except ImportError:
            ssl_mod = None
            HAVE_USSL = False
            print("[DEBUG] No TLS module available")
            return False

API_HOST = "iot-picopi-module.onrender.com"
API_PORT_HTTPS = 443
API_PORT_HTTP = 80

CONFIG_FILE = "device_config.json"

def blink_led(times=1, on_time=0.1, off_time=0.1):
    """Blink LED to indicate activity"""
    for _ in range(times):
        led.on()
        time.sleep(on_time)
        led.off()
        time.sleep(off_time)

def LoadConfig():
    """Load config from JSON"""
    try:
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    except:
        return None

def SaveConfig(config):
    """Save config to JSON"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f)
        print(f"✓ Config saved to {CONFIG_FILE}")
        return True
    except Exception as e:
        print(f"✗ Failed to save config: {e}")
        return False

def Phase1_GetCredentials():
    """Phase 1: Get WiFi credentials and save"""
    print("\n" + "=" * 50)
    print("PHASE 1: GET WIFI CREDENTIALS")
    print("=" * 50)
    
    # Blink 2 times: Starting Phase 1
    blink_led(2, 0.2, 0.2)
    
    print("\nBroadcasting AP, waiting for credentials...")
    creds = listen_for_credentials()
    
    if not creds:
        print("✗ Failed to get credentials")
        return False
    
    print(f"\n✓ Received credentials:")
    print(f"  SSID: {creds['ssid']}")
    print(f"  User ID: {creds['user_id']}")
    
    # Save to config
    config = {
        "ssid": creds["ssid"],
        "password": creds["password"],
        "user_id": creds["user_id"],
        "phase": "credentials_saved"
    }
    
    if SaveConfig(config):
        print("\n🔄 Restarting in 3 seconds to free memory...")
        # Blink fast 5 times: About to restart
        blink_led(5, 0.1, 0.1)
        time.sleep(1)
        machine.reset()
    else:
        print("✗ Save failed, not restarting")
        return False

def ConnectWiFi(ssid, password):
    """Connect to WiFi"""
    print(f"\nConnecting to {ssid}...")
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)
    
    max_wait = 10
    while max_wait > 0:
        if wlan.status() < 0 or wlan.status() >= 3:
            break
        max_wait -= 1
        print('  Waiting...')
        time.sleep(1)
    
    if wlan.status() != 3:
        print(f"✗ WiFi failed (status: {wlan.status()})")
        return False
    
    ip = wlan.ifconfig()[0]
    print(f"✓ WiFi connected: {ip}")
    return True

def GetMACAddress():
    """Get MAC address"""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    return ubinascii.hexlify(wlan.config('mac')).decode()

def RegisterDeviceHTTP_Direct(user_id):
    """Register device via direct HTTP to IP (bypass redirect)"""
    mac = GetMACAddress()
    device_name = f"pico_{mac[-6:]}"
    payload = {
        "name": device_name,
        "type": "pico_pi",
        "user_id": user_id
    }
    body = json.dumps(payload)
    
    print(f"\nRegistering via direct HTTP: {device_name}")
    print("  Note: This may fail due to Render's HTTPS redirect")
    
    try:
        # Get IP directly
        addr = socket.getaddrinfo(API_HOST, API_PORT_HTTP)[0][-1]
        print(f"  Connecting to {addr}...")
        s = socket.socket()
        s.settimeout(30)
        s.connect(addr)
        
        # Try sending request anyway
        req = (
            f"POST /api/v1/devices HTTP/1.1\r\n"
            f"Host: {API_HOST}\r\n"
            "Content-Type: application/json\r\n"
            f"Content-Length: {len(body)}\r\n"
            "Connection: close\r\n\r\n" + body
        )
        s.send(req.encode())
        
        print("  Waiting for response...")
        resp = b""
        while True:
            chunk = s.recv(512)
            if not chunk:
                break
            resp += chunk
        s.close()
        
        print(f"  Response received ({len(resp)} bytes)")
        parts = resp.split(b"\r\n\r\n", 1)
        status = parts[0].split(b"\r\n", 1)[0].decode()
        print(f"  Status: {status}")
        
        if "307" in status or "301" in status:
            print("  ⚠ Server requires HTTPS (redirect)")
            return None
        
        if status.startswith("HTTP/1.1 2") or status.startswith("HTTP/1.0 2"):
            body_bytes = parts[1] if len(parts) > 1 else b""
            data = json.loads(body_bytes.decode()).get("data", {})
            device_id = data.get("id") or data.get("device_id")
            if device_id:
                print(f"✓ Device registered: {device_id}")
                return device_id
    except Exception as e:
        print(f"✗ HTTP error: {e}")
    
    return None

def RegisterDeviceHTTPS(user_id):
    """Register device via HTTPS - same logic as test_connection.py"""
    # Re-check TLS at runtime
    if not check_tls():
        print("✗ TLS not available")
        return None
    
    mac = GetMACAddress()
    device_name = f"pico_{mac[-6:]}"
    payload = {
        "name": device_name,
        "type": "pico_pi",
        "user_id": user_id
    }
    body = json.dumps(payload)
    
    print(f"\nRegistering via HTTPS: {device_name}")
    print(f"  Payload: {body}")
    
    try:
        # DNS resolution
        dns_results = socket.getaddrinfo(API_HOST, API_PORT_HTTPS)
        addr = dns_results[0][-1]
        print(f"  DNS: {API_HOST}:443 -> {addr}")
        
        # TCP connect
        s = socket.socket()
        s.settimeout(30)
        print(f"  → Connecting to {addr}...")
        s.connect(addr)
        print("  ✓ TCP connected")
        
        # TLS wrap
        print("  → TLS wrapping...")
        s = ssl_mod.wrap_socket(s, server_hostname=API_HOST)
        print("  ✓ TLS established")
        
        # Send request
        req = (
            f"POST /api/v1/devices HTTP/1.1\r\n"
            f"Host: {API_HOST}\r\n"
            "Content-Type: application/json\r\n"
            f"Content-Length: {len(body)}\r\n"
            "Connection: close\r\n\r\n" + body
        )
        print("  → Sending request...")
        s.send(req.encode())
        
        # Read response
        print("  → Waiting for response...")
        resp = b""
        while True:
            chunk = s.recv(512)
            if not chunk:
                break
            resp += chunk
        s.close()
        
        print(f"  → Response: {len(resp)} bytes")
        
        # Parse response
        parts = resp.split(b"\r\n\r\n", 1)
        headers = parts[0]
        status = headers.split(b"\r\n", 1)[0].decode()
        body_bytes = parts[1] if len(parts) > 1 else b""
        
        print(f"  Status: {status}")
        
        if status.startswith("HTTP/1.1 2") or status.startswith("HTTP/1.0 2"):
            # Handle chunked encoding (Render uses Transfer-Encoding: chunked)
            if b"transfer-encoding: chunked" in headers.lower():
                # Remove chunk size markers
                chunks = []
                remaining = body_bytes
                while remaining:
                    # Find chunk size line
                    if b"\r\n" not in remaining:
                        break
                    size_line, rest = remaining.split(b"\r\n", 1)
                    try:
                        chunk_size = int(size_line.strip(), 16)
                        if chunk_size == 0:
                            break
                        chunk_data = rest[:chunk_size]
                        chunks.append(chunk_data)
                        remaining = rest[chunk_size+2:]  # +2 for \r\n after chunk
                    except:
                        break
                body_bytes = b"".join(chunks)
            
            # Parse JSON
            try:
                body_str = body_bytes.decode()
                print(f"  Body: {body_str[:150]}...")
                data = json.loads(body_str).get("data", {})
                device_id = data.get("id") or data.get("device_id")
                if device_id:
                    print(f"✓ Device registered: {device_id}")
                    return device_id
                else:
                    print(f"  ⚠ No device_id in response: {data}")
            except Exception as e:
                print(f"  ✗ JSON parse error: {e}")
                print(f"  Raw body: {body_bytes[:200]}")
        else:
            print(f"✗ Non-2xx status")
            print(f"  Body preview: {body_bytes[:200]}")
    except Exception as e:
        import sys
        print(f"✗ HTTPS error: {e}")
        sys.print_exception(e)
    
    return None

def RegisterModuleHTTPS(device_id, user_id, module_type, module_name):
    """Register a device module (thermostat or weather_sensor)"""
    if not check_tls():
        print(f"✗ TLS not available for {module_type}")
        return None
    
    payload = {
        "device_id": device_id,
        "user_id": user_id,
        "module_type": module_type,
        "name": module_name
    }
    body = json.dumps(payload)
    
    print(f"\n  Registering module: {module_name} ({module_type})")
    
    try:
        dns_results = socket.getaddrinfo(API_HOST, API_PORT_HTTPS)
        addr = dns_results[0][-1]
        
        s = socket.socket()
        s.settimeout(30)
        s.connect(addr)
        s = ssl_mod.wrap_socket(s, server_hostname=API_HOST)
        
        req = (
            f"POST /api/v1/device-modules HTTP/1.1\r\n"
            f"Host: {API_HOST}\r\n"
            "Content-Type: application/json\r\n"
            f"Content-Length: {len(body)}\r\n"
            "Connection: close\r\n\r\n" + body
        )
        s.send(req.encode())
        
        resp = b""
        while True:
            chunk = s.recv(512)
            if not chunk:
                break
            resp += chunk
        s.close()
        
        # Parse response
        parts = resp.split(b"\r\n\r\n", 1)
        headers = parts[0]
        status = headers.split(b"\r\n", 1)[0].decode()
        body_bytes = parts[1] if len(parts) > 1 else b""
        
        if status.startswith("HTTP/1.1 2") or status.startswith("HTTP/1.0 2"):
            # Handle chunked encoding
            if b"transfer-encoding: chunked" in headers.lower():
                chunks = []
                remaining = body_bytes
                while remaining:
                    if b"\r\n" not in remaining:
                        break
                    size_line, rest = remaining.split(b"\r\n", 1)
                    try:
                        chunk_size = int(size_line.strip(), 16)
                        if chunk_size == 0:
                            break
                        chunk_data = rest[:chunk_size]
                        chunks.append(chunk_data)
                        remaining = rest[chunk_size+2:]
                    except:
                        break
                body_bytes = b"".join(chunks)
            
            try:
                data = json.loads(body_bytes.decode()).get("data", {})
                module_id = data.get("id") or data.get("module_id")
                if module_id:
                    print(f"  ✓ Module registered: {module_id}")
                    return module_id
            except Exception as e:
                print(f"  ✗ JSON parse error: {e}")
        else:
            print(f"  ✗ Failed: {status}")
    except Exception as e:
        print(f"  ✗ Module registration error: {e}")
    
    return None

def Phase2_RegisterDevice():
    """Phase 2: Register device and modules"""
    print("\n" + "=" * 50)
    print("PHASE 2: REGISTER DEVICE & MODULES")
    print("=" * 50)
    
    # Blink 3 times: Starting Phase 2
    blink_led(3, 0.2, 0.2)
    
    config = LoadConfig()
    if not config:
        print("✗ No config found")
        return False
    
    print(f"\n✓ Config loaded:")
    print(f"  SSID: {config['ssid']}")
    print(f"  User ID: {config['user_id']}")
    
    # Connect to WiFi
    if not ConnectWiFi(config["ssid"], config["password"]):
        print("\n✗ Phase 2 failed: WiFi connection")
        return False
    
    # Wait for network to stabilize
    print("\nStabilizing network (20s)...")
    time.sleep(20)
    
    # Register device via HTTPS
    device_id = RegisterDeviceHTTPS(config["user_id"])
    
    if not device_id:
        print("\n✗ Phase 2 failed: device registration")
        return False
    
    config["device_id"] = device_id
    
    # Register modules
    print("\n" + "=" * 50)
    print("REGISTERING MODULES")
    print("=" * 50)
    
    modules = {}
    
    # Register door module
    door_id = RegisterModuleHTTPS(device_id, config["user_id"], "DOOR", "Main Door Sensor")
    if door_id:
        modules["door_id"] = door_id
    
    # Register weather sensor module
    weather_id = RegisterModuleHTTPS(device_id, config["user_id"], "WEATHER_SENSOR", "Outdoor Weather Station")
    if weather_id:
        modules["weather_sensor_id"] = weather_id
    
    # Save everything to config
    config["modules"] = modules
    config["phase"] = "ready"
    SaveConfig(config)
    
    # Verify it was saved
    print("\n📄 Current config:")
    saved_config = LoadConfig()
    if saved_config:
        for key, value in saved_config.items():
            if key == "password":
                print(f"  {key}: ****")
            else:
                print(f"  {key}: {value}")
    
    print("\n✓ Phase 2 complete - device & modules registered!")
    return True

# ==================== PHASE 3: OPERATION ====================

def GetISO8601Timestamp():
    """Generate ISO 8601 timestamp"""
    t = time.localtime()
    return "{:04d}-{:02d}-{:02d}T{:02d}:{:02d}:{:02d}Z".format(
        t[0], t[1], t[2], t[3], t[4], t[5]
    )

def SendDataToAPI(device_id, module_id, data_type, data):
    """Send sensor data to API"""
    if not check_tls():
        return False
    
    # Build payload with data as JSON string
    payload = {
        "device_id": device_id,
        "device_module_id": module_id,
        "timestamp": GetISO8601Timestamp(),
        "data": json.dumps(data)  # Store all sensor data as JSON
    }
    
    body = json.dumps(payload)
    print(f"    Payload: {body[:150]}")
    
    try:
        dns_results = socket.getaddrinfo(API_HOST, API_PORT_HTTPS)
        addr = dns_results[0][-1]
        
        s = socket.socket()
        s.settimeout(10)
        s.connect(addr)
        s = ssl_mod.wrap_socket(s, server_hostname=API_HOST)
        
        req = (
            f"POST /api/v1/device-data HTTP/1.1\r\n"
            f"Host: {API_HOST}\r\n"
            "Content-Type: application/json\r\n"
            f"Content-Length: {len(body)}\r\n"
            "Connection: close\r\n\r\n" + body
        )
        s.send(req.encode())
        
        resp = b""
        while True:
            chunk = s.recv(512)
            if not chunk:
                break
            resp += chunk
        s.close()
        
        # Parse status
        status = resp.split(b"\r\n", 1)[0].decode()
        if "20" in status:
            return True
        else:
            print(f"    ⚠ API response: {status}")
            return False
    except Exception as e:
        print(f"    ✗ Send failed: {e}")
        return False

def GetCommandsFromAPI(device_id):
    """Fetch pending commands from API"""
    if not check_tls():
        return []
    
    try:
        dns_results = socket.getaddrinfo(API_HOST, API_PORT_HTTPS)
        addr = dns_results[0][-1]
        
        s = socket.socket()
        s.settimeout(10)
        s.connect(addr)
        s = ssl_mod.wrap_socket(s, server_hostname=API_HOST)
        
        url_path = f"/api/v1/devices/{device_id}/commands?status=pending"
        print(f"   Request: GET {url_path}")
        
        req = (
            f"GET {url_path} HTTP/1.1\r\n"
            f"Host: {API_HOST}\r\n"
            "Connection: close\r\n\r\n"
        )
        s.send(req.encode())
        
        resp = b""
        while True:
            chunk = s.recv(512)
            if not chunk:
                break
            resp += chunk
        s.close()
        
        # Parse response
        parts = resp.split(b"\r\n\r\n", 1)
        headers = parts[0]
        status = headers.split(b"\r\n", 1)[0].decode()
        body_bytes = parts[1] if len(parts) > 1 else b""
        
        print(f"   Response: {status}")
        
        if "20" in status:
            # Handle chunked encoding
            if b"transfer-encoding: chunked" in headers.lower():
                chunks = []
                remaining = body_bytes
                while remaining:
                    if b"\r\n" not in remaining:
                        break
                    size_line, rest = remaining.split(b"\r\n", 1)
                    try:
                        chunk_size = int(size_line.strip(), 16)
                        if chunk_size == 0:
                            break
                        chunk_data = rest[:chunk_size]
                        chunks.append(chunk_data)
                        remaining = rest[chunk_size+2:]
                    except:
                        break
                body_bytes = b"".join(chunks)
            
            try:
                body_str = body_bytes.decode()
                print(f"   Body: {body_str[:200]}")
                data = json.loads(body_str)
                commands = data.get("data", [])
                print(f"   Parsed: {len(commands) if isinstance(commands, list) else 0} commands")
                return commands if isinstance(commands, list) else []
            except Exception as e:
                print(f"   Parse error: {e}")
                return []
        else:
            print(f"   ⚠ Non-200 status: {status}")
        return []
    except Exception as e:
        print(f"    ✗ Command fetch failed: {e}")
        return []

def ReadDoorStatus():
    """Read door status from LED state"""
    # LED on = door open (1), LED off = door closed (0)
    is_open = led.value()
    status = "open" if is_open else "closed"
    
    print(f"🚪  DOOR:")
    print(f"   Status: {status}")
    print(f"   LED: {'ON' if is_open else 'OFF'}")
    
    return {
        "status": status,
        "is_open": is_open
    }

def ReadWeatherSensorData():
    try:
        sensor.measure()

        c_temperature = sensor.temperature()
        f_temperature = c_temperature * 9 / 5 + 32   # Convert to Fahrenheit
        humidity = sensor.humidity()

        # Mock other values
        pressure = 1013.25
    
        print(f"☀️  WEATHER SENSOR:")
        print(f"   Temperature: {round(f_temperature, 1)}F")
        print(f"   Humidity: {humidity}%")
        print(f"   Pressure: {pressure} hPa")
    
        return {
            "temperature": round(f_temperature, 1),
            "humidity": round(humidity, 1),
            "pressure": pressure
        }
    except Exception as e:
        print("Sensor read error:", e)

def Phase3_Operation():
    """Phase 3: Run operational loop with API communication"""
    print("\n" + "=" * 50)
    print("PHASE 3: OPERATIONAL MODE")
    print("=" * 50)
    
    # Blink 4 times: Starting Phase 3 (operational)
    blink_led(4, 0.2, 0.2)
    # Set initial door state to closed (LED off)
    led.off()
    
    config = LoadConfig()
    if not config or not config.get("device_id"):
        print("✗ No device registered")
        return False
    
    device_id = config['device_id']
    modules = config.get('modules', {})
    
    print(f"\n✓ Device ID: {device_id}")
    if modules:
        print(f"✓ Modules: {list(modules.keys())}")
    
    # Reconnect to WiFi if needed
    wlan = network.WLAN(network.STA_IF)
    if not wlan.isconnected():
        print("\n🔄 Reconnecting to WiFi...")
        if not ConnectWiFi(config["ssid"], config["password"]):
            print("✗ WiFi reconnection failed")
            return False
    
    print("\n📡 Starting sensor monitoring & API sync loop...")
    print("   (Press Ctrl+C to stop)\n")
    
    cycle = 0
    try:
        while True:
            cycle += 1
            print("=" * 50)
            print(f"CYCLE {cycle}")
            print("=" * 50)
            
            # Read door status
            door_data = ReadDoorStatus()
            
            # Send door data to API
            if modules.get("door_id"):
                print("    📤 Sending to API...", end=" ")
                if SendDataToAPI(device_id, modules["door_id"], "door", door_data):
                    print("✓")
                else:
                    print("✗")
            
            print()
            
            # Read weather sensor data
            weather_data = ReadWeatherSensorData()
            
            # Display Weather on LCD
            lcd.clear()
            lcd.putstr(f"Temp: {weather_data["temperature"]}F\nHumi: {weather_data["humidity"]}%")
            
            # Send weather data to API
            if modules.get("weather_sensor_id"):
                print("    📤 Sending to API...", end=" ")
                if SendDataToAPI(device_id, modules["weather_sensor_id"], "weather", weather_data):
                    print("✓")
                else:
                    print("✗")
            
            # Check for pending commands every cycle (5 seconds) for faster response
            print("\n📥 Checking for commands...")
            commands = GetCommandsFromAPI(device_id)
            if commands:
                print(f"   Found {len(commands)} command(s):")
                for cmd in commands:
                    print(f"\n   ╔══ COMMAND RECEIVED ══")
                    print(f"   ║ ID: {cmd.get('id', 'N/A')}")
                    print(f"   ║ Command: {cmd.get('command', 'N/A')}")
                    print(f"   ║ Device Module ID: {cmd.get('device_module_id', 'N/A')}")
                    print(f"   ║ Module Type: {cmd.get('module_type', 'N/A')}")
                    print(f"   ║ Status: {cmd.get('status', 'N/A')}")
                    print(f"   ║ Params: {cmd.get('params', {})}")
                    print(f"   ╚══════════════════════\n")
                    
                    # Execute command based on type
                    command_name = cmd.get('command', '')
                    cmd_module_id = cmd.get('device_module_id', '')
                    
                    # Match command to correct module
                    if command_name == 'OPEN_DOOR' and cmd_module_id == modules.get("door_id"):
                        print(f"   🚪 Executing: Open door (Module: {cmd_module_id})")
                        led.on()
                        print(f"      ✓ Door opened (LED ON)")
                        # Send updated status immediately
                        door_data = ReadDoorStatus()
                        if modules.get("door_id"):
                            print("      📤 Sending updated status...", end=" ")
                            if SendDataToAPI(device_id, modules["door_id"], "door", door_data):
                                print("✓")
                            else:
                                print("✗")
                    elif command_name == 'CLOSE_DOOR' and cmd_module_id == modules.get("door_id"):
                        print(f"   🚪 Executing: Close door (Module: {cmd_module_id})")
                        led.off()
                        print(f"      ✓ Door closed (LED OFF)")
                        # Send updated status immediately
                        door_data = ReadDoorStatus()
                        if modules.get("door_id"):
                            print("      📤 Sending updated status...", end=" ")
                            if SendDataToAPI(device_id, modules["door_id"], "door", door_data):
                                print("✓")
                            else:
                                print("✗")
                    elif command_name == 'BLINK_PICO1':
                        params = cmd.get('params', {})
                        n = params.get('n', 3)
                        on_time = params.get('on_time', 0.2)
                        off_time = params.get('off_time', 0.2)
                        print(f"   🔵 Executing: Blink LED {n} times")
                        print(f"      On: {on_time}s, Off: {off_time}s")
                        # Save current door state
                        door_was_open = led.value()
                        blink_led(n, on_time, off_time)
                        # Restore door state after blinking
                        if door_was_open:
                            led.on()
                        else:
                            led.off()
                    elif command_name == 'CHANGE_WIFI':
                        params = cmd.get('params', {})
                        new_ssid = params.get('ssid', '')
                        new_password = params.get('password', '')
                        if new_ssid and new_password:
                            print(f"   📶 Executing: Change WiFi to '{new_ssid}'")
                            # Update config with new credentials
                            config['ssid'] = new_ssid
                            config['password'] = new_password
                            if SaveConfig(config):
                                print(f"      ✓ WiFi credentials updated in config")
                                print(f"      🔄 Restarting to apply new WiFi...")
                                time.sleep(2)
                                machine.reset()
                            else:
                                print(f"      ✗ Failed to save new credentials")
                        else:
                            print(f"   ⚠️  Missing ssid or password in CHANGE_WIFI command")
                    else:
                        if command_name in ['OPEN_DOOR', 'CLOSE_DOOR']:
                            print(f"   ⚠️  Door command for different module (Expected: {modules.get('door_id')}, Got: {cmd_module_id})")
                        else:
                            print(f"   ⚠️  Unknown command: {command_name}")
            else:
                print("   No pending commands")
            
            print("\n⏱️  Waiting 5 seconds...\n")
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n\n⏹  Stopped by user")
        return True

# ==================== MAIN ====================

def main():
    print("\n" + "=" * 50)
    print("PICO SIMPLE STARTUP")
    print("=" * 50)
    
    # Check if we have config
    config = LoadConfig()
    
    if not config:
        print("\n→ No config found, starting Phase 1...")
        Phase1_GetCredentials()
    elif config.get("phase") == "credentials_saved":
        print(f"\n→ Config exists (phase: {config.get('phase')})")
        print("   Starting Phase 2...")
        Phase2_RegisterDevice()
    elif config.get("phase") == "ready":
        print(f"\n→ Device ready (phase: {config.get('phase')})")
        print("   Starting Phase 3...")
        Phase3_Operation()
    else:
        print(f"\n→ Unknown phase: {config.get('phase')}")
        print("   Starting Phase 2...")
        Phase2_RegisterDevice()

if __name__ == "__main__":
    main()
