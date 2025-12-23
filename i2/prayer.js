// ------------------------ Geolocation and Prayer Time Fetch ------------------------

// Add a variable to store location data
let userLatitude, userLongitude;
let prayerTimesData = null;
let lastFetchDate = null;

// Function to get user location
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      userLatitude = position.coords.latitude;
      userLongitude = position.coords.longitude;
      fetchPrayerTimes();
    }, function (error) {
      console.error("Error getting geolocation: ", error);
      // Default to a location if geolocation fails (e.g., Makkah)
      userLatitude = 21.4225;
      userLongitude = 39.8262;
      fetchPrayerTimes();
    });
  } else {
    alert("Geolocation is not supported by this browser.");
    // Default to a location
    userLatitude = 21.4225;
    userLongitude = 39.8262;
    fetchPrayerTimes();
  }
}

// Fetch prayer times from the API
async function fetchPrayerTimes() {
  if (!userLatitude || !userLongitude) {
    console.log('Waiting for location...');
    return;
  }

  const currentDate = new Date().toLocaleDateString();
  if (lastFetchDate === currentDate) {
    console.log("Prayer times already fetched today.");
    return;
  }

  const method = 2; // Adjust this to the calculation method you want
  const url = `https://api.aladhan.com/v1/timings?latitude=${userLatitude}&longitude=${userLongitude}&method=${method}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const timings = data.data.timings;

    prayerTimesData = [
      { name: 'Fajr', time: timings.Fajr },
      { name: 'Dhuhr', time: timings.Dhuhr },
      { name: 'Asr', time: timings.Asr },
      { name: 'Maghrib', time: timings.Maghrib },
      { name: 'Isha', time: timings.Isha }
    ];
    lastFetchDate = currentDate;
    updatePrayerInfo();
  } catch (error) {
    console.error('Error fetching prayer times:', error);
  }
}

// Function to update the prayer info
function updatePrayerInfo() {
  if (!prayerTimesData) return;

  const now = new Date();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

  let currentPrayer = null, nextPrayer = null;
  let currentPrayerTime = null, nextPrayerTime = null;

  for (let i = 0; i < prayerTimesData.length; i++) {
    const prayerTime = prayerTimesData[i].time.split(':');
    const prayerTimeMinutes = parseInt(prayerTime[0]) * 60 + parseInt(prayerTime[1]);

    if (prayerTimeMinutes <= currentTimeInMinutes) {
      currentPrayer = prayerTimesData[i].name;
      currentPrayerTime = prayerTimesData[i].time;
      nextPrayer = (i < prayerTimesData.length - 1) ? prayerTimesData[i + 1].name : prayerTimesData[0].name;
      nextPrayerTime = (i < prayerTimesData.length - 1) ? prayerTimesData[i + 1].time : prayerTimesData[0].time;
    }
  }

  if (!currentPrayer) {
    currentPrayer = prayerTimesData[prayerTimesData.length - 1].name;
    currentPrayerTime = prayerTimesData[prayerTimesData.length - 1].time;
    nextPrayer = "Fajr";
    nextPrayerTime = prayerTimesData[0].time;
  }

  // Format time to 12-hour format with AM/PM
  function formatPrayerTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  document.getElementById('current-prayer-name').textContent = currentPrayer;
  document.getElementById('current-prayer-time').textContent = formatPrayerTime(currentPrayerTime);
  document.getElementById('next-prayer-name').textContent = nextPrayer;
  document.getElementById('next-prayer-time').textContent = formatPrayerTime(nextPrayerTime);
}
