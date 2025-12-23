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
  debugDiv.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.9);color:white;padding:10px;border-radius:5px;z-index:9999;font-size:12px;display:none;';
  debugDiv.id = 'debugPanel';
  debugDiv.innerHTML = `
    <div style="margin-bottom:5px;font-weight:bold;">🔧 Debug Audio Panel</div>
    <button onclick="window.debugAudio.playMedicineTime()" style="margin:2px;padding:5px;font-size:10px;background:#4CAF50;color:white;border:none;border-radius:3px;">Medicine Time</button>
    <button onclick="window.debugAudio.playBeepThreeTimes()" style="margin:2px;padding:5px;font-size:10px;background:#2196F3;color:white;border:none;border-radius:3px;">3 Beeps</button>
    <div style="margin-top:8px;border-top:1px solid #555;padding-top:5px;">
      <div style="font-size:10px;color:#ccc;margin-bottom:3px;">Test Individual Sounds:</div>
      <button onclick="testIndividualSound('medicineTimeSound', 'Medicine Time')" style="margin:2px;padding:5px;font-size:10px;background:#FF9800;color:white;border:none;border-radius:3px;">Medicine</button>
      <button onclick="testIndividualSound('sundaySound', 'Sunday')" style="margin:2px;padding:5px;font-size:10px;background:#9C27B0;color:white;border:none;border-radius:3px;">Sunday</button>
      <button onclick="testIndividualSound('morningSound', 'Morning')" style="margin:2px;padding:5px;font-size:10px;background:#E91E63;color:white;border:none;border-radius:3px;">Morning</button>
      <button onclick="testIndividualSound('noonSound', 'Noon')" style="margin:2px;padding:5px;font-size:10px;background:#00BCD4;color:white;border:none;border-radius:3px;">Noon</button>
      <button onclick="testIndividualSound('eveningSound', 'Evening')" style="margin:2px;padding:5px;font-size:10px;background:#8BC34A;color:white;border:none;border-radius:3px;">Evening</button>
    </div>
    <div style="margin-top:8px;font-size:10px;color:#aaa;">Triple-tap anywhere to hide</div>
  `;
  document.body.appendChild(debugDiv);
  
  // Add triple-tap instructions indicator
  const tapIndicator = document.createElement('div');
  tapIndicator.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(255,193,7,0.9);color:black;padding:8px 12px;border-radius:5px;z-index:9998;font-size:12px;font-weight:bold;display:none;';
  tapIndicator.id = 'tapIndicator';
  tapIndicator.innerHTML = '👆 Triple-tap to show debug panel';
  document.body.appendChild(tapIndicator);
  
  // Show indicator briefly on load
  setTimeout(() => {
    tapIndicator.style.display = 'block';
    setTimeout(() => {
      tapIndicator.style.display = 'none';
    }, 5000);
  }, 1000);
  
  // Show/hide debug panel with triple tap
  let tapCount = 0;
  let lastTap = 0;
  let tapTimer;
  
  function handleTripleTap(e) {
    // Don't count taps on buttons
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    
    const now = Date.now();
    
    // Reset counter if too much time passed
    if (now - lastTap > 1000) {
      tapCount = 0;
    }
    
    tapCount++;
    lastTap = now;
    
    // Show tap feedback
    showTapFeedback(e.clientX, e.clientY, tapCount);
    
    if (tapCount === 3) {
      // Toggle debug panel
      debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
      tapIndicator.style.display = 'none';
      
      // Show/hide indicator based on panel state
      if (debugDiv.style.display === 'block') {
        console.log('🔧 Debug panel shown');
      } else {
        console.log('🔧 Debug panel hidden');
        // Show indicator again after hiding panel
        setTimeout(() => {
          tapIndicator.style.display = 'block';
          setTimeout(() => {
            tapIndicator.style.display = 'none';
          }, 3000);
        }, 1000);
      }
      
      tapCount = 0;
    }
    
    // Auto-reset after 1 second
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => {
      tapCount = 0;
    }, 1000);
  }
  
  // Add visual tap feedback
  function showTapFeedback(x, y, count) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%);
      background: rgba(0, 150, 255, 0.7);
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      z-index: 10000;
      pointer-events: none;
    `;
    feedback.textContent = count;
    document.body.appendChild(feedback);
    
    // Animate and remove
    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translate(-50%, -50%) scale(1.5)';
      setTimeout(() => {
        document.body.removeChild(feedback);
      }, 300);
    }, 300);
  }
  
  // Add event listeners for triple tap
  document.addEventListener('click', handleTripleTap);
  document.addEventListener('touchstart', handleTripleTap);
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
  
  console.log(`Testing: ${soundName}`);
  console.log(`Audio source: ${source.src}`);
  console.log(`Audio readyState: ${audio.readyState} (0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA)`);
  console.log(`Audio networkState: ${audio.networkState} (0=NETWORK_EMPTY, 1=NETWORK_IDLE, 2=NETWORK_LOADING, 3=NETWORK_NO_SOURCE)`);
  
  if (audio.error) {
    console.error(`Audio error: ${audio.error.code} - ${audio.error.message}`);
    alert(`Audio error: ${audio.error.message}`);
    return;
  }
  
  // Try to play
  setTimeout(() => {
    console.log(`Attempting to play ${soundName}...`);
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`✅ Successfully playing: ${soundName}`);
        alert(`Now playing: ${soundName}`);
      }).catch(error => {
        console.error(`❌ Failed to play ${soundName}:`, error);
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        
        let errorMsg = `Failed to play ${soundName}: ${error.message}`;
        
        // Provide helpful suggestions based on error type
        if (error.name === 'NotAllowedError') {
          errorMsg += '\n\n📱 iOS Users: Make sure to:\n1. Unmute your device\n2. Check Safari settings for audio permissions\n3. Try tapping the screen first';
        } else if (error.name === 'NotSupportedError') {
          errorMsg += '\n\nThis audio format may not be supported on your device.';
        }
        
        alert(errorMsg);
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
    const errorMsg = `Audio test failed: ${error.message}\n\nTry using the debug panel (triple-tap) to test individual sounds.`;
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
    
    console.log(`Checking: ${audio.id}`);
    console.log(`  Source: ${source.src}`);
    console.log(`  Ready state: ${audio.readyState}`);
    console.log(`  Network state: ${audio.networkState}`);
    
    if (audio.error) {
      const errorMsg = `Error in ${audio.id}: ${audio.error.code} - ${audio.error.message}`;
      issues.push(errorMsg);
      console.error(`  ❌ ${errorMsg}`);
    } else if (audio.readyState < 2) {
      console.log(`  ⚠️ ${audio.id} not fully loaded, loading now...`);
      audio.load();
      
      // Wait a bit for loading
      await new Promise(r => setTimeout(r, 100));
    } else {
      console.log(`  ✅ ${audio.id} is ready`);
    }
  }
  
  if (issues.length > 0) {
    console.warn('Audio pre-check issues:', issues);
    alert(`Found ${issues.length} audio issue(s). Check console for details.`);
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
