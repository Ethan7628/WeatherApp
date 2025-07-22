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
    const hourlyForecast = document.getElementById('hourly-forecast');
    
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
    fetchWeather('Madrid');
    
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
                    showError('Unable to retrieve your location. Please enable location services or search manually.');
                    console.error(error);
                }
            );
        } else {
            showError('Geolocation is not supported by your browser. Please search manually.');
        }
    }
    
    function fetchWeather(location) {
        showLoading();
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
                displayHourlyForecast(forecastData);
                hideLoading();
            })
            .catch(error => {
                showError(error.message);
                hideLoading();
                console.error('Error:', error);
            });
    }
    
    function fetchWeatherByCoords(lat, lon) {
        showLoading();
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                displayCurrentWeather(data);
                return fetchForecast(lat, lon);
            })
            .then(forecastData => {
                displayForecast(forecastData);
                displayHourlyForecast(forecastData);
                hideLoading();
            })
            .catch(error => {
                showError('Error fetching weather data');
                hideLoading();
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
        cityName.textContent = `${data.name}`;
        currentTemp.textContent = Math.round(data.main.temp);
        
        // Calculate chance of rain based on weather conditions
        const rainChance = data.weather[0].main.toLowerCase().includes('rain') ? 
            Math.min(data.main.humidity, 90) : 
            Math.max(0, data.main.humidity - 70);
        
        weatherDesc.textContent = `Chance of rain ${Math.max(0, rainChance)}%`;
        feelsLike.textContent = `${Math.round(data.main.feels_like)}°`;
        humidity.textContent = `${rainChance}%`;
        windSpeed.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
        
        // Convert pressure to UV index approximation (simplified)
        const uvIndex = Math.min(11, Math.max(1, Math.round((data.main.pressure - 1000) / 10)));
        pressure.textContent = uvIndex;
        
        const iconCode = data.weather[0].icon;
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.alt = data.weather[0].main;
    }
    
    function displayHourlyForecast(data) {
        hourlyForecast.innerHTML = '';
        
        // Get next 6 hours of forecast
        const hourlyData = data.list.slice(0, 6);
        
        hourlyData.forEach(item => {
            const time = new Date(item.dt * 1000);
            const hour = time.getHours();
            const timeStr = hour === 0 ? '12:00 AM' : 
                          hour < 12 ? `${hour}:00 AM` : 
                          hour === 12 ? '12:00 PM' : 
                          `${hour - 12}:00 PM`;
            
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            hourlyItem.innerHTML = `
                <div class="hourly-time">${timeStr}</div>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].main}">
                <div class="hourly-temp">${Math.round(item.main.temp)}°</div>
            `;
            
            hourlyForecast.appendChild(hourlyItem);
        });
    }
    
    function displayForecast(data) {
        forecastDays.innerHTML = '';
        
        // Group forecast by day
        const dailyForecast = {};
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().toDateString();
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateStr = date.toDateString();
            
            // Skip today's data for the 7-day forecast
            if (dateStr === today) return;
            
            if (!dailyForecast[dateStr]) {
                dailyForecast[dateStr] = {
                    day: daysOfWeek[date.getDay()],
                    date: date,
                    temps: [],
                    icons: [],
                    descriptions: [],
                    conditions: []
                };
            }
            
            dailyForecast[dateStr].temps.push(item.main.temp);
            dailyForecast[dateStr].icons.push(item.weather[0].icon);
            dailyForecast[dateStr].descriptions.push(item.weather[0].main);
            dailyForecast[dateStr].conditions.push(item.weather[0].description);
        });
        
        // Get the next 7 days
        const forecastDates = Object.keys(dailyForecast)
            .sort((a, b) => new Date(a) - new Date(b))
            .slice(0, 7);
        
        forecastDates.forEach((dateStr, index) => {
            const dayData = dailyForecast[dateStr];
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
            
            // Format day name
            const dayName = index === 0 ? 'Today' : dayData.day;
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-day-info">
                    <div class="forecast-day">${dayName}</div>
                    <img src="https://openweathermap.org/img/wn/${mostFrequentIcon}.png" alt="${mostFrequentDesc}">
                    <div class="forecast-desc">${mostFrequentDesc}</div>
                </div>
                <div class="forecast-temps">
                    <span class="max-temp">${maxTemp}</span>
                    <span>/</span>
                    <span class="min-temp">${minTemp}</span>
                </div>
            `;
            
            forecastDays.appendChild(forecastItem);
        });
    }
    
    function showLoading() {
        // You can add a loading spinner here if needed
        console.log('Loading weather data...');
    }
    
    function hideLoading() {
        // Hide loading spinner
        console.log('Weather data loaded');
    }
    
    function showError(message) {
        // Create error element if it doesn't exist
        let errorElement = document.querySelector('.error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error';
            document.querySelector('.current-weather-section').prepend(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
    
    // Add smooth scrolling for mobile
    if (window.innerWidth <= 768) {
        const forecastList = document.querySelector('.forecast-list');
        if (forecastList) {
            forecastList.style.scrollBehavior = 'smooth';
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Refresh layout on orientation change for mobile
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        }
    });
});