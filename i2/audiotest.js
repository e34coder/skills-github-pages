// ------------------------ TEST AUDIO BUTTON ------------------------

// Global variables
let autoHideTimeout = null;
let isTesting = false;
let audioContextUnlocked = false;

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
  
  // On mobile, we need to unlock audio context on first interaction
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Create a one-time unlock function
    const unlockAudio = () => {
      if (!audioContextUnlocked) {
        console.log('Unlocking audio context for mobile...');
        
        // Play and immediately pause to unlock audio
        const audio = document.getElementById("reminderSound");
        audio.volume = 0.01;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            audio.pause();
            audio.currentTime = 0;
            audioContextUnlocked = true;
            console.log('Audio context unlocked');
          }).catch(e => {
            console.warn('Audio unlock failed:', e);
          });
        }
        
        // Remove the event listeners after first unlock attempt
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
      }
    };
    
    // Try to unlock on first interaction
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
  }
  
  console.log('Test audio button initialized');
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
  if (isTesting) return;
  
  isTesting = true;
  try {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log('Starting audio test...');
    
    // Ensure audio is ready
    const audio = document.getElementById("reminderSound");
    audio.volume = 1.0;
    
    // Play beeps three times
    await playBeepThreeTimes();
    
    // Small delay before speech
    await new Promise(r => setTimeout(r, 300));
    
    // Speak the reminder
    console.log('Playing voice reminder...');
    await speakMedicine(`Test reminder, ${day} test time. This is a test of the medicine reminder system.`);
    
  } catch (error) {
    console.error('Test audio failed:', error);
    alert('Audio test failed. Please check your device volume and permissions.');
  } finally {
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
