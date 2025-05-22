document.addEventListener('DOMContentLoaded', () => {
  console.log(':: Extension popup loaded');
  const startButton = document.getElementById('start-button');
  const asnListInput = document.getElementById('asn-list');
  const statusDiv = document.getElementById('status');
  const debugLog = document.getElementById('debug-log');

  function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = type;
    logEntry.textContent = `[${timestamp}] ${message}`;
    debugLog.appendChild(logEntry);
    debugLog.scrollTop = debugLog.scrollHeight;
    console.log(`:: ${message}`);
  }

  function updateStatus(message, type) {
    log(message, type);
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'log') {
      log(message.message, message.logType);
    }
  });

  startButton.addEventListener('click', async () => {
    log('Start button clicked');
    const asnList = asnListInput.value.trim();
    log(`ASN list input: ${asnList}`);

    if (!asnList) {
      log('No ASN numbers entered', 'error');
      updateStatus('Please enter at least one ASN number', 'error');
      return;
    }

    const asns = asnList.split(',').map(asn => asn.trim()).filter(asn => asn);
    log(`Parsed ASNs: ${asns.join(', ')}`);
    
    if (asns.length === 0) {
      log('No valid ASN numbers found', 'error');
      updateStatus('Please enter valid ASN numbers', 'error');
      return;
    }

    startButton.disabled = true;
    updateStatus(`Processing ${asns.length} ASN(s)...`, 'processing');

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
          updateStatus('Processing started! You can close this popup.', 'success');
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
}); 