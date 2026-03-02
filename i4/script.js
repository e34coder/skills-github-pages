// i4/script.js
let userLatitude, userLongitude;
let prayerTimesCache = {}; // Format: { "2024-01-05": [...], "2024-01-06": [...], ... }
let currentDateKey = null;
let currentDayData = null;
let isFetching = false;
let fetchRetryTimeout = null;
let statusBorder = document.getElementById('status-border');

function getDateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function loadCachedData() {
  try {
    const cached = localStorage.getItem('prayerTimesMultiDay');
    if (cached) {
      prayerTimesCache = JSON.parse(cached);
      console.log('Loaded cache with days:', Object.keys(prayerTimesCache));
    }
  } catch (e) {
    console.error('Error loading cached data:', e);
    prayerTimesCache = {};
  }
}

function cacheData() {
  try {
    localStorage.setItem('prayerTimesMultiDay', JSON.stringify(prayerTimesCache));
  } catch (e) {
    console.error('Error caching data:', e);
  }
}

function updateStatusBorder(status) {
  // Remove all status classes
  statusBorder.classList.remove('status-green', 'status-yellow', 'status-red');
  
  // Add the appropriate class
  if (status === 'green') {
    statusBorder.classList.add('status-green');
  } else if (status === 'yellow') {
    statusBorder.classList.add('status-yellow');
  } else if (status === 'red') {
    statusBorder.classList.add('status-red');
  }
}

function getDataForDate(targetDate) {
  const targetKey = getDateKey(targetDate);
  
  // Check if we have data for this exact date
  if (prayerTimesCache[targetKey]) {
    return {
      data: prayerTimesCache[targetKey],
      source: 'exact'
    };
  }
  
  // Find the most recent date before target date
  const availableDates = Object.keys(prayerTimesCache).sort();
  let mostRecent = null;
  
  for (let date of availableDates) {
    if (date <= targetKey) {
      mostRecent = date;
    } else {
      break;
    }
  }
  
  if (mostRecent) {
    return {
      data: prayerTimesCache[mostRecent],
      source: 'older',
      originalDate: mostRecent
    };
  }
  
  return null;
}

function getDaysDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function updatePrayerData() {
  const today = new Date();
  const todayKey = getDateKey(today);
  currentDateKey = todayKey;
  
  const result = getDataForDate(today);
  
  if (result) {
    currentDayData = result.data;
    
    if (result.source === 'exact') {
      // Using today's exact data
      updateStatusBorder('green');
      console.log('Using fresh data for today');
    } else {
      // Using older data
      const daysDiff = getDaysDifference(result.originalDate, todayKey);
      if (daysDiff <= 5) {
        updateStatusBorder('yellow');
        console.log(`Using cached data from ${result.originalDate} (${daysDiff} days old)`);
      } else {
        updateStatusBorder('red');
        console.log(`Using old data from ${result.originalDate} (${daysDiff} days old) - PAST 5 DAYS`);
      }
    }
    
    updatePrayerInfo();
  } else {
    // No data available at all
    console.log('No prayer data available');
    updateStatusBorder('red');
  }
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      userLatitude = position.coords.latitude;
      userLongitude = position.coords.longitude;
      fetchNextFiveDays();
    }, function(error) {
      console.error("Error getting geolocation: ", error);
      updatePrayerData(); // Try to use cached data
    });
  } else {
    alert("Geolocation is not supported by this browser.");
    updatePrayerData(); // Try to use cached data
  }
}

async function fetchPrayerTimesForDate(date) {
  if (!userLatitude || !userLongitude) return null;
  
  const method = 2;
  const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timings/${formattedDate}?latitude=${userLatitude}&longitude=${userLongitude}&method=${method}`;
  
  try {
    console.log(`Fetching prayer times for ${getDateKey(date)}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`API error! code: ${data.code}`);
    }
    
    const timings = data.data.timings;
    return [{
      name: 'Fajr',
      time: timings.Fajr
    }, {
      name: 'Dhuhr',
      time: timings.Dhuhr
    }, {
      name: 'Asr',
      time: timings.Asr
    }, {
      name: 'Maghrib',
      time: timings.Maghrib
    }, {
      name: 'Isha',
      time: timings.Isha
    }];
    
  } catch (error) {
    console.error(`Error fetching for ${getDateKey(date)}:`, error);
    return null;
  }
}

async function fetchNextFiveDays() {
  if (isFetching) {
    console.log('Fetch already in progress');
    return;
  }
  
  if (!userLatitude || !userLongitude) {
    console.log('Waiting for location...');
    return;
  }
  
  isFetching = true;
  
  const today = new Date();
  const dates = [];
  
  // Create array of next 5 days (today + 4 more = 5 days total)
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  let successCount = 0;
  
  // Fetch each date with 10-second gap
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const dateKey = getDateKey(date);
    
    // Skip if we already have this date cached
    if (prayerTimesCache[dateKey]) {
      console.log(`Already have data for ${dateKey}, skipping`);
      continue;
    }
    
    const prayerData = await fetchPrayerTimesForDate(date);
    
    if (prayerData) {
      prayerTimesCache[dateKey] = prayerData;
      successCount++;
    }
    
    // Wait 10 seconds before next fetch, but not after the last one
    if (i < dates.length - 1) {
      console.log('Waiting 10 seconds before next fetch...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  if (successCount > 0) {
    cacheData();
    console.log(`Successfully fetched ${successCount} new days of prayer times`);
  }
  
  // Update the display with today's data
  updatePrayerData();
  
  // Schedule next fetch attempt at midnight
  scheduleMidnightFetch();
  
  isFetching = false;
}

function scheduleMidnightFetch() {
  if (fetchRetryTimeout) {
    clearTimeout(fetchRetryTimeout);
  }
  
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  
  const timeUntilMidnight = midnight - now;
  
  fetchRetryTimeout = setTimeout(() => {
    console.log('Midnight reached - fetching next 5 days');
    fetchNextFiveDays();
  }, timeUntilMidnight);
  
  console.log(`Scheduled next fetch for midnight (${midnight.toLocaleTimeString()})`);
}

function am_pm(hours) {
  return hours >= 12 ? 'pm' : 'am';
}

function updateClock() {
  const clockElement = document.getElementById('clock');
  const dayNameElement = document.getElementById('day-name');
  const dayPartElement = document.getElementById('day-part');
  const dateMonthElement = document.getElementById('date-month');
  const dateDayElement = document.getElementById('date-day');
  const dateYearElement = document.getElementById('date-year');
  
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = am_pm(hours);
  const hour12 = hours % 12 || 12;
  
  const formattedTime = `${hour12}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds} ${ampm}`;
  
  let partOfDay = hours < 12 ? 'Morning' : (hours < 18 ? 'Afternoon' : 'Evening');
  clockElement.textContent = formattedTime;
  
  const formattedDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedMonth = now.toLocaleDateString('en-US', { month: 'long' });
  const formattedDate = now.getDate();
  const formattedYear = now.getFullYear();
  
  dayNameElement.textContent = formattedDay;
  dayPartElement.textContent = partOfDay;
  dateMonthElement.textContent = formattedMonth;
  dateDayElement.textContent = formattedDate;
  dateYearElement.textContent = formattedYear;
  
  // Check if day changed (midnight)
  const todayKey = getDateKey(now);
  if (currentDateKey !== todayKey) {
    console.log('New day detected - updating prayer data');
    updatePrayerData();
  }
}

function updatePrayerInfo() {
  if (!currentDayData) return;
  
  const now = new Date();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  
  let currentPrayer = null;
  let currentPrayerTime = null;
  let nextPrayer = null;
  let nextPrayerTime = null;
  
  const prayerTimesInMinutes = currentDayData.map(prayer => {
    const [hour, minute] = prayer.time.split(':');
    return parseInt(hour) * 60 + parseInt(minute);
  });
  
  for (let i = 0; i < currentDayData.length; i++) {
    if (prayerTimesInMinutes[i] <= currentTimeInMinutes) {
      currentPrayer = currentDayData[i].name;
      currentPrayerTime = currentDayData[i].time;
      
      if (i < currentDayData.length - 1) {
        nextPrayer = currentDayData[i + 1].name;
        nextPrayerTime = currentDayData[i + 1].time;
      } else {
        nextPrayer = currentDayData[0].name;
        nextPrayerTime = currentDayData[0].time;
      }
    }
  }
  
  if (!currentPrayer) {
    currentPrayer = currentDayData[currentDayData.length - 1].name;
    currentPrayerTime = currentDayData[currentDayData.length - 1].time;
    nextPrayer = currentDayData[0].name;
    nextPrayerTime = currentDayData[0].time;
  }
  
  const formatPrayerTime = (time) => {
    const [hour, minute] = time.split(':');
    let formattedHour = parseInt(hour);
    const ampm = am_pm(formattedHour);
    if (formattedHour > 12) formattedHour -= 12;
    if (formattedHour === 0) formattedHour = 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };
  
  document.getElementById('current-prayer-name').textContent = currentPrayer;
  document.getElementById('current-prayer-time').textContent = formatPrayerTime(currentPrayerTime);
  document.getElementById('next-prayer-name').textContent = nextPrayer;
  document.getElementById('next-prayer-time').textContent = formatPrayerTime(nextPrayerTime);
  
  const breakElement = document.getElementById('prayer-time-break');
  breakElement.textContent = '→';
  breakElement.style.color = '#FFFFFF';
}

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function initialize() {
  loadCachedData();
  
  // Try to use cached data immediately
  updatePrayerData();
  
  // Get location and fetch new data
  getLocation();
  
  // Start the clock
  startClock();
  
  // Check every minute if we need to update (for midnight detection)
  setInterval(() => {
    const todayKey = getDateKey();
    if (currentDateKey !== todayKey) {
      console.log('New day detected - updating prayer data');
      updatePrayerData();
    }
  }, 60000);
}

window.addEventListener('online', () => {
  console.log('Connection restored - attempting to fetch');
  fetchNextFiveDays();
});

window.onload = initialize;

window.addEventListener('beforeunload', () => {
  if (fetchRetryTimeout) {
    clearTimeout(fetchRetryTimeout);
  }
});
