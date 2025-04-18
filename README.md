# NYT Connections Solver

A Chrome extension that attempts to solve the NYT Connections puzzle by extracting the 16 words and using Claude's AI to identify the 4 groups of 4 related words.

## Features

- Automatically extracts the 16 words from the NYT Connections game
- Sends the words to a backend server for analysis with Claude AI
- Displays the solution on the game page
- Works with the current format of the NYT Connections game

## Setup Instructions

### 1. Backend Server Setup

1. Clone this repository:
   ```
   git clone https://github.com/esawadhana/connections-bot.git
   cd nyt-connections-solver
   ```

2. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

3. Populate line 12 of the 'server.py' file with your API key.
   ```
   CLAUDE_API_KEY = "YOUR_API_KEY"
   ```

4. Start the Flask server:
   ```
   python server.py
   ```
   The server will run on http://localhost:5000 by default.

### 2. Chrome Extension Setup


1. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked" and select the extension directory
   - The NYT Connections Solver should now appear in your extensions

## Usage

1. Navigate to the NYT Connections game: https://www.nytimes.com/games/connections
2. Click the extension icon to open the popup
3. Click "Extract Words" to find the 16 words on the page
4. If 16 words are found, the "Solve Puzzle" button will be enabled
5. Click "Solve Puzzle" to send the words for analysis
6. The solution will be displayed within the extension

## Requirements

- Python 3.7+
- Flask
- Chrome browser
- Anthropic API key (Claude AI)

## Troubleshooting

- If the extension can't find words, try refreshing the page
- Ensure the Flask server is running before using the extension
- Check that your API key is correctly inserted in 'server.py'
- Make sure the extension has permission to access the NYT website
- As of March 2025, the Claude API is not flawless when it comes to solving the Connections puzzle
- See this paper (not my own) for more details of AI's solving Connections: https://web.stanford.edu/class/cs224n/final-reports/256847963.pdf

## License

MIT License # connections-bot
# connections-bot
