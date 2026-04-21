console.log("Hello! The script is alive!");

const startBtn = document.getElementById('start-btn');
console.log("Did I find the button?", startBtn); 
const speedDisplay = document.querySelector('.numbers');
const lastSpeedDisplay = document.getElementById('last-speed');
const averageSpeedDisplay = document.getElementById('average-speed');
const totalTestsDisplay = document.getElementById('total-tests');
const unitsDisplay = document.querySelector('.units');

let testCount = 0;
let speedHistory = [];

startBtn.addEventListener('click', async function() {
    // 1. Reset UI to loading state
    startBtn.classList.remove('complete');
    startBtn.classList.add('loading');

    // Make text grey while running
    speedDisplay.style.color = "grey";

    let currentMainSpeed = speedDisplay.textContent;
    let currentMainUnits = unitsDisplay.textContent;

    if (parseFloat(currentMainSpeed) > 0) {
        lastSpeedDisplay.textContent = currentMainSpeed + " " + currentMainUnits;
    }

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

        const avgMbps = speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length;
        const displayAvg = avgMbps >= 1
            ? Math.round(avgMbps) + " Mbps"
            : Math.round(avgMbps * 1000) + " Kbps";
        averageSpeedDisplay.textContent = displayAvg;

        testCount++;
        totalTestsDisplay.textContent = testCount;

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
       const startBtn = document.getElementById('start-btn');
       if (startBtn) {
           startBtn.click();
        }
    });