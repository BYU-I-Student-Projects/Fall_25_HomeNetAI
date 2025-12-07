package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

const (
	PICO_PASSWORD = "12345678" // Default Pico AP password
	PICO_IP       = "192.168.4.1"
	PICO_PORT     = "80"
)

// Styles
var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("205")).
			MarginBottom(1)

	selectedStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("170")).
			Bold(true).
			PaddingLeft(2)

	normalStyle = lipgloss.NewStyle().
			PaddingLeft(4)

	errorStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("196")).
			Bold(true)

	successStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("42")).
			Bold(true)

	inputStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("86"))

	promptStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("205")).
			Bold(true)
)

type step int

const (
	stepEnteringUsername step = iota
	stepEnteringLoginPassword
	stepLoggingIn
	stepListingPicos
	stepSelectingPico
	stepConnectingToPico
	stepEnteringSSID
	stepEnteringPassword
	stepSendingCredentials
	stepComplete
)

type network struct {
	SSID   string
	Signal string
	IsPico bool
}

type model struct {
	step         step
	networks     []network
	picoNetworks []network
	cursor       int
	selectedPico *network
	username     string
	loginPass    string
	userID       string
	authToken    string
	homeSSID     string
	homePassword string
	currentInput string
	message      string
	quitting     bool
	scanAttempts int
}

type networksFoundMsg []network
type connectionSuccessMsg struct{}
type sendSuccessMsg struct{}
type scanTickMsg struct{}
type loginSuccessMsg struct {
	userID string
	token  string
}
type errMsg struct{ err error }

func (e errMsg) Error() string { return e.err.Error() }

func initialModel() model {
	return model{
		step:         stepEnteringUsername,
		networks:     []network{},
		picoNetworks: []network{},
		cursor:       0,
		scanAttempts: 0,
	}
}

func (m model) Init() tea.Cmd {
	return nil
}

func tickScan() tea.Cmd {
	return tea.Tick(3*time.Second, func(t time.Time) tea.Msg {
		return scanTickMsg{}
	})
}

func loginUser(username, password string) tea.Cmd {
	return func() tea.Msg {
		client := &http.Client{Timeout: 10 * time.Second}

		payload := map[string]string{
			"username": username,
			"password": password,
		}

		jsonData, _ := json.Marshal(payload)
		loginURL := "https://iot-picopi-module.onrender.com/api/v1/auth/login"

		req, _ := http.NewRequest("POST", loginURL, bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			return errMsg{fmt.Errorf("authentication required - create an account at our website to proceed")}
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return errMsg{fmt.Errorf("authentication required - create an account at our website to proceed")}
		}

		var result map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return errMsg{fmt.Errorf("authentication required - create an account at our website to proceed")}
		}

		// Check if response has success field
		success, _ := result["success"].(bool)
		if !success {
			return errMsg{fmt.Errorf("authentication required - create an account at our website to proceed")}
		}

		userID, ok := result["user_id"].(string)
		if !ok || userID == "" {
			return errMsg{fmt.Errorf("authentication required - create an account at our website to proceed")}
		}

		// Token is optional, use empty string if not provided
		token, _ := result["token"].(string)

		return loginSuccessMsg{userID: userID, token: token}
	}
}

func listNetworks() tea.Msg {
	cmd := exec.Command("netsh", "wlan", "show", "networks", "mode=bssid")
	output, err := cmd.Output()
	if err != nil {
		return errMsg{fmt.Errorf("failed to list networks: %w", err)}
	}

	networks := parseNetworks(string(output))
	return networksFoundMsg(networks)
}

func parseNetworks(output string) []network {
	var networks []network
	lines := strings.Split(output, "\n")

	var currentSSID string
	var currentSignal string
	picoPattern := regexp.MustCompile(`(?i)^Pico-[0-9a-fA-F]+$`)

	for _, line := range lines {
		line = strings.TrimSpace(line)

		if strings.HasPrefix(line, "SSID") && !strings.Contains(line, "BSSID") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				ssid := strings.TrimSpace(parts[1])
				if ssid != "" {
					currentSSID = ssid
				}
			}
		}

		if strings.HasPrefix(line, "Signal") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				currentSignal = strings.TrimSpace(parts[1])
			}
		}

		if currentSSID != "" && currentSignal != "" {
			isPico := picoPattern.MatchString(currentSSID)
			networks = append(networks, network{
				SSID:   currentSSID,
				Signal: currentSignal,
				IsPico: isPico,
			})
			currentSSID = ""
			currentSignal = ""
		}
	}

	return networks
}

func connectToNetwork(ssid, password string) tea.Cmd {
	return func() tea.Msg {
		profileXML := fmt.Sprintf(`<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
	<name>%s</name>
	<SSIDConfig>
		<SSID>
			<name>%s</name>
		</SSID>
	</SSIDConfig>
	<connectionType>ESS</connectionType>
	<connectionMode>auto</connectionMode>
	<MSM>
		<security>
			<authEncryption>
				<authentication>WPA2PSK</authentication>
				<encryption>AES</encryption>
				<useOneX>false</useOneX>
			</authEncryption>
			<sharedKey>
				<keyType>passPhrase</keyType>
				<protected>false</protected>
				<keyMaterial>%s</keyMaterial>
			</sharedKey>
		</security>
	</MSM>
</WLANProfile>`, ssid, ssid, password)

		tmpFile, _ := os.CreateTemp("", "wifi-profile-*.xml")
		defer os.Remove(tmpFile.Name())
		tmpFile.WriteString(profileXML)
		tmpFile.Close()

		exec.Command("netsh", "wlan", "add", "profile", fmt.Sprintf("filename=%s", tmpFile.Name()), "user=all").Run()
		exec.Command("netsh", "wlan", "connect", fmt.Sprintf("name=%s", ssid)).Run()

		for i := 0; i < 15; i++ {
			time.Sleep(1 * time.Second)
			output, err := exec.Command("netsh", "wlan", "show", "interfaces").Output()
			if err == nil && strings.Contains(string(output), ssid) && strings.Contains(string(output), "connected") {
				return connectionSuccessMsg{}
			}
		}

		return errMsg{fmt.Errorf("connection timeout")}
	}
}

func sendCredentials(ssid, password, userID string) tea.Cmd {
	return func() tea.Msg {
		client := &http.Client{Timeout: 15 * time.Second}

		checkURL := fmt.Sprintf("http://%s:%s/", PICO_IP, PICO_PORT)
		resp, err := client.Get(checkURL)
		if err != nil {
			return errMsg{fmt.Errorf("Pico not reachable: %w", err)}
		}
		resp.Body.Close()

		payload := map[string]string{
			"ssid":     ssid,
			"password": password,
			"user_id":  userID,
		}

		jsonData, _ := json.Marshal(payload)

		credURL := fmt.Sprintf("http://%s:%s/credentials", PICO_IP, PICO_PORT)
		req, _ := http.NewRequest("POST", credURL, bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		resp, err = client.Do(req)
		if err != nil {
			return errMsg{fmt.Errorf("failed to send: %w", err)}
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			return errMsg{fmt.Errorf("Pico returned %d: %s", resp.StatusCode, string(body))}
		}

		return sendSuccessMsg{}
	}
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			m.quitting = true
			return m, tea.Quit

		case "up", "k":
			if m.step == stepSelectingPico && m.cursor > 0 {
				m.cursor--
			}

		case "down", "j":
			if m.step == stepSelectingPico && m.cursor < len(m.picoNetworks)-1 {
				m.cursor++
			}

		case "backspace":
			if len(m.currentInput) > 0 {
				m.currentInput = m.currentInput[:len(m.currentInput)-1]
			}

		default:
			if m.step == stepEnteringUsername || m.step == stepEnteringLoginPassword || m.step == stepEnteringSSID || m.step == stepEnteringPassword {
				m.currentInput += msg.String()
			}

		case "enter":
			switch m.step {
			case stepEnteringUsername:
				if m.currentInput != "" {
					m.username = m.currentInput
					m.currentInput = ""
					m.step = stepEnteringLoginPassword
				}

			case stepEnteringLoginPassword:
				if m.currentInput != "" {
					m.loginPass = m.currentInput
					m.currentInput = ""
					m.step = stepLoggingIn
					m.message = "Logging in..."
					return m, loginUser(m.username, m.loginPass)
				}

			case stepSelectingPico:
				if len(m.picoNetworks) > 0 {
					m.selectedPico = &m.picoNetworks[m.cursor]
					m.step = stepConnectingToPico
					m.message = fmt.Sprintf("Connecting to %s...", m.selectedPico.SSID)
					return m, connectToNetwork(m.selectedPico.SSID, PICO_PASSWORD)
				}

			case stepEnteringSSID:
				if m.currentInput != "" {
					m.homeSSID = m.currentInput
					m.currentInput = ""
					m.step = stepEnteringPassword
				}

			case stepEnteringPassword:
				if m.currentInput != "" {
					m.homePassword = m.currentInput
					m.currentInput = ""
					m.step = stepSendingCredentials
					m.message = "Sending credentials..."
					return m, sendCredentials(m.homeSSID, m.homePassword, m.userID)
				}

			case stepComplete:
				m.quitting = true
				return m, tea.Quit
			}
		}

	case loginSuccessMsg:
		m.userID = msg.userID
		m.authToken = msg.token
		m.step = stepListingPicos
		m.message = successStyle.Render("✓ Logged in as " + m.username)
		return m, listNetworks

	case networksFoundMsg:
		m.networks = []network(msg)
		m.scanAttempts++
		m.picoNetworks = []network{}

		for _, net := range m.networks {
			if net.IsPico {
				m.picoNetworks = append(m.picoNetworks, net)
			}
		}

		if len(m.picoNetworks) == 0 {
			return m, tickScan()
		} else {
			m.step = stepSelectingPico
		}

	case scanTickMsg:
		return m, listNetworks

	case connectionSuccessMsg:
		m.step = stepEnteringSSID
		m.message = successStyle.Render("✓ Connected to Pico!")

	case sendSuccessMsg:
		m.step = stepComplete
		m.message = successStyle.Render("✓ Credentials sent!\nPico is connecting...")

	case errMsg:
		m.message = errorStyle.Render("✗ " + msg.err.Error())
		m.step = stepListingPicos
		return m, tea.Tick(2*time.Second, func(time.Time) tea.Msg { return scanTickMsg{} })
	}

	return m, nil
}

func (m model) View() string {
	if m.quitting {
		return ""
	}

	var s strings.Builder

	s.WriteString(titleStyle.Render("🔧 Pico WiFi Setup Tool\n\n"))

	switch m.step {
	case stepEnteringUsername:
		s.WriteString(promptStyle.Render("Enter your username:\n"))
		s.WriteString(inputStyle.Render("> " + m.currentInput))
		s.WriteString("\n\nPress Enter\n")

	case stepEnteringLoginPassword:
		s.WriteString(promptStyle.Render("Enter your password:\n"))
		s.WriteString(inputStyle.Render("> " + strings.Repeat("•", len(m.currentInput))))
		s.WriteString("\n\nPress Enter\n")

	case stepLoggingIn:
		s.WriteString(m.message + "\n")

	case stepListingPicos:
		if m.message != "" {
			s.WriteString(m.message + "\n\n")
		}
		dots := strings.Repeat(".", (m.scanAttempts%3)+1)
		s.WriteString(fmt.Sprintf("Scanning for Pico devices%s\n", dots))
		s.WriteString("(Press q to quit)\n")

	case stepSelectingPico:
		s.WriteString(promptStyle.Render("Select a Pico device:\n\n"))

		for i, net := range m.picoNetworks {
			cursor := " "
			style := normalStyle
			if m.cursor == i {
				cursor = ">"
				style = selectedStyle
			}
			s.WriteString(fmt.Sprintf("%s %s (%s)\n", cursor, style.Render(net.SSID), net.Signal))
		}

		s.WriteString("\nUse ↑/↓, Enter to connect, q to quit\n")

	case stepConnectingToPico:
		s.WriteString(m.message + "\n")

	case stepEnteringSSID:
		s.WriteString(promptStyle.Render("Enter home WiFi SSID:\n"))
		s.WriteString(inputStyle.Render("> " + m.currentInput))
		s.WriteString("\n\nPress Enter\n")

	case stepEnteringPassword:
		s.WriteString(promptStyle.Render("Enter WiFi password:\n"))
		s.WriteString(inputStyle.Render("> " + strings.Repeat("•", len(m.currentInput))))
		s.WriteString("\n\nPress Enter\n")

	case stepSendingCredentials:
		s.WriteString(m.message + "\n")

	case stepComplete:
		s.WriteString(m.message + "\n")
		s.WriteString("\nPress Enter to exit\n")
	}

	return s.String()
}

func main() {
	p := tea.NewProgram(initialModel())
	if _, err := p.Run(); err != nil {
		fmt.Println("Error:", err)
		os.Exit(1)
	}
}
