#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import os
import io
import requests
from pathlib import Path

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    # Set environment variable to ensure subprocess uses UTF-8
    os.environ['PYTHONIOENCODING'] = 'utf-8'

def main():
    if len(sys.argv) < 4:
        print("Error: Missing arguments. Usage: generate_audio.py <text> <api_key> <output_file> [reference_id]")
        sys.exit(1)

    text = sys.argv[1]
    api_key = sys.argv[2]
    output_file = sys.argv[3]
    reference_id = sys.argv[4].strip() if len(sys.argv) > 4 and sys.argv[4].strip() else None

    try:
        # API endpoint
        url = "https://api.fish.audio/v1/tts"
        
        # Prepare request headers
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "model": "s1"
        }
        
        # Prepare request body
        payload = {
            "text": text,
            "format": "mp3"
        }
        
        if reference_id:
            payload["reference_id"] = reference_id
        
        # Make API request
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"Error: API request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            sys.exit(1)
        
        # Create output directory if it doesn't exist
        output_dir = os.path.dirname(output_file)
        if output_dir:
            Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Save audio file
        with open(output_file, 'wb') as f:
            f.write(response.content)
        
        # Exit with success code
        sys.exit(0)
    except requests.exceptions.RequestException as e:
        print(f"Error making API request: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
