// ------------------------ CACHE FOR OFFLINE USE ------------------------
const CACHE_NAME = 'medicine-reminder-cache-v5';
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

// Enhanced audio playback with detailed debugging
function playAudioWithDebug(audioId, debugName) {
  return new Promise((resolve) => {
    const audio = document.getElementById(audioId);
    if (!audio) {
      console.error(`Audio element "${audioId}" not found for: ${debugName}`);
      resolve();
      return;
    }
    
    console.log(`Preparing to play: ${debugName} (${audioId})`);
    
    // Reset audio completely
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1.0;
    
    // Check if audio is actually loaded
    if (audio.readyState < 2) { // HAVE_CURRENT_DATA or less
      console.warn(`Audio not loaded for ${debugName}, loading now...`);
      audio.load();
    }
    
    // Small delay for stability
    setTimeout(() => {
      console.log(`Attempting to play: ${debugName}`);
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`✅ Successfully started playing: ${debugName}`);
        }).catch(error => {
          console.error(`❌ Failed to play ${debugName}:`, error);
          console.error(`Error details:`, {
            name: error.name,
            message: error.message,
            audioId: audioId,
            readyState: audio.readyState,
            networkState: audio.networkState,
            error: audio.error
          });
          
          // Try alternative approach for iOS
          if (error.name === 'NotAllowedError') {
            console.log(`Attempting iOS workaround for ${debugName}`);
            attemptIOSWorkaround(audio, debugName, resolve);
          } else {
            setTimeout(resolve, 1000);
          }
        });
      }
      
      // Set up ended event
      const onEnded = () => {
        audio.removeEventListener('ended', onEnded);
        console.log(`✅ Finished playing: ${debugName}`);
        resolve();
      };
      
      audio.addEventListener('ended', onEnded);
      
      // Safety timeout
      setTimeout(() => {
        audio.removeEventListener('ended', onEnded);
        if (!audio.paused) {
          console.log(`⏱️ Timeout for: ${debugName}, forcing stop`);
          audio.pause();
          audio.currentTime = 0;
        }
        resolve();
      }, 8000); // 8 second timeout for longer audio files
    }, 300); // Longer initial delay
  });
}

// iOS workaround for audio playback issues
function attemptIOSWorkaround(audio, debugName, resolve) {
  console.log(`Trying iOS workaround for ${debugName}`);
  
  // Create a new audio element dynamically
  const newAudio = new Audio();
  newAudio.src = audio.querySelector('source').src;
  newAudio.volume = 1.0;
  newAudio.preload = 'auto';
  
  // Try to play after a user gesture simulation
  setTimeout(() => {
    const playPromise = newAudio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`✅ iOS workaround successful for: ${debugName}`);
        
        newAudio.onended = () => {
          console.log(`✅ iOS workaround finished: ${debugName}`);
          newAudio.remove();
          resolve();
        };
        
        // Safety timeout
        setTimeout(() => {
          newAudio.pause();
          newAudio.remove();
          resolve();
        }, 8000);
        
      }).catch(error => {
        console.error(`❌ iOS workaround failed for ${debugName}:`, error);
        newAudio.remove();
        setTimeout(resolve, 1000);
      });
    } else {
      newAudio.remove();
      setTimeout(resolve, 1000);
    }
  }, 500);
}

// iOS-compatible beep playback
function playBeepThreeTimes() {
  return new Promise((resolve) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      console.log('iOS: Playing beeps with enhanced method');
      playEnhancedIOSBeeps(resolve);
    } else {
      console.log('Non-iOS: Playing beeps');
      playStandardBeeps(resolve);
    }
  });
}

// Enhanced iOS beep implementation
function playEnhancedIOSBeeps(resolve) {
  const audio = document.getElementById("reminderSound");
  if (!audio) {
    console.error('Beep audio element not found');
    resolve();
    return;
  }
  
  let beepCount = 0;
  const maxBeeps = 3;
  
  function playSingleBeep() {
    // Complete reset for iOS
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1.0;
    
    // Force reload for iOS
    if (audio.readyState < 2) {
      audio.load();
    }
    
    // Longer delay for iOS stability
    setTimeout(() => {
      console.log(`Playing iOS beep ${beepCount + 1}/${maxBeeps}`);
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`✅ iOS beep ${beepCount + 1} started`);
        }).catch(error => {
          console.warn(`⚠️ iOS beep ${beepCount + 1} failed:`, error);
          beepCount++;
          if (beepCount < maxBeeps) {
            setTimeout(playSingleBeep, 1000);
          } else {
            console.log('✅ All iOS beeps attempted');
            resolve();
          }
        });
      }
      
      // iOS timeout-based playback (more reliable than ended event)
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        beepCount++;
        
        console.log(`✅ iOS beep ${beepCount}/${maxBeeps} completed`);
        
        if (beepCount < maxBeeps) {
          // Wait before playing next beep
          setTimeout(playSingleBeep, 700);
        } else {
          console.log('✅ All iOS beeps finished');
          resolve();
        }
      }, 650); // Slightly longer than beep duration
    }, 200);
  }
  
  playSingleBeep();
}

// Standard beep implementation for non-iOS devices
function playStandardBeeps(resolve) {
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
    
    console.log(`Playing beep ${beepCount + 1}/${maxBeeps}`);
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`✅ Beep ${beepCount + 1} started`);
      }).catch(error => {
        console.warn(`⚠️ Beep ${beepCount + 1} failed:`, error);
        beepCount++;
        if (beepCount < maxBeeps) {
          setTimeout(playSingleBeep, 1000);
        } else {
          resolve();
        }
      });
    }
    
    audio.onended = () => {
      beepCount++;
      console.log(`✅ Beep ${beepCount}/${maxBeeps} completed`);
      
      if (beepCount < maxBeeps) {
        setTimeout(playSingleBeep, 400);
      } else {
        console.log('✅ All beeps finished');
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
      console.log(`⏱️ Beep ${beepCount}/${maxBeeps} timeout`);
      
      if (beepCount < maxBeeps) {
        setTimeout(playSingleBeep, 400);
      } else {
        resolve();
      }
    }, 800);
  }
  
  playSingleBeep();
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
  
  return playAudioWithDebug(daySoundId, `Day: ${day}`);
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
  
  return playAudioWithDebug(timeSoundId, `Time: ${timeOfDay}`);
}

// Play medicine time announcement
function playMedicineTime() {
  return playAudioWithDebug("medicineTimeSound", "Medicine Time");
}

// Play complete medicine reminder sequence with detailed logging
async function playMedicineReminder(day, timeOfDay) {
  try {
    console.log(`🎬 STARTING MEDICINE REMINDER for ${day} ${timeOfDay}`);
    
    // Step 1: Play beeps
    console.log('🔊 Step 1: Playing 3 beeps...');
    await playBeepThreeTimes();
    
    // Longer pause for iOS after beeps
    console.log('⏸️ Pausing after beeps...');
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 2: Play medicine time announcement
    console.log('🔊 Step 2: Playing "Medicine Time"...');
    await playMedicineTime();
    
    // Pause
    console.log('⏸️ Pausing after medicine time...');
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 3: Play day of week
    console.log(`🔊 Step 3: Playing day (${day})...`);
    await playDaySound(day);
    
    // Pause
    console.log('⏸️ Pausing after day...');
    await new Promise(r => setTimeout(r, 1000));
    
    // Step 4: Play time of day
    console.log(`🔊 Step 4: Playing time (${timeOfDay})...`);
    await playTimeOfDaySound(timeOfDay);
    
    console.log('✅ COMPLETE MEDICINE REMINDER PLAYED SUCCESSFULLY');
    
  } catch (error) {
    console.error('❌ ERROR in medicine reminder:', error);
    
    // Try to continue with other parts even if one fails
    console.log('🔄 Attempting to continue with remaining audio...');
  }
}

function checkMedicineReminder(now) {
  resetIfNewDay();
  const h = now.getHours();
  const m = now.getMinutes();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });

  if (h === 6 && m === 0 && !playedToday.morning) {
    playedToday.morning = true;
    console.log('⏰ Playing morning reminder...');
    playMedicineReminder(day, 'morning');
  }

  if (h === 12 && m === 0 && !playedToday.noon) {
    playedToday.noon = true;
    console.log('⏰ Playing noon reminder...');
    playMedicineReminder(day, 'noon');
  }

  if (h === 18 && m === 0 && !playedToday.evening) {
    playedToday.evening = true;
    console.log('⏰ Playing evening reminder...');
    playMedicineReminder(day, 'evening');
  }
}

// Export functions for testing
window.debugAudio = {
  playMedicineTime: playMedicineTime,
  playDaySound: playDaySound,
  playTimeOfDaySound: playTimeOfDaySound,
  playBeepThreeTimes: playBeepThreeTimes,
  playMedicineReminder: playMedicineReminder
};
