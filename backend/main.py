from fastapi import FastAPI, HTTPException, Query
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests


app = FastAPI(title="AI Flood Prediction System")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionData(BaseModel):
    location: str
    rainfall: float
    forecast_rainfall: float
    humidity: float
    temperature: float
    elevation: float


@app.get("/")
def home():
    return {
        "message": "AI Flood Prediction Backend is Running"
    }


@app.get("/api/weather")
def get_weather(
    latitude: float = Query(...),
    longitude: float = Query(...)
):

    weather_url = "https://api.open-meteo.com/v1/forecast"

    weather_params = {

        "latitude": latitude,

        "longitude": longitude,

        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation,"
            "rain,"
            "wind_speed_10m"
        ),

        "hourly": (
            "precipitation,"
            "rain,"
            "precipitation_probability"
        ),

        "forecast_days": 1,

        "timezone": "auto"
    }


    try:

        response = requests.get(
            weather_url,
            params=weather_params,
            timeout=10
        )

        response.raise_for_status()

        weather = response.json()

    except requests.RequestException as e:

        raise HTTPException(
            status_code=500,
            detail=f"Weather API error: {str(e)}"
        )


    current = weather["current"]


    forecast_rainfall = round(
        sum(
            weather["hourly"]["precipitation"]
        ),
        2
    )


    return {

        "location":
            f"{latitude:.4f}, {longitude:.4f}",

        "latitude":
            latitude,

        "longitude":
            longitude,

        "elevation":
            weather.get("elevation"),

        "temperature":
            current["temperature_2m"],

        "humidity":
            current["relative_humidity_2m"],

        "precipitation":
            current["precipitation"],

        "rain":
            current["rain"],

        "wind_speed":
            current["wind_speed_10m"],

        "forecast_rainfall":
            forecast_rainfall
    }

# ----------------------------------------
# FLOOD PREDICTION
# ----------------------------------------

@app.post("/api/predict")
def predict(data: PredictionData):

    # TEMPORARY RISK MODEL
    #
    # Later we will replace this with
    # the actual trained Machine Learning model.


    current_rain_score = min(
        data.rainfall / 20,
        1
    )

    forecast_rain_score = min(
        data.forecast_rainfall / 100,
        1
    )

    humidity_score = (
        data.humidity / 100
    )

    elevation_score = max(
        0,
        1 - (data.elevation / 500)
    )


    risk = (

        current_rain_score * 0.35

        + forecast_rain_score * 0.35

        + humidity_score * 0.15

        + elevation_score * 0.15

    )


    risk_percentage = round(
        risk * 100
    )


    risk_percentage = max(
        0,
        min(100, risk_percentage)
    )


    if risk_percentage >= 70:

        risk_level = "HIGH"

    elif risk_percentage >= 40:

        risk_level = "MODERATE"

    else:

        risk_level = "LOW"


    return {

        "location": data.location,

        "risk_percentage": risk_percentage,

        "risk_level": risk_level,

        "factors": {

            "rainfall": data.rainfall,

            "forecast_rainfall":
                data.forecast_rainfall,

            "humidity":
                data.humidity,

            "temperature":
                data.temperature,

            "elevation":
                data.elevation
        }

    }