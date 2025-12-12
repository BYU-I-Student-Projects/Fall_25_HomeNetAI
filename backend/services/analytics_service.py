"""
Analytics Service for HomeNetAI
Provides statistical analysis, trend detection, and forecasting for weather data
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from database.database import HomeNetDatabase

db = HomeNetDatabase()


class AnalyticsService:
    """Service for analyzing weather data and generating insights"""
    
    def get_historical_data(
        self, 
        location_id: int, 
        days: int = 30
    ) -> Dict:
        """
        Get historical weather data for analysis
        
        Args:
            location_id: ID of the location
            days: Number of days to retrieve (default 30)
            
        Returns:
            Dictionary with historical data and basic statistics
        """
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # Get weather data for the specified period
            start_date = datetime.now() - timedelta(days=days)
            
            cursor.execute("""
                SELECT 
                    timestamp,
                    temperature,
                    apparent_temperature,
                    humidity,
                    precipitation,
                    wind_speed,
                    uv_index
                FROM weather_data
                WHERE location_id = %s AND timestamp >= %s
                ORDER BY timestamp ASC
            """, (location_id, start_date))
            
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if not rows:
                return {
                    "data": [],
                    "statistics": {},
                    "data_points": 0
                }
            
            # Convert to list of dictionaries
            data = []
            for row in rows:
                data.append({
                    "timestamp": row[0].isoformat(),
                    "temperature": float(row[1]) if row[1] else None,
                    "apparent_temperature": float(row[2]) if row[2] else None,
                    "humidity": float(row[3]) if row[3] else None,
                    "precipitation": float(row[4]) if row[4] else None,
                    "wind_speed": float(row[5]) if row[5] else None,
                    "uv_index": float(row[6]) if row[6] else None
                })
            
            # Calculate basic statistics
            df = pd.DataFrame(data)
            
            statistics = {
                "temperature": self._calculate_stats(df, "temperature"),
                "humidity": self._calculate_stats(df, "humidity"),
                "precipitation": self._calculate_stats(df, "precipitation"),
                "wind_speed": self._calculate_stats(df, "wind_speed"),
            }
            
            return {
                "data": data,
                "statistics": statistics,
                "data_points": len(data),
                "period_days": days
            }
            
        except Exception as e:
            print(f"Error getting historical data: {e}")
            raise
    
    def get_trends(
        self, 
        location_id: int, 
        metric: str = "temperature",
        days: int = 30
    ) -> Dict:
        """
        Analyze trends in weather data
        
        Args:
            location_id: ID of the location
            metric: Weather metric to analyze (temperature, humidity, etc.)
            days: Number of days to analyze
            
        Returns:
            Dictionary with trend analysis including slope and direction
        """
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            start_date = datetime.now() - timedelta(days=days)
            
            # Validate metric
            valid_metrics = ["temperature", "humidity", "precipitation", "wind_speed", "uv_index"]
            if metric not in valid_metrics:
                metric = "temperature"
            
            cursor.execute(f"""
                SELECT 
                    timestamp,
                    {metric}
                FROM weather_data
                WHERE location_id = %s 
                    AND timestamp >= %s
                    AND {metric} IS NOT NULL
                ORDER BY timestamp ASC
            """, (location_id, start_date))
            
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if len(rows) < 2:
                return {
                    "trend": "insufficient_data",
                    "slope": 0,
                    "direction": "stable",
                    "confidence": 0
                }
            
            # Prepare data for linear regression
            timestamps = [(row[0] - rows[0][0]).total_seconds() / 3600 for row in rows]  # Hours from start
            values = [float(row[1]) for row in rows]
            
            # Fit linear regression
            X = np.array(timestamps).reshape(-1, 1)
            y = np.array(values)
            
            model = LinearRegression()
            model.fit(X, y)
            
            slope = float(model.coef_[0])
            r_squared = float(model.score(X, y))
            
            # Determine trend direction
            if abs(slope) < 0.01:
                direction = "stable"
            elif slope > 0:
                direction = "increasing"
            else:
                direction = "decreasing"
            
            # Calculate predictions for visualization
            future_hours = 24  # Predict 24 hours ahead
            future_X = np.array(timestamps + [timestamps[-1] + i for i in range(1, future_hours + 1)]).reshape(-1, 1)
            predictions = model.predict(future_X).tolist()
            
            return {
                "metric": metric,
                "trend": direction,
                "slope": slope,
                "slope_per_day": slope * 24,  # Convert hourly slope to daily
                "direction": direction,
                "confidence": r_squared,
                "data_points": len(rows),
                "predictions": predictions[-future_hours:],
                "current_value": values[-1] if values else None,
                "predicted_24h": predictions[-1] if predictions else None
            }
            
        except Exception as e:
            print(f"Error analyzing trends: {e}")
            raise
    
    def get_forecast(
        self, 
        location_id: int,
        hours: int = 24
    ) -> Dict:
        """
        Generate simple weather forecast using historical patterns
        
        Args:
            location_id: ID of the location
            hours: Number of hours to forecast
            
        Returns:
            Dictionary with forecasted values for key metrics
        """
        try:
            # Get trends for multiple metrics
            metrics = ["temperature", "humidity", "precipitation", "wind_speed"]
            forecasts = {}
            
            for metric in metrics:
                trend_data = self.get_trends(location_id, metric, days=7)
                
                if trend_data.get("predicted_24h"):
                    forecasts[metric] = {
                        "current": trend_data.get("current_value"),
                        "predicted": trend_data.get("predicted_24h"),
                        "trend": trend_data.get("direction"),
                        "confidence": trend_data.get("confidence")
                    }
            
            return {
                "location_id": location_id,
                "forecast_hours": hours,
                "generated_at": datetime.now().isoformat(),
                "forecasts": forecasts
            }
            
        except Exception as e:
            print(f"Error generating forecast: {e}")
            raise
    
    def get_anomalies(
        self, 
        location_id: int,
        days: int = 30
    ) -> Dict:
        """
        Detect anomalies in weather data using statistical methods
        
        Args:
            location_id: ID of the location
            days: Number of days to analyze
            
        Returns:
            Dictionary with detected anomalies
        """
        try:
            historical = self.get_historical_data(location_id, days)
            
            if not historical["data"]:
                return {"anomalies": [], "total": 0}
            
            df = pd.DataFrame(historical["data"])
            anomalies = []
            
            # Check for temperature anomalies
            if "temperature" in df.columns:
                temp_mean = df["temperature"].mean()
                temp_std = df["temperature"].std()
                
                # Flag values > 2 standard deviations from mean
                for idx, row in df.iterrows():
                    temp = row["temperature"]
                    if temp and abs(temp - temp_mean) > 2 * temp_std:
                        anomalies.append({
                            "timestamp": row["timestamp"],
                            "metric": "temperature",
                            "value": temp,
                            "expected_range": [temp_mean - 2*temp_std, temp_mean + 2*temp_std],
                            "severity": "high" if abs(temp - temp_mean) > 3 * temp_std else "medium"
                        })
            
            return {
                "anomalies": anomalies[:10],  # Return top 10
                "total": len(anomalies),
                "period_days": days
            }
            
        except Exception as e:
            print(f"Error detecting anomalies: {e}")
            raise
    
    def get_summary_statistics(
        self, 
        location_id: int,
        days: int = 30
    ) -> Dict:
        """
        Get comprehensive summary statistics for a location
        
        Args:
            location_id: ID of the location
            days: Number of days to summarize
            
        Returns:
            Dictionary with summary statistics
        """
        try:
            historical = self.get_historical_data(location_id, days)
            
            if not historical["data"]:
                return {"error": "No data available"}
            
            # Get trends for key metrics
            temp_trend = self.get_trends(location_id, "temperature", days)
            humidity_trend = self.get_trends(location_id, "humidity", days)
            
            return {
                "period": {
                    "days": days,
                    "data_points": historical["data_points"]
                },
                "statistics": historical["statistics"],
                "trends": {
                    "temperature": {
                        "direction": temp_trend.get("direction"),
                        "change_per_day": temp_trend.get("slope_per_day")
                    },
                    "humidity": {
                        "direction": humidity_trend.get("direction"),
                        "change_per_day": humidity_trend.get("slope_per_day")
                    }
                },
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error generating summary: {e}")
            raise
    
    def _calculate_stats(self, df: pd.DataFrame, column: str) -> Dict:
        """Calculate statistics for a column"""
        if column not in df.columns or df[column].isna().all():
            return {
                "mean": None,
                "min": None,
                "max": None,
                "std": None
            }
        
        return {
            "mean": float(df[column].mean()),
            "min": float(df[column].min()),
            "max": float(df[column].max()),
            "std": float(df[column].std())
        }


# Global analytics service instance
analytics_service = AnalyticsService()
