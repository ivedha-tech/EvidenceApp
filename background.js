// Log when background script starts
console.log(':: Background: Service Worker Started');

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'debug.html' });
});

// Function to add timestamp to screenshot
async function addTimestampToScreenshot(imageData) {
  console.log(':: Background: Adding timestamp to screenshot');
  try {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the screenshot
    ctx.drawImage(imageData, 0, 0);
    
    // Add timestamp
    const timestamp = new Date().toLocaleString();
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    
    // Add text with outline for better visibility
    ctx.strokeText(timestamp, imageData.width - 300, 30);
    ctx.fillText(timestamp, imageData.width - 300, 30);
    
    const blob = await canvas.convertToBlob();
    console.log(':: Background: Timestamp added successfully');
    return blob;
  } catch (error) {
    console.error(':: Background: Error adding timestamp:', error);
    throw error;
  }
}

// Function to create Word document with screenshot
async function createWordDocument(screenshotBlob, asn) {
  console.log(':: Background: Creating document for ASN:', asn);
  try {
    // Create a simple HTML document with the screenshot
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Evidence for ${asn}</title>
        <style>
          body { margin: 0; padding: 20px; }
          img { max-width: 100%; }
          .timestamp { 
            position: absolute;
            top: 20px;
            right: 20px;
            font-family: Arial;
            font-size: 14px;
          }
          .asn-info {
            margin-bottom: 20px;
            font-family: Arial;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="asn-info">ASN: ${asn}</div>
        <div class="timestamp">${new Date().toLocaleString()}</div>
        <img src="${URL.createObjectURL(screenshotBlob)}" alt="Screenshot">
      </body>
      </html>
    `;

    // Convert HTML to a blob
    const blob = new Blob([htmlContent], { type: 'text/html' });
    console.log(':: Background: Document created successfully');
    return blob;
  } catch (error) {
    console.error(':: Background: Error creating document:', error);
    throw error;
  }
}

// Function to wait for page load
function waitForPageLoad(tabId) {
  return new Promise((resolve) => {
    console.log(`:: Background: Waiting for page load on tab ${tabId}`);
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        console.log(`:: Background: Page load complete for tab ${tabId}`);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

// Function to wait for network idle
function waitForNetworkIdle(tabId) {
  return new Promise((resolve) => {
    console.log(`:: Background: Waiting for network idle on tab ${tabId}`);
    let timer;
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'loading') {
        console.log(`:: Background: Tab ${tabId} is loading`);
        clearTimeout(timer);
      } else if (updatedTabId === tabId && changeInfo.status === 'complete') {
        console.log(`:: Background: Tab ${tabId} completed loading`);
        clearTimeout(timer);
        timer = setTimeout(() => {
          console.log(`:: Background: Network is idle for tab ${tabId}`);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, 1000);
      }
    });
  });
}

// Function to send log to debug page
function sendLogToDebug(message, type = 'info') {
  chrome.runtime.sendMessage({
    type: 'log',
    message: message,
    logType: type
  }).catch(() => {
    // Ignore errors if debug page is closed
  });
}

// Function to send progress update
function sendProgressUpdate(current, total) {
  chrome.runtime.sendMessage({
    type: 'progress',
    current: current,
    total: total
  }).catch(() => {
    // Ignore errors if debug page is closed
  });
}

// Function to send step update
function sendStepUpdate(step) {
  chrome.runtime.sendMessage({
    type: 'step',
    step: step
  }).catch(() => {
    // Ignore errors if debug page is closed
  });
}

// Function to process a single ASN
async function processASN(asn) {
  console.log(`:: Background: Starting to process ASN: ${asn}`);
  sendLogToDebug(`Starting to process ASN: ${asn}`);
  let tab = null;
  try {
    // Open Google in a new tab
    console.log(':: Background: Opening Google in new tab');
    sendLogToDebug('Opening Google in new tab');
    sendStepUpdate('Opening Google');
    tab = await chrome.tabs.create({ url: 'https://www.google.com' });
    console.log(`:: Background: Tab created with ID: ${tab.id}`);
    sendLogToDebug(`Tab created with ID: ${tab.id}`);
    
    // Wait for the page to load
    console.log(':: Background: Waiting for initial page load');
    sendLogToDebug('Waiting for initial page load');
    sendStepUpdate('Waiting for Google to load');
    await waitForPageLoad(tab.id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Execute content script to perform search
    console.log(':: Background: Executing search script');
    sendLogToDebug('Executing search script');
    sendStepUpdate('Performing search');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: (searchTerm) => {
        return new Promise((resolve, reject) => {
          console.log(`:: Content script: Searching for "${searchTerm}"`);
          // Try different selectors for Google search input
          const searchInput = document.querySelector('input[name="q"]') || 
                            document.querySelector('textarea[name="q"]') ||
                            document.querySelector('input[title="Search"]') ||
                            document.querySelector('textarea[title="Search"]');
          
          console.log(`:: Content script: Search input found: ${!!searchInput}`);
          if (searchInput) {
            console.log(':: Content script: Setting search input value');
            searchInput.value = searchTerm;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(':: Content script: Submitting form');
            searchInput.form.submit();
            resolve(true);
          } else {
            console.log(':: Content script: Search input not found');
            reject(new Error('Could not find search input field'));
          }
        });
      },
      args: [asn]
    });

    // Wait for search results page to load and network to be idle
    console.log(':: Background: Waiting for search results page');
    sendLogToDebug('Waiting for search results page');
    sendStepUpdate('Waiting for search results');
    await waitForPageLoad(tab.id);
    // await waitForNetworkIdle(tab.id);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    console.log(':: Background: Attempting to take screenshot');
    sendLogToDebug('Attempting to take screenshot');
    sendStepUpdate('Taking screenshot');
    const screenshotUrl = await new Promise((resolve, reject) => {
      // First, check if we can access the tab
      chrome.tabs.get(tab.id, (tabInfo) => {
        if (chrome.runtime.lastError) {
          console.error(':: Background: Error accessing tab:', chrome.runtime.lastError);
          sendLogToDebug(`Error accessing tab: ${chrome.runtime.lastError.message}`, 'error');
          reject(chrome.runtime.lastError);
          return;
        }
        
        console.log(':: Background: Tab status:', tabInfo.status);
        sendLogToDebug(`Tab status: ${tabInfo.status}`);
        if (tabInfo.status !== 'complete') {
          sendLogToDebug('Tab is not fully loaded', 'error');
          reject(new Error('Tab is not fully loaded'));
          return;
        }

        // Now try to capture the screenshot
        chrome.tabs.captureVisibleTab(tab.id, { format: 'png' }, (url) => {
          if (chrome.runtime.lastError) {
            console.error(':: Background: Screenshot error:', chrome.runtime.lastError);
            sendLogToDebug(`Screenshot error: ${chrome.runtime.lastError.message}`, 'error');
            reject(chrome.runtime.lastError);
          } else if (!url) {
            console.error(':: Background: Screenshot returned null URL');
            sendLogToDebug('Screenshot returned null URL', 'error');
            reject(new Error('Screenshot returned null URL'));
          } else {
            console.log(':: Background: Screenshot captured successfully');
            sendLogToDebug('Screenshot captured successfully', 'success');
            resolve(url);
          }
        });
      });
    });

    if (!screenshotUrl) {
      sendLogToDebug('Failed to capture screenshot - URL is null', 'error');
      throw new Error('Failed to capture screenshot - URL is null');
    }

    // Process screenshot
    console.log(':: Background: Processing screenshot');
    sendLogToDebug('Processing screenshot');
    sendStepUpdate('Processing screenshot');
    const response = await fetch(screenshotUrl);
    if (!response.ok) {
      sendLogToDebug(`Failed to fetch screenshot: ${response.status} ${response.statusText}`, 'error');
      throw new Error(`Failed to fetch screenshot: ${response.status} ${response.statusText}`);
    }
    const screenshotBlob = await response.blob();
    console.log(':: Background: Screenshot blob created, size:', screenshotBlob.size);
    sendLogToDebug(`Screenshot blob created, size: ${screenshotBlob.size} bytes`);
    
    if (screenshotBlob.size === 0) {
      sendLogToDebug('Screenshot blob is empty', 'error');
      throw new Error('Screenshot blob is empty');
    }
    
    const imageData = await createImageBitmap(screenshotBlob);
    console.log(':: Background: Image bitmap created');
    sendLogToDebug('Image bitmap created');
    
    const timestampedBlob = await addTimestampToScreenshot(imageData);
    console.log(':: Background: Timestamp added to screenshot');
    sendLogToDebug('Timestamp added to screenshot');
    
    // Create and download document
    console.log(':: Background: Creating document');
    sendLogToDebug('Creating document');
    sendStepUpdate('Creating document');
    const docBlob = await createWordDocument(timestampedBlob, asn);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    console.log(':: Background: Downloading document');
    sendLogToDebug('Downloading document');
    sendStepUpdate('Downloading document');
    await new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: URL.createObjectURL(docBlob),
        filename: `evidence-${asn}-${timestamp}.html`,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error(':: Background: Download error:', chrome.runtime.lastError);
          sendLogToDebug(`Download error: ${chrome.runtime.lastError.message}`, 'error');
          reject(chrome.runtime.lastError);
        } else {
          console.log(':: Background: Download started with ID:', downloadId);
          sendLogToDebug(`Download started with ID: ${downloadId}`, 'success');
          resolve(downloadId);
        }
      });
    });

    console.log(':: Background: ASN processing completed successfully');
    sendLogToDebug('ASN processing completed successfully', 'success');
    return true;
  } catch (error) {
    console.error(':: Background: Error processing ASN:', error);
    sendLogToDebug(`Error processing ASN: ${error.message}`, 'error');
    throw error;
  } finally {
    // Close the tab if it exists
    if (tab && tab.id) {
      try {
        console.log(`:: Background: Closing tab ${tab.id}`);
        sendLogToDebug(`Closing tab ${tab.id}`);
        await chrome.tabs.remove(tab.id);
      } catch (e) {
        console.error(':: Background: Error closing tab:', e);
        sendLogToDebug(`Error closing tab: ${e.message}`, 'error');
      }
    }
  }
}

// Function to process next ASN
async function processNextASN() {
  console.log(':: Background: Starting to process next ASN');
  const data = await chrome.storage.local.get(['pendingASNs', 'currentASNIndex', 'totalASNs']);
  const { pendingASNs, currentASNIndex, totalASNs } = data;
  
  if (currentASNIndex >= totalASNs) {
    console.log(':: Background: All ASNs processed');
    sendLogToDebug('All ASNs processed', 'success');
    sendStepUpdate('All ASNs processed');
    return;
  }

  try {
    const asn = pendingASNs[currentASNIndex];
    console.log(`:: Background: Processing ASN ${currentASNIndex + 1}/${totalASNs}: ${asn}`);
    sendLogToDebug(`Processing ASN ${currentASNIndex + 1}/${totalASNs}: ${asn}`);
    sendProgressUpdate(currentASNIndex + 1, totalASNs);
    
    await processASN(asn);
    
    // Update index and process next ASN
    await chrome.storage.local.set({ currentASNIndex: currentASNIndex + 1 });
    processNextASN();
  } catch (error) {
    console.error(':: Background: Error in processNextASN:', error);
    sendLogToDebug(`Error in processNextASN: ${error.message}`, 'error');
  }
}

// Listen for messages from debug page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(':: Background: Received message:', request);
  
  if (request.action === 'startProcessing') {
    console.log(':: Background: Starting ASN processing');
    processNextASN().then(() => {
      console.log(':: Background: Processing completed successfully');
      sendResponse({ success: true });
    }).catch((error) => {
      console.error(':: Background: Processing failed:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the message channel open for async response
  }
}); 