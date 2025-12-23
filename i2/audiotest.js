// ------------------------ TEST AUDIO BUTTON ------------------------

// Global variables
let autoHideTimeout = null;
let isTesting = false;
let audioContextUnlocked = false;
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
  // Prevent rapid clicking
  const now = Date.now();
  if (isTesting || (now - lastTestTime < 3000)) {
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
    
    // Ensure all audio elements are ready
    resetAllAudioElements();
    
    // Add a small delay to ensure audio context is ready
    await new Promise(r => setTimeout(r, 100));
    
    // Play complete test sequence
    await playMedicineReminder(day, timeOfDay);
    
    console.log('Test reminder completed successfully');
    
  } catch (error) {
    console.error('Test audio failed:', error);
    alert('Audio test failed. Please check your device volume and permissions.');
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
