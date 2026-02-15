// DOM Elements
const textInput = document.getElementById('textInput');
const temperatureInput = document.getElementById('temperatureInput');
const topPInput = document.getElementById('topPInput');
const referenceIdInput = document.getElementById('referenceId');
const referenceIdSelect = document.getElementById('referenceIdSelect');
const saveRefIdBtn = document.getElementById('saveRefIdBtn');
const generateBtn = document.getElementById('generateBtn');
const loadAudioBtn = document.getElementById('loadAudioBtn');
const audioPlayer = document.getElementById('audioPlayer');
const statusMessage = document.getElementById('statusMessage');

// Emotion modal
const emotionBtn = document.getElementById('emotionBtn');
const emotionModal = document.getElementById('emotionModal');
const emotionModalBody = document.getElementById('emotionModalBody');
const closeModal = document.querySelector('.close-modal');

// Confirm split generate modal
const confirmSplitModal = document.getElementById('confirmSplitModal');
const confirmSplitMessage = document.getElementById('confirmSplitMessage');
const confirmSplitBtn = document.getElementById('confirmSplitBtn');
const cancelSplitBtn = document.getElementById('cancelSplitBtn');
const closeConfirmSplitModal = document.getElementById('closeConfirmSplitModal');

// Speed control
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const speedSlider2 = document.getElementById('speedSlider2');
const speedValue2 = document.getElementById('speedValue2');

// Merge audio
const selectFolderBtn = document.getElementById('selectFolderBtn');
const mergeFolderPath = document.getElementById('mergeFolderPath');
const mergeInterval = document.getElementById('mergeInterval');
const mergeBtn = document.getElementById('mergeBtn');

// Audio filter controls
const highPassFilter = document.getElementById('highPassFilter');
const lowPassFilter = document.getElementById('lowPassFilter');
const bassBoost = document.getElementById('bassBoost');
const trebleBoost = document.getElementById('trebleBoost');
const pitchSemitones = document.getElementById('pitchSemitones');
const pitchCents = document.getElementById('pitchCents');
const highPassValue = document.getElementById('highPassValue');
const lowPassValue = document.getElementById('lowPassValue');
const bassBoostValue = document.getElementById('bassBoostValue');
const trebleBoostValue = document.getElementById('trebleBoostValue');
const pitchSemitonesValue = document.getElementById('pitchSemitonesValue');
const pitchCentsValue = document.getElementById('pitchCentsValue');
const applyAudioFilterBtn = document.getElementById('applyAudioFilterBtn');
const resetAudioFilterBtn = document.getElementById('resetAudioFilterBtn');

// Buttons for each section
const playBtn1 = document.getElementById('playBtn1');
const stopBtn1 = document.getElementById('stopBtn1');
const downloadBtn1 = document.getElementById('downloadBtn1');
const playBtn2 = document.getElementById('playBtn2');
const stopBtn2 = document.getElementById('stopBtn2');
const downloadBtn2 = document.getElementById('downloadBtn2');
const playBtn3 = document.getElementById('playBtn3');
const stopBtn3 = document.getElementById('stopBtn3');
const downloadBtn3 = document.getElementById('downloadBtn3');

// Audio files for each section
let currentAudioFile1 = null; // Section 1: Generate
let currentAudioFile1A = null; // Section 1A: Split Generate
let currentAudioFile2 = null; // Section 2: Adjust
let currentAudioFile3 = null; // Section 3: Merge
let currentActiveSection = null; // Track which section's audio is currently playing

// Sequential play state
let sequentialPlayFiles = []; // Array of audio file paths
let currentSequentialIndex = -1; // Current playing file index
let isSequentialPlaying = false; // Is sequential play active

// Reference ID storage
const STORAGE_KEY = 'savedReferenceIds';

// Helper function to load audio into player
function loadAudioToPlayer(filePath, section) {
  currentActiveSection = section;
  let fileUrl = filePath.replace(/\\/g, '/');
  if (!fileUrl.startsWith('/')) {
    fileUrl = '/' + fileUrl;
  }
  audioPlayer.src = `file://${fileUrl}`;
  audioPlayer.style.display = 'block';
  // Set playback rate based on active section
  if (section === 1) {
    audioPlayer.playbackRate = parseFloat(speedSlider.value);
  } else if (section === '1A') {
    audioPlayer.playbackRate = parseFloat(splitSpeedSlider ? splitSpeedSlider.value : 1.0);
  } else if (section === '1B') {
    const sequentialPlaySpeedSlider = document.getElementById('sequentialPlaySpeedSlider');
    audioPlayer.playbackRate = parseFloat(sequentialPlaySpeedSlider ? sequentialPlaySpeedSlider.value : 1.0);
  } else if (section === 2) {
    audioPlayer.playbackRate = parseFloat(speedSlider2.value);
  } else if (section === 3) {
    audioPlayer.playbackRate = parseFloat(speedSlider.value); // Section 3 uses section 1's speed
  }
}

// Helper function to enable/disable buttons for a section
function setSectionButtons(section, enabled) {
  if (section === 1) {
    playBtn1.disabled = !enabled;
    stopBtn1.disabled = !enabled;
    downloadBtn1.disabled = !enabled;
  } else if (section === '1A') {
    const playSplitBtn = document.getElementById('playSplitBtn');
    const stopSplitBtn = document.getElementById('stopSplitBtn');
    const downloadSplitBtn = document.getElementById('downloadSplitBtn');
    if (playSplitBtn) playSplitBtn.disabled = !enabled;
    if (stopSplitBtn) stopSplitBtn.disabled = !enabled;
    if (downloadSplitBtn) downloadSplitBtn.disabled = !enabled;
  } else if (section === '1B') {
    const startSequentialPlayBtn = document.getElementById('startSequentialPlayBtn');
    const pauseSequentialPlayBtn = document.getElementById('pauseSequentialPlayBtn');
    const stopSequentialPlayBtn = document.getElementById('stopSequentialPlayBtn');
    const prevFileBtn = document.getElementById('prevFileBtn');
    const nextFileBtn = document.getElementById('nextFileBtn');
    if (startSequentialPlayBtn) startSequentialPlayBtn.disabled = !enabled;
    if (pauseSequentialPlayBtn) pauseSequentialPlayBtn.disabled = !enabled;
    if (stopSequentialPlayBtn) stopSequentialPlayBtn.disabled = !enabled;
    if (prevFileBtn) prevFileBtn.disabled = !enabled;
    if (nextFileBtn) nextFileBtn.disabled = !enabled;
  } else if (section === 2) {
    playBtn2.disabled = !enabled;
    stopBtn2.disabled = !enabled;
    downloadBtn2.disabled = !enabled;
  } else if (section === 3) {
    playBtn3.disabled = !enabled;
    stopBtn3.disabled = !enabled;
    downloadBtn3.disabled = !enabled;
  }
}

// Load saved reference IDs from localStorage
function loadSavedReferenceIds() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    
    const parsed = JSON.parse(saved);
    
    // Backward compatibility: if it's an array of strings, convert to objects
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map(id => ({ id, name: '' }));
    }
    
    return parsed;
  } catch (error) {
    console.error('Error loading saved reference IDs:', error);
    return [];
  }
}

// Save reference IDs to localStorage
function saveReferenceIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving reference IDs:', error);
  }
}

// Update the reference ID select dropdown
function updateReferenceIdSelect() {
  const savedIds = loadSavedReferenceIds();
  
  // Clear existing options except the default one
  referenceIdSelect.innerHTML = '<option value="">-- 使用默认语音 --</option>';
  
  // Add saved reference IDs
  savedIds.forEach((item) => {
    const option = document.createElement('option');
    const id = typeof item === 'string' ? item : item.id;
    const name = typeof item === 'string' ? '' : (item.name || '');
    option.value = id;
    
    // Display format: "备注名称 (ID前8位...后8位)" or just "ID前8位...后8位" if no name
    if (name) {
      option.textContent = `${name} (${id.substring(0, 8)}...${id.substring(id.length - 8)})`;
    } else {
      option.textContent = `${id.substring(0, 8)}...${id.substring(id.length - 8)}`;
    }
    referenceIdSelect.appendChild(option);
  });
  
  // Also update split reference ID select
  const splitReferenceIdSelect = document.getElementById('splitReferenceIdSelect');
  if (splitReferenceIdSelect) {
    splitReferenceIdSelect.innerHTML = '<option value="">-- 使用默认语音 --</option>';
    savedIds.forEach((item) => {
      const option = document.createElement('option');
      const id = typeof item === 'string' ? item : item.id;
      const name = typeof item === 'string' ? '' : (item.name || '');
      option.value = id;
      
      // Display format: "备注名称 (ID前8位...后8位)" or just "ID前8位...后8位" if no name
      if (name) {
        option.textContent = `${name} (${id.substring(0, 8)}...${id.substring(id.length - 8)})`;
      } else {
        option.textContent = `${id.substring(0, 8)}...${id.substring(id.length - 8)}`;
      }
      splitReferenceIdSelect.appendChild(option);
    });
  }
}

// Initialize on page load
updateReferenceIdSelect();

// Emotion tags data
const emotionTags = {
  'Basic Emotions': [
    { tag: '(happy)', name: 'Happy', desc: 'Cheerful, upbeat tone' },
    { tag: '(sad)', name: 'Sad', desc: 'Melancholic, downcast' },
    { tag: '(angry)', name: 'Angry', desc: 'Frustrated, aggressive' },
    { tag: '(excited)', name: 'Excited', desc: 'Energetic, enthusiastic' },
    { tag: '(calm)', name: 'Calm', desc: 'Peaceful, relaxed' },
    { tag: '(nervous)', name: 'Nervous', desc: 'Anxious, uncertain' },
    { tag: '(confident)', name: 'Confident', desc: 'Assertive, self-assured' },
    { tag: '(surprised)', name: 'Surprised', desc: 'Shocked, amazed' },
    { tag: '(satisfied)', name: 'Satisfied', desc: 'Content, pleased' },
    { tag: '(delighted)', name: 'Delighted', desc: 'Very pleased, joyful' },
    { tag: '(scared)', name: 'Scared', desc: 'Frightened, fearful' },
    { tag: '(worried)', name: 'Worried', desc: 'Concerned, troubled' },
    { tag: '(upset)', name: 'Upset', desc: 'Disturbed, distressed' },
    { tag: '(frustrated)', name: 'Frustrated', desc: 'Annoyed, exasperated' },
    { tag: '(depressed)', name: 'Depressed', desc: 'Very sad, hopeless' },
    { tag: '(empathetic)', name: 'Empathetic', desc: 'Understanding, caring' },
    { tag: '(embarrassed)', name: 'Embarrassed', desc: 'Ashamed, awkward' },
    { tag: '(disgusted)', name: 'Disgusted', desc: 'Repelled, revolted' },
    { tag: '(moved)', name: 'Moved', desc: 'Emotionally touched' },
    { tag: '(proud)', name: 'Proud', desc: 'Accomplished, satisfied' },
    { tag: '(relaxed)', name: 'Relaxed', desc: 'At ease, casual' },
    { tag: '(grateful)', name: 'Grateful', desc: 'Thankful, appreciative' },
    { tag: '(curious)', name: 'Curious', desc: 'Inquisitive, interested' },
    { tag: '(sarcastic)', name: 'Sarcastic', desc: 'Ironic, mocking' }
  ],
  'Advanced Emotions': [
    { tag: '(disdainful)', name: 'Disdainful', desc: 'Contemptuous, scornful' },
    { tag: '(unhappy)', name: 'Unhappy', desc: 'Discontent, dissatisfied' },
    { tag: '(anxious)', name: 'Anxious', desc: 'Very worried, uneasy' },
    { tag: '(hysterical)', name: 'Hysterical', desc: 'Uncontrollably emotional' },
    { tag: '(indifferent)', name: 'Indifferent', desc: 'Uncaring, neutral' },
    { tag: '(uncertain)', name: 'Uncertain', desc: 'Doubtful, unsure' },
    { tag: '(doubtful)', name: 'Doubtful', desc: 'Skeptical, questioning' },
    { tag: '(confused)', name: 'Confused', desc: 'Puzzled, perplexed' },
    { tag: '(disappointed)', name: 'Disappointed', desc: 'Let down, dissatisfied' },
    { tag: '(regretful)', name: 'Regretful', desc: 'Sorry, remorseful' },
    { tag: '(guilty)', name: 'Guilty', desc: 'Culpable, responsible' },
    { tag: '(ashamed)', name: 'Ashamed', desc: 'Deeply embarrassed' },
    { tag: '(jealous)', name: 'Jealous', desc: 'Envious, resentful' },
    { tag: '(envious)', name: 'Envious', desc: 'Wanting what others have' },
    { tag: '(hopeful)', name: 'Hopeful', desc: 'Optimistic about future' },
    { tag: '(optimistic)', name: 'Optimistic', desc: 'Positive outlook' },
    { tag: '(pessimistic)', name: 'Pessimistic', desc: 'Negative outlook' },
    { tag: '(nostalgic)', name: 'Nostalgic', desc: 'Longing for the past' },
    { tag: '(lonely)', name: 'Lonely', desc: 'Isolated, alone' },
    { tag: '(bored)', name: 'Bored', desc: 'Uninterested, weary' },
    { tag: '(contemptuous)', name: 'Contemptuous', desc: 'Showing contempt' },
    { tag: '(sympathetic)', name: 'Sympathetic', desc: 'Showing sympathy' },
    { tag: '(compassionate)', name: 'Compassionate', desc: 'Showing deep care' },
    { tag: '(determined)', name: 'Determined', desc: 'Resolved, decided' },
    { tag: '(resigned)', name: 'Resigned', desc: 'Accepting defeat' }
  ],
  'Tone Markers': [
    { tag: '(in a hurry tone)', name: 'Hurried', desc: 'Rushed, urgent' },
    { tag: '(shouting)', name: 'Shouting', desc: 'Loud, calling out' },
    { tag: '(screaming)', name: 'Screaming', desc: 'Very loud, panicked' },
    { tag: '(whispering)', name: 'Whispering', desc: 'Very soft, secretive' },
    { tag: '(soft tone)', name: 'Soft', desc: 'Gentle, quiet' }
  ],
  'Audio Effects': [
    { tag: '(laughing)', name: 'Laughing', desc: 'Full laughter' },
    { tag: '(chuckling)', name: 'Chuckling', desc: 'Light laugh' },
    { tag: '(sobbing)', name: 'Sobbing', desc: 'Crying heavily' },
    { tag: '(crying loudly)', name: 'Crying Loudly', desc: 'Intense crying' },
    { tag: '(sighing)', name: 'Sighing', desc: 'Exhale of relief/frustration' },
    { tag: '(groaning)', name: 'Groaning', desc: 'Sound of frustration' },
    { tag: '(panting)', name: 'Panting', desc: 'Out of breath' },
    { tag: '(gasping)', name: 'Gasping', desc: 'Sharp intake of breath' },
    { tag: '(yawning)', name: 'Yawning', desc: 'Tired sound' },
    { tag: '(snoring)', name: 'Snoring', desc: 'Sleep sound' }
  ],
  'Special Effects': [
    { tag: '(audience laughing)', name: 'Audience Laughter', desc: 'Crowd laughing sound' },
    { tag: '(background laughter)', name: 'Background Laughter', desc: 'Ambient laughter' },
    { tag: '(crowd laughing)', name: 'Crowd Laughter', desc: 'Large group laughing' },
    { tag: '(break)', name: 'Short Pause', desc: 'Brief pause in speech' },
    { tag: '(long-break)', name: 'Long Pause', desc: 'Extended pause in speech' }
  ]
};

// Render emotion tags in modal
function renderEmotionTags() {
  emotionModalBody.innerHTML = '';
  
  Object.keys(emotionTags).forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'emotion-category';
    
    const title = document.createElement('h3');
    title.textContent = category;
    categoryDiv.appendChild(title);
    
    const grid = document.createElement('div');
    grid.className = 'emotion-grid';
    
    emotionTags[category].forEach(emotion => {
      const tagDiv = document.createElement('div');
      tagDiv.className = 'emotion-tag';
      tagDiv.dataset.tag = emotion.tag;
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'emotion-tag-name';
      nameDiv.textContent = emotion.name;
      
      const descDiv = document.createElement('div');
      descDiv.className = 'emotion-tag-desc';
      descDiv.textContent = emotion.desc;
      
      tagDiv.appendChild(nameDiv);
      tagDiv.appendChild(descDiv);
      
      tagDiv.addEventListener('click', () => {
        insertEmotionTag(emotion.tag);
      });
      
      grid.appendChild(tagDiv);
    });
    
    categoryDiv.appendChild(grid);
    emotionModalBody.appendChild(categoryDiv);
  });
}

// Insert emotion tag into text input
function insertEmotionTag(tag) {
  const cursorPos = textInput.selectionStart;
  const textBefore = textInput.value.substring(0, cursorPos);
  const textAfter = textInput.value.substring(cursorPos);
  
  const spaceBefore = textBefore.length > 0 && !textBefore.endsWith(' ') ? ' ' : '';
  const spaceAfter = textAfter.length > 0 && !textAfter.startsWith(' ') ? ' ' : '';
  
  textInput.value = textBefore + spaceBefore + tag + spaceAfter + textAfter;
  
  const newCursorPos = cursorPos + spaceBefore.length + tag.length + spaceAfter.length;
  textInput.setSelectionRange(newCursorPos, newCursorPos);
  textInput.focus();
  
  emotionModal.style.display = 'none';
}

// Open emotion modal
emotionBtn.addEventListener('click', () => {
  renderEmotionTags();
  emotionModal.style.display = 'block';
});

// Close modal when clicking X
closeModal.addEventListener('click', () => {
  emotionModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  if (event.target === emotionModal) {
    emotionModal.style.display = 'none';
  }
});

// Initialize speed slider
function initializeSpeedSlider() {
  speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(1)}x`;
  audioPlayer.playbackRate = parseFloat(speedSlider.value);
}

// Update speed when slider changes
speedSlider.addEventListener('input', (e) => {
  const speed = parseFloat(e.target.value);
  speedValue.textContent = `${speed.toFixed(1)}x`;
  if (currentActiveSection === 1) {
    audioPlayer.playbackRate = speed;
  }
});

// Initialize speed slider 2 for section 2
function initializeSpeedSlider2() {
  speedValue2.textContent = `${parseFloat(speedSlider2.value).toFixed(1)}x`;
  if (currentActiveSection === 2) {
    audioPlayer.playbackRate = parseFloat(speedSlider2.value);
  }
}

// Update speed slider 2 when it changes
speedSlider2.addEventListener('input', (e) => {
  const speed = parseFloat(e.target.value);
  speedValue2.textContent = `${speed.toFixed(1)}x`;
  if (currentActiveSection === 2) {
    audioPlayer.playbackRate = speed;
  }
});

initializeSpeedSlider();
initializeSpeedSlider2();

// Initialize split speed slider
const splitSpeedSlider = document.getElementById('splitSpeedSlider');
const splitSpeedValue = document.getElementById('splitSpeedValue');

if (splitSpeedSlider && splitSpeedValue) {
  splitSpeedValue.textContent = `${parseFloat(splitSpeedSlider.value).toFixed(1)}x`;
  splitSpeedSlider.addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value);
    splitSpeedValue.textContent = `${speed.toFixed(1)}x`;
    if (currentActiveSection === '1A') {
      audioPlayer.playbackRate = speed;
    }
  });
}

// Split mode folder selection
const splitFolderPath = document.getElementById('splitFolderPath');
const selectSplitFolderBtn = document.getElementById('selectSplitFolderBtn');

// Handle split folder selection
if (selectSplitFolderBtn) {
  selectSplitFolderBtn.addEventListener('click', async () => {
    try {
      const result = await window.electronAPI.selectFolder();
      if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        splitFolderPath.value = result.filePaths[0];
      }
    } catch (error) {
      showStatus(`选择文件夹失败: ${error.message}`, 'error');
    }
  });
  
  // Allow clicking on the input to select folder
  if (splitFolderPath) {
    splitFolderPath.addEventListener('click', () => {
      selectSplitFolderBtn.click();
    });
  }
}

function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = 'block';
  
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
}

function setLoading(loading) {
  generateBtn.disabled = loading;
  const btnText = generateBtn.querySelector('.btn-text');
  const btnLoading = generateBtn.querySelector('.btn-loading');
  
  if (loading) {
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
  } else {
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

// ============ SECTION 1: Generate Speech (Single) ============
generateBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  
  if (!text) {
    showStatus('请输入要转换的文本', 'error');
    return;
  }
  
  let referenceId = referenceIdSelect.value.trim() || referenceIdInput.value.trim();
  referenceId = referenceId || undefined;

  // Read sampling parameters
  let temperature = null;
  let topP = null;

  if (temperatureInput && temperatureInput.value.trim() !== '') {
    const t = parseFloat(temperatureInput.value.trim());
    if (isNaN(t) || t < 0 || t > 1) {
      showStatus('temperature 必须在 0 到 1 之间', 'error');
      return;
    }
    temperature = t;
  }

  if (topPInput && topPInput.value.trim() !== '') {
    const p = parseFloat(topPInput.value.trim());
    if (isNaN(p) || p < 0 || p > 1) {
      showStatus('top_p 必须在 0 到 1 之间', 'error');
      return;
    }
    topP = p;
  }
  
  setLoading(true);
  showStatus('正在生成语音...', 'info');
  
  try {
    const result = await window.electronAPI.generateSpeech(text, referenceId, false, null, temperature, topP);
    
    if (result.success) {
      currentAudioFile1 = result.filePath;
      loadAudioToPlayer(result.filePath, 1);
      setSectionButtons(1, true);
      showStatus('语音生成成功！', 'success');
    } else {
      showStatus(`生成失败: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`发生错误: ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
});

// ============ SECTION 1A: Split Generate Speech ============
const generateSplitBtn = document.getElementById('generateSplitBtn');
const splitTextInput = document.getElementById('splitTextInput');
const splitReferenceIdSelect = document.getElementById('splitReferenceIdSelect');
const splitReferenceIdInput = document.getElementById('splitReferenceId');

// Function to actually generate split audio
async function executeSplitGenerate() {
  const text = splitTextInput ? splitTextInput.value.trim() : '';
  
  if (!text) {
    showStatus('请输入要转换的文本', 'error');
    return;
  }
  
  if (!text.includes('*****')) {
    showStatus('分段模式需要文本中包含 ***** 分割符号', 'error');
    return;
  }
  
  // Check if folder is selected
  const selectedFolder = splitFolderPath ? splitFolderPath.value.trim() : '';
  if (!selectedFolder) {
    showStatus('请先选择保存文件夹', 'error');
    return;
  }
  
  let referenceId = splitReferenceIdSelect ? (splitReferenceIdSelect.value.trim() || (splitReferenceIdInput ? splitReferenceIdInput.value.trim() : '')) : '';
  referenceId = referenceId || undefined;

  // Sampling parameters for split generate (use 1A section inputs)
  const splitTemperatureInput = document.getElementById('splitTemperatureInput');
  const splitTopPInput = document.getElementById('splitTopPInput');
  let temperature = null;
  let topP = null;

  if (splitTemperatureInput && splitTemperatureInput.value.trim() !== '') {
    const t = parseFloat(splitTemperatureInput.value.trim());
    if (isNaN(t) || t < 0 || t > 1) {
      showStatus('temperature 必须在 0 到 1 之间', 'error');
      return;
    }
    temperature = t;
  }

  if (splitTopPInput && splitTopPInput.value.trim() !== '') {
    const p = parseFloat(splitTopPInput.value.trim());
    if (isNaN(p) || p < 0 || p > 1) {
      showStatus('top_p 必须在 0 到 1 之间', 'error');
      return;
    }
    topP = p;
  }

  const btnText = generateSplitBtn.querySelector('.btn-text');
  const btnLoading = generateSplitBtn.querySelector('.btn-loading');
  
  if (btnText) btnText.style.display = 'none';
  if (btnLoading) btnLoading.style.display = 'inline';
  generateSplitBtn.disabled = true;
  showStatus('正在生成分段语音...', 'info');
  
  try {
    const result = await window.electronAPI.generateSpeech(text, referenceId, true, selectedFolder, temperature, topP);
    
    if (result.success && result.filePaths && result.filePaths.length > 0) {
      // Load the first file for playback
      currentAudioFile1A = result.filePaths[0];
      loadAudioToPlayer(result.filePaths[0], '1A');
      setSectionButtons('1A', true);
      
      let successMsg = `语音生成成功！共生成 ${result.fileCount} 个分段音频文件（1.mp3, 2.mp3, ...）。`;
      if (result.warnings) {
        successMsg += ` 警告：${result.warnings}`;
        showStatus(successMsg + ` 所有文件保存在: ${result.outputDir}`, 'error');
      } else {
        showStatus(successMsg + ` 所有文件保存在: ${result.outputDir}`, 'success');
      }
      // Keep the message visible longer
      setTimeout(() => {
        if (statusMessage.textContent.includes('所有文件保存在:')) {
          statusMessage.style.display = 'none';
        }
      }, 10000);
    } else {
      showStatus(`生成失败: ${result.error || '没有生成任何文件'}`, 'error');
    }
  } catch (error) {
    showStatus(`发生错误: ${error.message}`, 'error');
  } finally {
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
    generateSplitBtn.disabled = false;
  }
}

if (generateSplitBtn) {
  generateSplitBtn.addEventListener('click', () => {
    const text = splitTextInput ? splitTextInput.value.trim() : '';
    
    if (!text) {
      showStatus('请输入要转换的文本', 'error');
      return;
    }
    
    if (!text.includes('*****')) {
      showStatus('分段模式需要文本中包含 ***** 分割符号', 'error');
      return;
    }
    
    // Check if folder is selected
    const selectedFolder = splitFolderPath ? splitFolderPath.value.trim() : '';
    if (!selectedFolder) {
      showStatus('请先选择保存文件夹', 'error');
      return;
    }
    
    // Show confirmation modal
    confirmSplitMessage.textContent = `即将生成语音存入 ${selectedFolder} 文件夹`;
    confirmSplitModal.style.display = 'block';
  });
}

// Handle confirm button click
if (confirmSplitBtn) {
  confirmSplitBtn.addEventListener('click', () => {
    confirmSplitModal.style.display = 'none';
    executeSplitGenerate();
  });
}

// Handle cancel button click
if (cancelSplitBtn) {
  cancelSplitBtn.addEventListener('click', () => {
    confirmSplitModal.style.display = 'none';
  });
}

// Handle close button click
if (closeConfirmSplitModal) {
  closeConfirmSplitModal.addEventListener('click', () => {
    confirmSplitModal.style.display = 'none';
  });
}

// Close modal when clicking outside
if (confirmSplitModal) {
  window.addEventListener('click', (event) => {
    if (event.target === confirmSplitModal) {
      confirmSplitModal.style.display = 'none';
    }
  });
}

// Section 1A buttons (Split Generate)
const playSplitBtn = document.getElementById('playSplitBtn');
const stopSplitBtn = document.getElementById('stopSplitBtn');
const downloadSplitBtn = document.getElementById('downloadSplitBtn');

if (playSplitBtn) {
  playSplitBtn.addEventListener('click', () => {
    if (currentAudioFile1A) {
      if (currentActiveSection !== '1A') {
        loadAudioToPlayer(currentAudioFile1A, '1A');
      }
      audioPlayer.play();
    }
  });
}

if (stopSplitBtn) {
  stopSplitBtn.addEventListener('click', () => {
    if (currentActiveSection === '1A') {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }
  });
}

if (downloadSplitBtn) {
  downloadSplitBtn.addEventListener('click', async () => {
    if (!currentAudioFile1A) {
      showStatus('没有可下载的音频文件', 'error');
      return;
    }
    
    const speed = splitSpeedSlider ? parseFloat(splitSpeedSlider.value) : 1.0;
    
    try {
      const result = await window.electronAPI.downloadAudio(currentAudioFile1A, speed);
      
      if (result.canceled) return;
      
      if (result.success) {
        if (Math.abs(speed - 1.0) > 0.01) {
          showStatus(`音频已保存（速度 ${speed.toFixed(1)}x）: ${result.filePath}`, 'success');
        } else {
          showStatus(`音频已保存到: ${result.filePath}`, 'success');
        }
      } else {
        showStatus(`下载失败: ${result.error}`, 'error');
        if (result.error.includes('ffmpeg')) {
          setTimeout(() => { statusMessage.style.display = 'none'; }, 15000);
        }
      }
    } catch (error) {
      showStatus(`发生错误: ${error.message}`, 'error');
    }
  });
}

// Section 1 buttons
playBtn1.addEventListener('click', () => {
  if (currentAudioFile1) {
    if (currentActiveSection !== 1) {
      loadAudioToPlayer(currentAudioFile1, 1);
    }
    audioPlayer.play();
  }
});

stopBtn1.addEventListener('click', () => {
  if (currentActiveSection === 1) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }
});

downloadBtn1.addEventListener('click', async () => {
  if (!currentAudioFile1) {
    showStatus('没有可下载的音频文件', 'error');
    return;
  }
  
  const speed = parseFloat(speedSlider.value);
  
  try {
    const result = await window.electronAPI.downloadAudio(currentAudioFile1, speed);
    
    if (result.canceled) return;
    
    if (result.success) {
      if (Math.abs(speed - 1.0) > 0.01) {
        showStatus(`音频已保存（速度 ${speed.toFixed(1)}x）: ${result.filePath}`, 'success');
      } else {
        showStatus(`音频已保存到: ${result.filePath}`, 'success');
      }
    } else {
      showStatus(`下载失败: ${result.error}`, 'error');
      if (result.error.includes('ffmpeg')) {
        setTimeout(() => { statusMessage.style.display = 'none'; }, 15000);
      }
    }
  } catch (error) {
    showStatus(`发生错误: ${error.message}`, 'error');
  }
});

// ============ SECTION 2: Adjust Audio ============
loadAudioBtn.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.selectAudioFile();
    if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
      currentAudioFile2 = result.filePaths[0];
      loadAudioToPlayer(currentAudioFile2, 2);
      setSectionButtons(2, true);
      applyAudioFilterBtn.disabled = false;
      showStatus('音频文件加载成功！', 'success');
    }
  } catch (error) {
    showStatus(`加载音频文件失败: ${error.message}`, 'error');
  }
});

// Section 2 buttons
playBtn2.addEventListener('click', () => {
  if (currentAudioFile2) {
    if (currentActiveSection !== 2) {
      loadAudioToPlayer(currentAudioFile2, 2);
    }
    audioPlayer.play();
  }
});

stopBtn2.addEventListener('click', () => {
  if (currentActiveSection === 2) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }
});

downloadBtn2.addEventListener('click', async () => {
  if (!currentAudioFile2) {
    showStatus('没有可下载的音频文件', 'error');
    return;
  }
  
  const speed = parseFloat(speedSlider2.value);
  
  try {
    const result = await window.electronAPI.downloadAudio(currentAudioFile2, speed);
    
    if (result.canceled) return;
    
    if (result.success) {
      if (Math.abs(speed - 1.0) > 0.01) {
        showStatus(`音频已保存（速度 ${speed.toFixed(1)}x）: ${result.filePath}`, 'success');
      } else {
        showStatus(`音频已保存到: ${result.filePath}`, 'success');
      }
    } else {
      showStatus(`下载失败: ${result.error}`, 'error');
      if (result.error.includes('ffmpeg')) {
        setTimeout(() => { statusMessage.style.display = 'none'; }, 15000);
      }
    }
  } catch (error) {
    showStatus(`发生错误: ${error.message}`, 'error');
  }
});

// Audio filter slider updates
highPassFilter.addEventListener('input', (e) => {
  highPassValue.textContent = `${e.target.value} Hz`;
});

lowPassFilter.addEventListener('input', (e) => {
  lowPassValue.textContent = `${e.target.value} Hz`;
});

bassBoost.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  bassBoostValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
});

trebleBoost.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  trebleBoostValue.textContent = `${value > 0 ? '+' : ''}${value} dB`;
});

pitchSemitones.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  pitchSemitonesValue.textContent = `${value > 0 ? '+' : ''}${value}`;
});

pitchCents.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  pitchCentsValue.textContent = `${value > 0 ? '+' : ''}${value}`;
});

resetAudioFilterBtn.addEventListener('click', () => {
  highPassFilter.value = 0;
  lowPassFilter.value = 22050;
  bassBoost.value = 0;
  trebleBoost.value = 0;
  pitchSemitones.value = 0;
  pitchCents.value = 0;
  highPassValue.textContent = '0 Hz';
  lowPassValue.textContent = '22050 Hz';
  bassBoostValue.textContent = '0 dB';
  trebleBoostValue.textContent = '0 dB';
  pitchSemitonesValue.textContent = '0';
  pitchCentsValue.textContent = '0';
});

applyAudioFilterBtn.addEventListener('click', async () => {
  if (!currentAudioFile2) {
    showStatus('没有可处理的音频文件', 'error');
    return;
  }

  const highPass = parseInt(highPassFilter.value);
  const lowPass = parseInt(lowPassFilter.value);
  const bass = parseInt(bassBoost.value);
  const treble = parseInt(trebleBoost.value);
  const semitones = parseInt(pitchSemitones.value);
  const cents = parseInt(pitchCents.value);

  if (highPass === 0 && lowPass === 22050 && bass === 0 && treble === 0 && semitones === 0 && cents === 0) {
    showStatus('请先调整音频处理参数', 'info');
    return;
  }

  const btnText = applyAudioFilterBtn.querySelector('.btn-text');
  const btnLoading = applyAudioFilterBtn.querySelector('.btn-loading');

  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  applyAudioFilterBtn.disabled = true;
  showStatus('正在处理音频...', 'info');

  try {
    const result = await window.electronAPI.processAudioFilter(
      currentAudioFile2,
      highPass,
      lowPass,
      bass,
      treble,
      semitones,
      cents
    );

    if (result.success) {
      currentAudioFile2 = result.filePath;
      loadAudioToPlayer(result.filePath, 2);
      setSectionButtons(2, true);
      showStatus('音频处理成功！', 'success');
    } else {
      showStatus(`处理失败: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`发生错误: ${error.message}`, 'error');
  } finally {
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    applyAudioFilterBtn.disabled = false;
  }
});

// ============ SECTION 3: Merge Audio ============
selectFolderBtn.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.selectFolder();
    if (result && !result.canceled) {
      mergeFolderPath.value = result.filePaths[0] || '';
    }
  } catch (error) {
    showStatus(`选择文件夹失败: ${error.message}`, 'error');
  }
});

mergeBtn.addEventListener('click', async () => {
  const folderPath = mergeFolderPath.value.trim();
  const interval = parseFloat(mergeInterval.value) || 0;
  
  if (!folderPath) {
    showStatus('请先选择包含音频文件的文件夹', 'error');
    return;
  }
  
  if (interval < 0 || interval > 10) {
    showStatus('间隔时间必须在 0 到 10 秒之间', 'error');
    return;
  }
  
  const btnText = mergeBtn.querySelector('.btn-text');
  const btnLoading = mergeBtn.querySelector('.btn-loading');
  
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  mergeBtn.disabled = true;
  showStatus('正在合并音频文件...', 'info');
  
  try {
    const result = await window.electronAPI.mergeAudio(folderPath, interval);
    
    if (result.success) {
      currentAudioFile3 = result.filePath;
      loadAudioToPlayer(result.filePath, 3);
      setSectionButtons(3, true);
      showStatus(`音频合并成功！共合并 ${result.fileCount} 个文件。`, 'success');
    } else {
      showStatus(`合并失败: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`发生错误: ${error.message}`, 'error');
  } finally {
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    mergeBtn.disabled = false;
  }
});

// Section 3 buttons
playBtn3.addEventListener('click', () => {
  if (currentAudioFile3) {
    if (currentActiveSection !== 3) {
      loadAudioToPlayer(currentAudioFile3, 3);
    }
    audioPlayer.play();
  }
});

stopBtn3.addEventListener('click', () => {
  if (currentActiveSection === 3) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }
});

downloadBtn3.addEventListener('click', async () => {
  if (!currentAudioFile3) {
    showStatus('没有可下载的音频文件', 'error');
    return;
  }
  
  const speed = parseFloat(speedSlider.value);
  
  try {
    const result = await window.electronAPI.downloadAudio(currentAudioFile3, speed);
    
    if (result.canceled) return;
    
    if (result.success) {
      if (Math.abs(speed - 1.0) > 0.01) {
        showStatus(`音频已保存（速度 ${speed.toFixed(1)}x）: ${result.filePath}`, 'success');
      } else {
        showStatus(`音频已保存到: ${result.filePath}`, 'success');
      }
    } else {
      showStatus(`下载失败: ${result.error}`, 'error');
      if (result.error.includes('ffmpeg')) {
        setTimeout(() => { statusMessage.style.display = 'none'; }, 15000);
      }
    }
  } catch (error) {
    showStatus(`发生错误: ${error.message}`, 'error');
  }
});

// Audio player event listeners (shared)
audioPlayer.addEventListener('play', () => {
  if (currentActiveSection === 1) {
    playBtn1.disabled = true;
    stopBtn1.disabled = false;
  } else if (currentActiveSection === '1A') {
    const playSplitBtn = document.getElementById('playSplitBtn');
    const stopSplitBtn = document.getElementById('stopSplitBtn');
    if (playSplitBtn) playSplitBtn.disabled = true;
    if (stopSplitBtn) stopSplitBtn.disabled = false;
  } else if (currentActiveSection === '1B') {
    if (pauseSequentialPlayBtn) pauseSequentialPlayBtn.disabled = false;
    if (startSequentialPlayBtn) startSequentialPlayBtn.disabled = true;
  } else if (currentActiveSection === 2) {
    playBtn2.disabled = true;
    stopBtn2.disabled = false;
  } else if (currentActiveSection === 3) {
    playBtn3.disabled = true;
    stopBtn3.disabled = false;
  }
});

audioPlayer.addEventListener('pause', () => {
  if (currentActiveSection === 1) {
    playBtn1.disabled = false;
  } else if (currentActiveSection === '1A') {
    const playSplitBtn = document.getElementById('playSplitBtn');
    if (playSplitBtn) playSplitBtn.disabled = false;
  } else if (currentActiveSection === '1B') {
    if (pauseSequentialPlayBtn) pauseSequentialPlayBtn.disabled = true;
    if (startSequentialPlayBtn) startSequentialPlayBtn.disabled = false;
  } else if (currentActiveSection === 2) {
    playBtn2.disabled = false;
  } else if (currentActiveSection === 3) {
    playBtn3.disabled = false;
  }
});


// Save reference ID button
saveRefIdBtn.addEventListener('click', () => {
  const refId = referenceIdInput.value.trim();
  const refIdNameInput = document.getElementById('referenceIdName');
  const refIdName = refIdNameInput ? refIdNameInput.value.trim() : '';
  
  if (!refId) {
    showStatus('请输入 Reference ID', 'error');
    return;
  }
  
  if (!/^[a-f0-9]{32}$/i.test(refId)) {
    showStatus('Reference ID 格式不正确（应为32位十六进制字符串）', 'error');
    return;
  }
  
  const savedIds = loadSavedReferenceIds();
  
  // Check if ID already exists
  const existingIndex = savedIds.findIndex(item => {
    const id = typeof item === 'string' ? item : item.id;
    return id === refId;
  });
  
  if (existingIndex >= 0) {
    // Update existing entry with new name if provided
    if (refIdName) {
      savedIds[existingIndex] = { id: refId, name: refIdName };
      saveReferenceIds(savedIds);
      updateReferenceIdSelect();
      showStatus('已更新该 Reference ID 的备注名称', 'success');
    } else {
      showStatus('该 Reference ID 已存在', 'info');
    }
    referenceIdSelect.value = refId;
    if (refIdNameInput) refIdNameInput.value = '';
    return;
  }
  
  // Add new entry
  savedIds.push({ id: refId, name: refIdName });
  saveReferenceIds(savedIds);
  updateReferenceIdSelect();
  referenceIdSelect.value = refId;
  referenceIdInput.value = '';
  if (refIdNameInput) refIdNameInput.value = '';
  showStatus(refIdName ? `Reference ID 已保存（备注: ${refIdName}）` : 'Reference ID 已保存', 'success');
});

referenceIdSelect.addEventListener('change', (e) => {
  if (e.target.value) {
    referenceIdInput.value = e.target.value;
    
    // Also update the name input if available
    const savedIds = loadSavedReferenceIds();
    const selectedItem = savedIds.find(item => {
      const id = typeof item === 'string' ? item : item.id;
      return id === e.target.value;
    });
    
    const refIdNameInput = document.getElementById('referenceIdName');
    if (refIdNameInput) {
      if (selectedItem && typeof selectedItem === 'object' && selectedItem.name) {
        refIdNameInput.value = selectedItem.name;
      } else {
        refIdNameInput.value = '';
      }
    }
  } else {
    referenceIdInput.value = '';
    const refIdNameInput = document.getElementById('referenceIdName');
    if (refIdNameInput) refIdNameInput.value = '';
  }
});

// Sync split reference ID select with input
if (splitReferenceIdSelect) {
  splitReferenceIdSelect.addEventListener('change', (e) => {
    if (e.target.value && splitReferenceIdInput) {
      splitReferenceIdInput.value = e.target.value;
    } else if (splitReferenceIdInput) {
      splitReferenceIdInput.value = '';
    }
  });
}

if (splitReferenceIdInput) {
  splitReferenceIdInput.addEventListener('input', () => {
    if (splitReferenceIdSelect && splitReferenceIdSelect.value && 
        splitReferenceIdInput.value !== splitReferenceIdSelect.value) {
      splitReferenceIdSelect.value = '';
    }
  });
}

referenceIdInput.addEventListener('input', () => {
  if (referenceIdSelect.value && referenceIdInput.value !== referenceIdSelect.value) {
    referenceIdSelect.value = '';
  }
});

// Enter key to generate (Ctrl+Enter)
textInput.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    generateBtn.click();
  }
});

referenceIdInput.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    saveRefIdBtn.click();
  }
});

// ============ SECTION 1B: Sequential Play Folder Audio ============
const sequentialPlayFolderPath = document.getElementById('sequentialPlayFolderPath');
const selectSequentialPlayFolderBtn = document.getElementById('selectSequentialPlayFolderBtn');
const startSequentialPlayBtn = document.getElementById('startSequentialPlayBtn');
const pauseSequentialPlayBtn = document.getElementById('pauseSequentialPlayBtn');
const stopSequentialPlayBtn = document.getElementById('stopSequentialPlayBtn');
const prevFileBtn = document.getElementById('prevFileBtn');
const nextFileBtn = document.getElementById('nextFileBtn');
const currentPlayingFile = document.getElementById('currentPlayingFile');
const sequentialPlayProgress = document.getElementById('sequentialPlayProgress');
const sequentialPlaySpeedSlider = document.getElementById('sequentialPlaySpeedSlider');
const sequentialPlaySpeedValue = document.getElementById('sequentialPlaySpeedValue');
const startFromFileSelect = document.getElementById('startFromFileSelect');

// Initialize sequential play speed slider
if (sequentialPlaySpeedSlider && sequentialPlaySpeedValue) {
  sequentialPlaySpeedValue.textContent = `${parseFloat(sequentialPlaySpeedSlider.value).toFixed(1)}x`;
  sequentialPlaySpeedSlider.addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value);
    sequentialPlaySpeedValue.textContent = `${speed.toFixed(1)}x`;
    if (currentActiveSection === '1B') {
      audioPlayer.playbackRate = speed;
    }
  });
}

// Handle sequential play folder selection
if (selectSequentialPlayFolderBtn) {
  selectSequentialPlayFolderBtn.addEventListener('click', async () => {
    try {
      const result = await window.electronAPI.selectFolder();
      if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        sequentialPlayFolderPath.value = result.filePaths[0];
        
        // Get audio files list
        showStatus('正在获取音频文件列表...', 'info');
        const listResult = await window.electronAPI.getAudioFilesList(result.filePaths[0]);
        
        if (listResult.success && listResult.filePaths.length > 0) {
          sequentialPlayFiles = listResult.filePaths;
          currentSequentialIndex = -1;
          startSequentialPlayBtn.disabled = false;
          currentPlayingFile.textContent = `已找到 ${sequentialPlayFiles.length} 个音频文件`;
          sequentialPlayProgress.textContent = `0 / ${sequentialPlayFiles.length}`;
          
          // Populate start from file select dropdown
          if (startFromFileSelect) {
            startFromFileSelect.innerHTML = '<option value="">-- 从第一个文件开始 --</option>';
            sequentialPlayFiles.forEach((filePath, index) => {
              const fileName = filePath.split(/[\\/]/).pop();
              const option = document.createElement('option');
              option.value = index.toString();
              option.textContent = `${index + 1}. ${fileName}`;
              startFromFileSelect.appendChild(option);
            });
            startFromFileSelect.disabled = false;
          }
          
          showStatus(`找到 ${sequentialPlayFiles.length} 个音频文件，可以开始播放`, 'success');
        } else {
          showStatus(listResult.error || '文件夹中没有找到音频文件', 'error');
          currentPlayingFile.textContent = '未找到音频文件';
          sequentialPlayFiles = [];
          startSequentialPlayBtn.disabled = true;
          if (startFromFileSelect) {
            startFromFileSelect.innerHTML = '<option value="">-- 请先选择文件夹 --</option>';
            startFromFileSelect.disabled = true;
          }
        }
      }
    } catch (error) {
      showStatus(`选择文件夹失败: ${error.message}`, 'error');
    }
  });
  
  if (sequentialPlayFolderPath) {
    sequentialPlayFolderPath.addEventListener('click', () => {
      selectSequentialPlayFolderBtn.click();
    });
  }
}

// Handle start from file selection change
if (startFromFileSelect) {
  startFromFileSelect.addEventListener('change', (e) => {
    if (e.target.value && sequentialPlayFiles.length > 0) {
      const selectedIndex = parseInt(e.target.value);
      if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < sequentialPlayFiles.length) {
        // If currently playing, immediately switch to selected file
        if (isSequentialPlaying && currentActiveSection === '1B') {
          playSequentialFile(selectedIndex);
        }
      }
    }
  });
}

// Function to play file at index
function playSequentialFile(index) {
  if (index < 0 || index >= sequentialPlayFiles.length) {
    return false;
  }
  
  currentSequentialIndex = index;
  const filePath = sequentialPlayFiles[index];
  const fileName = filePath.split(/[\\/]/).pop();
  
  currentPlayingFile.textContent = `正在播放: ${fileName} (${index + 1}/${sequentialPlayFiles.length})`;
  sequentialPlayProgress.textContent = `${index + 1} / ${sequentialPlayFiles.length}`;
  
  // Update start from file select to reflect current playing file
  if (startFromFileSelect) {
    startFromFileSelect.value = index.toString();
  }
  
  loadAudioToPlayer(filePath, '1B');
  audioPlayer.play();
  
  return true;
}

// Start sequential play
if (startSequentialPlayBtn) {
  startSequentialPlayBtn.addEventListener('click', () => {
    if (sequentialPlayFiles.length === 0) {
      showStatus('请先选择包含音频文件的文件夹', 'error');
      return;
    }
    
    isSequentialPlaying = true;
    startSequentialPlayBtn.disabled = true;
    pauseSequentialPlayBtn.disabled = false;
    stopSequentialPlayBtn.disabled = false;
    prevFileBtn.disabled = false;
    nextFileBtn.disabled = false;
    
    // Get start index from user selection or use current index
    let startIndex = 0;
    if (currentSequentialIndex < 0) {
      // If not currently playing, check if user selected a start file
      if (startFromFileSelect && startFromFileSelect.value) {
        startIndex = parseInt(startFromFileSelect.value);
        if (isNaN(startIndex) || startIndex < 0 || startIndex >= sequentialPlayFiles.length) {
          startIndex = 0;
        }
      }
      playSequentialFile(startIndex);
    } else {
      // Resume from current position
      audioPlayer.play();
    }
  });
}

// Pause sequential play
if (pauseSequentialPlayBtn) {
  pauseSequentialPlayBtn.addEventListener('click', () => {
    audioPlayer.pause();
    startSequentialPlayBtn.disabled = false;
    pauseSequentialPlayBtn.disabled = true;
  });
}

// Stop sequential play
if (stopSequentialPlayBtn) {
  stopSequentialPlayBtn.addEventListener('click', () => {
    isSequentialPlaying = false;
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    currentSequentialIndex = -1;
    startSequentialPlayBtn.disabled = false;
    pauseSequentialPlayBtn.disabled = true;
    stopSequentialPlayBtn.disabled = true;
    prevFileBtn.disabled = true;
    nextFileBtn.disabled = true;
    currentPlayingFile.textContent = '已停止';
    sequentialPlayProgress.textContent = `0 / ${sequentialPlayFiles.length}`;
    // Reset start file selection to default when stopped
    if (startFromFileSelect) {
      startFromFileSelect.value = '';
    }
  });
}

// Previous file
if (prevFileBtn) {
  prevFileBtn.addEventListener('click', () => {
    if (currentSequentialIndex > 0) {
      playSequentialFile(currentSequentialIndex - 1);
    } else {
      // Go to last file
      playSequentialFile(sequentialPlayFiles.length - 1);
    }
  });
}

// Next file
if (nextFileBtn) {
  nextFileBtn.addEventListener('click', () => {
    if (currentSequentialIndex < sequentialPlayFiles.length - 1) {
      playSequentialFile(currentSequentialIndex + 1);
    } else {
      // Go to first file (loop)
      playSequentialFile(0);
    }
  });
}

// Auto play next file when current file ends
audioPlayer.addEventListener('ended', () => {
  if (currentActiveSection === '1B' && isSequentialPlaying) {
    const nextIndex = currentSequentialIndex + 1;
    if (nextIndex < sequentialPlayFiles.length) {
      // Play next file
      playSequentialFile(nextIndex);
    } else {
      // All files played, stop
      isSequentialPlaying = false;
      startSequentialPlayBtn.disabled = false;
      pauseSequentialPlayBtn.disabled = true;
      stopSequentialPlayBtn.disabled = true;
      currentPlayingFile.textContent = '播放完成';
      showStatus('所有文件播放完成', 'success');
    }
  } else if (currentActiveSection === 1) {
    playBtn1.disabled = false;
  } else if (currentActiveSection === '1A') {
    const playSplitBtn = document.getElementById('playSplitBtn');
    if (playSplitBtn) playSplitBtn.disabled = false;
  } else if (currentActiveSection === 2) {
    playBtn2.disabled = false;
  } else if (currentActiveSection === 3) {
    playBtn3.disabled = false;
  }
});
