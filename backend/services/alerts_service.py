"""
Smart Alerts Service - ML-driven weather alerts and recommendations
Provides actionable insights based on weather predictions and patterns
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import statistics
from database.database import Database
from services.analytics_service import AnalyticsService

class AlertsService:
    def __init__(self):
        self.db = Database()
        self.analytics = AnalyticsService()
    
    def get_active_alerts(self, location_id: int, user_id: int) -> List[Dict[str, Any]]:
        """Get all active alerts and recommendations for a location"""
        alerts = []
        
        # Get weather data for analysis
        weather_data = self._get_recent_weather(location_id)
        forecast_data = self._get_forecast_weather(location_id)
        
        if not weather_data or not forecast_data:
            return []
        
        # Generate different types of alerts
        alerts.extend(self._check_precipitation_alerts(weather_data, forecast_data))
        alerts.extend(self._check_temperature_alerts(weather_data, forecast_data))
        alerts.extend(self._check_comfort_recommendations(weather_data, forecast_data))
        alerts.extend(self._check_anomaly_alerts(location_id, weather_data))
        alerts.extend(self._check_wind_alerts(weather_data, forecast_data))
        alerts.extend(self._check_uv_alerts(forecast_data))
        
        # Sort by severity and timestamp
        severity_order = {'critical': 0, 'warning': 1, 'info': 2, 'recommendation': 3}
        alerts.sort(key=lambda x: (severity_order.get(x['severity'], 999), x['timestamp']))
        
        return alerts
    
    def _get_recent_weather(self, location_id: int) -> Optional[Dict[str, Any]]:
        """Get recent weather data (last 24 hours)"""
        query = """
            SELECT temperature, humidity, precipitation, windspeed, 
                   apparent_temperature, pressure, cloud_cover, timestamp
            FROM weather_data
            WHERE location_id = %s 
            AND timestamp >= NOW() - INTERVAL '24 hours'
            ORDER BY timestamp DESC
            LIMIT 24
        """
        results = self.db.execute_query(query, (location_id,))
        
        if not results:
            return None
        
        return {
            'current': results[0] if results else None,
            'recent': results
        }
    
    def _get_forecast_weather(self, location_id: int) -> Optional[Dict[str, Any]]:
        """Get forecast weather data (next 24 hours)"""
        query = """
            SELECT temperature, humidity, precipitation, windspeed,
                   apparent_temperature, timestamp
            FROM weather_data
            WHERE location_id = %s 
            AND timestamp >= NOW()
            AND timestamp <= NOW() + INTERVAL '24 hours'
            ORDER BY timestamp ASC
            LIMIT 24
        """
        results = self.db.execute_query(query, (location_id,))
        
        return results if results else []
    
    def _check_precipitation_alerts(self, weather_data: Dict, forecast_data: List) -> List[Dict]:
        """Check for rain/precipitation alerts"""
        alerts = []
        
        # Check upcoming rain in next 6 hours
        next_6_hours = [f for f in forecast_data[:6] if f]
        rain_forecast = [f for f in next_6_hours if f.get('precipitation', 0) > 0.1]
        
        if rain_forecast:
            total_rain = sum(f.get('precipitation', 0) for f in rain_forecast)
            hours_until = len([f for f in forecast_data[:forecast_data.index(rain_forecast[0])] if f])
            
            if total_rain > 5:  # Heavy rain (>5mm)
                alerts.append({
                    'type': 'precipitation',
                    'severity': 'warning',
                    'title': '⚠️ Heavy Rain Expected',
                    'message': f'Heavy rain ({total_rain:.1f}mm) expected in {hours_until} hour(s)',
                    'recommendation': 'Consider postponing outdoor activities',
                    'timestamp': datetime.now().isoformat(),
                    'icon': 'cloud-rain'
                })
            elif total_rain > 0.5:
                alerts.append({
                    'type': 'precipitation',
                    'severity': 'info',
                    'title': '🌧️ Rain Expected',
                    'message': f'Rain ({total_rain:.1f}mm) expected in {hours_until} hour(s)',
                    'recommendation': 'Bring an umbrella if going out',
                    'timestamp': datetime.now().isoformat(),
                    'icon': 'cloud-drizzle'
                })
        
        # Check if currently raining
        current = weather_data.get('current')
        if current and current.get('precipitation', 0) > 0.1:
            alerts.append({
                'type': 'precipitation',
                'severity': 'info',
                'title': '🌧️ Currently Raining',
                'message': f'Active precipitation: {current.get("precipitation", 0):.1f}mm/h',
                'recommendation': 'Take precautions if going outside',
                'timestamp': datetime.now().isoformat(),
                'icon': 'cloud-rain'
            })
        
        return alerts
    
    def _check_temperature_alerts(self, weather_data: Dict, forecast_data: List) -> List[Dict]:
        """Check for significant temperature changes"""
        alerts = []
        
        current = weather_data.get('current')
        if not current:
            return alerts
        
        current_temp = current.get('temperature', 0)
        
        # Check for temperature drops in next 12 hours
        if len(forecast_data) >= 12:
            future_temps = [f.get('temperature', 0) for f in forecast_data[:12] if f]
            if future_temps:
                min_temp = min(future_temps)
                temp_drop = current_temp - min_temp
                
                if temp_drop >= 8:  # 15°F drop
                    alerts.append({
                        'type': 'temperature',
                        'severity': 'warning',
                        'title': '🥶 Significant Temperature Drop',
                        'message': f'Temperature dropping {temp_drop:.1f}°C ({temp_drop * 1.8:.0f}°F) in next 12 hours',
                        'recommendation': 'Adjust home heating and dress warmly',
                        'timestamp': datetime.now().isoformat(),
                        'icon': 'thermometer-snow'
                    })
                
                # Check for temperature rise
                max_temp = max(future_temps)
                temp_rise = max_temp - current_temp
                
                if temp_rise >= 8:  # 15°F rise
                    alerts.append({
                        'type': 'temperature',
                        'severity': 'info',
                        'title': '🌡️ Temperature Rising',
                        'message': f'Temperature increasing {temp_rise:.1f}°C ({temp_rise * 1.8:.0f}°F) today',
                        'recommendation': 'Consider adjusting cooling systems',
                        'timestamp': datetime.now().isoformat(),
                        'icon': 'thermometer-sun'
                    })
        
        # Extreme temperature alerts
        if current_temp <= 0:
            alerts.append({
                'type': 'temperature',
                'severity': 'critical',
                'title': '❄️ Freezing Temperature',
                'message': f'Current temperature: {current_temp:.1f}°C (32°F)',
                'recommendation': 'Protect pipes and sensitive plants',
                'timestamp': datetime.now().isoformat(),
                'icon': 'snowflake'
            })
        elif current_temp >= 35:  # 95°F
            alerts.append({
                'type': 'temperature',
                'severity': 'critical',
                'title': '🔥 Extreme Heat',
                'message': f'Current temperature: {current_temp:.1f}°C ({current_temp * 1.8 + 32:.0f}°F)',
                'recommendation': 'Stay hydrated and avoid prolonged sun exposure',
                'timestamp': datetime.now().isoformat(),
                'icon': 'sun'
            })
        
        return alerts
    
    def _check_comfort_recommendations(self, weather_data: Dict, forecast_data: List) -> List[Dict]:
        """Generate comfort and activity recommendations"""
        alerts = []
        
        current = weather_data.get('current')
        if not current:
            return alerts
        
        temp = current.get('temperature', 0)
        humidity = current.get('humidity', 0)
        windspeed = current.get('windspeed', 0)
        precipitation = current.get('precipitation', 0)
        
        # Find best outdoor time in next 12 hours
        outdoor_scores = []
        for i, forecast in enumerate(forecast_data[:12]):
            if not forecast:
                continue
            
            f_temp = forecast.get('temperature', 0)
            f_humidity = forecast.get('humidity', 0)
            f_precip = forecast.get('precipitation', 0)
            f_wind = forecast.get('windspeed', 0)
            
            # Calculate comfort score (0-100)
            score = 100
            
            # Temperature comfort (15-25°C is ideal)
            if 15 <= f_temp <= 25:
                score += 20
            elif f_temp < 10 or f_temp > 30:
                score -= 30
            
            # Low humidity is better
            if f_humidity < 60:
                score += 10
            elif f_humidity > 80:
                score -= 20
            
            # No precipitation
            if f_precip < 0.1:
                score += 20
            else:
                score -= 50
            
            # Moderate wind
            if f_wind < 20:
                score += 10
            else:
                score -= 15
            
            outdoor_scores.append((i, score))
        
        if outdoor_scores:
            best_time_idx, best_score = max(outdoor_scores, key=lambda x: x[1])
            
            if best_score >= 80 and precipitation < 0.1:
                time_offset = best_time_idx
                best_time = (datetime.now() + timedelta(hours=time_offset)).strftime('%I %p')
                
                alerts.append({
                    'type': 'recommendation',
                    'severity': 'recommendation',
                    'title': '☀️ Great Weather Ahead',
                    'message': f'Excellent outdoor conditions around {best_time}',
                    'recommendation': 'Perfect time for outdoor activities',
                    'timestamp': datetime.now().isoformat(),
                    'icon': 'sun'
                })
        
        # Current comfort recommendations
        if temp >= 18 and temp <= 24 and humidity < 70 and precipitation < 0.1 and windspeed < 25:
            alerts.append({
                'type': 'recommendation',
                'severity': 'recommendation',
                'title': '🌤️ Ideal Weather Conditions',
                'message': 'Current conditions are excellent for outdoor activities',
                'recommendation': 'Great time to be outside!',
                'timestamp': datetime.now().isoformat(),
                'icon': 'cloud-sun'
            })
        
        # High humidity warning
        if humidity > 80:
            alerts.append({
                'type': 'comfort',
                'severity': 'info',
                'title': '💧 High Humidity',
                'message': f'Current humidity: {humidity:.0f}%',
                'recommendation': 'Use dehumidifier for indoor comfort',
                'timestamp': datetime.now().isoformat(),
                'icon': 'droplet'
            })
        
        return alerts
    
    def _check_anomaly_alerts(self, location_id: int, weather_data: Dict) -> List[Dict]:
        """Check for unusual weather patterns using ML anomaly detection"""
        alerts = []
        
        try:
            # Get anomalies from analytics service
            anomalies = self.analytics.get_anomalies(location_id, days=7)
            
            current = weather_data.get('current')
            if not current:
                return alerts
            
            current_time = current.get('timestamp')
            
            # Check if current weather is anomalous
            for anomaly in anomalies.get('anomalies', []):
                anomaly_time = anomaly.get('timestamp')
                
                # Check if anomaly is within last hour
                if anomaly_time and current_time:
                    time_diff = abs((current_time - anomaly_time).total_seconds() / 3600)
                    
                    if time_diff <= 1:
                        metric = anomaly.get('metric', '')
                        value = anomaly.get('value', 0)
                        deviation = anomaly.get('deviation', 0)
                        
                        alerts.append({
                            'type': 'anomaly',
                            'severity': 'warning',
                            'title': '⚡ Unusual Weather Pattern',
                            'message': f'Abnormal {metric}: {value:.1f} (deviation: {deviation:.1f}σ)',
                            'recommendation': 'Weather conditions differ from historical patterns',
                            'timestamp': datetime.now().isoformat(),
                            'icon': 'alert-triangle'
                        })
        except Exception as e:
            print(f"Error checking anomalies: {e}")
        
        return alerts
    
    def _check_wind_alerts(self, weather_data: Dict, forecast_data: List) -> List[Dict]:
        """Check for high wind alerts"""
        alerts = []
        
        current = weather_data.get('current')
        if not current:
            return alerts
        
        windspeed = current.get('windspeed', 0)
        
        # High wind warning (>50 km/h / 30 mph)
        if windspeed > 50:
            alerts.append({
                'type': 'wind',
                'severity': 'warning',
                'title': '💨 High Wind Warning',
                'message': f'Current wind speed: {windspeed:.0f} km/h ({windspeed * 0.621:.0f} mph)',
                'recommendation': 'Secure loose outdoor items',
                'timestamp': datetime.now().isoformat(),
                'icon': 'wind'
            })
        
        # Check for increasing winds
        future_winds = [f.get('windspeed', 0) for f in forecast_data[:6] if f]
        if future_winds and max(future_winds) > 60:
            alerts.append({
                'type': 'wind',
                'severity': 'warning',
                'title': '🌪️ Strong Winds Expected',
                'message': f'Wind gusts up to {max(future_winds):.0f} km/h expected',
                'recommendation': 'Prepare for strong winds',
                'timestamp': datetime.now().isoformat(),
                'icon': 'wind'
            })
        
        return alerts
    
    def _check_uv_alerts(self, forecast_data: List) -> List[Dict]:
        """Check for UV index alerts (if available in data)"""
        alerts = []
        
        # This would require UV index data in the database
        # Placeholder for future implementation when UV data is available
        
        return alerts
    
    def get_alert_summary(self, location_id: int, user_id: int) -> Dict[str, Any]:
        """Get summary of active alerts by type and severity"""
        alerts = self.get_active_alerts(location_id, user_id)
        
        summary = {
            'total_alerts': len(alerts),
            'by_severity': {
                'critical': len([a for a in alerts if a['severity'] == 'critical']),
                'warning': len([a for a in alerts if a['severity'] == 'warning']),
                'info': len([a for a in alerts if a['severity'] == 'info']),
                'recommendation': len([a for a in alerts if a['severity'] == 'recommendation'])
            },
            'by_type': {},
            'alerts': alerts
        }
        
        # Count by type
        for alert in alerts:
            alert_type = alert.get('type', 'other')
            summary['by_type'][alert_type] = summary['by_type'].get(alert_type, 0) + 1
        
        return summary
