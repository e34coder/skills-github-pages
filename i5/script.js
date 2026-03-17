// script.js - Complete file with null checks
const VERSION = "v1.04";
let userLatitude, userLongitude;
let prayerTimesCache = {}; // Format: { "2024-01-05": [...], "2024-01-06": [...], ... }
let currentDateKey = null;
let currentDayData = null;
let isFetching = false;
let fetchRetryTimeout = null;
let statusBorder = document.getElementById("status-border");

function getDateKey(date = new Date()) {
	return date.toISOString().split("T")[0];
}

function loadCachedData() {
	try {
		const cached = localStorage.getItem("prayerTimesMultiDay");
		if (cached) {
			prayerTimesCache = JSON.parse(cached);
			console.log(
				"Loaded cache with days:",
				Object.keys(prayerTimesCache),
			);
		}
	} catch (e) {
		console.error("Error loading cached data:", e);
		prayerTimesCache = {};
	}
}

function cacheData() {
	try {
		localStorage.setItem(
			"prayerTimesMultiDay",
			JSON.stringify(prayerTimesCache),
		);
	} catch (e) {
		console.error("Error caching data:", e);
	}
}

function updateStatusBorder(status) {
	if (!statusBorder) return;

	// Remove all status classes
	statusBorder.classList.remove(
		"status-green",
		"status-yellow",
		"status-red",
	);

	// Add the appropriate class
	if (status === "green") {
		statusBorder.classList.add("status-green");
	} else if (status === "yellow") {
		statusBorder.classList.add("status-yellow");
	} else if (status === "red") {
		statusBorder.classList.add("status-red");
	}
}

function getDataForDate(targetDate) {
	const targetKey = getDateKey(targetDate);

	// Check if we have data for this exact date
	if (prayerTimesCache[targetKey]) {
		return {
			data: prayerTimesCache[targetKey],
			source: "exact",
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
			source: "older",
			originalDate: mostRecent,
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

	const versionBadge = document.getElementById("version-badge");
	if (versionBadge) {
		versionBadge.textContent = VERSION;
	}

	const result = getDataForDate(today);

	if (result) {
		currentDayData = result.data;

		if (result.source === "exact") {
			// Using today's exact data
			updateStatusBorder("green");
			console.log("Using fresh data for today");
		} else {
			// Using older data
			const daysDiff = getDaysDifference(result.originalDate, todayKey);
			if (daysDiff <= 5) {
				updateStatusBorder("yellow");
				console.log(
					`Using cached data from ${result.originalDate} (${daysDiff} days old)`,
				);
			} else {
				updateStatusBorder("red");
				console.log(
					`Using old data from ${result.originalDate} (${daysDiff} days old) - PAST 5 DAYS`,
				);
			}
		}

		updatePrayerInfo();
	} else {
		// No data available at all
		console.log("No prayer data available");
		updateStatusBorder("red");
	}
}

function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function (position) {
				userLatitude = position.coords.latitude;
				userLongitude = position.coords.longitude;
				fetchNextFiveDays();
			},
			function (error) {
				console.error("Error getting geolocation: ", error);
				updatePrayerData(); // Try to use cached data
			},
		);
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
		return [
			{
				name: "Fajr",
				time: timings.Fajr,
			},
			{
				name: "Dhuhr",
				time: timings.Dhuhr,
			},
			{
				name: "Asr",
				time: timings.Asr,
			},
			{
				name: "Maghrib",
				time: timings.Maghrib,
			},
			{
				name: "Isha",
				time: timings.Isha,
			},
		];
	} catch (error) {
		console.error(`Error fetching for ${getDateKey(date)}:`, error);
		return null;
	}
}

async function fetchNextFiveDays() {
	if (isFetching) {
		console.log("Fetch already in progress");
		return;
	}

	if (!userLatitude || !userLongitude) {
		console.log("Waiting for location...");
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
			console.log("Waiting 10 seconds before next fetch...");
			await new Promise((resolve) => setTimeout(resolve, 10000));
		}
	}

	if (successCount > 0) {
		cacheData();
		console.log(
			`Successfully fetched ${successCount} new days of prayer times`,
		);
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
		console.log("Midnight reached - fetching next 5 days");
		fetchNextFiveDays();
	}, timeUntilMidnight);

	console.log(
		`Scheduled next fetch for midnight (${midnight.toLocaleTimeString()})`,
	);
}

function am_pm(hours) {
	return hours >= 12 ? "pm" : "am";
}

// Replace your updateDayIcon function with this version - NO SPACE VERSION
function updateDayIcon() {
	const canvas = document.getElementById("dayIcon");
	if (!canvas) return;

	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	ctx.clearRect(0, 0, 100, 100);

	const now = new Date();
	const hours = now.getHours();

	// Morning: 6am to 12pm (noon)
	// Afternoon: 12pm to 6pm
	// Evening: 6pm to 6am
	if (hours >= 6 && hours < 12) {
		// Morning - sun clipped to top half, fills canvas
		ctx.save();
		ctx.beginPath();
		ctx.rect(0, 0, 100, 50);
		ctx.clip();

		ctx.beginPath();
		ctx.arc(50, 70, 35, 0, 2 * Math.PI); // Moved down to fill top half
		ctx.fillStyle = "#FFB347";
		ctx.fill();
		ctx.strokeStyle = "#FF8C00";
		ctx.lineWidth = 3;
		ctx.stroke();

		ctx.strokeStyle = "#FFB347";
		ctx.lineWidth = 3;

		for (let i = 0; i < 8; i++) {
			let angle = (i / 8) * (2 * Math.PI);
			let x1 = 50 + Math.cos(angle) * 40;
			let y1 = 70 + Math.sin(angle) * 40;
			let x2 = 50 + Math.cos(angle) * 55;
			let y2 = 70 + Math.sin(angle) * 55;

			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}

		ctx.restore();

		ctx.beginPath();
		ctx.moveTo(0, 50);
		ctx.lineTo(100, 50);
		ctx.strokeStyle = "#CCCCCC";
		ctx.lineWidth = 1;
		ctx.stroke();
	} else if (hours >= 12 && hours < 18) {
		// Afternoon - full sun filling canvas
		ctx.beginPath();
		ctx.arc(50, 50, 40, 0, 2 * Math.PI); // Larger, centered
		ctx.fillStyle = "#FFD700";
		ctx.fill();
		ctx.strokeStyle = "#FF8C00";
		ctx.lineWidth = 3;
		ctx.stroke();

		ctx.strokeStyle = "#FFD700";
		ctx.lineWidth = 3;

		for (let i = 0; i < 8; i++) {
			let angle = (i / 8) * (2 * Math.PI);
			let x1 = 50 + Math.cos(angle) * 45;
			let y1 = 50 + Math.sin(angle) * 45;
			let x2 = 50 + Math.cos(angle) * 65;
			let y2 = 50 + Math.sin(angle) * 65;

			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}
	} else {
		// Night - moon filling canvas, no stars
		ctx.beginPath();
		ctx.arc(50, 50, 40, 0, 2 * Math.PI); // Larger moon, centered
		ctx.fillStyle = "#F0F0F0";
		ctx.fill();
		ctx.strokeStyle = "#C0C0C0";
		ctx.lineWidth = 3;
		ctx.stroke();

		// Crescent cutout - adjusted for larger moon
		ctx.beginPath();
		ctx.arc(30, 40, 30, 0, 2 * Math.PI);
		ctx.fillStyle = "#000000";
		ctx.fill();
	}
}

// Update the time formatting in your updateClock function
function updateClock() {
	// Get all elements with null checks
	const clockElement = document.getElementById("clock");
	const dayNameElement = document.getElementById("day-name");
	const dayPartElement = document.getElementById("day-part");
	const dateMonthElement = document.getElementById("date-month");
	const dateDayElement = document.getElementById("date-day");
	const dateYearElement = document.getElementById("date-year");

	const now = new Date();
	const hours = now.getHours();
	const minutes = now.getMinutes();
	const ampm = hours >= 12 ? "pm" : "am";
	const hour12 = hours % 12 || 12;

	// Format time without seconds
	const formattedTime = `${hour12}:${minutes < 10 ? "0" + minutes : minutes} ${ampm}`;

	let partOfDay =
		hours < 12 ? "Morning" : hours < 18 ? "Afternoon" : "Evening";

	// Update elements only if they exist
	if (clockElement) clockElement.textContent = formattedTime;

	const formattedDay = now.toLocaleDateString("en-US", { weekday: "long" });
	const formattedMonth = now.toLocaleDateString("en-US", { month: "long" });
	const formattedDate = now.getDate();
	const formattedYear = now.getFullYear();

	if (dayNameElement) dayNameElement.textContent = formattedDay;
	if (dayPartElement) dayPartElement.textContent = partOfDay;
	if (dateMonthElement) dateMonthElement.textContent = formattedMonth;
	if (dateDayElement) dateDayElement.textContent = formattedDate;
	if (dateYearElement) dateYearElement.textContent = formattedYear;

	// Update the icon
	updateDayIcon();

	// Update current/next prayer by the current time (with cached prayer data)
	if (currentDayData) {
		updatePrayerInfo();
	}

	// Check if day changed (midnight)
	const todayKey = getDateKey(now);
	if (currentDateKey !== todayKey) {
		console.log("New day detected - updating prayer data");
		updatePrayerData();
	}
}
// Replace your updatePrayerInfo function with this corrected version
function updatePrayerInfo() {
	if (!currentDayData) return;

	const currentPrayerNameEl = document.getElementById("current-prayer-name");
	const currentPrayerTimeEl = document.getElementById("current-prayer-time");
	const nextPrayerNameEl = document.getElementById("next-prayer-name");
	const nextPrayerTimeEl = document.getElementById("next-prayer-time");

	if (
		!currentPrayerNameEl ||
		!currentPrayerTimeEl ||
		!nextPrayerNameEl ||
		!nextPrayerTimeEl
	) {
		console.error("Prayer info elements not found");
		return;
	}

	const now = new Date();
	const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

	const knownOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
	const prayerSchedule = [];

	for (let prayer of currentDayData) {
		if (!prayer.time || !prayer.name) continue;
		const parts = prayer.time.split(":");
		if (parts.length < 2) continue;
		const hour = Number(parts[0]);
		const minute = Number(parts[1]);
		if (Number.isNaN(hour) || Number.isNaN(minute)) continue;
		prayerSchedule.push({
			name: prayer.name,
			time: prayer.time,
			minutes: hour * 60 + minute,
		});
	}

	// Keep prayers in expected order to avoid API ordering quirks
	prayerSchedule.sort(
		(a, b) => knownOrder.indexOf(a.name) - knownOrder.indexOf(b.name),
	);

	// Ensure we have at least two prayers
	if (prayerSchedule.length < 2) {
		console.error("Prayer schedule incomplete", prayerSchedule);
		return;
	}

	let currentPrayerIdx = -1;

	// Find the last prayer that is <= current time
	for (let i = prayerSchedule.length - 1; i >= 0; i--) {
		if (prayerSchedule[i].minutes <= currentTimeInMinutes) {
			currentPrayerIdx = i;
			break;
		}
	}

	if (currentPrayerIdx === -1) {
		// Current time is before first prayer (Fajr)
		currentPrayerIdx = prayerSchedule.length - 1; // Isha from previous day
	}

	const nextPrayerIdx = (currentPrayerIdx + 1) % prayerSchedule.length;
	const currentPrayer = prayerSchedule[currentPrayerIdx];
	const nextPrayer = prayerSchedule[nextPrayerIdx];

	console.log(
		"Prayer schedule:",
		prayerSchedule.map((p) => `${p.name}@${p.minutes}`),
	);
	console.log(
		"Current time minutes:",
		currentTimeInMinutes,
		"current index:",
		currentPrayerIdx,
		"next index:",
		nextPrayerIdx,
	);

	const formatPrayerTime = (time) => {
		const [hour, minute] = time.split(":");
		let h = Number(hour);
		if (Number.isNaN(h)) return time;
		const ampm = h >= 12 ? "pm" : "am";
		if (h === 0) h = 12;
		if (h > 12) h -= 12;
		const m = minute?.padStart(2, "0") ?? "00";
		return `${h}:${m} ${ampm}`;
	};

	currentPrayerNameEl.textContent = currentPrayer.name;
	currentPrayerTimeEl.textContent = formatPrayerTime(currentPrayer.time);
	nextPrayerNameEl.textContent = nextPrayer.name;
	nextPrayerTimeEl.textContent = formatPrayerTime(nextPrayer.time);
}

function startClock() {
	updateClock();
	setInterval(updateClock, 1000);
}

function initialize() {
	console.log("Initializing...");

	// Get status border element
	statusBorder = document.getElementById("status-border");

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
			console.log("New day detected - updating prayer data");
			updatePrayerData();
		}
	}, 60000);
}

// Make sure DOM is fully loaded before initializing
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initialize);
} else {
	// DOM is already loaded
	initialize();
}

window.addEventListener("online", () => {
	console.log("Connection restored - attempting to fetch");
	fetchNextFiveDays();
});

window.addEventListener("beforeunload", () => {
	if (fetchRetryTimeout) {
		clearTimeout(fetchRetryTimeout);
	}
});
