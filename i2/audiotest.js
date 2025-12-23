// ------------------------ TEST AUDIO BUTTON ------------------------

// Global variables
let autoHideTimeout = null;
let isTesting = false;

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
    
    // Play beeps three times
    await playBeepThreeTimes();
    
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
