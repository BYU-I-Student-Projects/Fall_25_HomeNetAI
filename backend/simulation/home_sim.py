import random
import time
from datetime import datetime

class SmartHomeSimulator:
    def __init__(self):
        self.temperature = 72.0  # °F starting value
        self.humidity = 45.0     # % starting value
        self.window_open = False
        self.motion = 0
        self.energy_usage = 0.5  # kWh baseline

    def update_temperature(self):
        """Simulate temperature drift."""
        drift = random.uniform(-0.5, 0.5)
        if self.window_open:
            drift += random.uniform(-1.0, 1.0)  # more variation if window open
        self.temperature = max(60, min(85, self.temperature + drift))

    def update_humidity(self):
        """Simulate humidity change."""
        drift = random.uniform(-0.5, 0.5)
        self.humidity = max(25, min(70, self.humidity + drift))

    def update_motion(self):
        """Random motion detection (binary)."""
        self.motion = 1 if random.random() < 0.2 else 0  # 20% chance motion

    def update_energy(self):
        """Simulate random energy consumption spikes."""
        base = 0.3
        if self.motion:  # more usage if motion detected
            base += random.uniform(0.2, 1.5)
        self.energy_usage = round(base, 2)

    def update_window(self):
        """10% chance to toggle window state each tick."""
        if random.random() < 0.3:
            self.window_open = not self.window_open

    def generate_data(self):
        """Generate one snapshot of simulated smart home data."""
        self.update_window()
        self.update_temperature()
        self.update_humidity()
        self.update_motion()
        self.update_energy()

        return {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "temperature": round(self.temperature, 1),
            "humidity": round(self.humidity, 1),
            "window_open": self.window_open,
            "motion": self.motion,
            "energy_usage": self.energy_usage
        }


def run_simulation(interval=2, steps=10):
    """Run the simulation and print results."""
    sim = SmartHomeSimulator()
    for _ in range(steps):
        datapoint = sim.generate_data()
        print(datapoint)
        time.sleep(interval)


if __name__ == "__main__":
    run_simulation(interval=2, steps=10)
