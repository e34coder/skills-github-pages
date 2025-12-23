// ------------------------ CACHE FOR OFFLINE USE ------------------------
const CACHE_NAME = 'medicine-reminder-cache-v1';
const urlsToCache = [
  'https://e34coder.github.io/skills-github-pages/sounds/iphone/point-smooth-beep-230573.mp3'
];

// Cache audio file on load
async function cacheAudioFile() {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache);
    console.log('Audio file cached successfully');
  } catch (error) {
    console.warn('Failed to cache audio file:', error);
  }
}

// Get audio from cache or network
async function getAudioFromCache(url) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);
    
    if (cachedResponse) {
      console.log('Using cached audio');
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
    console.warn('Error accessing cache:', error);
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

// FIXED FOR MOBILE: Play beep three times with mobile-friendly audio handling
function playBeepThreeTimes() {
  return new Promise(async (resolve) => {
    const audio = document.getElementById("reminderSound");
    let count = 0;
    
    // Reset audio and ensure it's ready
    audio.pause();
    audio.currentTime = 0;
    
    // On mobile, we need to load the audio first
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile, we'll use a simpler approach with timeouts
      // since audio playback can be restricted
      await new Promise(r => setTimeout(r, 100));
    }
    
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

// FIXED FOR MOBILE: Speech synthesis with better mobile handling
function speakMedicine(text) {
  return new Promise((resolve) => {
    // Cancel any ongoing speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    // Check if speech synthesis is available
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }
    
    // Detect if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // For mobile, we need to ensure we have user interaction context
    if (isMobile) {
      // Small delay to ensure audio context is ready
      setTimeout(() => {
        performSpeech(text, resolve);
      }, 500);
    } else {
      // Desktop can proceed immediately
      setTimeout(() => {
        performSpeech(text, resolve);
      }, 100);
    }
  });
}

// Helper function to perform the actual speech
function performSpeech(text, resolve, retryCount = 0) {
  const msg = new SpeechSynthesisUtterance(text);
  
  // Set properties
  msg.volume = 1;
  msg.rate = 0.85; // Slightly slower for clarity
  msg.pitch = 1;
  msg.lang = 'en-US';
  
  // Get available voices
  const voices = speechSynthesis.getVoices();
  
  if (voices.length > 0) {
    // Try to find a good English voice
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length > 0) {
      // Prefer voices that work well on mobile
      const preferredVoice = englishVoices.find(v => 
        v.name.includes('Google') || 
        v.name.includes('Samantha') ||
        v.name.includes('Alex') ||
        v.name.includes('Karen')
      );
      msg.voice = preferredVoice || englishVoices[0];
    }
  }
  
  // Add event listeners
  msg.onstart = () => {
    console.log('Speech started:', text);
  };
  
  msg.onend = () => {
    console.log('Speech ended successfully');
    resolve();
  };
  
  msg.onerror = (event) => {
    console.error('Speech error:', event.error);
    
    // Retry logic (max 2 retries)
    if (retryCount < 2) {
      console.log(`Retrying speech (attempt ${retryCount + 1})...`);
      setTimeout(() => {
        performSpeech(text, resolve, retryCount + 1);
      }, 500);
    } else {
      console.log('Max retries reached, giving up');
      resolve();
    }
  };
  
  // Speak the message
  try {
    speechSynthesis.speak(msg);
  } catch (error) {
    console.error('Error starting speech:', error);
    
    // If speech fails immediately, retry once
    if (retryCount === 0) {
      setTimeout(() => {
        performSpeech(text, resolve, retryCount + 1);
      }, 500);
    } else {
      resolve();
    }
  }
  
  // Safety timeout (10 seconds)
  setTimeout(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      console.log('Speech cancelled due to timeout');
    }
    resolve();
  }, 10000);
}

function checkMedicineReminder(now) {
  resetIfNewDay();
  const h = now.getHours();
  const m = now.getMinutes();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });

  if (h === 6 && m === 0 && !playedToday.morning) {
    playedToday.morning = true;
    console.log('Playing morning reminder...');
    playBeepThreeTimes().then(() => {
      speakMedicine(`Medicine time, ${day} morning.`);
    });
  }

  if (h === 12 && m === 0 && !playedToday.noon) {
    playedToday.noon = true;
    console.log('Playing noon reminder...');
    playBeepThreeTimes().then(() => {
      speakMedicine(`Medicine time, ${day} noon.`);
    });
  }

  if (h === 18 && m === 0 && !playedToday.evening) {
    playedToday.evening = true;
    console.log('Playing evening reminder...');
    playBeepThreeTimes().then(() => {
      speakMedicine(`Medicine time, ${day} evening.`);
    });
  }
}
