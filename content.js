// NYT Connections Solver - Content Script
// This script will be automatically injected into the Connections game page

/**
 * Extract all connection words from the current page
 * @returns {Array} Array of connection words
 */
function extractConnectionWords() {
  console.log("Extracting connection words...");
  // Store all found game words
  const gameWords = [];
  
  try {
    // First attempt: look for data-flip-id elements
    document.querySelectorAll('[data-flip-id]').forEach(el => {
      const text = el.textContent.trim().toUpperCase();
      if (text && text.length > 0 && !text.includes("SHUFFLE") && !text.includes("SUBMIT")) {
        gameWords.push(text);
      }
    });
    
    // If that didn't work, try alternative selectors
    if (gameWords.length < 16) {
      // Clear array
      gameWords.length = 0;
      
      // Try with game-tile selector (might be used in some versions)
      document.querySelectorAll('.game-tile').forEach(el => {
        const text = el.textContent.trim().toUpperCase();
        if (text && text.length > 0 && !text.includes("SHUFFLE") && !text.includes("SUBMIT")) {
          gameWords.push(text);
        }
      });
    }
    
    // Try one more approach if needed
    if (gameWords.length < 16) {
      // Clear array
      gameWords.length = 0;
      
      // Just get all small text elements (less reliable)
      document.querySelectorAll('button').forEach(el => {
        const text = el.textContent.trim().toUpperCase();
        if (text && text.length > 0 && text.length < 20 && 
            !text.includes("SHUFFLE") && !text.includes("SUBMIT") && 
            !text.includes("MENU") && !text.includes("HINT")) {
          if (!gameWords.includes(text)) {
            gameWords.push(text);
          }
        }
      });
    }
    
    console.log(`Found ${gameWords.length} words: ${gameWords.join(', ')}`);
  } catch (error) {
    console.error("Error extracting words:", error);
  }

  return gameWords;
}

/**
 * Display the solution in the UI
 * @param {String} solution - The solution text from the API
 */
function displaySolution(solution) {
  // Print solution to console
  console.log("CONNECTIONS SOLUTION:");
  console.log("=====================");
  console.log(solution);
  console.log("=====================");
  
  // Remove any existing solution display
  const existingDisplay = document.getElementById('connections-solution');
  if (existingDisplay) {
    existingDisplay.remove();
  }
  
  // Create a solution display div
  const solutionDiv = document.createElement('div');
  solutionDiv.id = 'connections-solution';
  solutionDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: white; border: 2px solid #333; padding: 15px; z-index: 9999; max-width: 350px; box-shadow: 0 0 10px rgba(0,0,0,0.5); font-family: Arial, sans-serif; line-height: 1.4;';
  
  // Add solution content
  solutionDiv.innerHTML = `
    <h3 style="margin-top: 0; color: #333;">Connections Solution</h3>
    <div style="max-height: 400px; overflow-y: auto;">${solution || 'No solution available'}</div>
    <button id="close-solution" style="margin-top: 10px; padding: 5px 10px; cursor: pointer;">Close</button>
  `;
  
  // Add to page
  document.body.appendChild(solutionDiv);
  
  // Add close handler
  document.getElementById('close-solution').addEventListener('click', () => {
    document.getElementById('connections-solution').remove();
  });
}

// Listen for messages from the extension popup/background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    const words = extractConnectionWords();
    sendResponse({ words });
  } else if (request.action === 'display-solution') {
    displaySolution(request.solution);
    sendResponse({ success: true });
  }
  return true; // Required for async response
});

// Let the extension know the content script is loaded
chrome.runtime.sendMessage({ status: 'content-script-loaded' }); 