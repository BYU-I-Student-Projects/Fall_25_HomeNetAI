package httpHandler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"iot-server/usecases"
	"iot-server/ws"

	"github.com/gin-gonic/gin"
)

type CommandHandler struct {
	wsMgr *ws.Manager
	cmdUC *usecases.CommandsUseCase
}

func NewCommandHandler(mgr *ws.Manager, uc *usecases.CommandsUseCase) *CommandHandler {
	return &CommandHandler{wsMgr: mgr, cmdUC: uc}
}

type enqueueReq struct {
	DeviceID       string                 `json:"device_id"`
	DeviceModuleID string                 `json:"device_module_id"` // NEW: target specific module
	Command        string                 `json:"command"`
	Params         map[string]interface{} `json:"params"`
}

// POST /api/v1/commands
// Enqueue a command and, if device is connected via WS, push immediately
func (h *CommandHandler) Enqueue(c *gin.Context) {
	var req enqueueReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	cmd, err := h.cmdUC.Enqueue(req.DeviceID, req.DeviceModuleID, req.Command, req.Params)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := "queued"
	// Try to send via WS if connected
	if h.wsMgr != nil && h.wsMgr.IsConnected(req.DeviceID) {
		env := map[string]interface{}{
			"type":             "command",
			"command_id":       cmd.ID,
			"device_module_id": req.DeviceModuleID,
			"command":          req.Command,
			"params":           req.Params,
			"timestamp":        time.Now().UTC().Format(time.RFC3339Nano),
		}
		b, _ := json.Marshal(env)
		if err := h.wsMgr.SendToDevice(req.DeviceID, b); err == nil {
			_ = h.cmdUC.MarkSent([]string{cmd.ID})
			status = "sent"
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": status, "command": cmd})
}

// GET /api/v1/commands/poll?device_id=...&limit=...
// Devices call this to fetch pending commands when WS isn't available
func (h *CommandHandler) Poll(c *gin.Context) {
	deviceID := c.Query("device_id")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "device_id required"})
		return
	}
	// optional limit
	limit := 10
	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}
	cmds, err := h.cmdUC.Poll(deviceID, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// mark as sent so they aren't re-delivered endlessly
	ids := make([]string, 0, len(cmds))
	safe := make([]map[string]interface{}, 0, len(cmds))
	for _, c0 := range cmds {
		ids = append(ids, c0.ID)
		// parse params JSON
		var p interface{}
		if c0.Params != "" && json.Valid([]byte(c0.Params)) {
			_ = json.Unmarshal([]byte(c0.Params), &p)
		} else {
			p = map[string]interface{}{}
		}
		safe = append(safe, map[string]interface{}{
			"id":               c0.ID,
			"type":             "command",
			"device_module_id": c0.DeviceModuleID,
			"command":          c0.Command,
			"params":           p,
			"timestamp":        time.Now().UTC().Format(time.RFC3339Nano),
		})
	}
	_ = h.cmdUC.MarkSent(ids)
	c.JSON(http.StatusOK, gin.H{"data": safe, "count": len(safe)})
}

// GET /api/v1/devices/:id/commands?status=pending
// REST endpoint for fetching device commands
func (h *CommandHandler) GetDeviceCommands(c *gin.Context) {
	deviceID := c.Param("id")
	status := c.DefaultQuery("status", "pending")

	// optional limit
	limit := 10
	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}

	// For now, only support pending status
	if status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only status=pending is supported"})
		return
	}

	cmds, err := h.cmdUC.Poll(deviceID, limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// mark as sent and format response
	ids := make([]string, 0, len(cmds))
	safe := make([]map[string]interface{}, 0, len(cmds))
	for _, c0 := range cmds {
		ids = append(ids, c0.ID)
		// parse params JSON
		var p interface{}
		if c0.Params != "" && json.Valid([]byte(c0.Params)) {
			_ = json.Unmarshal([]byte(c0.Params), &p)
		} else {
			p = map[string]interface{}{}
		}
		safe = append(safe, map[string]interface{}{
			"id":               c0.ID,
			"command":          c0.Command,
			"device_module_id": c0.DeviceModuleID,
			"module_type":      "",
			"status":           "pending",
			"params":           p,
		})
	}
	_ = h.cmdUC.MarkSent(ids)
	c.JSON(http.StatusOK, gin.H{"data": safe, "count": len(safe)})
}

type ackReq struct {
	CommandID string `json:"command_id"`
	Status    string `json:"status"`
	Message   string `json:"message"`
}

// POST /api/v1/command-responses
// Device acknowledges command execution
func (h *CommandHandler) Ack(c *gin.Context) {
	var req ackReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}
	resp := req.Message
	// store as simple JSON string
	if resp == "" {
		resp = "{}"
	} else {
		b, _ := json.Marshal(map[string]string{"message": resp})
		resp = string(b)
	}
	if err := h.cmdUC.Ack(req.CommandID, req.Status, resp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

type changeWiFiReq struct {
	DeviceID string `json:"device_id" binding:"required"`
	SSID     string `json:"ssid" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// POST /api/v1/devices/:id/change-wifi
// Send command to device to change WiFi credentials
func (h *CommandHandler) ChangeWiFiCredentials(c *gin.Context) {
	deviceID := c.Param("id")

	var req changeWiFiReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}

	// Override deviceID from URL param
	req.DeviceID = deviceID

	// Create command params
	params := map[string]interface{}{
		"ssid":     req.SSID,
		"password": req.Password,
	}

	// Enqueue CHANGE_WIFI command
	cmd, err := h.cmdUC.Enqueue(req.DeviceID, "", "CHANGE_WIFI", params)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := "queued"
	// Try to send via WS if connected
	if h.wsMgr != nil && h.wsMgr.IsConnected(req.DeviceID) {
		env := map[string]interface{}{
			"type":             "command",
			"command_id":       cmd.ID,
			"device_module_id": cmd.DeviceModuleID,
			"command":          cmd.Command,
			"params":           params,
			"timestamp":        time.Now().UTC().Format(time.RFC3339Nano),
		}
		b, _ := json.Marshal(env)
		if err := h.wsMgr.SendToDevice(req.DeviceID, b); err == nil {
			_ = h.cmdUC.MarkSent([]string{cmd.ID})
			status = "sent"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "WiFi change command sent",
		"command_id": cmd.ID,
		"status":     status,
	})
}
