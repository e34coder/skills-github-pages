// ------------------------ TEST AUDIO BUTTON ------------------------

// Global variables
let autoHideTimeout = null;
let isTesting = false;
let lastTestTime = 0;

// Initialize test audio button
function initTestAudioButton() {
  const testAudioBtn = document.getElementById('testAudioBtn');
  
  if (!testAudioBtn) {
    console.error('Test audio button not found!');
    return;
  }
  
  // Event listeners for interaction
  document.addEventListener('click', showTestButton);
  document.addEventListener('touchstart', showTestButton);
  testAudioBtn.addEventListener('click', handleTestAudio);
  
  // iOS-specific audio unlock
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    console.log('iOS device detected, setting up audio unlock');
    setupIOSAudioUnlock();
  }
  
  console.log('Test audio button initialized');
}

// iOS audio unlock setup
function setupIOSAudioUnlock() {
  // Create a hidden button that user can tap to unlock audio
  const unlockButton = document.createElement('button');
  unlockButton.style.cssText = 'position:fixed;top:10px;left:10px;padding:10px;background:#ff4444;color:white;border:none;border-radius:5px;z-index:9999;display:none;';
  unlockButton.textContent = '🔊 Tap to Enable Audio';
  unlockButton.id = 'iosAudioUnlock';
  document.body.appendChild(unlockButton);
  
  // Show unlock button on first interaction
  const showUnlock = () => {
    unlockButton.style.display = 'block';
    document.removeEventListener('click', showUnlock);
    document.removeEventListener('touchstart', showUnlock);
  };
  
  document.addEventListener('click', showUnlock);
  document.addEventListener('touchstart', showUnlock);
  
  // Unlock audio when button is tapped
  unlockButton.addEventListener('click', () => {
    console.log('iOS audio unlock triggered');
    
    // Try to play a silent audio to unlock audio context
    const audioElements = document.querySelectorAll('audio');
    if (audioElements.length > 0) {
      const audio = audioElements[0];
      audio.volume = 0.01;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1.0;
          console.log('iOS audio context unlocked');
          unlockButton.style.display = 'none';
          alert('Audio enabled! You can now test the reminder.');
        }).catch(e => {
          console.warn('iOS audio unlock failed:', e);
          alert('Audio permission denied. Please allow audio in Safari settings.');
        });
      }
    }
  });
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

// Handle test audio button click
async function handleTestAudio() {
  // Prevent rapid clicking
  const now = Date.now();
  if (isTesting || (now - lastTestTime < 4000)) {
    console.log('Test already in progress or too soon since last test');
    return;
  }
  
  lastTestTime = now;
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
    
    console.log(`Starting test reminder for ${day} ${timeOfDay}`);
    
    // Reset all audio elements
    resetAllAudioElements();
    
    // Add a delay for iOS
    await new Promise(r => setTimeout(r, 200));
    
    // Play complete test sequence
    await playMedicineReminder(day, timeOfDay);
    
    console.log('Test reminder completed successfully');
    
  } catch (error) {
    console.error('Test audio failed:', error);
    
    // iOS-specific error message
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert('Audio test failed on iOS. Please tap the red "Tap to Enable Audio" button in the top-left corner first, then try again.');
    } else {
      alert('Audio test failed. Please check your device volume and permissions.');
    }
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
  console.log('All audio elements reset');
}
