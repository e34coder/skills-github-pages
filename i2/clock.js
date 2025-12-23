// ------------------------ Clock ------------------------

function am_pm(h) {
  return h >= 12 ? 'PM' : 'AM';
}

function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const hour12 = h % 12 || 12;
  document.getElementById("clock").textContent =
    `${hour12}:${m.toString().padStart(2, '0')} ${am_pm(h)}`;

  document.getElementById("day").textContent =
    now.toLocaleDateString('en-US', { weekday: 'long' });

  document.getElementById("date").textContent =
    now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  checkMedicineReminder(now);
}

setInterval(updateClock, 10000);
updateClock();
