// Popup script for NYT Connections Solver extension

// Store the extracted words
let extractedWords = [];

// DOM elements
const extractBtn = document.getElementById('extractBtn');
const solveBtn = document.getElementById('solveBtn');
const statusDiv = document.getElementById('status');
const wordsListDiv = document.getElementById('wordsList');
const solutionContainer = document.getElementById('solutionContainer');
const solutionText = document.getElementById('solutionText');

// Display a status message
function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.display = 'block';
  
  if (isError) {
    statusDiv.className = 'error';
  } else {
    statusDiv.className = 'success';
  }
}

// Display the list of extracted words
function displayWords(words) {
  wordsListDiv.innerHTML = '';
  wordsListDiv.style.display = 'block';
  
  words.forEach(word => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'word-item';
    wordSpan.textContent = word;
    wordsListDiv.appendChild(wordSpan);
  });
}

// Display the solution in the popup
function displaySolution(solution) {
  // Clear previous solution
  solutionText.textContent = solution || 'No solution available';
  solutionContainer.style.display = 'block';
  
  // Log to console as well for debugging
  console.log("SOLUTION IN POPUP:");
  console.log("==================");
  console.log(solution);
  console.log("==================");
}

// Check for cached solution after extracting words
async function checkCachedSolution(words) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'get-cached-solution',
      words: words
    });
    
    if (response && response.success) {
      // Display the cached solution
      displaySolution(response.solution);
      showStatus('Retrieved cached solution');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking cached solution:', error);
    return false;
  }
}

// Extract words from the active tab
async function extractWords() {
  try {
    showStatus('Extracting words...');
    
    // Query for the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we're on the NYT Connections page
    if (!tab.url.includes('nytimes.com/games/connections')) {
      showStatus('Please navigate to the NYT Connections game first', true);
      return;
    }
    
    // Check if the content script is ready
    try {
      // Send message to content script to extract words
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
      
      if (!response || !response.words) {
        showStatus('Failed to extract words', true);
        return;
      }
      
      extractedWords = response.words;
      
      if (extractedWords.length === 16) {
        showStatus(`Successfully extracted ${extractedWords.length} words`);
        displayWords(extractedWords);
        solveBtn.disabled = false;
        
        // Check if we have a cached solution for these words
        const hasCachedSolution = await checkCachedSolution(extractedWords);
        if (!hasCachedSolution) {
          // Hide any previous solution if no cached solution
          solutionContainer.style.display = 'none';
        }
      } else {
        showStatus(`Found ${extractedWords.length} words, need exactly 16`, true);
        displayWords(extractedWords);
        solveBtn.disabled = true;
        // Hide any previous solution
        solutionContainer.style.display = 'none';
      }
    } catch (messageError) {
      console.error('Error sending message to content script:', messageError);
      
      // Try injecting the content script if it's not available
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        
        showStatus('Content script loaded. Please try again.', true);
      } catch (injectionError) {
        console.error('Error injecting content script:', injectionError);
        showStatus('Error: Content script could not be loaded. Please refresh the page.', true);
      }
    }
  } catch (error) {
    console.error('Error extracting words:', error);
    showStatus('Error: ' + error.message, true);
  }
}

// Send words to be analyzed
async function solveConnections() {
  if (extractedWords.length !== 16) {
    showStatus('Need exactly 16 words to solve', true);
    return;
  }
  
  try {
    showStatus('Analyzing connections...');
    
    // Send to background script for analysis
    const response = await chrome.runtime.sendMessage({
      action: 'analyze',
      words: extractedWords
    });
    
    if (response && response.success) {
      // Display the solution in the popup
      displaySolution(response.solution);
      if (response.cached) {
        showStatus('Solution ready! (from cache)');
      } else {
        showStatus('Solution ready!');
      }
    } else {
      showStatus('Failed to get solution: ' + (response?.error || 'Unknown error'), true);
    }
  } catch (error) {
    console.error('Error solving connections:', error);
    showStatus('Error communicating with server', true);
  }
}

// Initialize popup when opened
async function initPopup() {
  // Extract words as soon as popup opens if on the right page
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url.includes('nytimes.com/games/connections')) {
      extractWords();
    }
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

// Add event listeners and initialize
document.addEventListener('DOMContentLoaded', () => {
  extractBtn.addEventListener('click', extractWords);
  solveBtn.addEventListener('click', solveConnections);
  
  // Initialize when popup opens
  initPopup();
}); 