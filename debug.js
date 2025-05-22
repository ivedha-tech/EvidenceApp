document.addEventListener('DOMContentLoaded', () => {
  const debugLog = document.getElementById('debug-log');
  const statusDiv = document.getElementById('status');
  const clearButton = document.getElementById('clear-button');
  const startButton = document.getElementById('start-button');
  const asnListInput = document.getElementById('asn-list');
  const progressText = document.getElementById('progress-text');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const currentStep = document.getElementById('current-step');
  const totalLogsSpan = document.getElementById('total-logs');
  const errorCountSpan = document.getElementById('error-count');
  const successCountSpan = document.getElementById('success-count');
  const asnsProcessedSpan = document.getElementById('asns-processed');

  let stats = {
    total: 0,
    errors: 0,
    success: 0,
    asnsProcessed: 0
  };

  function updateStats(type) {
    stats.total++;
    if (type === 'error') stats.errors++;
    if (type === 'success') stats.success++;
    
    totalLogsSpan.textContent = stats.total;
    errorCountSpan.textContent = stats.errors;
    successCountSpan.textContent = stats.success;
    asnsProcessedSpan.textContent = stats.asnsProcessed;
  }

  function updateProgress(current, total) {
    const percentage = (current / total) * 100;
    progressText.textContent = `${current}/${total}`;
    progressBarFill.style.width = `${percentage}%`;
  }

  function updateCurrentStep(step) {
    currentStep.textContent = step;
  }

  function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    
    // Add timestamp
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'timestamp';
    timestampSpan.textContent = `[${timestamp}] `;
    logEntry.appendChild(timestampSpan);
    
    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.className = type;
    messageSpan.textContent = message;
    logEntry.appendChild(messageSpan);
    
    debugLog.appendChild(logEntry);
    debugLog.scrollTop = debugLog.scrollHeight;
    
    updateStats(type);
  }

  function updateStatus(message, type) {
    log(message, type);
    statusDiv.textContent = message;
    statusDiv.className = `status-bar ${type}`;
  }

  // Clear logs
  clearButton.addEventListener('click', () => {
    debugLog.innerHTML = '';
    statusDiv.textContent = '';
    statusDiv.className = 'status-bar';
    stats = { total: 0, errors: 0, success: 0, asnsProcessed: 0 };
    updateStats();
    updateProgress(0, 0);
    updateCurrentStep('Ready to start');
    startButton.disabled = false;
  });

  // Start processing
  startButton.addEventListener('click', async () => {
    const asnList = asnListInput.value.trim();
    log(`Starting processing with ASNs: ${asnList}`);

    if (!asnList) {
      updateStatus('Please enter at least one ASN number', 'error');
      return;
    }

    const asns = asnList.split(',').map(asn => asn.trim()).filter(asn => asn);
    log(`Parsed ASNs: ${asns.join(', ')}`);
    
    if (asns.length === 0) {
      updateStatus('Please enter valid ASN numbers', 'error');
      return;
    }

    startButton.disabled = true;
    updateStatus(`Processing ${asns.length} ASN(s)...`, 'processing');
    updateProgress(0, asns.length);

    try {
      // Store ASNs in chrome.storage
      await chrome.storage.local.set({ 
        pendingASNs: asns,
        currentASNIndex: 0,
        totalASNs: asns.length
      });
      log('ASNs stored in chrome.storage', 'success');

      // Send message to background script to start processing
      chrome.runtime.sendMessage({ 
        action: 'startProcessing',
        asn: asns[0]
      }, (response) => {
        if (response && response.success) {
          log('Background script started processing', 'success');
          updateStatus('Processing started!', 'success');
        } else {
          log(`Failed to start background processing: ${response?.error || 'Unknown error'}`, 'error');
          updateStatus(`Error: ${response?.error || 'Failed to start processing'}`, 'error');
          startButton.disabled = false;
        }
      });
    } catch (error) {
      log(`Error in main process: ${error.message}`, 'error');
      updateStatus(`Error: ${error.message}`, 'error');
      startButton.disabled = false;
    }
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'log') {
      log(message.message, message.logType);
    } else if (message.type === 'progress') {
      updateProgress(message.current, message.total);
      stats.asnsProcessed = message.current;
      updateStats();
    } else if (message.type === 'step') {
      updateCurrentStep(message.step);
    }
  });

  // Initial log
  log('Debug page loaded and ready', 'info');
}); 