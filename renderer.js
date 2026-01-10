// DOM Elements
const textInput = document.getElementById('textInput');
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
let currentAudioFile2 = null; // Section 2: Adjust
let currentAudioFile3 = null; // Section 3: Merge
let currentActiveSection = null; // Track which section's audio is currently playing

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
    return saved ? JSON.parse(saved) : [];
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
  savedIds.forEach((id) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = `${id.substring(0, 8)}...${id.substring(id.length - 8)}`;
    referenceIdSelect.appendChild(option);
  });
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

// ============ SECTION 1: Generate Speech ============
generateBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  
  if (!text) {
    showStatus('请输入要转换的文本', 'error');
    return;
  }
  
  let referenceId = referenceIdSelect.value.trim() || referenceIdInput.value.trim();
  referenceId = referenceId || undefined;
  
  setLoading(true);
  showStatus('正在生成语音...', 'info');
  
  try {
    const result = await window.electronAPI.generateSpeech(text, referenceId);
    
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
  } else if (currentActiveSection === 2) {
    playBtn2.disabled = false;
  } else if (currentActiveSection === 3) {
    playBtn3.disabled = false;
  }
});

audioPlayer.addEventListener('ended', () => {
  if (currentActiveSection === 1) {
    playBtn1.disabled = false;
  } else if (currentActiveSection === 2) {
    playBtn2.disabled = false;
  } else if (currentActiveSection === 3) {
    playBtn3.disabled = false;
  }
});

// Save reference ID button
saveRefIdBtn.addEventListener('click', () => {
  const refId = referenceIdInput.value.trim();
  
  if (!refId) {
    showStatus('请输入 Reference ID', 'error');
    return;
  }
  
  if (!/^[a-f0-9]{32}$/i.test(refId)) {
    showStatus('Reference ID 格式不正确（应为32位十六进制字符串）', 'error');
    return;
  }
  
  const savedIds = loadSavedReferenceIds();
  
  if (savedIds.includes(refId)) {
    showStatus('该 Reference ID 已存在', 'info');
    referenceIdSelect.value = refId;
    return;
  }
  
  savedIds.push(refId);
  saveReferenceIds(savedIds);
  updateReferenceIdSelect();
  referenceIdSelect.value = refId;
  referenceIdInput.value = '';
  showStatus('Reference ID 已保存', 'success');
});

referenceIdSelect.addEventListener('change', (e) => {
  if (e.target.value) {
    referenceIdInput.value = e.target.value;
  } else {
    referenceIdInput.value = '';
  }
});

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
