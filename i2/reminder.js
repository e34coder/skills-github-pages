// ------------------------ CACHE FOR OFFLINE USE ------------------------
const CACHE_NAME = 'medicine-reminder-cache-v2';
const urlsToCache = [
  'https://e34coder.github.io/skills-github-pages/sounds/iphone/point-smooth-beep-230573.mp3',
  'i2/sounds/medicine_time.mp3',
  'i2/sounds/sunday.mp3',
  'i2/sounds/monday.mp3',
  'i2/sounds/tuesday.mp3',
  'i2/sounds/wednesday.mp3',
  'i2/sounds/thursday.mp3',
  'i2/sounds/friday.mp3',
  'i2/sounds/saturday.mp3',
  'i2/sounds/morning.mp3',
  'i2/sounds/noon.mp3',
  'i2/sounds/evening.mp3'
];

// Cache all audio files on load
async function cacheAudioFiles() {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Cache each file individually with error handling
    for (const url of urlsToCache) {
      try {
        await cache.add(url);
        console.log(`Cached: ${url}`);
      } catch (error) {
        console.warn(`Failed to cache ${url}:`, error);
      }
    }
    
    console.log('All audio files cached successfully');
  } catch (error) {
    console.warn('Failed to cache audio files:', error);
  }
}

// Get audio from cache or network
async function getAudioFromCache(url) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    
    if (cachedResponse) {
      console.log(`Using cached audio: ${url}`);
      return await cachedResponse.blob();
    }
    
    // If not in cache, fetch and cache it
    const response = await fetch(url);
    if (response.ok) {
      const responseClone = response.clone();
      cache.put(url, responseClone);
      return await response.blob();
    }
    return null;
  } catch (error) {
    console.warn(`Error accessing cache for ${url}:`, error);
    return null;
  }
}

// Preload all audio elements
function preloadAllAudio() {
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    audio.load();
    console.log(`Preloaded: ${audio.querySelector('source').src}`);
  });
}

// ------------------------ MEDICINE REMINDER VARIABLES ------------------------
const playedToday = {
  morning: false,
  noon: false,
  evening: false,
  date: new Date().toDateString()
};

function resetIfNewDay() {
  const today = new Date().toDateString();
  if (playedToday.date !== today) {
    playedToday.morning = playedToday.noon = playedToday.evening = false;
    playedToday.date = today;
  }
}

// Play beep three times
function playBeepThreeTimes() {
  return new Promise(async (resolve) => {
    const audio = document.getElementById("reminderSound");
    let count = 0;
    
    // Reset audio and ensure it's ready
    audio.pause();
    audio.currentTime = 0;
    
    // Function to play a single beep
    async function playSingleBeep() {
      return new Promise((beepResolve) => {
        audio.currentTime = 0;
        
        // Create a new play promise for each beep
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log(`Beep ${count + 1} started`);
          }).catch(error => {
            console.warn(`Beep ${count + 1} failed:`, error);
            // If play fails, wait and continue
            setTimeout(beepResolve, 500);
            return;
          });
        }
        
        // Set up ended event
        const onEnded = () => {
          audio.removeEventListener('ended', onEnded);
          console.log(`Beep ${count + 1} ended`);
          beepResolve();
        };
        
        audio.addEventListener('ended', onEnded);
        
        // Safety timeout in case 'ended' event doesn't fire
        setTimeout(() => {
          audio.removeEventListener('ended', onEnded);
          beepResolve();
        }, 800);
      });
    }
    
    // Play three beeps in sequence with proper timing
    for (let i = 0; i < 3; i++) {
      count = i;
      await playSingleBeep();
      
      // Add a pause between beeps (except after the last one)
      if (i < 2) {
        await new Promise(r => setTimeout(r, 300));
      }
    }
    
    console.log('All beeps finished');
    resolve();
  });
}

// Play day sound based on day of week
function playDaySound(day) {
  return new Promise((resolve) => {
    let daySoundId = '';
    
    switch(day.toLowerCase()) {
      case 'sunday':
        daySoundId = 'sundaySound';
        break;
      case 'monday':
        daySoundId = 'mondaySound';
        break;
      case 'tuesday':
        daySoundId = 'tuesdaySound';
        break;
      case 'wednesday':
        daySoundId = 'wednesdaySound';
        break;
      case 'thursday':
        daySoundId = 'thursdaySound';
        break;
      case 'friday':
        daySoundId = 'fridaySound';
        break;
      case 'saturday':
        daySoundId = 'saturdaySound';
        break;
      default:
        console.warn(`Unknown day: ${day}`);
        resolve();
        return;
    }
    
    const dayAudio = document.getElementById(daySoundId);
    if (!dayAudio) {
      console.error(`Audio element not found: ${daySoundId}`);
      resolve();
      return;
    }
    
    dayAudio.currentTime = 0;
    dayAudio.volume = 1.0;
    
    const playPromise = dayAudio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`Playing day sound: ${day}`);
      }).catch(error => {
        console.warn(`Failed to play day sound for ${day}:`, error);
        setTimeout(resolve, 1000);
      });
    }
    
    dayAudio.onended = () => {
      console.log(`Day sound finished: ${day}`);
      resolve();
    };
    
    // Safety timeout
    setTimeout(() => {
      dayAudio.pause();
      dayAudio.currentTime = 0;
      resolve();
    }, 5000);
  });
}

// Play time of day sound (morning/noon/evening)
function playTimeOfDaySound(timeOfDay) {
  return new Promise((resolve) => {
    let timeSoundId = '';
    
    switch(timeOfDay.toLowerCase()) {
      case 'morning':
        timeSoundId = 'morningSound';
        break;
      case 'noon':
        timeSoundId = 'noonSound';
        break;
      case 'evening':
        timeSoundId = 'eveningSound';
        break;
      default:
        console.warn(`Unknown time of day: ${timeOfDay}`);
        resolve();
        return;
    }
    
    const timeAudio = document.getElementById(timeSoundId);
    if (!timeAudio) {
      console.error(`Audio element not found: ${timeSoundId}`);
      resolve();
      return;
    }
    
    timeAudio.currentTime = 0;
    timeAudio.volume = 1.0;
    
    const playPromise = timeAudio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`Playing time sound: ${timeOfDay}`);
      }).catch(error => {
        console.warn(`Failed to play time sound for ${timeOfDay}:`, error);
        setTimeout(resolve, 1000);
      });
    }
    
    timeAudio.onended = () => {
      console.log(`Time sound finished: ${timeOfDay}`);
      resolve();
    };
    
    // Safety timeout
    setTimeout(() => {
      timeAudio.pause();
      timeAudio.currentTime = 0;
      resolve();
    }, 5000);
  });
}

// Play medicine time announcement
function playMedicineTime() {
  return new Promise((resolve) => {
    const medicineAudio = document.getElementById("medicineTimeSound");
    if (!medicineAudio) {
      console.error('Medicine time audio element not found');
      resolve();
      return;
    }
    
    medicineAudio.currentTime = 0;
    medicineAudio.volume = 1.0;
    
    const playPromise = medicineAudio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('Playing medicine time announcement');
      }).catch(error => {
        console.warn('Failed to play medicine time:', error);
        setTimeout(resolve, 1000);
      });
    }
    
    medicineAudio.onended = () => {
      console.log('Medicine time announcement finished');
      resolve();
    };
    
    // Safety timeout
    setTimeout(() => {
      medicineAudio.pause();
      medicineAudio.currentTime = 0;
      resolve();
    }, 5000);
  });
}

// Play complete medicine reminder sequence
async function playMedicineReminder(day, timeOfDay) {
  try {
    // Play beeps first
    await playBeepThreeTimes();
    
    // Small pause
    await new Promise(r => setTimeout(r, 300));
    
    // Play medicine time announcement
    await playMedicineTime();
    
    // Small pause
    await new Promise(r => setTimeout(r, 300));
    
    // Play day of week
    await playDaySound(day);
    
    // Small pause
    await new Promise(r => setTimeout(r, 300));
    
    // Play time of day
    await playTimeOfDaySound(timeOfDay);
    
    console.log('Complete medicine reminder played');
  } catch (error) {
    console.error('Error playing medicine reminder:', error);
  }
}

function checkMedicineReminder(now) {
  resetIfNewDay();
  const h = now.getHours();
  const m = now.getMinutes();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });

  if (h === 6 && m === 0 && !playedToday.morning) {
    playedToday.morning = true;
    console.log('Playing morning reminder...');
    playMedicineReminder(day, 'morning');
  }

  if (h === 12 && m === 0 && !playedToday.noon) {
    playedToday.noon = true;
    console.log('Playing noon reminder...');
    playMedicineReminder(day, 'noon');
  }

  if (h === 18 && m === 0 && !playedToday.evening) {
    playedToday.evening = true;
    console.log('Playing evening reminder...');
    playMedicineReminder(day, 'evening');
  }
}
