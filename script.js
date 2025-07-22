document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const locationInput = document.getElementById('location-input');
    const searchBtn = document.getElementById('search-btn');
    const locationBtn = document.getElementById('location-btn');
    const cityName = document.getElementById('city-name');
    const countryName = document.getElementById('country-name');
    const currentTemp = document.getElementById('current-temp');
    const weatherIcon = document.getElementById('weather-icon');
    const weatherDesc = document.getElementById('weather-desc');
    const feelsLike = document.getElementById('feels-like');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('wind-speed');
    const pressure = document.getElementById('pressure');
    const forecastDays = document.getElementById('forecast-days');
    const hourlyForecast = document.getElementById('hourly-forecast');
    
    // Navigation Elements
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const cityCards = document.querySelectorAll('.city-card');
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    
    // API Key - Replace with your actual API key from OpenWeatherMap
    const apiKey = '0d79679dedff760c08254efb05ebfba8';
    
    // Settings State
    const settings = {
        tempUnit: 'celsius', // celsius or fahrenheit
        windUnit: 'kmh', // kmh or mph
        timeFormat: '12h', // 12h or 24h
        notifications: true,
        locationServices: true,
        darkMode: true
    };
    
    // Initialize App
    init();
    
    function init() {
        setupEventListeners();
        loadSettings();
        fetchWeather('Madrid');
        updateCityCards();
    }
    
    function setupEventListeners() {
        // Weather functionality
        searchBtn.addEventListener('click', searchWeather);
        locationBtn.addEventListener('click', getLocationWeather);
        locationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchWeather(); 
            }
        });
        
        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.getAttribute('data-section');
                switchSection(section);
            });
        });
        
        // City cards
        cityCards.forEach(card => {
            card.addEventListener('click', function() {
                const city = this.getAttribute('data-city');
                fetchWeather(city);
                switchSection('weather');
            });
        });
        
        // Settings toggles
        toggleSwitches.forEach(toggle => {
            toggle.addEventListener('click', function() {
                this.classList.toggle('active');
                updateSettings(this.id);
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', handleResize);
    }
    
    // Navigation Functions
    function switchSection(sectionName) {
        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionName) {
                link.classList.add('active');
            }
        });
        
        // Update active content section
        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionName + '-section') {
                section.classList.add('active');
            }
        });
    }
    
    // Weather Functions
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
        countryName.textContent = data.sys.country;
        
        // Convert temperature based on settings
        const temp = settings.tempUnit === 'fahrenheit' ? 
            Math.round((data.main.temp * 9/5) + 32) : 
            Math.round(data.main.temp);
        const unit = settings.tempUnit === 'fahrenheit' ? '°F' : '°C';
        
        currentTemp.textContent = temp;
        currentTemp.nextElementSibling.textContent = unit.charAt(1);
        
        // Calculate chance of rain based on weather conditions
        const rainChance = data.weather[0].main.toLowerCase().includes('rain') ? 
            Math.min(data.main.humidity, 90) : 
            Math.max(0, data.main.humidity - 70);
        
        weatherDesc.textContent = `Chance of rain ${Math.max(0, rainChance)}%`;
        
        const feelsLikeTemp = settings.tempUnit === 'fahrenheit' ? 
            Math.round((data.main.feels_like * 9/5) + 32) : 
            Math.round(data.main.feels_like);
        
        feelsLike.textContent = `${feelsLikeTemp}${unit}`;
        humidity.textContent = `${rainChance}%`;
        
        // Convert wind speed based on settings
        const windSpeedValue = settings.windUnit === 'mph' ? 
            (data.wind.speed * 2.237).toFixed(1) : 
            (data.wind.speed * 3.6).toFixed(1);
        const windUnit = settings.windUnit === 'mph' ? 'mph' : 'km/h';
        
        windSpeed.textContent = `${windSpeedValue} ${windUnit}`;
        
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
            
            let timeStr;
            if (settings.timeFormat === '24h') {
                timeStr = `${hour.toString().padStart(2, '0')}:00`;
            } else {
                timeStr = hour === 0 ? '12:00 AM' : 
                          hour < 12 ? `${hour}:00 AM` : 
                          hour === 12 ? '12:00 PM' : 
                          `${hour - 12}:00 PM`;
            }
            
            const temp = settings.tempUnit === 'fahrenheit' ? 
                Math.round((item.main.temp * 9/5) + 32) : 
                Math.round(item.main.temp);
            const unit = settings.tempUnit === 'fahrenheit' ? '°F' : '°C';
            
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'hourly-item';
            hourlyItem.innerHTML = `
                <div class="hourly-time">${timeStr}</div>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].main}">
                <div class="hourly-temp">${temp}${unit.charAt(1)}</div>
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
            
            let maxTemp = Math.round(Math.max(...dayData.temps));
            let minTemp = Math.round(Math.min(...dayData.temps));
            
            if (settings.tempUnit === 'fahrenheit') {
                maxTemp = Math.round((maxTemp * 9/5) + 32);
                minTemp = Math.round((minTemp * 9/5) + 32);
            }
            
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
    
    // City Cards Functions
    function updateCityCards() {
        const cities = [
            { name: 'New York', temp: 22, desc: 'Partly Cloudy' },
            { name: 'London', temp: 18, desc: 'Rainy' },
            { name: 'Tokyo', temp: 26, desc: 'Sunny' },
            { name: 'Paris', temp: 20, desc: 'Cloudy' },
            { name: 'Sydney', temp: 24, desc: 'Clear' },
            { name: 'Dubai', temp: 35, desc: 'Hot' }
        ];
        
        cityCards.forEach((card, index) => {
            if (cities[index]) {
                const city = cities[index];
                let temp = city.temp;
                let unit = '°C';
                
                if (settings.tempUnit === 'fahrenheit') {
                    temp = Math.round((temp * 9/5) + 32);
                    unit = '°F';
                }
                
                card.querySelector('.temp').textContent = `${temp}${unit}`;
            }
        });
    }
    
    // Settings Functions
    function updateSettings(toggleId) {
        const toggle = document.getElementById(toggleId);
        const isActive = toggle.classList.contains('active');
        
        switch(toggleId) {
            case 'temp-toggle':
                settings.tempUnit = isActive ? 'fahrenheit' : 'celsius';
                break;
            case 'wind-toggle':
                settings.windUnit = isActive ? 'mph' : 'kmh';
                break;
            case 'time-toggle':
                settings.timeFormat = isActive ? '24h' : '12h';
                break;
            case 'notification-toggle':
                settings.notifications = isActive;
                break;
            case 'location-toggle':
                settings.locationServices = isActive;
                break;
            case 'theme-toggle':
                settings.darkMode = isActive;
                break;
        }
        
        saveSettings();
        updateCityCards();
        
        // Refresh weather display if weather data exists
        if (cityName.textContent !== 'Madrid' || currentTemp.textContent !== '31') {
            // Re-fetch current weather to update units
            const currentCity = cityName.textContent;
            if (currentCity) {
                fetchWeather(currentCity);
            }
        }
    }
    
    function loadSettings() {
        const savedSettings = localStorage.getItem('weatherAppSettings');
        if (savedSettings) {
            Object.assign(settings, JSON.parse(savedSettings));
            
            // Update toggle states
            document.getElementById('temp-toggle').classList.toggle('active', settings.tempUnit === 'fahrenheit');
            document.getElementById('wind-toggle').classList.toggle('active', settings.windUnit === 'mph');
            document.getElementById('time-toggle').classList.toggle('active', settings.timeFormat === '24h');
            document.getElementById('notification-toggle').classList.toggle('active', settings.notifications);
            document.getElementById('location-toggle').classList.toggle('active', settings.locationServices);
            document.getElementById('theme-toggle').classList.toggle('active', settings.darkMode);
        }
    }
    
    function saveSettings() {
        localStorage.setItem('weatherAppSettings', JSON.stringify(settings));
    }
    
    // Utility Functions
    function showLoading() {
        console.log('Loading weather data...');
    }
    
    function hideLoading() {
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
    
    function handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    }
    
    // Handle escape key to close mobile menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });
});