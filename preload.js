const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateSpeech: (text, referenceId) => 
    ipcRenderer.invoke('generate-speech', { text, referenceId }),
  downloadAudio: (filePath, speed) => 
    ipcRenderer.invoke('download-audio', filePath, speed),
  selectFolder: () => 
    ipcRenderer.invoke('select-folder'),
  selectAudioFile: () => 
    ipcRenderer.invoke('select-audio-file'),
  mergeAudio: (folderPath, interval) => 
    ipcRenderer.invoke('merge-audio', folderPath, interval),
  processAudioFilter: (filePath, highPass, lowPass, bass, treble, semitones, cents) => 
    ipcRenderer.invoke('process-audio-filter', filePath, highPass, lowPass, bass, treble, semitones, cents)
});
