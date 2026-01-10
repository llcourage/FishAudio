#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import os
import subprocess
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    # Set environment variable to ensure subprocess uses UTF-8
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# Hard-coded ffmpeg path
FFMPEG_PATH = r'C:\Users\llcou\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin'
FFMPEG_BIN = os.path.join(FFMPEG_PATH, 'ffmpeg.exe')

def main():
    if len(sys.argv) < 4:
        print("Error: Missing arguments. Usage: process_audio.py <input_file> <output_file> <speed>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    speed = float(sys.argv[3])

    # Check if ffmpeg exists at hard-coded path
    if not os.path.exists(FFMPEG_BIN):
        print(f"Error: ffmpeg not found at {FFMPEG_BIN}")
        sys.exit(1)
    
    # Add ffmpeg bin directory to PATH
    os.environ['PATH'] = FFMPEG_PATH + os.pathsep + os.environ.get('PATH', '')

    try:
        # Create output directory if it doesn't exist
        output_dir = os.path.dirname(output_file)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        # Use ffmpeg's atempo filter to change speed without changing pitch
        # atempo can only change speed by factors between 0.5 and 2.0
        # For speeds outside this range, we need to chain multiple atempo filters
        
        atempo_filters = []
        remaining_speed = speed
        
        # If speed is outside 0.5-2.0 range, break it into multiple atempo filters
        while remaining_speed > 2.0:
            atempo_filters.append('atempo=2.0')
            remaining_speed /= 2.0
        
        while remaining_speed < 0.5:
            atempo_filters.append('atempo=0.5')
            remaining_speed /= 0.5
        
        # Add the final atempo filter with the remaining speed
        if abs(remaining_speed - 1.0) > 0.01:  # Only add if not 1.0
            atempo_filters.append(f'atempo={remaining_speed:.6f}')
        
        # Build the filter complex
        if atempo_filters:
            filter_complex = ','.join(atempo_filters)
        else:
            # Speed is 1.0, no filter needed
            filter_complex = 'anull'
        
        # Use ffmpeg directly to process audio
        cmd = [
            FFMPEG_BIN,
            '-i', input_file,
            '-filter:a', filter_complex,
            '-c:a', 'libmp3lame',
            '-b:a', '192k',
            '-y',  # Overwrite output file
            output_file
        ]
        
        # Run ffmpeg command
        # Use UTF-8 encoding to avoid Windows cp1252 decoding errors
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            errors='replace'  # Replace invalid bytes instead of raising error
        )
        
        if result.returncode != 0:
            print(f"Error: ffmpeg failed: {result.stderr}")
            sys.exit(1)
        
        sys.exit(0)
    except Exception as e:
        try:
            print(f"Error processing audio: {str(e)}")
        except UnicodeEncodeError:
            print(f"Error processing audio: {repr(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
