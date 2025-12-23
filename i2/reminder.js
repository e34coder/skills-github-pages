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

// FIXED: Play beep three times with proper timing
function playBeepThreeTimes() {
  return new Promise((resolve) => {
    const audio = document.getElementById("reminderSound");
    let count = 0;
    
    // Reset audio
    audio.pause();
    audio.currentTime = 0;
    
    // Function to play a single beep
    function playBeep() {
      return new Promise((beepResolve) => {
        audio.currentTime = 0;
        
        // Create a new play promise for each beep
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log(`Beep ${count + 1} started`);
          }).catch(error => {
            console.warn(`Beep ${count + 1} failed:`, error);
            // Continue even if audio fails
            setTimeout(beepResolve, 500);
          });
        }
        
        // When audio ends naturally
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
        }, 1000);
      });
    }
    
    // Play three beeps in sequence
    async function playSequence() {
      for (let i = 0; i < 3; i++) {
        count = i;
        await playBeep();
        // Add small pause between beeps (except after last one)
        if (i < 2) {
          await new Promise(r => setTimeout(r, 200));
        }
      }
      console.log('All beeps finished');
      resolve();
    }
    
    // Start the sequence
    playSequence();
  });
}

// FIXED FOR IPHONE: Speech synthesis with proper iOS handling
function speakMedicine(text) {
  return new Promise((resolve) => {
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Check if speech synthesis is available
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }
    
    // On iOS, we need to handle speech differently
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      // iOS workaround: create and remove an iframe to trigger user interaction
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Wait for iframe to load
      setTimeout(() => {
        document.body.removeChild(iframe);
        
        // Now try to speak
        setTimeout(() => {
          speakWithRetry(text, resolve);
        }, 100);
      }, 100);
    } else {
      // Non-iOS devices
      setTimeout(() => {
        speakWithRetry(text, resolve);
      }, 100);
    }
  });
}

// Helper function to speak with retry logic
function speakWithRetry(text, resolve, retryCount = 0) {
  const msg = new SpeechSynthesisUtterance(text);
  
  // Set properties
  msg.volume = 1;
  msg.rate = 0.9;
  msg.pitch = 1;
  msg.lang = 'en-US';
  
  // Get available voices
  const voices = speechSynthesis.getVoices();
  
  if (voices.length > 0) {
    // Try to find a good English voice
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length > 0) {
      // Prefer female voices for medicine reminders
      const femaleVoice = englishVoices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('zira')
      );
      msg.voice = femaleVoice || englishVoices[0];
    }
  }
  
  // Add event listeners
  msg.onstart = () => {
    console.log('Speech started:', text);
    // Vibrate on mobile if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  };
  
  msg.onend = () => {
    console.log('Speech ended');
    resolve();
  };
  
  msg.onerror = (event) => {
    console.error('Speech error:', event.error);
    
    // Retry logic for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && retryCount < 2) {
      console.log(`Retrying speech (attempt ${retryCount + 1})...`);
      setTimeout(() => {
        speakWithRetry(text, resolve, retryCount + 1);
      }, 500);
    } else {
      resolve();
    }
  };
  
  // Speak the message
  try {
    speechSynthesis.speak(msg);
  } catch (error) {
    console.error('Error starting speech:', error);
    resolve();
  }
  
  // Safety timeout
  setTimeout(() => {
    speechSynthesis.cancel();
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
