console.log("Hello! The script is alive!");

const startBtn = document.getElementById('start-btn');
console.log("Did I find the button?", startBtn); 
const speedDisplay = document.querySelector('.numbers');
const lastSpeedDisplay = document.getElementById('last-speed');
const averageSpeedDisplay = document.getElementById('average-speed');
const totalTestsDisplay = document.getElementById('total-tests');
const bestSpeedDisplay = document.getElementById('best-speed');
const unitsDisplay = document.querySelector('.units');

let testCount = 0;
let speedHistory = [];
let peakSpeed = 0;
let peakTime = null;

// Helper to format speeds consistently in text widgets
function formatSpeed(speedMbps) {
    if (speedMbps >= 1) {
        return Math.round(speedMbps) + " Mbps";
    } else {
        return Math.round(speedMbps * 1000) + " Kbps";
    }
}

// Update widgets using stored stats
function updateUIFromHistory() {
    // 1. Total tests
    totalTestsDisplay.textContent = testCount;

    // 2. Last Speed (reads second-to-last or last based on current context)
    if (speedHistory.length > 0) {
        const lastSpeed = speedHistory[speedHistory.length - 1];
        lastSpeedDisplay.textContent = formatSpeed(lastSpeed);
    } else {
        lastSpeedDisplay.textContent = "--";
    }

    // 3. Average Speed
    if (speedHistory.length > 0) {
        const avgMbps = speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length;
        averageSpeedDisplay.textContent = formatSpeed(avgMbps);
    } else {
        averageSpeedDisplay.textContent = "--";
    }

    // 4. Peak Speed and Time of Day
    if (peakSpeed > 0 && peakTime) {
        bestSpeedDisplay.textContent = `${peakTime} (${formatSpeed(peakSpeed)})`;
    } else {
        bestSpeedDisplay.textContent = "--";
    }
}

// Load values from LocalStorage
function loadStats() {
    try {
        const storedHistory = localStorage.getItem('netstat_history');
        const storedCount = localStorage.getItem('netstat_count');
        const storedPeakSpeed = localStorage.getItem('netstat_peak_speed');
        const storedPeakTime = localStorage.getItem('netstat_peak_time');

        if (storedHistory) {
            speedHistory = JSON.parse(storedHistory);
        }
        if (storedCount) {
            testCount = parseInt(storedCount, 10);
        } else {
            testCount = speedHistory.length;
        }
        if (storedPeakSpeed) {
            peakSpeed = parseFloat(storedPeakSpeed);
        }
        if (storedPeakTime) {
            peakTime = storedPeakTime;
        }

        updateUIFromHistory();
    } catch (e) {
        console.error("Failed to load local storage stats:", e);
    }
}

startBtn.addEventListener('click', async function() {
    // 1. Reset UI to loading state
    startBtn.classList.remove('complete');
    startBtn.classList.add('loading');

    // Make text grey while running
    speedDisplay.style.color = "rgba(255,255,255,0.4)";

    const fileUrl = "AtlasBrandingSize.tif?nocache=" + Math.random();
    const maxTestDurationMs = 7000;
    
    let bytesReceived = 0;
    let startTime;
    
    // Create our remote control kill switch!
    const controller = new AbortController();
    let timeoutId;

    try {
        // Hand the remote control's signal to the fetch request
        const response = await fetch(fileUrl, { 
            cache: 'no-store', 
            signal: controller.signal 
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body.getReader();
        
        startTime = performance.now(); 
        
        // Press the STOP button after a shorter test interval
        timeoutId = setTimeout(() => {
            controller.abort(); 
        }, maxTestDurationMs);

        // Setup our UI update timer (fixes the initial Mbps spike!)
        let lastUiUpdateTime = performance.now();

        // Keep reading until the file finishes OR the abort button is pressed
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytesReceived += value.length;

            const currentTime = performance.now();
            
            // Only run the UI update if 500ms have passed since the last update
            if (currentTime - lastUiUpdateTime > 500) {
                const durationInSeconds = (currentTime - startTime) / 1000; 

                if (durationInSeconds > 0) {
                    const speedBps = (bytesReceived * 8) / durationInSeconds;
                    const speedMbps = speedBps / 1000000; 

                    console.log("Current Live Speed:", speedMbps.toFixed(2));
               
                    // Update the screen immediately
                    if (speedMbps >= 1) {
                        speedDisplay.textContent = Math.round(speedMbps);
                        unitsDisplay.textContent = "Mbps";        
                    } else {
                        speedDisplay.textContent = Math.round(speedMbps * 1000);
                        unitsDisplay.textContent = "Kbps";
                    }
                }
                
                // Reset the timer for the next half-second!
                lastUiUpdateTime = currentTime;
            }
        }

    } catch (error) {
        // When our 7-second timer presses STOP, it throws an 'AbortError'.
        // We EXPECT this, so we ignore it! We only show "Error" for real network drops.
        if (error.name !== 'AbortError') {
            console.error("Real Network Error:", error);
            if (bytesReceived === 0) speedDisplay.textContent = "Error";
        }
    } finally {
        // Clean up the timer just in case the download somehow finished early
        clearTimeout(timeoutId); 
    }

    // --- CALCULATE AND UPDATE UI ---
    if (bytesReceived > 0 && startTime) {
        const endTime = performance.now();
        const durationInSeconds = (endTime - startTime) / 1000; 

        const speedBps = (bytesReceived * 8) / durationInSeconds;
        const speedMbps = speedBps / 1000000; 
        
        speedHistory.push(speedMbps);
        testCount++;

        // Save to local storage
        try {
            localStorage.setItem('netstat_history', JSON.stringify(speedHistory));
            localStorage.setItem('netstat_count', testCount.toString());
            
            // Check if this is the peak speed
            if (speedMbps > peakSpeed) {
                peakSpeed = speedMbps;
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                peakTime = `${hours}:${minutes}`;
                
                localStorage.setItem('netstat_peak_speed', peakSpeed.toString());
                localStorage.setItem('netstat_peak_time', peakTime);
            }
        } catch (e) {
            console.error("Failed to save stats to local storage:", e);
        }

        let displaySpeed, displayUnits;
        if (speedMbps >= 1) {
            displaySpeed = Math.round(speedMbps);
            displayUnits = "Mbps";        
        } else {
            displaySpeed = Math.round(speedMbps * 1000);
            displayUnits = "Kbps";
        }

        speedDisplay.textContent = displaySpeed;
        unitsDisplay.textContent = displayUnits;

        // Force UI updates for supporting widgets
        updateUIFromHistory();

        console.log(`Success! Bytes: ${bytesReceived}, Duration: ${durationInSeconds.toFixed(2)}s, Speed: ${speedMbps.toFixed(2)} Mbps`);

        // Change button to complete state, then back to normal
        startBtn.classList.remove('loading');
        startBtn.classList.add('complete');
        setTimeout(() => startBtn.classList.remove('complete'), 3000);
        
        // Remove the grey color
        speedDisplay.style.color = "";

    } else {
        // If it failed completely, make sure the loading spinner stops and color resets
        startBtn.classList.remove('loading');
        speedDisplay.style.color = "";
    }

 });

window.addEventListener('DOMContentLoaded', () => {
    // 1. Load historical database first
    loadStats();

    // 2. Click start to trigger immediate test run
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.click();
    }
});