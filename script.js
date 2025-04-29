document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const locationInput = document.getElementById('location-input');
    const searchBtn = document.getElementById('search-btn');
    const locationBtn = document.getElementById('location-btn');
    const cityName = document.getElementById('city-name');
    const currentTemp = document.getElementById('current-temp');
    const weatherIcon = document.getElementById('weather-icon');
    const weatherDesc = document.getElementById('weather-desc');
    const feelsLike = document.getElementById('feels-like');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('wind-speed');
    const pressure = document.getElementById('pressure');
    const forecastDays = document.getElementById('forecast-days');
    
    // API Key - Replace with your actual API key from OpenWeatherMap
    const apiKey = '0d79679dedff760c08254efb05ebfba8';
    
    // Event Listeners
    searchBtn.addEventListener('click', searchWeather);
    locationBtn.addEventListener('click', getLocationWeather);
    locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather(); 
        }
    });
    
    // Initial load - default city
    fetchWeather('Kampala');
    
    // Functions
    function searchWeather() {
        const location = locationInput.value.trim();
        if (location) {
            fetchWeather(location);
        }
    }
    
    function getLocationWeather() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherByCoords(latitude, longitude);
                },
                error => {
                    alert('Unable to retrieve your location. Please enable location services or search manually.');
                    console.error(error);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser. Please search manually.');
        }
    }
    
    function fetchWeather(location) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`;
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('City not found');
                }
                return response.json();
            })
            .then(data => {
                displayCurrentWeather(data);
                return fetchForecast(data.coord.lat, data.coord.lon);
            })
            .then(forecastData => {
                displayForecast(forecastData);
            })
            .catch(error => {
                alert(error.message);
                console.error('Error:', error);
            });
    }
    
    function fetchWeatherByCoords(lat, lon) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                displayCurrentWeather(data);
                return fetchForecast(lat, lon);
            })
            .then(forecastData => {
                displayForecast(forecastData);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    
    function fetchForecast(lat, lon) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        
        return fetch(apiUrl)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching forecast:', error);
            });
    }
    
    function displayCurrentWeather(data) {
        cityName.textContent = `${data.name}, ${data.sys.country}`;
        currentTemp.textContent = Math.round(data.main.temp);
        weatherDesc.textContent = data.weather[0].description;
        feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        pressure.textContent = `${data.main.pressure} hPa`;
        
        const iconCode = data.weather[0].icon;
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.alt = data.weather[0].main;
    }
    
    function displayForecast(data) {
        // Clear previous forecast
        forecastDays.innerHTML = '';
        
        // Group forecast by day
        const dailyForecast = {};
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = daysOfWeek[date.getDay()];
            const dateStr = date.toISOString().split('T')[0];
            
            if (!dailyForecast[dateStr]) {
                dailyForecast[dateStr] = {
                    day: day,
                    temps: [],
                    icons: [],
                    descriptions: []
                };
            }
            
            dailyForecast[dateStr].temps.push(item.main.temp);
            dailyForecast[dateStr].icons.push(item.weather[0].icon);
            dailyForecast[dateStr].descriptions.push(item.weather[0].main);
        });
        
        // Get the next 5 days (excluding today)
        const forecastDates = Object.keys(dailyForecast).slice(1, 6);
        
        forecastDates.forEach(date => {
            const dayData = dailyForecast[date];
            const maxTemp = Math.round(Math.max(...dayData.temps));
            const minTemp = Math.round(Math.min(...dayData.temps));
            
            // Get most frequent icon/description
            const iconCounts = {};
            dayData.icons.forEach(icon => {
                iconCounts[icon] = (iconCounts[icon] || 0) + 1;
            });
            const mostFrequentIcon = Object.keys(iconCounts).reduce((a, b) => 
                iconCounts[a] > iconCounts[b] ? a : b
            );
            
            const descCounts = {};
            dayData.descriptions.forEach(desc => {
                descCounts[desc] = (descCounts[desc] || 0) + 1;
            });
            const mostFrequentDesc = Object.keys(descCounts).reduce((a, b) => 
                descCounts[a] > descCounts[b] ? a : b
            );
            
            // Create forecast day element
            const forecastDay = document.createElement('div');
            forecastDay.className = 'forecast-day';
            forecastDay.innerHTML = `
                <div class="day">${dayData.day}</div>
                <img src="https://openweathermap.org/img/wn/${mostFrequentIcon}.png" alt="${mostFrequentDesc}">
                <div class="temp">
                    <span class="max-temp">${maxTemp}°</span>
                    <span class="min-temp">${minTemp}°</span>
                </div>
            `;
            
            forecastDays.appendChild(forecastDay);
        });
    }
});