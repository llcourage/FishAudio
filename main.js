const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;

let mainWindow;

// Get the path to store last save directory
const getLastSaveDirPath = () => {
  return path.join(app.getPath('userData'), 'last-save-dir.txt');
};

// Read last save directory
const getLastSaveDirectory = async () => {
  try {
    const dirPath = getLastSaveDirPath();
    const dir = await fs.readFile(dirPath, 'utf-8');
    // Verify the directory still exists
    try {
      await fs.access(dir);
      return dir.trim();
    } catch {
      // Directory doesn't exist, return null to use default
      return null;
    }
  } catch {
    return null;
  }
};

// Save last save directory
const saveLastSaveDirectory = async (filePath) => {
  try {
    const dir = path.dirname(filePath);
    const dirPath = getLastSaveDirPath();
    await fs.writeFile(dirPath, dir, 'utf-8');
  } catch (error) {
    console.error('Error saving last save directory:', error);
  }
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Hard-coded API key
const API_KEY = '34000ff5e9864e69b87adf9ce1485877';

// Handle text-to-speech request using Python backend
ipcMain.handle('generate-speech', async (event, { text, referenceId }) => {
  return new Promise((resolve) => {
    try {
      // Create temp directory for audio files
      const tempDir = path.join(app.getPath('temp'), 'fish-audio');
      const tempFile = path.join(tempDir, `audio-${Date.now()}.mp3`);

      // Prepare Python script arguments
      const scriptPath = path.join(__dirname, 'generate_audio.py');
      const args = [scriptPath, text, API_KEY, tempFile];
      if (referenceId) {
        args.push(referenceId);
      }

      // Spawn Python process (try 'python' first, which works on Windows and Unix if python3 is aliased)
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      const pythonEnv = { ...process.env, PYTHONIOENCODING: 'utf-8' };
      const pythonProcess = spawn(pythonCommand, args, { env: pythonEnv });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString('utf8');
      });

      pythonProcess.stderr.on('data', (data) => {
        const errorText = data.toString('utf8');
        stderr += errorText;
        console.error('Python stderr:', errorText);
      });

      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          // Check if file exists
          try {
            await fs.access(tempFile);
            resolve({ success: true, filePath: tempFile });
          } catch (error) {
            resolve({ success: false, error: 'Audio file was not created' });
          }
        } else {
          const errorMsg = stderr || stdout || 'Unknown error occurred';
          resolve({ success: false, error: errorMsg.trim() });
        }
      });

      pythonProcess.on('error', (error) => {
        if (error.code === 'ENOENT') {
          resolve({ 
            success: false, 
            error: 'Python not found. Please make sure Python is installed and in your PATH.' 
          });
        } else {
          resolve({ success: false, error: error.message });
        }
      });
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
});

// Handle download request (processes audio with speed if not 1.0)
ipcMain.handle('download-audio', async (event, filePath, speed = 1.0) => {
  return new Promise(async (resolve) => {
    try {
      // Get last save directory, fallback to downloads if not available
      const lastSaveDir = await getLastSaveDirectory();
      const defaultDir = lastSaveDir || app.getPath('downloads');
      const defaultFileName = `audio-speed${speed.toFixed(1)}x-${Date.now()}.mp3`;
      const defaultPath = path.join(defaultDir, defaultFileName);

      dialog.showSaveDialog(mainWindow, {
        title: '保存音频文件',
        defaultPath: defaultPath,
        filters: [
          { name: '音频文件', extensions: ['mp3'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      }).then(async (result) => {
        if (result.canceled || !result.filePath) {
          return resolve({ success: false, canceled: true });
        }

        const savePath = result.filePath;
        
        // Save the directory for next time
        await saveLastSaveDirectory(savePath);

        try {
          // If speed is 1.0, just copy the file
          if (Math.abs(speed - 1.0) < 0.01) {
            await fs.copyFile(filePath, savePath);
            return resolve({ success: true, filePath: savePath });
          }

          // Otherwise, process the audio with the specified speed
          const processScriptPath = path.join(__dirname, 'process_audio.py');
          const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
          
          // Use the current process environment (which should include user PATH)
          const pythonEnv = { ...process.env, PYTHONIOENCODING: 'utf-8' };
          const pythonProcess = spawn(pythonCommand, [processScriptPath, filePath, savePath, speed.toString()], {
            env: pythonEnv
          });

          let stdout = '';
          let stderr = '';

          pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString('utf8');
          });

          pythonProcess.stderr.on('data', (data) => {
            const errorText = data.toString('utf8');
            stderr += errorText;
            console.error('Python stderr:', errorText);
          });

          pythonProcess.on('close', async (code) => {
            if (code === 0) {
              // Check if file exists
              try {
                await fs.access(savePath);
                resolve({ success: true, filePath: savePath });
              } catch (error) {
                resolve({ success: false, error: 'Processed audio file was not created' });
              }
            } else {
              let errorMsg = stderr || stdout || 'Unknown error occurred';
              
              // Provide helpful error message if ffmpeg is missing
              if (errorMsg.includes('ffmpeg') || errorMsg.includes('ffprobe') || errorMsg.includes('Couldn\'t find')) {
                errorMsg = 'ffmpeg 未安装。请安装 ffmpeg 以使用速度处理功能。\n' +
                          'Windows: 下载 https://ffmpeg.org/download.html 或使用: choco install ffmpeg\n' +
                          'macOS: brew install ffmpeg\n' +
                          'Linux: sudo apt-get install ffmpeg\n' +
                          '安装后需要将 ffmpeg 添加到系统 PATH 环境变量中。';
              }
              
              resolve({ success: false, error: errorMsg.trim() });
            }
          });

          pythonProcess.on('error', (error) => {
            if (error.code === 'ENOENT') {
              resolve({ 
                success: false, 
                error: 'Python not found. Please make sure Python is installed and in your PATH.' 
              });
            } else {
              resolve({ success: false, error: error.message });
            }
          });
        } catch (error) {
          resolve({ success: false, error: error.message });
        }
      }).catch((error) => {
        resolve({ success: false, error: error.message });
      });
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
});

// Handle folder selection
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择包含音频文件的文件夹',
      properties: ['openDirectory']
    });
    return result;
  } catch (error) {
    console.error('Error selecting folder:', error);
    return { canceled: true };
  }
});

// Handle audio file selection
ipcMain.handle('select-audio-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择音频文件',
      properties: ['openFile'],
      filters: [
        { name: '音频文件', extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });
    return result;
  } catch (error) {
    console.error('Error selecting audio file:', error);
    return { canceled: true };
  }
});

// Handle audio merge request
ipcMain.handle('merge-audio', async (event, folderPath, interval) => {
  return new Promise((resolve) => {
    try {
      const mergeScriptPath = path.join(__dirname, 'merge_audio.py');
      const outputFile = path.join(app.getPath('temp'), 'fish-audio', `merged-${Date.now()}.mp3`);
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      const pythonProcess = spawn(pythonCommand, [mergeScriptPath, folderPath, outputFile, interval.toString()], {
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString('utf8');
      });

      pythonProcess.stderr.on('data', (data) => {
        const errorText = data.toString('utf8');
        stderr += errorText;
        console.error('Python stderr:', errorText);
      });

      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            await fs.access(outputFile);
            // Try to parse file count from stdout
            const match = stdout.match(/Merged (\d+) files/);
            const fileCount = match ? parseInt(match[1]) : 0;
            resolve({ success: true, filePath: outputFile, fileCount });
          } catch (error) {
            resolve({ success: false, error: 'Merged audio file was not created' });
          }
        } else {
          const errorMsg = stderr || stdout || 'Unknown error occurred';
          resolve({ success: false, error: errorMsg.trim() });
        }
      });

      pythonProcess.on('error', (error) => {
        if (error.code === 'ENOENT') {
          resolve({ 
            success: false, 
            error: 'Python not found. Please make sure Python is installed and in your PATH.' 
          });
        } else {
          resolve({ success: false, error: error.message });
        }
      });
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
});

// Handle audio filter processing request
ipcMain.handle('process-audio-filter', async (event, filePath, highPass, lowPass, bass, treble, semitones, cents) => {
  return new Promise((resolve) => {
    try {
      const filterScriptPath = path.join(__dirname, 'process_audio_filter.py');
      const outputFile = path.join(app.getPath('temp'), 'fish-audio', `filtered-${Date.now()}.mp3`);
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      const pythonProcess = spawn(pythonCommand, [
        filterScriptPath,
        filePath,
        outputFile,
        highPass.toString(),
        lowPass.toString(),
        bass.toString(),
        treble.toString(),
        (semitones || 0).toString(),
        (cents || 0).toString()
      ], {
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString('utf8');
      });

      pythonProcess.stderr.on('data', (data) => {
        const errorText = data.toString('utf8');
        stderr += errorText;
        console.error('Python stderr:', errorText);
      });

      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            await fs.access(outputFile);
            resolve({ success: true, filePath: outputFile });
          } catch (error) {
            resolve({ success: false, error: 'Processed audio file was not created' });
          }
        } else {
          const errorMsg = stderr || stdout || 'Unknown error occurred';
          
          // Provide helpful error message if ffmpeg is missing
          if (errorMsg.includes('ffmpeg') || errorMsg.includes('ffprobe') || errorMsg.includes('Couldn\'t find')) {
            const errorMessage = 'ffmpeg 未安装。请安装 ffmpeg 以使用音频处理功能。\n' +
                               'Windows: 下载 https://ffmpeg.org/download.html 或使用: choco install ffmpeg\n' +
                               'macOS: brew install ffmpeg\n' +
                               'Linux: sudo apt-get install ffmpeg\n' +
                               '安装后需要将 ffmpeg 添加到系统 PATH 环境变量中。';
            resolve({ success: false, error: errorMessage });
          } else {
            resolve({ success: false, error: errorMsg.trim() });
          }
        }
      });

      pythonProcess.on('error', (error) => {
        if (error.code === 'ENOENT') {
          resolve({ 
            success: false, 
            error: 'Python not found. Please make sure Python is installed and in your PATH.' 
          });
        } else {
          resolve({ success: false, error: error.message });
        }
      });
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
});
