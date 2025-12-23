// ------------------------ TEST AUDIO BUTTON ------------------------

// Global variables
let autoHideTimeout = null;
let isTesting = false;
let audioContextInitialized = false;

// Initialize test audio button
function initTestAudioButton() {
  const testAudioBtn = document.getElementById('testAudioBtn');
  
  if (!testAudioBtn) {
    console.error('Test audio button not found!');
    return;
  }
  
  // Initialize audio context on first user interaction
  const initAudioContext = () => {
    if (!audioContextInitialized) {
      console.log('Initializing audio context...');
      initializeAudioForIOS();
      audioContextInitialized = true;
      
      // Remove the event listeners after first init
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    }
  };
  
  // Set up initialization on first interaction
  document.addEventListener('click', initAudioContext);
  document.addEventListener('touchstart', initAudioContext);
  
  // Event listeners for button
  document.addEventListener('click', showTestButton);
  document.addEventListener('touchstart', showTestButton);
  testAudioBtn.addEventListener('click', handleTestAudio);
  
  console.log('Test audio button initialized');
}

// Initialize audio specifically for iOS devices
function initializeAudioForIOS() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (!isIOS) return;
  
  console.log('Running iOS audio initialization...');
  
  // Method 1: Try to play and pause all audio elements silently
  const audioElements = document.querySelectorAll('audio');
  let initializedCount = 0;
  
  audioElements.forEach((audio, index) => {
    setTimeout(() => {
      try {
        // Set volume to 0 and try to play
        audio.volume = 0.01;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // Immediately pause and reset
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1.0;
            initializedCount++;
            console.log(`✅ Initialized audio: ${audio.id} (${initializedCount}/${audioElements.length})`);
          }).catch(error => {
            console.warn(`⚠️ Could not initialize ${audio.id}:`, error);
            audio.volume = 1.0;
          });
        }
      } catch (error) {
        console.warn(`Error initializing ${audio.id}:`, error);
      }
    }, index * 300); // Stagger the initialization
  });
  
  // Method 2: Create and play a silent audio element (web audio API approach)
  setTimeout(() => {
    try {
      // Create a silent audio buffer
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        
        // Create a silent buffer
        const buffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        
        // Start with zero volume
        source.start(0);
        console.log('✅ Web Audio API initialized');
        
        // Resume audio context (required for iOS)
        if (audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            console.log('✅ AudioContext resumed');
          });
        }
      }
    } catch (error) {
      console.warn('Web Audio API initialization failed:', error);
    }
  }, 1000);
  
  // Method 3: Load all audio files
  setTimeout(() => {
    console.log('Loading all audio files...');
    audioElements.forEach(audio => {
      if (audio.readyState < 3) { // LOADING or less
        audio.load();
      }
    });
  }, 1500);
}

// Show button after interaction
function showTestButton() {
  if (isTesting) return;
  
  const testAudioBtn = document.getElementById('testAudioBtn');
  if (!testAudioBtn) return;
  
  // Clear any existing timeout
  if (autoHideTimeout) {
    clearTimeout(autoHideTimeout);
  }
  
  testAudioBtn.classList.add('show');
  
  // Auto-hide after 10 seconds
  autoHideTimeout = setTimeout(() => {
    testAudioBtn.classList.remove('show');
    autoHideTimeout = null;
  }, 10000);
}

// Handle test audio button click with pre-initialization
async function handleTestAudio() {
  if (isTesting) return;
  
  isTesting = true;
  
  // Show loading state on button
  const testAudioBtn = document.getElementById('testAudioBtn');
  const originalText = testAudioBtn.innerHTML;
  testAudioBtn.innerHTML = '⏳';
  testAudioBtn.disabled = true;
  
  try {
    const currentDate = new Date();
    const day = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = getTestTimeOfDay(currentDate);
    
    console.log('Starting test reminder...');
    
    // Force audio initialization before playing
    await ensureAudioInitialized();
    
    // Reset all audio elements
    resetAllAudioElements();
    
    // Extra delay for iOS
    await new Promise(r => setTimeout(r, 300));
    
    // Play complete test sequence
    await playMedicineReminder(day, timeOfDay);
    
    console.log('Test reminder completed');
    
  } catch (error) {
    console.error('Test audio failed:', error);
    alert('Audio test failed. Please tap the screen once, then try the test button again.');
  } finally {
    // Restore button state
    testAudioBtn.innerHTML = originalText;
    testAudioBtn.disabled = false;
    isTesting = false;
    
    // Re-hide button after testing
    setTimeout(() => {
      const testAudioBtn = document.getElementById('testAudioBtn');
      if (testAudioBtn) {
        testAudioBtn.classList.remove('show');
      }
      autoHideTimeout = null;
    }, 3000);
  }
}

// Ensure audio is properly initialized
async function ensureAudioInitialized() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (!isIOS) return;
  
  console.log('Ensuring audio is initialized for iOS...');
  
  // Try to play a silent sound to unlock audio
  return new Promise((resolve) => {
    const silentAudio = document.createElement('audio');
    silentAudio.volume = 0.01;
    
    // Create a simple beep sound programmatically
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      try {
        const audioContext = new AudioContext();
        
        // Create a short beep
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.001; // Very quiet
        
        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          console.log('✅ Silent audio played for initialization');
          resolve();
        }, 100);
        
        // Resume if suspended
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
      } catch (error) {
        console.warn('Could not use Web Audio API:', error);
        resolve();
      }
    } else {
      // Fallback to HTML5 audio
      silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ';
      const playPromise = silentAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          silentAudio.pause();
          console.log('✅ HTML5 audio initialized');
          resolve();
        }).catch(() => {
          console.warn('HTML5 audio initialization failed');
          resolve();
        });
      } else {
        resolve();
      }
    }
  });
}

// Determine which time of day sound to use for test based on current time
function getTestTimeOfDay(date) {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'noon';
  return 'evening';
}

// Reset all audio elements to ensure clean state
function resetAllAudioElements() {
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1.0;
  });
}
