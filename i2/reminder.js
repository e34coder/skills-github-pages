// ------------------------ CACHE FOR OFFLINE USE ------------------------
const CACHE_NAME = 'medicine-reminder-cache';
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

// Detect iPhone 8 or older iOS devices
function isOlderIOSDevice() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  
  if (!isIOS) return false;
  
  // Check for iPhone 8 (iPhone10,1 iPhone10,4) or older
  // iPhone 8 has iOS 16.7.8 which might have different audio handling
  const isIPhone8 = /iPhone10,[14]/.test(ua);
  const isOlderIOS = /OS 1[0-5]/.test(ua) || /OS 16/.test(ua); // iOS 10-16
  
  return isIPhone8 || isOlderIOS;
}

// Enhanced audio playback with iPhone 8 specific handling
function playAudioElement(audioId) {
  return new Promise((resolve) => {
    const audio = document.getElementById(audioId);
    if (!audio) {
      console.error(`Audio element not found: ${audioId}`);
      resolve();
      return;
    }
    
    const isOlderIOS = isOlderIOSDevice();
    
    // Reset audio with different approach for older iOS
    if (isOlderIOS) {
      // For older iOS: more aggressive reset
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1.0;
      
      // Force reload for older iOS
      if (audio.readyState < 2) {
        audio.load();
      }
      
      // Longer delay for older iOS
      setTimeout(() => {
        playAudioWithRetry(audio, audioId, resolve, 0);
      }, 300);
    } else {
      // Standard approach for newer devices
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1.0;
      
      setTimeout(() => {
        playAudioWithRetry(audio, audioId, resolve, 0);
      }, 100);
    }
  });
}

// Audio playback with retry logic for problematic devices
function playAudioWithRetry(audio, audioId, resolve, retryCount) {
  const maxRetries = 2;
  const isOlderIOS = isOlderIOSDevice();
  
  const playPromise = audio.play();
  
  if (playPromise !== undefined) {
    playPromise.then(() => {
      console.log(`Playing: ${audioId}`);
      
      // Set up ended event
      const onEnded = () => {
        audio.removeEventListener('ended', onEnded);
        console.log(`Finished: ${audioId}`);
        resolve();
      };
      
      audio.addEventListener('ended', onEnded);
      
      // Shorter timeout for older iOS (they're more sensitive)
      const timeoutDuration = isOlderIOS ? 3000 : 5000;
      setTimeout(() => {
        audio.removeEventListener('ended', onEnded);
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
        console.log(`Timeout: ${audioId}`);
        resolve();
      }, timeoutDuration);
      
    }).catch(error => {
      console.warn(`Failed to play ${audioId} (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        // Wait longer between retries for older iOS
        const retryDelay = isOlderIOS ? 500 : 300;
        setTimeout(() => {
          audio.currentTime = 0;
          playAudioWithRetry(audio, audioId, resolve, retryCount + 1);
        }, retryDelay);
      } else {
        console.error(`Giving up on ${audioId} after ${maxRetries} retries`);
        setTimeout(resolve, 1000);
      }
    });
  } else {
    // If play() returns undefined (older browsers)
    setTimeout(resolve, isOlderIOS ? 2000 : 1000);
  }
}

// Play beep three times with iPhone 8 optimization
function playBeepThreeTimes() {
  return new Promise((resolve) => {
    const audio = document.getElementById("reminderSound");
    if (!audio) {
      console.error('Beep audio element not found');
      resolve();
      return;
    }
    
    const isOlderIOS = isOlderIOSDevice();
    let beepCount = 0;
    const maxBeeps = 3;
    
    function playSingleBeep() {
      audio.currentTime = 0;
      audio.volume = 1.0;
      
      // For older iOS, add a small pre-delay
      setTimeout(() => {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log(`Beep ${beepCount + 1} started`);
          }).catch(error => {
            console.warn(`Beep ${beepCount + 1} failed:`, error);
            beepCount++;
            if (beepCount < maxBeeps) {
              // Longer delay for older iOS on failure
              setTimeout(playSingleBeep, isOlderIOS ? 1000 : 800);
            } else {
              resolve();
            }
          });
        }
        
        // Use timeout-based playback for older iOS (more reliable)
        if (isOlderIOS) {
          setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
            beepCount++;
            
            if (beepCount < maxBeeps) {
              // Longer pause between beeps for older iOS
              setTimeout(playSingleBeep, 700);
            } else {
              console.log('All beeps finished (timeout method)');
              resolve();
            }
          }, 600);
        } else {
          // Standard ended event for newer devices
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
      }, isOlderIOS ? 50 : 0);
    }
    
    playSingleBeep();
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

// Play complete medicine reminder sequence with iPhone 8 optimization
async function playMedicineReminder(day, timeOfDay) {
  const isOlderIOS = isOlderIOSDevice();
  
  try {
    console.log(`Starting medicine reminder for ${day} ${timeOfDay} (iPhone 8: ${isOlderIOS})`);
    
    // Step 1: Play beeps
    console.log('Step 1: Playing 3 beeps...');
    await playBeepThreeTimes();
    
    // Longer pause for iPhone 8 after beeps
    const pause1 = isOlderIOS ? 1200 : 500;
    console.log(`Pausing for ${pause1}ms after beeps...`);
    await new Promise(r => setTimeout(r, pause1));
    
    // Step 2: Play medicine time announcement
    console.log('Step 2: Playing "Medicine Time"...');
    await playMedicineTime();
    
    // Pause
    const pause2 = isOlderIOS ? 1200 : 500;
    console.log(`Pausing for ${pause2}ms after medicine time...`);
    await new Promise(r => setTimeout(r, pause2));
    
    // Step 3: Play day of week
    console.log(`Step 3: Playing day (${day})...`);
    await playDaySound(day);
    
    // Pause
    const pause3 = isOlderIOS ? 1200 : 500;
    console.log(`Pausing for ${pause3}ms after day...`);
    await new Promise(r => setTimeout(r, pause3));
    
    // Step 4: Play time of day
    console.log(`Step 4: Playing time (${timeOfDay})...`);
    await playTimeOfDaySound(timeOfDay);
    
    console.log('Complete medicine reminder played successfully');
    
  } catch (error) {
    console.error('Error in medicine reminder:', error);
    
    // Try to continue even if one part fails
    console.log('Attempting to continue with remaining audio...');
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
