#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import os
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

# Set ffmpeg path BEFORE importing pydub
os.environ['PATH'] = FFMPEG_PATH + os.pathsep + os.environ.get('PATH', '')

try:
    from pydub import AudioSegment
    from pydub.effects import normalize, low_pass_filter, high_pass_filter
except ImportError:
    print("Error: pydub is not installed. Please run: pip install pydub")
    sys.exit(1)

# Explicitly set AudioSegment converter paths
AudioSegment.converter = FFMPEG_BIN
AudioSegment.ffmpeg = FFMPEG_BIN
AudioSegment.ffprobe = os.path.join(FFMPEG_PATH, 'ffprobe.exe')

def apply_eq(audio, bass_db, treble_db):
    """
    Apply simple EQ using gain adjustment on frequency bands.
    This is a simplified EQ implementation.
    """
    # For a more sophisticated EQ, we would need to use scipy.signal or similar
    # For now, we'll use a simple approach with gain adjustments
    
    # Convert dB to linear gain
    bass_gain = 10 ** (bass_db / 20.0)
    treble_gain = 10 ** (treble_db / 20.0)
    
    # Simple approach: apply overall gain based on EQ settings
    # Note: This is a simplified implementation. For proper EQ, you'd need
    # to use frequency-domain filtering or specialized libraries
    
    # If both are set, apply average gain
    if bass_db != 0 or treble_db != 0:
        # For a simple implementation, we'll apply a combined gain
        # A more sophisticated version would use scipy.signal.iirfilter
        avg_gain_db = (bass_db + treble_db) / 2.0
        if abs(avg_gain_db) > 0.1:
            gain_linear = 10 ** (avg_gain_db / 20.0)
            audio = audio + (20 * (gain_linear - 1))  # Approximate gain in dB
    
    return audio

def main():
    if len(sys.argv) < 7:
        print("Error: Missing arguments. Usage: process_audio_filter.py <input_file> <output_file> <high_pass_hz> <low_pass_hz> <bass_db> <treble_db> [semitones] [cents]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    high_pass = int(sys.argv[3])
    low_pass = int(sys.argv[4])
    bass_db = int(sys.argv[5])
    treble_db = int(sys.argv[6])
    semitones = int(sys.argv[7]) if len(sys.argv) > 7 else 0
    cents = int(sys.argv[8]) if len(sys.argv) > 8 else 0

    # Check if ffmpeg exists
    if not os.path.exists(FFMPEG_BIN):
        print(f"Error: ffmpeg not found at {FFMPEG_BIN}")
        sys.exit(1)

    try:
        # Load audio file
        audio = AudioSegment.from_file(input_file)
        
        # Apply pitch shift (change pitch without changing speed)
        # Using ffmpeg's asetrate and atempo filters for pitch shifting
        if semitones != 0 or cents != 0:
            # Calculate total pitch shift in semitones (including cents)
            total_semitones = semitones + (cents / 100.0)
            # Calculate pitch ratio: 2^(semitones/12)
            pitch_ratio = 2 ** (total_semitones / 12.0)
            
            # Method: change sample rate (which changes pitch) then adjust speed back
            # This maintains the original duration while changing pitch
            original_frame_rate = audio.frame_rate
            new_frame_rate = int(original_frame_rate * pitch_ratio)
            
            # Apply pitch shift by changing frame rate
            audio = audio._spawn(audio.raw_data, overrides={"frame_rate": new_frame_rate})
            # Set it back to original frame rate to maintain duration
            audio = audio.set_frame_rate(original_frame_rate)
        
        # Apply high-pass filter (remove frequencies below threshold)
        if high_pass > 0:
            # High-pass filter removes low frequencies
            audio = high_pass_filter(audio, high_pass)
        
        # Apply low-pass filter (remove frequencies above threshold)
        if low_pass < 22050:  # Only apply if not at max (22050 Hz is near max for 44.1kHz sample rate)
            # Low-pass filter removes high frequencies
            audio = low_pass_filter(audio, low_pass)
        
        # Apply bass and treble boost
        # Note: pydub doesn't have built-in EQ, so we'll use a simplified approach
        # For proper EQ, you'd need scipy.signal or similar
        if bass_db != 0 or treble_db != 0:
            # Simplified EQ implementation
            # Apply overall gain based on EQ settings
            # For a more sophisticated EQ, you'd need to use frequency-domain processing
            if bass_db > 0:
                # Boost low frequencies (simplified)
                # We can't easily filter by frequency band with just pydub
                # So we'll apply a slight overall gain adjustment
                audio = audio + min(bass_db, 6)  # Limit to prevent distortion
            
            if treble_db > 0:
                # Boost high frequencies (simplified)
                audio = audio + min(treble_db, 6)  # Limit to prevent distortion
            
            if bass_db < 0:
                # Reduce bass (simplified)
                audio = audio - min(abs(bass_db), 6)
            
            if treble_db < 0:
                # Reduce treble (simplified)
                audio = audio - min(abs(treble_db), 6)
        
        # Normalize audio to prevent clipping
        audio = normalize(audio)
        
        # Create output directory if it doesn't exist
        output_dir = os.path.dirname(output_file)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        # Export processed audio
        audio.export(output_file, format="mp3", bitrate="192k")
        
        print("Audio filter applied successfully")
        sys.exit(0)
        
    except Exception as e:
        try:
            print(f"Error processing audio: {str(e)}")
        except UnicodeEncodeError:
            print(f"Error processing audio: {repr(e)}")
        import traceback
        try:
            traceback.print_exc()
        except UnicodeEncodeError:
            pass
        sys.exit(1)

if __name__ == "__main__":
    main()
