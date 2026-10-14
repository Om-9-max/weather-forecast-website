
const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const locationButton = document.getElementById("location-button");
const message = document.getElementById("message");
const weatherPanel = document.getElementById("weather-panel");

function weatherInfo(code) {
  if (code === 0) return ["Clear sky", "☀️"];
  if ([1, 2].includes(code)) return ["Mostly clear", "🌤️"];
  if (code === 3) return ["Overcast", "☁️"];
  if ([45, 48].includes(code)) return ["Foggy", "🌫️"];
  if ([51, 53, 55, 56, 57].includes(code)) {
    return ["Drizzle", "🌦️"];
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return ["Rain", "🌧️"];
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return ["Snow", "❄️"];
  }
  if ([95, 96, 99].includes(code)) return ["Thunderstorm", "⛈️"];
  return ["Unknown conditions", "🌡️"];
}

function showMessage(text) {
  message.textContent = text;
}

async function loadWeather(city) {
  if (!city.trim()) {
    showMessage("Please enter a city name.");
    return;
  }

  searchButton.disabled = true;
  weatherPanel.hidden = true;
  showMessage("Loading weather information...");

  try {
    // Step 1: Find the city coordinates.
    const geoURL = new URL(
      "https://geocoding-api.open-meteo.com/v1/search"
    );

    geoURL.search = new URLSearchParams({
      name: city.trim(),
      count: "1",
      language: "en",
      format: "json"
    });

    const geoResponse = await fetch(geoURL);
    if (!geoResponse.ok) throw new Error("Location search failed.");

    const geoData = await geoResponse.json();
    const place = geoData.results?.[0];

    if (!place) {
      throw new Error("City not found. Try another city name.");
    }

    // Step 2: Request current weather and a five-day forecast.
    const forecastURL = new URL(
      "https://api.open-meteo.com/v1/forecast"
    );

    forecastURL.search = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "weather_code",
        "wind_speed_10m"
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min"
      ].join(","),
      timezone: "auto",
      forecast_days: "5"
    });

    const weatherResponse = await fetch(forecastURL);
    if (!weatherResponse.ok) throw new Error("Weather request failed.");

    const data = await weatherResponse.json();
    displayWeather(place, data);
    showMessage("");
  } catch (error) {
    showMessage(error.message || "Unable to load weather. Please try again.");
  } finally {
    searchButton.disabled = false;
  }
}

function displayWeather(place, data) {
  const current = data.current;
  const [description, icon] = weatherInfo(current.weather_code);

  document.getElementById("location-name").textContent =
    [place.name, place.admin1, place.country]
      .filter(Boolean)
      .join(", ");

  document.getElementById("current-date").textContent =
    "Local time: " +
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: data.timezone
    }).format(new Date());

  document.getElementById("weather-icon").textContent = icon;
  document.getElementById("temperature").textContent =
    Math.round(current.temperature_2m);
  document.getElementById("description").textContent = description;
  document.getElementById("feels-like").textContent =
    Math.round(current.apparent_temperature) + "°C";
  document.getElementById("humidity").textContent =
    current.relative_humidity_2m + "%";
  document.getElementById("wind").textContent =
    current.wind_speed_10m + " km/h";

  const forecastList = document.getElementById("forecast-list");
  forecastList.replaceChildren();

  data.daily.time.forEach((date, index) => {
    const [dayDescription, dayIcon] =
      weatherInfo(data.daily.weather_code[index]);

    const card = document.createElement("article");
    card.className = "forecast-card";

    const day = document.createElement("p");
    day.textContent = new Date(date + "T12:00:00").toLocaleDateString(
      "en-IN",
      { weekday: "short", day: "numeric", month: "short" }
    );

    const iconElement = document.createElement("div");
    iconElement.className = "forecast-icon";
    iconElement.textContent = dayIcon;

    const descriptionElement = document.createElement("p");
    descriptionElement.className = "muted";
    descriptionElement.textContent = dayDescription;

    const temperatures = document.createElement("strong");
    temperatures.textContent =
      `${Math.round(data.daily.temperature_2m_max[index])}° / ` +
      `${Math.round(data.daily.temperature_2m_min[index])}°`;

    card.append(day, iconElement, descriptionElement, temperatures);
    forecastList.appendChild(card);
  });

  weatherPanel.hidden = false;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadWeather(cityInput.value);
});

locationButton.addEventListener("click", () => {
  cityInput.value = "Bhubaneswar";
  loadWeather("Bhubaneswar");
});

// Load an initial city when the website opens.
loadWeather("Bhubaneswar");
