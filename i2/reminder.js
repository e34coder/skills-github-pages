// ------------------------ CACHE FOR OFFLINE USE ------------------------
const CACHE_NAME = 'medicine-reminder-cache-v4';
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

// iOS-compatible beep playback
function playBeepThreeTimes() {
  return new Promise((resolve) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      // iOS-specific implementation
      playIOSBeeps(resolve);
    } else {
      // Standard implementation for other devices
      playStandardBeeps(resolve);
    }
  });
}

// iOS-specific beep implementation
function playIOSBeeps(resolve) {
  console.log('iOS: Playing beeps with iOS-compatible method');
  
  const audio = document.getElementById("reminderSound");
  if (!audio) {
    console.error('Beep audio element not found');
    resolve();
    return;
  }
  
  let beepCount = 0;
  const maxBeeps = 3;
  
  // iOS requires special handling for audio playback
  function playSingleBeep() {
    // Reset audio for iOS
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1.0;
    
    // Small delay for iOS
    setTimeout(() => {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`iOS beep ${beepCount + 1} started`);
        }).catch(error => {
          console.warn(`iOS beep ${beepCount + 1} failed:`, error);
          // Continue to next beep even if this one fails
          beepCount++;
          if (beepCount < maxBeeps) {
            setTimeout(playSingleBeep, 800);
          } else {
            console.log('iOS beeps finished (with possible errors)');
            resolve();
          }
        });
      }
      
      // iOS often doesn't fire 'ended' event reliably, so use timeout
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        beepCount++;
        
        if (beepCount < maxBeeps) {
          // Wait before playing next beep
          setTimeout(playSingleBeep, 500);
        } else {
          console.log('iOS beeps finished');
          resolve();
        }
      }, 600); // Beep duration
    }, 100);
  }
  
  playSingleBeep();
}

// Standard beep implementation for non-iOS devices
function playStandardBeeps(resolve) {
  console.log('Non-iOS: Playing beeps');
  
  const audio = document.getElementById("reminderSound");
  if (!audio) {
    console.error('Beep audio element not found');
    resolve();
    return;
  }
  
  let beepCount = 0;
  const maxBeeps = 3;
  
  function playSingleBeep() {
    audio.currentTime = 0;
    audio.volume = 1.0;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`Beep ${beepCount + 1} started`);
      }).catch(error => {
        console.warn(`Beep ${beepCount + 1} failed:`, error);
        beepCount++;
        if (beepCount < maxBeeps) {
          setTimeout(playSingleBeep, 800);
        } else {
          resolve();
        }
      });
    }
    
    audio.onended = () => {
      beepCount++;
      if (beepCount < maxBeeps) {
        setTimeout(playSingleBeep, 300);
      } else {
        console.log('All beeps finished');
        resolve();
      }
    };
    
    // Safety timeout
    setTimeout(() => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
      beepCount++;
      if (beepCount < maxBeeps) {
        setTimeout(playSingleBeep, 300);
      } else {
        resolve();
      }
    }, 800);
  }
  
  playSingleBeep();
}

// Play audio with iOS compatibility
function playAudioElement(audioId) {
  return new Promise((resolve) => {
    const audio = document.getElementById(audioId);
    if (!audio) {
      console.error(`Audio element not found: ${audioId}`);
      resolve();
      return;
    }
    
    // Reset audio
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1.0;
    
    // Small delay for iOS
    setTimeout(() => {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`Playing: ${audioId}`);
        }).catch(error => {
          console.warn(`Failed to play ${audioId}:`, error);
          setTimeout(resolve, 1000);
        });
      }
      
      // Set up ended event
      const onEnded = () => {
        audio.removeEventListener('ended', onEnded);
        console.log(`Finished: ${audioId}`);
        resolve();
      };
      
      audio.addEventListener('ended', onEnded);
      
      // Safety timeout (especially important for iOS)
      setTimeout(() => {
        audio.removeEventListener('ended', onEnded);
        audio.pause();
        audio.currentTime = 0;
        console.log(`Timeout: ${audioId}`);
        resolve();
      }, 5000);
    }, 100);
  });
}

// Play day sound based on day of week
function playDaySound(day) {
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
      return Promise.resolve();
  }
  
  return playAudioElement(daySoundId);
}

// Play time of day sound (morning/noon/evening)
function playTimeOfDaySound(timeOfDay) {
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
      return Promise.resolve();
  }
  
  return playAudioElement(timeSoundId);
}

// Play medicine time announcement
function playMedicineTime() {
  return playAudioElement("medicineTimeSound");
}

// Play complete medicine reminder sequence
async function playMedicineReminder(day, timeOfDay) {
  try {
    console.log(`Starting medicine reminder for ${day} ${timeOfDay}`);
    
    // Play beeps first
    await playBeepThreeTimes();
    
    // Longer pause for iOS
    await new Promise(r => setTimeout(r, 800));
    
    // Play medicine time announcement
    await playMedicineTime();
    
    // Pause
    await new Promise(r => setTimeout(r, 800));
    
    // Play day of week
    await playDaySound(day);
    
    // Pause
    await new Promise(r => setTimeout(r, 800));
    
    // Play time of day
    await playTimeOfDaySound(timeOfDay);
    
    console.log('Complete medicine reminder played successfully');
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
