// Import API keys from config file
const openCageApiKey = CONFIG.OPENCAGE_API_KEY;
const weatherApiKey = CONFIG.WEATHER_API_KEY;
const cities = ['New Delhi', 'Shanghai', 'Washington', 'Boston'];

// Function to convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius) => {
    return (celsius * 9/5) + 32;
}

// Function to format temperature based on selected unit
const formatTemperature = (temp, isFahrenheit) => {
    if (temp === undefined || temp === null) return '';
    const temperature = isFahrenheit ? celsiusToFahrenheit(temp) : temp;
    return Math.round(temperature * 10) / 10;
}

// Function to format Unix timestamp to readable time
const formatTime = (unixTimestamp) => {
    if (!unixTimestamp) return '';
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Function to update temperature displays
const updateTemperatureDisplays = (isFahrenheit) => {
    const unit = isFahrenheit ? '°F' : '°C';
    document.querySelectorAll('.unit-text').forEach(el => el.textContent = unit.slice(1));
    document.querySelectorAll('.temp-unit').forEach(el => el.textContent = unit.slice(1));
    
    // Update main card temperatures if they exist
    const tempElements = ['temp-card-title', 'main-temp', 'main-min-temp', 'main-max-temp'];
    tempElements.forEach(id => {
        const element = document.getElementById(id);
        if (element && element.dataset.celsius) {
            element.textContent = formatTemperature(parseFloat(element.dataset.celsius), isFahrenheit);
        }
    });

    // Update table temperatures
    document.querySelectorAll('td[data-field="temp"], td[data-field="min_temp"], td[data-field="max_temp"]').forEach(td => {
        if (td.dataset.celsius) {
            td.textContent = formatTemperature(parseFloat(td.dataset.celsius), isFahrenheit);
        }
    });
}

// Function to update map for a city with coordinates
const updateMapWithCoords = (cityName, lat, lng) => {
    const mapFrame = document.getElementById('city-map');
    // Calculate bounding box coordinates (approximately 10km around the city)
    const delta = 0.1; // roughly 10km
    const bbox = `${lng-delta},${lat-delta},${lng+delta},${lat+delta}`;
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    mapFrame.src = mapUrl;
    document.getElementById('map-container').style.display = 'block';
}

// Function to get weather data for a city
const getweather = (cityName) => {
    const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json?q=${cityName}&key=${openCageApiKey}`;
    const isFahrenheit = document.getElementById('tempUnitToggle').checked;
    
    if (cityName === city.value || cityName === 'New Delhi') {
        cityKaNaam.innerHTML = cityName;
        document.getElementById('weather-text').style.display = 'inline';
    }

    fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            if (data.results.length === 0) {
                if (cityName === city.value) {
                    // Hide the weather display cards
                    document.querySelector('.row-cols-1').style.display = 'none';
                    // Hide "Weather for" text and show error message
                    document.getElementById('weather-text').style.display = 'none';
                    cityKaNaam.innerHTML = "DATA UNAVAILABLE FOR THE SPECIFIED CITY!";
                    // Hide map for invalid city
                    document.getElementById('map-container').style.display = 'none';
                }
                throw new Error('No results found for the specified city.');
            }
            const { lat, lng } = data.results[0].geometry;
            
            // Update map if this is the searched city
            if (cityName === city.value || cityName === 'New Delhi') {
                updateMapWithCoords(cityName, lat, lng);
            }

            const weatherUrl = `https://weather-by-api-ninjas.p.rapidapi.com/v1/weather?lat=${lat}&lon=${lng}`;
            const options = {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': weatherApiKey,
                    'x-rapidapi-host': 'weather-by-api-ninjas.p.rapidapi.com'
                }
            };

            return fetch(weatherUrl, options);
        })
        .then(response => response.json())
        .then(response => {
            if (cityName === city.value || cityName === 'New Delhi') {
                // Show the weather display cards
                document.querySelector('.row-cols-1').style.display = 'flex';
                // Show "Weather for" text
                document.getElementById('weather-text').style.display = 'inline';
                // Show map container
                document.getElementById('map-container').style.display = 'block';
                
                updateWeatherDisplay(response);
            }

            // Update table row for the city
            updateTableRow(cityName, response);
        })
        .catch(err => {
            console.error('Error:', err);
            if (cityName === city.value) {
                // Hide the weather display cards
                document.querySelector('.row-cols-1').style.display = 'none';
                // Hide "Weather for" text and show error message
                document.getElementById('weather-text').style.display = 'none';
                cityKaNaam.innerHTML = "DATA UNAVAILABLE FOR THE SPECIFIED CITY!";
                // Hide map for invalid city
                document.getElementById('map-container').style.display = 'none';
            }
        });
}

// Update main weather display with data
const updateWeatherDisplay = (response) => {
    const isFahrenheit = document.getElementById('tempUnitToggle').checked;
    
    // Update temperature data
    const tempCardTitle = document.getElementById('temp-card-title');
    tempCardTitle.dataset.celsius = response.temp;
    tempCardTitle.textContent = formatTemperature(response.temp, isFahrenheit);

    const mainTemp = document.getElementById('main-temp');
    mainTemp.dataset.celsius = response.temp;
    mainTemp.textContent = formatTemperature(response.temp, isFahrenheit);

    const mainMinTemp = document.getElementById('main-min-temp');
    mainMinTemp.dataset.celsius = response.min_temp;
    mainMinTemp.textContent = formatTemperature(response.min_temp, isFahrenheit);

    const mainMaxTemp = document.getElementById('main-max-temp');
    mainMaxTemp.dataset.celsius = response.max_temp;
    mainMaxTemp.textContent = formatTemperature(response.max_temp, isFahrenheit);

    // Update other weather data
    document.getElementById('humidity-card-title').innerHTML = response.humidity;
    document.getElementById('main-wind-degrees').innerHTML = response.wind_degrees;
    document.getElementById('main-feels-like').innerHTML = response.feels_like;
    document.getElementById('main-humidity').innerHTML = response.humidity;
    document.getElementById('wind-card-title').innerHTML = response.wind_speed;
    document.getElementById('main-wind-speed').innerHTML = response.wind_speed;
    document.getElementById('main-sunrise').innerHTML = formatTime(response.sunrise);
    document.getElementById('main-sunset').innerHTML = formatTime(response.sunset);
}

// Update table row with weather data
const updateTableRow = (cityName, response) => {
    const row = document.querySelector(`tr[data-city="${cityName}"]`);
    if (!row) return;
    
    const isFahrenheit = document.getElementById('tempUnitToggle').checked;
    
    row.querySelector('[data-field="cloud_pct"]').textContent = response.cloud_pct;
    
    // Store and display temperature data
    const tempCell = row.querySelector('[data-field="temp"]');
    tempCell.dataset.celsius = response.temp;
    tempCell.textContent = formatTemperature(response.temp, isFahrenheit);

    const minTempCell = row.querySelector('[data-field="min_temp"]');
    minTempCell.dataset.celsius = response.min_temp;
    minTempCell.textContent = formatTemperature(response.min_temp, isFahrenheit);

    const maxTempCell = row.querySelector('[data-field="max_temp"]');
    maxTempCell.dataset.celsius = response.max_temp;
    maxTempCell.textContent = formatTemperature(response.max_temp, isFahrenheit);

    // Update other data
    row.querySelector('[data-field="feels_like"]').textContent = response.feels_like;
    row.querySelector('[data-field="humidity"]').textContent = response.humidity;
    row.querySelector('[data-field="wind_speed"]').textContent = response.wind_speed;
    row.querySelector('[data-field="wind_degrees"]').textContent = response.wind_degrees;
    row.querySelector('[data-field="sunrise"]').textContent = formatTime(response.sunrise);
    row.querySelector('[data-field="sunset"]').textContent = formatTime(response.sunset);
}

// Event listener for temperature unit toggle
document.getElementById('tempUnitToggle').addEventListener('change', (e) => {
    const isFahrenheit = e.target.checked;
    updateTemperatureDisplays(isFahrenheit);
});

// Event listener for search button
submit.addEventListener('click', (e) => {
    e.preventDefault();
    getweather(city.value);
});

// Initialize map with New Delhi
updateMapWithCoords('New Delhi', 28.6139, 77.2090);

// Get weather for all cities in the table
cities.forEach(city => {
    getweather(city);
});

// Function to toggle theme
const toggleTheme = (isDark) => {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.querySelector('.theme-text').textContent = isDark ? 'Dark' : 'Light';
}

// Event listener for theme toggle
document.getElementById('themeToggle').addEventListener('change', (e) => {
    const isDark = e.target.checked;
    toggleTheme(isDark);
});