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
  
  console.log('Test audio button initialized');
  
  // Add debug buttons for testing individual sounds
  addDebugButtons();
}

// Add debug buttons for testing individual sounds
function addDebugButtons() {
  const debugDiv = document.createElement('div');
  debugDiv.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.8);color:white;padding:10px;border-radius:5px;z-index:9999;font-size:12px;display:none;';
  debugDiv.id = 'debugPanel';
  debugDiv.innerHTML = `
    <div style="margin-bottom:5px;font-weight:bold;">Debug Audio:</div>
    <button onclick="window.debugAudio.playMedicineTime()" style="margin:2px;padding:5px;font-size:10px;">Medicine Time</button>
    <button onclick="window.debugAudio.playBeepThreeTimes()" style="margin:2px;padding:5px;font-size:10px;">3 Beeps</button>
    <div style="margin-top:5px;">
      <button onclick="testIndividualSound('sundaySound', 'Sunday')" style="margin:2px;padding:5px;font-size:10px;">Sunday</button>
      <button onclick="testIndividualSound('morningSound', 'Morning')" style="margin:2px;padding:5px;font-size:10px;">Morning</button>
    </div>
  `;
  document.body.appendChild(debugDiv);
  
  // Show/hide debug panel with triple tap
  let tapCount = 0;
  let lastTap = 0;
  
  document.addEventListener('click', (e) => {
    const now = Date.now();
    if (now - lastTap > 1000) tapCount = 0;
    
    tapCount++;
    lastTap = now;
    
    if (tapCount === 3) {
      debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
      tapCount = 0;
    }
  });
}

// Test individual sound
function testIndividualSound(audioId, soundName) {
  console.log(`Testing individual sound: ${soundName} (${audioId})`);
  
  const audio = document.getElementById(audioId);
  if (!audio) {
    console.error(`Audio element ${audioId} not found`);
    alert(`Audio element ${audioId} not found`);
    return;
  }
  
  audio.pause();
  audio.currentTime = 0;
  audio.volume = 1.0;
  
  // Check if audio has source
  const source = audio.querySelector('source');
  if (!source || !source.src) {
    console.error(`No source found for ${audioId}`);
    alert(`No audio source found for ${soundName}`);
    return;
  }
  
  console.log(`Audio source: ${source.src}`);
  console.log(`Audio readyState: ${audio.readyState}`);
  console.log(`Audio networkState: ${audio.networkState}`);
  
  // Try to play
  setTimeout(() => {
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`✅ Successfully playing: ${soundName}`);
        alert(`Now playing: ${soundName}`);
      }).catch(error => {
        console.error(`❌ Failed to play ${soundName}:`, error);
        alert(`Failed to play ${soundName}: ${error.message}`);
      });
    }
  }, 100);
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
  if (isTesting || (now - lastTestTime < 5000)) {
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
    
    console.log(`🎬 STARTING TEST REMINDER for ${day} ${timeOfDay}`);
    
    // Reset all audio elements
    resetAllAudioElements();
    
    // Pre-check audio files
    await preCheckAudioFiles();
    
    // Add a delay for stability
    await new Promise(r => setTimeout(r, 500));
    
    // Play complete test sequence
    await playMedicineReminder(day, timeOfDay);
    
    console.log('✅ TEST REMINDER COMPLETED');
    
  } catch (error) {
    console.error('❌ TEST AUDIO FAILED:', error);
    
    // Provide helpful error message
    const errorMsg = `Audio test failed: ${error.message}. Check console for details.`;
    alert(errorMsg);
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

// Pre-check audio files
async function preCheckAudioFiles() {
  console.log('🔍 Pre-checking audio files...');
  
  const audioElements = document.querySelectorAll('audio');
  const issues = [];
  
  for (const audio of audioElements) {
    const source = audio.querySelector('source');
    if (!source || !source.src) {
      issues.push(`No source for: ${audio.id}`);
      continue;
    }
    
    console.log(`Checking: ${audio.id} -> ${source.src}`);
    console.log(`  Ready state: ${audio.readyState}`);
    console.log(`  Network state: ${audio.networkState}`);
    
    if (audio.error) {
      issues.push(`Error in ${audio.id}: ${audio.error.message}`);
    }
    
    if (audio.readyState < 2) {
      console.log(`  ⚠️ ${audio.id} not fully loaded, loading now...`);
      audio.load();
    }
  }
  
  if (issues.length > 0) {
    console.warn('Audio pre-check issues:', issues);
  } else {
    console.log('✅ All audio files pre-checked OK');
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
  console.log('🔄 Resetting all audio elements...');
  
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1.0;
  });
  
  console.log('✅ All audio elements reset');
}
