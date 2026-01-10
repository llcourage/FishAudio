#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import os
import glob
from pathlib import Path
import io
import re

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    # Set environment variable to ensure subprocess uses UTF-8
    os.environ['PYTHONIOENCODING'] = 'utf-8'

def natural_sort_key(text):
    """
    Generate a sort key for natural (numeric) sorting.
    Converts strings like 'audio10.mp3' to ['audio', 10, '.mp3'] for proper numeric sorting.
    """
    def convert(text_part):
        try:
            return int(text_part)
        except ValueError:
            return text_part.lower()
    
    # Split the text into text and number parts
    return [convert(c) for c in re.split(r'(\d+)', text)]

# Hard-coded ffmpeg path
FFMPEG_PATH = r'C:\Users\llcou\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin'
FFMPEG_BIN = os.path.join(FFMPEG_PATH, 'ffmpeg.exe')

# Set ffmpeg path BEFORE importing pydub
os.environ['PATH'] = FFMPEG_PATH + os.pathsep + os.environ.get('PATH', '')

try:
    from pydub import AudioSegment
    from pydub.generators import Sine
    # Explicitly set AudioSegment converter paths
    AudioSegment.converter = FFMPEG_BIN
    AudioSegment.ffmpeg = FFMPEG_BIN
    AudioSegment.ffprobe = os.path.join(FFMPEG_PATH, 'ffprobe.exe')
except ImportError:
    print("Error: pydub is not installed. Please run: pip install pydub")
    sys.exit(1)

def main():
    if len(sys.argv) < 4:
        print("Error: Missing arguments. Usage: merge_audio.py <folder_path> <output_file> <interval_seconds>")
        sys.exit(1)

    folder_path = sys.argv[1]
    output_file = sys.argv[2]
    interval = float(sys.argv[3])

    # Check if ffmpeg exists
    if not os.path.exists(FFMPEG_BIN):
        print(f"Error: ffmpeg not found at {FFMPEG_BIN}")
        sys.exit(1)

    try:
        # Get all audio files from folder (case-insensitive, avoid duplicates)
        audio_extensions = ['*.mp3', '*.wav', '*.m4a', '*.aac', '*.flac', '*.ogg']
        audio_files_set = set()
        
        for ext in audio_extensions:
            # Search for both lowercase and uppercase extensions
            files_lower = glob.glob(os.path.join(folder_path, ext), recursive=False)
            files_upper = glob.glob(os.path.join(folder_path, ext.upper()), recursive=False)
            
            # Add all files (using normalized path to avoid duplicates on case-insensitive filesystems)
            for f in files_lower + files_upper:
                # Use absolute path for case-insensitive comparison
                normalized = os.path.normcase(os.path.abspath(f))
                audio_files_set.add(normalized)
        
        # Convert set to list and sort using natural sort (numeric sorting)
        audio_files = sorted(audio_files_set, key=lambda x: natural_sort_key(os.path.basename(x)))
        
        if not audio_files:
            try:
                print(f"Error: No audio files found in {folder_path}")
            except UnicodeEncodeError:
                print(f"Error: No audio files found in the specified folder")
            sys.exit(1)
        
        # Create silence segment if interval > 0
        silence = None
        if interval > 0:
            # Create silence (1000ms = 1 second)
            silence = AudioSegment.silent(duration=int(interval * 1000))
        
        # Load and merge all audio files
        combined = AudioSegment.empty()
        file_count = 0
        
        for i, audio_file in enumerate(audio_files):
            try:
                # Load audio file (try different formats)
                if audio_file.lower().endswith('.mp3'):
                    audio = AudioSegment.from_mp3(audio_file)
                elif audio_file.lower().endswith('.wav'):
                    audio = AudioSegment.from_wav(audio_file)
                elif audio_file.lower().endswith('.m4a'):
                    audio = AudioSegment.from_file(audio_file, format='m4a')
                else:
                    audio = AudioSegment.from_file(audio_file)
                
                # Add audio to combined
                combined += audio
                file_count += 1
                
                # Add silence between files (except after the last one)
                if silence and i < len(audio_files) - 1:
                    combined += silence
                    
            except Exception as e:
                try:
                    print(f"Warning: Failed to load {audio_file}: {str(e)}", file=sys.stderr)
                except UnicodeEncodeError:
                    print(f"Warning: Failed to load audio file: {str(e)}", file=sys.stderr)
                continue
        
        if file_count == 0:
            print("Error: No audio files could be loaded")
            sys.exit(1)
        
        # Create output directory if it doesn't exist
        output_dir = os.path.dirname(output_file)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        # Export merged audio
        combined.export(output_file, format="mp3")
        
        print(f"Merged {file_count} files successfully")
        sys.exit(0)
        
    except Exception as e:
        try:
            print(f"Error merging audio: {str(e)}")
        except UnicodeEncodeError:
            print(f"Error merging audio: {repr(e)}")
        import traceback
        try:
            traceback.print_exc()
        except UnicodeEncodeError:
            # Fallback for traceback printing
            pass
        sys.exit(1)

if __name__ == "__main__":
    main()
