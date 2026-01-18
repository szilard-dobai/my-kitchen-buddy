# Usage Guide: Recipe Extraction System

## Overview

This system uses a two-part prompt structure:
1. **System Prompt**: Defines the AI's role and capabilities (see `recipe-extraction-prompt.md`)
2. **User Prompt**: Simple request with the video to analyze

## How to Use

### Step 1: Set the System Prompt

Use the entire content of `recipe-extraction-prompt.md` as the system prompt when initializing your AI model (e.g., GPT-4, Claude, etc.).

### Step 2: Send User Prompt

Send a simple user message with the video URL or file:

```
Extract the recipe from this video: [VIDEO_URL]
```

## Example API Usage

### OpenAI API Example

```python
import openai

# System prompt (from recipe-extraction-prompt.md)
with open('recipe-extraction-prompt.md', 'r') as f:
    system_prompt = f.read()

# User prompt
user_prompt = "Extract the recipe from this video: https://www.tiktok.com/@chefexample/video/1234567890"

response = openai.ChatCompletion.create(
    model="gpt-4-vision-preview",  # or gpt-4-turbo with vision
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
)
```

### Anthropic Claude API Example

```python
import anthropic

# System prompt (from recipe-extraction-prompt.md)
with open('recipe-extraction-prompt.md', 'r') as f:
    system_prompt = f.read()

# User prompt
user_prompt = "Extract the recipe from this video: https://www.instagram.com/p/DTleyfck9Gw/"

client = anthropic.Anthropic()
message = client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=4096,
    system=system_prompt,
    messages=[
        {"role": "user", "content": user_prompt}
    ]
)
```

## User Prompt Variations

### Simple URL
```
Extract the recipe from: https://www.tiktok.com/@chef/video/123
```

### With Video File
```
Please analyze the attached video file and extract the recipe information.
[attach video file]
```

### Multiple Videos
```
Extract recipes from these videos:
1. https://www.tiktok.com/@user1/video/111
2. https://www.tiktok.com/@user2/video/222
```

### With Specific Instructions
```
Extract the recipe from this video. Pay special attention to cooking times and temperatures:
https://www.instagram.com/reel/ABC123/
```

## Expected Output

The AI will return a JSON object matching the schema defined in the system prompt, containing:
- Recipe details (title, difficulty, times, servings)
- Complete ingredient list
- Step-by-step instructions
- Keyframe information
- Video and author metadata
- Extraction confidence scores

## Notes

- The system prompt should be set once per session/conversation
- User prompts can be sent multiple times with different videos
- For video files, ensure your AI model supports vision/video input capabilities
- Some platforms may require authentication or have rate limits for accessing video content
