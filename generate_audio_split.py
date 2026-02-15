#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import os
import io
import re
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
        print("Error: Missing arguments. Usage: generate_audio_split.py <text_with_separators> <api_key> <output_dir> [reference_id] [temperature] [top_p]")
        sys.exit(1)

    text_with_separators = sys.argv[1]
    api_key = sys.argv[2]
    output_dir = sys.argv[3]
    reference_id = sys.argv[4].strip() if len(sys.argv) > 4 and sys.argv[4].strip() else None

    # Optional sampling parameters
    temperature = None
    top_p = None
    if len(sys.argv) > 5 and sys.argv[5].strip():
        try:
            temperature = float(sys.argv[5].strip())
        except ValueError:
            temperature = None
    if len(sys.argv) > 6 and sys.argv[6].strip():
        try:
            top_p = float(sys.argv[6].strip())
        except ValueError:
            top_p = None

    try:
        # Split text by *****
        split_separator = '*****'
        text_segments = [segment.strip() for segment in text_with_separators.split(split_separator) if segment.strip()]
        
        if not text_segments:
            print("Error: No text segments found after splitting")
            sys.exit(1)
        
        # Remove [number] patterns from each segment before generating audio
        # Pattern matches [1], [123], etc.
        number_pattern = re.compile(r'\[\d+\]')
        cleaned_segments = []
        for segment in text_segments:
            # Remove all [number] patterns from the segment
            cleaned_segment = number_pattern.sub('', segment).strip()
            cleaned_segments.append(cleaned_segment)
        
        # Use cleaned segments for audio generation
        text_segments = cleaned_segments
        
        # Check if all segments were removed (shouldn't happen, but safety check)
        text_segments = [seg for seg in text_segments if seg]
        if not text_segments:
            print("Error: No text segments found after cleaning [number] patterns")
            sys.exit(1)

        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)

        # API endpoint
        url = "https://api.fish.audio/v1/tts"
        
        # Prepare request headers
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "model": "s1"
        }

        # Generate audio for each segment
        generated_files = []
        failed_segments = []
        for i, text_segment in enumerate(text_segments, start=1):
            output_file = os.path.join(output_dir, f"{i}.mp3")
            
            # Prepare request body
            payload = {
                "text": text_segment,
                "format": "mp3"
            }
            
            if reference_id:
                payload["reference_id"] = reference_id
            if temperature is not None:
                payload["temperature"] = temperature
            if top_p is not None:
                payload["top_p"] = top_p
            
            # Make API request with retry
            max_retries = 3
            success = False
            for attempt in range(max_retries):
                try:
                    response = requests.post(url, headers=headers, json=payload, timeout=60)
                    
                    if response.status_code != 200:
                        if attempt < max_retries - 1:
                            print(f"Warning: API request failed for segment {i}, attempt {attempt + 1}/{max_retries}, retrying...", file=sys.stderr)
                            continue
                        else:
                            print(f"Error: API request failed for segment {i} with status {response.status_code}", file=sys.stderr)
                            print(f"Response: {response.text}", file=sys.stderr)
                            failed_segments.append(i)
                            break
                    
                    # Verify response content is not empty
                    if not response.content or len(response.content) < 1000:  # MP3 files should be at least 1KB
                        if attempt < max_retries - 1:
                            print(f"Warning: Invalid audio data for segment {i}, attempt {attempt + 1}/{max_retries}, retrying...", file=sys.stderr)
                            continue
                        else:
                            print(f"Error: Invalid audio data received for segment {i}", file=sys.stderr)
                            failed_segments.append(i)
                            break
                    
                    # Verify it's a valid MP3 file by checking header
                    if not response.content.startswith(b'ID3') and not response.content.startswith(b'\xff\xfb'):
                        # Some MP3s don't have ID3 header, check for MPEG sync word
                        found_mp3_header = False
                        for j in range(min(10, len(response.content) - 1)):
                            if response.content[j:j+2] == b'\xff\xfb' or response.content[j:j+2] == b'\xff\xfa' or response.content[j:j+2] == b'\xff\xf3':
                                found_mp3_header = True
                                break
                        
                        if not found_mp3_header and attempt < max_retries - 1:
                            print(f"Warning: Invalid MP3 header for segment {i}, attempt {attempt + 1}/{max_retries}, retrying...", file=sys.stderr)
                            continue
                        elif not found_mp3_header:
                            print(f"Error: Invalid MP3 file format for segment {i}", file=sys.stderr)
                            failed_segments.append(i)
                            break
                    
                    # Save audio file
                    with open(output_file, 'wb') as f:
                        f.write(response.content)
                    
                    # Verify file was written and has reasonable size
                    if os.path.exists(output_file) and os.path.getsize(output_file) >= 1000:
                        generated_files.append(output_file)
                        print(f"Generated segment {i}/{len(text_segments)}: {output_file}")
                        success = True
                        break
                    else:
                        if attempt < max_retries - 1:
                            print(f"Warning: File verification failed for segment {i}, attempt {attempt + 1}/{max_retries}, retrying...", file=sys.stderr)
                            if os.path.exists(output_file):
                                os.remove(output_file)
                            continue
                        else:
                            print(f"Error: Failed to save valid audio file for segment {i}", file=sys.stderr)
                            failed_segments.append(i)
                            break
                            
                except requests.exceptions.Timeout:
                    if attempt < max_retries - 1:
                        print(f"Warning: Request timeout for segment {i}, attempt {attempt + 1}/{max_retries}, retrying...", file=sys.stderr)
                        continue
                    else:
                        print(f"Error: Request timeout for segment {i} after {max_retries} attempts", file=sys.stderr)
                        failed_segments.append(i)
                        break
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"Warning: Exception for segment {i}, attempt {attempt + 1}/{max_retries}: {str(e)}, retrying...", file=sys.stderr)
                        continue
                    else:
                        print(f"Error: Exception for segment {i}: {str(e)}", file=sys.stderr)
                        failed_segments.append(i)
                        break
            
            if not success:
                # Remove incomplete file if it exists
                if os.path.exists(output_file):
                    try:
                        os.remove(output_file)
                    except:
                        pass

        # Print success message with all generated files
        if failed_segments:
            print(f"WARNING: Failed to generate {len(failed_segments)} segment(s): {failed_segments}", file=sys.stderr)
        
        if len(generated_files) == 0:
            print("Error: No audio files were successfully generated", file=sys.stderr)
            sys.exit(1)
        
        if len(generated_files) < len(text_segments):
            print(f"WARNING: Only {len(generated_files)}/{len(text_segments)} segments were successfully generated", file=sys.stderr)
        
        print(f"SUCCESS: Generated {len(generated_files)} audio files")
        for file_path in generated_files:
            print(f"FILE: {file_path}")
        
        # Exit with code 0 if at least some files were generated
        # Exit with code 1 only if all files failed
        if len(generated_files) == 0:
            sys.exit(1)
        else:
            sys.exit(0)
    except requests.exceptions.RequestException as e:
        print(f"Error making API request: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
