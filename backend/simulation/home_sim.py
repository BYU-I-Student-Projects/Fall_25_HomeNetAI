import random
import time
from datetime import datetime

class SmartHomeSimulator:
    def __init__(self):
        self.temperature = 72.0  # °F starting value
        self.humidity = 45.0     # % starting value
<<<<<<< HEAD
        self.window_open = False
        self.motion = 0
        self.energy_usage = 0.5  # kWh baseline

    def update_temperature(self):
        """Simulate temperature drift."""
        drift = random.uniform(-0.5, 0.5)
        if self.window_open:
            drift += random.uniform(-1.0, 1.0)  # more variation if window open
=======
        self.front_door_open = False
        self.back_door_open = False
        self.windows = [False, False, False]  # three windows

    def time_effect_on_temperature(self):
        """Slight temperature drift based on time of day."""
        hour = datetime.now().hour
        if 6 <= hour < 12:   # morning warms up slightly
            return 0.05
        elif 12 <= hour < 18:  # afternoon warmer
            return 0.1
        elif 18 <= hour < 22:  # evening cools
            return -0.05
        else:  # night cooler
            return -0.3

    def update_temperature(self):
        """Simulate temperature drift with time and open windows/doors."""
        drift = random.uniform(-0.5, 0.5)
        drift += self.time_effect_on_temperature()

        # More variation if any window/door is open
        if any(self.windows) or self.front_door_open or self.back_door_open:
            drift += random.uniform(-1.0, 1.0)

>>>>>>> 4e31b81aea588dd75147cd5a21c63e22c24e0cc0
        self.temperature = max(60, min(85, self.temperature + drift))

    def update_humidity(self):
        """Simulate humidity change."""
        drift = random.uniform(-0.5, 0.5)
<<<<<<< HEAD
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
=======

        # If doors/windows open, outside air raises variability & humidity
        if any(self.windows) or self.front_door_open or self.back_door_open:
            drift += random.uniform(0.2, 1.0)

        self.humidity = max(25, min(70, self.humidity + drift))

    def update_doors_and_windows(self):
        """Chance to toggle door/window states."""
        if random.random() < 0.1:
            self.front_door_open = not self.front_door_open
        if random.random() < 0.1:
            self.back_door_open = not self.back_door_open
        for i in range(len(self.windows)):
            if random.random() < 0.2:
                self.windows[i] = not self.windows[i]

    def generate_data(self):
        """Generate one snapshot of simulated smart home data."""
        self.update_doors_and_windows()
        self.update_temperature()
        self.update_humidity()
>>>>>>> 4e31b81aea588dd75147cd5a21c63e22c24e0cc0

        return {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "temperature": round(self.temperature, 1),
            "humidity": round(self.humidity, 1),
<<<<<<< HEAD
            "window_open": self.window_open,
            "motion": self.motion,
            "energy_usage": self.energy_usage
=======
            "front_door_open": self.front_door_open,
            "back_door_open": self.back_door_open,
            "windows": self.windows[:]
>>>>>>> 4e31b81aea588dd75147cd5a21c63e22c24e0cc0
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
