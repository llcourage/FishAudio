const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateSpeech: (text, referenceId, splitMode = false, outputDir = null, temperature = null, topP = null) => 
    ipcRenderer.invoke('generate-speech', { text, referenceId, splitMode, outputDir, temperature, topP }),
  downloadAudio: (filePath, speed) => 
    ipcRenderer.invoke('download-audio', filePath, speed),
  selectFolder: () => 
    ipcRenderer.invoke('select-folder'),
  selectAudioFile: () => 
    ipcRenderer.invoke('select-audio-file'),
  mergeAudio: (folderPath, interval, customOutputFile = null) => 
    ipcRenderer.invoke('merge-audio', folderPath, interval, customOutputFile),
  processAudioFilter: (filePath, highPass, lowPass, bass, treble, semitones, cents) => 
    ipcRenderer.invoke('process-audio-filter', filePath, highPass, lowPass, bass, treble, semitones, cents),
  getAudioFilesList: (folderPath) => 
    ipcRenderer.invoke('get-audio-files-list', folderPath),
  generateSpeechAutoSection: (text, referenceId, outputDir, temperature = null, topP = null) =>
    ipcRenderer.invoke('generate-speech-auto-section', { text, referenceId, outputDir, temperature, topP })
});
