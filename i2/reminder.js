// ------------------------ CACHE FOR OFFLINE USE ------------------------
const CACHE_NAME = 'medicine-reminder-cache-v3';
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
    try {
      audio.load();
      console.log(`Preloaded: ${audio.querySelector('source').src}`);
    } catch (error) {
      console.warn(`Failed to preload audio:`, error);
    }
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

// Get audio element with fallback
function getBeepAudioElement(index) {
  const audioId = `reminderSound${index}`;
  const audio = document.getElementById(audioId);
  
  // If specific audio element doesn't exist, fall back to first one
  if (!audio && index > 1) {
    console.warn(`Audio element ${audioId} not found, falling back to reminderSound1`);
    return document.getElementById("reminderSound1");
  }
  
  return audio;
}

// Mobile-friendly beep playback
function playBeepThreeTimes() {
  return new Promise((resolve) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile: Use separate audio elements or fallback to single element
      console.log('Mobile: Playing beeps');
      playMobileBeeps(resolve);
    } else {
      // For desktop
      console.log('Desktop: Playing beeps');
      playDesktopBeeps(resolve);
    }
  });
}

// Mobile beep implementation
function playMobileBeeps(resolve) {
  let completedBeeps = 0;
  
  function playBeep(beepNumber) {
    return new Promise((beepResolve) => {
      const audio = getBeepAudioElement(beepNumber);
      
      if (!audio) {
        console.error(`No audio element found for beep ${beepNumber}`);
        beepResolve();
        return;
      }
      
      // Reset audio
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1.0;
      
      // Small delay between beeps
      setTimeout(() => {
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log(`Beep ${beepNumber} started`);
          }).catch(error => {
            console.warn(`Beep ${beepNumber} failed:`, error);
            beepResolve();
          });
        }
        
        // Set timeout for beep completion
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
          console.log(`Beep ${beepNumber} completed`);
          beepResolve();
        }, 700);
      }, beepNumber === 1 ? 0 : 800);
    });
  }
  
  // Play beeps sequentially
  async function playSequence() {
    try {
      await playBeep(1);
      await playBeep(2);
      await playBeep(3);
      console.log('All mobile beeps finished');
    } catch (error) {
      console.error('Error in beep sequence:', error);
    } finally {
      resolve();
    }
  }
  
  playSequence();
}

// Desktop beep implementation
function playDesktopBeeps(resolve) {
  const audio = getBeepAudioElement(1);
  if (!audio) {
    console.error('No beep audio element found');
    resolve();
    return;
  }
  
  let count = 0;
  
  function playBeep() {
    audio.currentTime = 0;
    audio.volume = 1.0;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`Desktop beep ${count + 1} started`);
      }).catch(error => {
        console.warn(`Desktop beep ${count + 1} failed:`, error);
        count++;
        if (count < 3) setTimeout(playBeep, 800);
        else resolve();
      });
    }
    
    audio.onended = () => {
      count++;
      if (count < 3) {
        setTimeout(playBeep, 300);
      } else {
        console.log('All desktop beeps finished');
        resolve();
      }
    };
  }
  
  playBeep();
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
    
    // Reset and prepare audio
    dayAudio.pause();
    dayAudio.currentTime = 0;
    dayAudio.volume = 1.0;
    
    // Small delay to ensure audio context is ready
    setTimeout(() => {
      const playPromise = dayAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`Playing day sound: ${day}`);
        }).catch(error => {
          console.warn(`Failed to play day sound for ${day}:`, error);
          setTimeout(resolve, 1000);
        });
      }
      
      // Set up ended event
      dayAudio.onended = () => {
        console.log(`Day sound finished: ${day}`);
        resolve();
      };
      
      // Safety timeout
      setTimeout(() => {
        if (!dayAudio.paused) {
          dayAudio.pause();
          dayAudio.currentTime = 0;
        }
        resolve();
      }, 5000);
    }, 100);
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
    
    // Reset and prepare audio
    timeAudio.pause();
    timeAudio.currentTime = 0;
    timeAudio.volume = 1.0;
    
    // Small delay to ensure audio context is ready
    setTimeout(() => {
      const playPromise = timeAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`Playing time sound: ${timeOfDay}`);
        }).catch(error => {
          console.warn(`Failed to play time sound for ${timeOfDay}:`, error);
          setTimeout(resolve, 1000);
        });
      }
      
      // Set up ended event
      timeAudio.onended = () => {
        console.log(`Time sound finished: ${timeOfDay}`);
        resolve();
      };
      
      // Safety timeout
      setTimeout(() => {
        if (!timeAudio.paused) {
          timeAudio.pause();
          timeAudio.currentTime = 0;
        }
        resolve();
      }, 5000);
    }, 100);
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
    
    // Reset and prepare audio
    medicineAudio.pause();
    medicineAudio.currentTime = 0;
    medicineAudio.volume = 1.0;
    
    // Small delay to ensure audio context is ready
    setTimeout(() => {
      const playPromise = medicineAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Playing medicine time announcement');
        }).catch(error => {
          console.warn('Failed to play medicine time:', error);
          setTimeout(resolve, 1000);
        });
      }
      
      // Set up ended event
      medicineAudio.onended = () => {
        console.log('Medicine time announcement finished');
        resolve();
      };
      
      // Safety timeout
      setTimeout(() => {
        if (!medicineAudio.paused) {
          medicineAudio.pause();
          medicineAudio.currentTime = 0;
        }
        resolve();
      }, 5000);
    }, 100);
  });
}

// Play complete medicine reminder sequence
async function playMedicineReminder(day, timeOfDay) {
  try {
    console.log(`Starting medicine reminder for ${day} ${timeOfDay}`);
    
    // Play beeps first
    await playBeepThreeTimes();
    
    // Small pause
    await new Promise(r => setTimeout(r, 500));
    
    // Play medicine time announcement
    await playMedicineTime();
    
    // Small pause
    await new Promise(r => setTimeout(r, 500));
    
    // Play day of week
    await playDaySound(day);
    
    // Small pause
    await new Promise(r => setTimeout(r, 500));
    
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
