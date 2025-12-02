import requests
import json

def test_weather_api():
    # First login to get token
    login_url = "http://localhost:8000/auth/login"
    # Assuming a user exists, or I need to register one.
    # I'll try to register a test user first.
    
    register_url = "http://localhost:8000/auth/register"
    user_data = {
        "username": "testuser_weather_debug",
        "email": "test_debug@example.com",
        "password": "password123"
    }
    
    try:
        requests.post(register_url, json=user_data)
    except:
        pass # User might exist

    # Login
    response = requests.post(login_url, json={"username": "testuser_weather_debug", "password": "password123"})
    if response.status_code != 200:
        print("Login failed")
        return

    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get locations
    loc_response = requests.get("http://localhost:8000/locations", headers=headers)
    locations = loc_response.json()["locations"]
    
    if not locations:
        # Add a location
        add_loc_url = "http://localhost:8000/locations"
        loc_data = {
            "name": "New York",
            "latitude": 40.7128,
            "longitude": -74.0060
        }
        requests.post(add_loc_url, json=loc_data, headers=headers)
        # Fetch again
        loc_response = requests.get("http://localhost:8000/locations", headers=headers)
        locations = loc_response.json()["locations"]

    if not locations:
        print("No locations found even after adding")
        return

    location_id = locations[0]["id"]
    print(f"Testing weather for location ID: {location_id}")

    # Get weather
    weather_url = f"http://localhost:8000/weather/{location_id}"
    weather_response = requests.get(weather_url, headers=headers)
    
    print("Status Code:", weather_response.status_code)
    print("Response JSON:")
    print(json.dumps(weather_response.json(), indent=2))

if __name__ == "__main__":
    test_weather_api()
