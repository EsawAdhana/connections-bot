import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
CLAUDE_API_KEY = ""

# Initialize Flask app
app = Flask(__name__)
# Configure CORS with more specific settings
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]}})

@app.route('/analyze', methods=['POST'])
def analyze_connections():
    """Endpoint to analyze NYT Connections words"""
    try:
        # Get the words from the request
        data = request.json
        
        if not data or 'words' not in data:
            return jsonify({'error': 'No words provided'}), 400
        
        words = data['words']
        
        # Validate the words
        if not isinstance(words, list) or len(words) != 16:
            return jsonify({'error': 'Exactly 16 words are required'}), 400
        
        # Call Claude API to analyze the words
        solution = call_claude_api(words)
        
        if solution:
            # Print solution to server console
            print("\n===== CONNECTIONS SOLUTION =====")
            print(solution)
            print("================================\n")
            
            return jsonify({'success': True, 'analysis': solution})
        else:
            return jsonify({'error': 'Failed to analyze words'}), 500
            
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500


def call_claude_api(words):
    """Call Claude API to analyze connections words"""
    if not CLAUDE_API_KEY:
        return "Error: No API key configured on the server."
    
    # Create the prompt
    prompt = f"""
    Analyze these 16 words from the NYT Connections puzzle:
    {', '.join(words)}

    Find 4 groups of 4 related words. Each word belongs to exactly one group.

    IMPORTANT: The connections can be subtle and require lateral thinking. Consider:
    - Common phrases, idioms, or expressions
    - Words that can precede or follow a common word
    - Words belonging to a specific category or domain
    - Words with similar patterns or structures
    - Homonyms or different meanings of the same word
    - Parts of a sequence or set

    Here are several SOLVED examples to understand the pattern of connections:

    === Feb 28, 2025 #628 ===
    Group 1: BE INDECISIVE
    - HESITATE, WAFFLE, WAVER, YO-YO

    Group 2: LOVELY PERSON
    - ANGEL, DEAR, DOLL, PEACH

    Group 3: LUCIDITY
    - MARBLES, MIND, SENSE, WITS

    Group 4: COMPONENTS OF METAPHORS FOR THINGS THAT CAN'T BE UNDONE
    - BELL, EGG, GENIE, TOOTHPASTE

    === Feb 27, 2025 #627 ===
    Group 1: CONTACT VIA TELEPHONE
    - CALL, DIAL, PHONE, RING

    Group 2: PARTS OF A CAR
    - BELT, HORN, MIRROR, WHEEL

    Group 3: LEVELS OF BIOLOGICAL ORGANIZATION
    - ATOM, CELL, ORGAN, TISSUE

    Group 4: ENDING WITH UNITS OF MEASURE
    - BIGFOOT, COMPOUND, INSTAGRAM, THERMOMETER

    === Feb 26, 2025 #626 ===
    Group 1: EXPENDITURE
    - CHARGE, COST, PRICE, RATE

    Group 2: ONETIME
    - FORMER, LATE, PAST, PRIOR

    Group 3: MADE WITH HORIZONTAL LINES
    - DASH, HYPHEN, MINUS, UNDERSCORE

    Group 4: SIMPSON FAMILY MEMBERS WITH FIRST LETTER CHANGED
    - BAGGIE, BARGE, COMER, PISA

    === Feb 25, 2025 #625 ===
    Group 1: ENTHUSIASM
    - GUSTO, PASSION, RELISH, ZEST

    Group 2: "MANY" IN DIFFERENT LANGUAGES
    - BEAUCOUP, MOLTO, MUCHO, MULTI

    Group 3: RECTANGULAR PRISMS
    - BRICK, FISH TANK, MICROWAVE, SHOEBOX

    Group 4: RHYME WITH U.S. COINS
    - JENNY, LIME, MORTAR, PICKLE

    === Feb 24, 2025 #624 ===
    Group 1: EAT VORACIOUSLY
    - GOBBLE, GULP, SCARF, WOLF

    Group 2: BEND UNDER PRESSURE
    - BOW, BUCKLE, CAVE, GIVE

    Group 3: CLASSIC NAUTICAL TATTOOS
    - ANCHOR, COMPASS, MERMAID, SWALLOW

    Group 4: BODY PARTS PLUS LETTER
    - BUTTE, CHINA, HEARTH, SHINE

    === Feb 23, 2025 #623 ===
    Group 1: RUB TOGETHER
    - GNASH, GRATE, GRIND, SCRAPE

    Group 2: WAYS TO PRESERVE FOOD
    - CAN, FERMENT, FREEZE, PICKLE

    Group 3: BREAKFAST CONDIMENTS
    - BUTTER, HOT SAUCE, JAM, SYRUP

    Group 4: PROVERBIAL THINGS THAT ARE SPILLED
    - BEANS, GUTS, MILK, TEA

    === Feb 22, 2025 #622 ===
    Group 1: MEMBER OF A TEAM WITH THE MOST CHAMPIONSHIPS IN THEIR RESPECTIVE SPORTS
    - CANADIEN, CELTIC, PACKER, YANKEE

    Group 2: CREATE SOME VOLUME/TEXTURE IN HAIR
    - CRIMP, CURL, FEATHER, TEASE

    Group 3: SUPPLIES FOR MACARONI ART
    - GLITTER, GLUE, MACARONI, PAPER

    Group 4: WORDS AFTER "GOLDEN"
    - DOODLE, GOOSE, PARACHUTE, ROD

    === Feb 21, 2025 #621 ===
    Group 1: WAY OF SOLVING A PROBLEM
    - ANSWER, FIX, REMEDY, SOLUTION

    Group 2: COLLECT, AS FROM AN ORCHARD
    - GATHER, HARVEST, PICK, REAP

    Group 3: PHOTOSHOP TOOLS
    - ERASER, EYEDROPPER, LASSO, MAGIC WAND

    Group 4: OBJECTS THAT MAY BE RIGHT- OR LEFT-HANDED
    - BASEBALL GLOVE, CAN OPENER, GOLF CLUB, GUITAR

    === Feb 20, 2025 #620 ===
    Group 1: ALERT
    - ALARM, FLARE, SIGNAL, SOS

    Group 2: SPEND THE NIGHT (AT)
    - BUNK, CRASH, SLEEP, STAY

    Group 3: ASSOCIATED WITH EARLY MORNING
    - DEW, ROOSTER, SUNRISE, WORM

    Group 4: COOKIE CUTTER SHAPES IN "SQUID GAME"
    - CIRCLE, STAR, TRIANGLE, UMBRELLA

    === Feb 19, 2025 #619 ===
    Group 1: STRUCTURES BY THE SHORE
    - BOARDWALK, DOCK, LIGHTHOUSE, WHARF

    Group 2: SMALL IMPERFECTION
    - DENT, DING, NICK, SCRATCH

    Group 3: SOUNDS A CUCKOO CLOCK MAKES
    - CHIME, CUCKOO, TICK, TOCK

    Group 4: ___TAIL
    - COCK, MOCK, PIG, PONY

    === Feb 18, 2025 #618 ===
    Group 1: CRATER
    - CAVITY, HOLE, HOLLOW, PIT

    Group 2: ACCESSIBLE
    - AVAILABLE, HANDY, NEARBY, READY

    Group 3: SUBSTANTIAL, AS A MEAL
    - FILLING, HEARTY, SOLID, SQUARE

    Group 4: BRITISHISMS
    - BUTTY, CHIPPY, FOOTY, TELLY

    === Feb 17, 2025 #617 ===
    Group 1: TIME OFF
    - BREAK, LEAVE, REST, VACATION

    Group 2: FOLLOW A MEANDERING COURSE
    - CURVE, SNAKE, WEAVE, WIND

    Group 3: BOWLING RESULTS
    - DOUBLE, SPARE, STRIKE, TURKEY

    Group 4: ___FISH
    - BLOW, CAT, GOLD, SWORD

    === Feb 16, 2025 #616 ===
    Group 1: GLIMMER
    - HINT, SUGGESTION, TOUCH, TRACE

    Group 2: CORRESPOND WELL WITH
    - COMPLEMENT, FIT, MATCH, SUIT

    Group 3: FAMOUS PUPPETS
    - LAMB CHOP, OSCAR, PUNCH, TRIUMPH

    Group 4: DOG BREEDS MINUS "ER" SOUND
    - BOX, POINT, RETRIEVE, SET

    === Feb 15, 2025 #615 ===
    Group 1: DIVULGE
    - BLAB, DISH, SPILL, TELL

    Group 2: WORDS ON A MAC KEYBOARD
    - COMMAND, CONTROL, OPTION, RETURN

    Group 3: WORDS SHORTENED IN ROCK GENRES
    - ALTERNATIVE, EMOTIONAL, POPULAR, PROGRESSIVE

    Group 4: ___CAKE
    - CHEESE, CUP, PAN, SHORT

    === Feb 14, 2025 #614 ===
    Group 1: MOLLYCODDLE
    - BABY, HUMOR, INDULGE, PAMPER

    Group 2: THINGS A RATTLESNAKE DOES
    - HISS, RATTLE, SHED, SLITHER

    Group 3: WORDS SAID TO AN UNSUSPECTING PERSON
    - BOO, GOTCHA, GUESS WHO, SURPRISE

    Group 4: HOMOPHONES OF BODIES OF WATER
    - BAE, CREAK, SEE, STRAIGHT

    === Feb 13, 2025 #613 ===
    Group 1: TEMPLATE
    - BLUEPRINT, GUIDE, MODEL, MOLD

    Group 2: DEMONSTRATION, AS OF APPRECIATION
    - EXPRESSION, GESTURE, SYMBOL, TOKEN

    Group 3: MODAL VERBS
    - CAN, MIGHT, MUST, WILL

    Group 4: ___ TRIP
    - EGO, GUILT, HEAD, POWER

    For each group you identify, provide:
    1. The four words
    2. The specific theme/connection
    3. A brief explanation of how each word fits

    Format as "GROUP NAME: [WORDS] - CONNECTION EXPLANATION"
    """
    
    # Set up the API call
    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true"
    }
    
    payload = {
        "model": "claude-3-opus-20240229",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    
    try:
        # Make the API call
        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"API error: {response.status_code}")
            print(response.text)
            return None
        
        # Extract the response text
        response_data = response.json()
        for content_block in response_data.get("content", []):
            if content_block.get("type") == "text":
                return content_block.get("text")
        
        return None
        
    except Exception as e:
        print(f"Error calling Claude API: {e}")
        return None


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 