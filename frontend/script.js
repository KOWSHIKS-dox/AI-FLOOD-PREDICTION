// =====================================================
// AI FLOOD RISK PREDICTION SYSTEM
// Automatic GPS + Manual Location + Weather + Prediction
// =====================================================


// -----------------------------------------------------
// GLOBAL LOCATION VARIABLES
// -----------------------------------------------------

let userLatitude = null;
let userLongitude = null;


// =====================================================
// 1. AUTOMATIC CURRENT LOCATION
// =====================================================

function getMyLocation() {

    const status = document.getElementById("locationStatus");

    status.innerText = "📍 Detecting your current location...";

    if (!navigator.geolocation) {

        status.innerText =
            "❌ Geolocation is not supported by this browser.";

        return;
    }

    navigator.geolocation.getCurrentPosition(

        async function (position) {

            userLatitude =
                position.coords.latitude;

            userLongitude =
                position.coords.longitude;

            console.log("Latitude:", userLatitude);
            console.log("Longitude:", userLongitude);

            status.innerText =
                "✅ Location detected. Getting weather...";

            await getWeatherAndPredict(
                userLatitude,
                userLongitude,
                "Current Location"
            );

        },

        function (error) {

            console.error("Location Error:", error);

            if (error.code === 1) {

                status.innerText =
                    "❌ Location permission denied.";

            } else if (error.code === 2) {

                status.innerText =
                    "❌ Unable to determine your location.";

            } else if (error.code === 3) {

                status.innerText =
                    "❌ Location request timed out.";

            } else {

                status.innerText =
                    "❌ Unable to get your location.";
            }
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}


// =====================================================
// 2. MANUAL LOCATION SEARCH
// =====================================================

async function searchManualLocation() {

    const input =
        document.getElementById("manualLocation");

    const status =
        document.getElementById(
            "manualLocationStatus"
        );

    const locationName =
        input.value.trim();


    // Check empty input

    if (locationName === "") {

        status.innerText =
            "❌ Please enter a location.";

        return;
    }


    status.innerText =
        "🔎 Searching for " +
        locationName +
        "...";


    try {

        // -------------------------------------------------
        // OPEN-METEO GEOCODING API
        // -------------------------------------------------

        const geocodingURL =
            "https://geocoding-api.open-meteo.com/v1/search" +
            "?name=" +
            encodeURIComponent(locationName) +
            "&count=1" +
            "&language=en" +
            "&format=json";


        console.log(
            "Geocoding URL:",
            geocodingURL
        );


        const response =
            await fetch(geocodingURL);


        if (!response.ok) {

            throw new Error(
                "Location search failed."
            );
        }


        const data =
            await response.json();


        console.log(
            "Location Search Result:",
            data
        );


        // -------------------------------------------------
        // CHECK RESULT
        // -------------------------------------------------

        if (
            !data.results ||
            data.results.length === 0
        ) {

            status.innerText =
                "❌ Location not found. Try another city.";

            return;
        }


        // First matching location

        const result =
            data.results[0];


        userLatitude =
            result.latitude;

        userLongitude =
            result.longitude;


        // Create readable location name

        let readableLocation =
            result.name || locationName;


        if (result.admin1) {

            readableLocation +=
                ", " + result.admin1;
        }


        if (result.country) {

            readableLocation +=
                ", " + result.country;
        }


        console.log(
            "Selected Location:",
            readableLocation
        );

        console.log(
            "Latitude:",
            userLatitude
        );

        console.log(
            "Longitude:",
            userLongitude
        );


        // -------------------------------------------------
        // SHOW SELECTED LOCATION
        // -------------------------------------------------

        document.getElementById(
            "location"
        ).value = readableLocation;


        status.innerText =
            "✅ Location found. Getting weather...";


        // -------------------------------------------------
        // GET WEATHER + FLOOD PREDICTION
        // -------------------------------------------------

        await getWeatherAndPredict(
            userLatitude,
            userLongitude,
            readableLocation
        );

    }


    catch (error) {

        console.error(
            "Manual Location Error:",
            error
        );


        status.innerText =
            "❌ Unable to search location. Check your internet connection.";

    }
}


// =====================================================
// 3. GET WEATHER DATA
// =====================================================

async function getWeatherAndPredict(
    latitude,
    longitude,
    locationName
) {

    try {

        console.log(
            "Getting weather for:",
            locationName
        );


        // -------------------------------------------------
        // OPEN-METEO WEATHER API
        // -------------------------------------------------

        const weatherURL =
            "https://api.open-meteo.com/v1/forecast" +

            "?latitude=" +
            latitude +

            "&longitude=" +
            longitude +

            "&current=" +
            "temperature_2m," +
            "relative_humidity_2m," +
            "precipitation," +
            "rain," +
            "wind_speed_10m" +

            "&hourly=" +
            "precipitation," +
            "rain," +
            "precipitation_probability" +

            "&forecast_days=1" +

            "&timezone=auto";


        console.log(
            "Weather URL:",
            weatherURL
        );


        const weatherResponse =
            await fetch(weatherURL);


        if (!weatherResponse.ok) {

            throw new Error(
                "Weather API failed."
            );
        }


        const weather =
            await weatherResponse.json();


        console.log(
            "Weather Data:",
            weather
        );


        // =================================================
        // CURRENT WEATHER
        // =================================================

        const current =
            weather.current;


        // -------------------------------------------------
        // CALCULATE FORECAST RAINFALL
        // -------------------------------------------------

        let forecastRainfall = 0;


        if (
            weather.hourly &&
            weather.hourly.precipitation
        ) {

            forecastRainfall =
                weather.hourly.precipitation
                    .reduce(
                        (total, value) =>
                            total + (value || 0),
                        0
                    );
        }


        forecastRainfall =
            Number(
                forecastRainfall.toFixed(2)
            );


        // =================================================
        // DISPLAY WEATHER
        // =================================================


        // Location

        document.getElementById(
            "location"
        ).value = locationName;


        // Rain

        document.getElementById(
            "rainValue"
        ).innerText =
            (current.rain ?? 0) +
            " mm";


        // Temperature

        document.getElementById(
            "temperatureValue"
        ).innerText =
            current.temperature_2m +
            " °C";


        // Humidity

        document.getElementById(
            "humidityValue"
        ).innerText =
            current.relative_humidity_2m +
            " %";


        // Wind

        document.getElementById(
            "windValue"
        ).innerText =
            current.wind_speed_10m +
            " km/h";


        // Elevation

        document.getElementById(
            "elevationValue"
        ).innerText =
            (weather.elevation ?? 0) +
            " m";


        // =================================================
        // STATUS
        // =================================================

        const locationStatus =
            document.getElementById(
                "locationStatus"
            );

        if (locationStatus) {

            locationStatus.innerText =
                "✅ Current location weather loaded.";
        }


        const manualStatus =
            document.getElementById(
                "manualLocationStatus"
            );

        if (manualStatus) {

            manualStatus.innerText =
                "✅ Weather data loaded for " +
                locationName;
        }


        // =================================================
        // PREPARE FLOOD PREDICTION
        // =================================================

        const predictionData = {

            location:
                locationName,

            rainfall:
                current.rain ?? 0,

            forecast_rainfall:
                forecastRainfall,

            humidity:
                current.relative_humidity_2m,

            temperature:
                current.temperature_2m,

            elevation:
                weather.elevation ?? 0
        };


        console.log(
            "Prediction Data:",
            predictionData
        );


        // =================================================
        // SEND TO FASTAPI
        // =================================================

        const predictionResponse =
            await fetch(
                "http://127.0.0.1:8000/api/predict",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            predictionData
                        )
                }
            );


        if (!predictionResponse.ok) {

            throw new Error(
                "Flood prediction API failed. " +
                predictionResponse.status
            );
        }


        const prediction =
            await predictionResponse.json();


        console.log(
            "Flood Prediction:",
            prediction
        );


        // =================================================
        // DISPLAY PREDICTION
        // =================================================


        document.getElementById(
            "riskPercent"
        ).innerText =
            prediction.risk_percentage +
            "%";


        document.getElementById(
            "riskLevel"
        ).innerText =
            prediction.risk_level;


        document.getElementById(
            "resultLocation"
        ).innerText =
            prediction.location;


        document.getElementById(
            "resultRisk"
        ).innerText =
            prediction.risk_level;


        console.log(
            "✅ Flood prediction completed."
        );

    }


    catch (error) {

        console.error(
            "Weather / Prediction Error:",
            error
        );


        const manualStatus =
            document.getElementById(
                "manualLocationStatus"
            );


        if (manualStatus) {

            manualStatus.innerText =
                "❌ Weather loaded, but flood prediction server is unavailable.";
        }


        // Don't erase weather data.
        // Weather can still be displayed even
        // when the prediction backend is offline.

        console.log(
            "Weather data was received, but prediction failed."
        );
    }
}


// =====================================================
// 4. PRESS ENTER TO SEARCH MANUAL LOCATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const input =
            document.getElementById(
                "manualLocation"
            );


        if (input) {

            input.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter"
                    ) {

                        searchManualLocation();
                    }

                }
            );
        }

    }
);