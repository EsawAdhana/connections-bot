// Background script for NYT Connections Solver extension

// Your Flask server endpoint 
const SERVER_API_URL = 'http://localhost:5001/analyze';

// Cache for storing solutions
const solutionsCache = new Map();

// Handle installation and updates
chrome.runtime.onInstalled.addListener(() => {
  console.log('NYT Connections Solver installed');
});

// Handle message from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Content script loaded notification
  if (request.status === 'content-script-loaded') {
    console.log('Content script loaded successfully');
    return;
  }
  
  // Request to get cached solution
  if (request.action === 'get-cached-solution' && request.words) {
    const cacheKey = request.words.sort().join('|');
    const cachedSolution = solutionsCache.get(cacheKey);
    
    if (cachedSolution) {
      console.log("Returning cached solution");
      sendResponse({ success: true, solution: cachedSolution, cached: true });
      return true;
    } else {
      sendResponse({ success: false, cached: false });
      return true;
    }
  }
  
  // Request to analyze words
  if (request.action === 'analyze' && request.words) {
    // Create a cache key from sorted words to ensure consistency
    const cacheKey = request.words.sort().join('|');
    
    // Check if we have a cached solution
    const cachedSolution = solutionsCache.get(cacheKey);
    if (cachedSolution) {
      console.log("Returning cached solution");
      sendResponse({ success: true, solution: cachedSolution, cached: true });
      return true;
    }
    
    // No cached solution, get from server
    analyzeWordsWithServer(request.words)
      .then(solution => {
        // Log the solution to console
        console.log("SOLUTION FROM SERVER:");
        console.log("=====================");
        console.log(solution);
        console.log("=====================");
        
        // Cache the solution
        solutionsCache.set(cacheKey, solution);
        
        // Send the solution back to whoever requested it
        sendResponse({ success: true, solution, cached: false });
      })
      .catch(error => {
        console.error('Error analyzing words:', error);
        sendResponse({ success: false, error: error.message, cached: false });
      });
    
    return true; // For async response
  }
});

/**
 * Send the words to our Flask server for analysis
 * @param {Array} words - Array of words to analyze
 * @returns {Promise<string>} - The solution text
 */
async function analyzeWordsWithServer(words) {
  try {
    console.log("Making request to server with words:", words);
    
    const response = await fetch(SERVER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ words })
    });
    
    if (!response.ok) {
      console.error("Server response not OK:", response.status, response.statusText);
      let errorMessage = `Server error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.error("Server error details:", errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.error("Failed to parse error JSON:", e);
        errorMessage += " (Could not parse error details)";
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.analysis || 'Analysis completed, but no solution was provided.';
  } catch (error) {
    console.error('Error in analyzeWordsWithServer:', error);
    throw error;
  }
}

/**
 * Creates a well-structured prompt for Claude to solve the Connections puzzle
 * @param {Array} words - Array of 16 words from the Connections game
 * @returns {string} - Formatted prompt for Claude
 */
function createPrompt(words) {
  return `I'm playing the NYT Connections game. I need to group these 16 words into 4 categories of 4 words each.

Words: ${words.join(', ')}

In this game:
- Each group of 4 words shares a common theme or category
- The categories are usually labeled: Yellow (easiest), Green, Blue, and Purple (hardest)
- Each word belongs to exactly one group

Please analyze these words and tell me:
1. The 4 groups/categories
2. Which 4 words belong in each group
3. A brief explanation of the connection for each group

Format your response so it's easy to understand the groupings.`;
} 