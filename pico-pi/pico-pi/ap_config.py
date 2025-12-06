import network
import socket
import json
import time
import os
import ubinascii


def _gen_ap_ssid():
    try:
        rand = os.urandom(3)
    except Exception:
        # Fallback if os.urandom not available
        t = int(time.ticks_ms() & 0xFFFFFF)
        rand = bytes([(t >> 16) & 0xFF, (t >> 8) & 0xFF, t & 0xFF])
    code = ubinascii.hexlify(rand).decode().upper()
    return "Pico-" + code


def _send_response(cl, status_code=200, body=b"OK", content_type="text/plain"):
    try:
        headers = (
            "HTTP/1.1 %d OK\r\n" % status_code +
            "Connection: close\r\n" +
            "Access-Control-Allow-Origin: *\r\n" +
            "Content-Type: %s\r\n" % content_type +
            "Content-Length: %d\r\n\r\n" % len(body)
        )
        cl.send(headers.encode() + body)
    except Exception:
        try:
            cl.close()
        except:
            pass


def _parse_request(raw):
    try:
        head, body = raw.split("\r\n\r\n", 1)
    except ValueError:
        head, body = raw, ""
    lines = head.split("\r\n")
    request_line = lines[0] if lines else ""
    parts = request_line.split(" ")
    method = parts[0] if len(parts) > 0 else ""
    path = parts[1] if len(parts) > 1 else ""
    headers = {}
    for ln in lines[1:]:
        if ":" in ln:
            k, v = ln.split(":", 1)
            headers[k.strip().lower()] = v.strip()
    return method, path, headers, body


def _parse_body(body, content_type):
    if content_type and content_type.startswith("application/json"):
        try:
            return json.loads(body or "{}")
        except Exception:
            return None
    # default: x-www-form-urlencoded
    params = {}
    for part in (body or "").split("&"):
        if "=" in part:
            k, v = part.split("=", 1)
            params[k] = v
    return params


def listen_for_credentials(timeout_seconds=300):
    """
    Start AP mode with SSID Pico-XXX and listen on http://192.168.4.1/credentials
    for a POST body containing {ssid, password, user_id?} either as form or JSON.
    Returns a credentials dict or None on timeout/error.
    """
    ssid = _gen_ap_ssid()
    ap = network.WLAN(network.AP_IF)
    ap.active(True)
    # Use WPA2 passphrase to avoid open AP issues; 8+ chars required
    try:
        ap.config(essid=ssid, password="12345678")
    except Exception:
        # Some firmwares require active(True) before config; already set
        pass

    ip, netmask, gateway, dns = ap.ifconfig()
    print("AP ONLINE:", ssid, ip)
    print("POST credentials to: http://%s/credentials" % ip)

    # Prepare socket
    addr = socket.getaddrinfo("0.0.0.0", 80)[0][-1]
    s = socket.socket()
    try:
        try:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        except Exception:
            pass
        s.bind(addr)
        s.listen(2)
        print("HTTP server listening on", addr)
    except Exception as e:
        print("HTTP server error:", e)
        try:
            s.close()
        except:
            pass
        return None

    creds = None
    deadline = time.time() + timeout_seconds
    try:
        while time.time() < deadline and creds is None:
            try:
                cl, caddr = s.accept()
            except Exception:
                time.sleep(0.1)
                continue
            print("Client:", caddr)
            req = b""
            try:
                chunk = cl.recv(2048)
                req = chunk or b""
            except Exception as e:
                print("recv error:", e)
                try:
                    cl.close()
                except:
                    pass
                continue

            # MicroPython may not support keyword args for decode; use positional
            try:
                text = req.decode('utf-8', 'ignore')
            except Exception:
                try:
                    text = req.decode()
                except Exception:
                    text = ''
            method, path, headers, body = _parse_request(text)
            if method == "GET" and path == "/":
                _send_response(cl, 200, b"READY")
                cl.close()
                continue
            if method == "POST" and path == "/credentials":
                ct = headers.get("content-type", "application/x-www-form-urlencoded")
                data = _parse_body(body, ct)
                if isinstance(data, dict) and ("ssid" in data) and ("password" in data):
                    # Optional user_id
                    creds = {
                        "ssid": data.get("ssid"),
                        "password": data.get("password"),
                        "user_id": data.get("user_id") or data.get("uid") or data.get("user")
                    }
                    print("Received credentials for:", creds.get("ssid"))
                    _send_response(cl, 200, b"OK")
                else:
                    _send_response(cl, 400, b"ERROR")
                cl.close()
                continue
            _send_response(cl, 404, b"NOT FOUND")
            cl.close()
    finally:
        try:
            s.close()
        except:
            pass
        # Keep AP on for a short grace, then turn off
        time.sleep(0.5)
        try:
            ap.active(False)
        except Exception:
            pass

    return creds
