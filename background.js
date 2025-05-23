// Log when background script starts
sendLogToDebug(':: Background: Service Worker Started');

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'debug.html' });
});

// Function to add timestamp to screenshot
async function addTimestampToScreenshot(imageData) {
  sendLogToDebug(':: Background: Adding timestamp to screenshot');
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
    sendLogToDebug(':: Background: Timestamp added successfully');
    return blob;
  } catch (error) {
    console.error(':: Background: Error adding timestamp:', error);
    throw error;
  }
}

// Function to create Word document with screenshot
async function createWordDocument(screenshotBlob, asn) {
  sendLogToDebug(':: Background: Creating document for ASN: ' + asn);
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
    sendLogToDebug(':: Background: Document created successfully');
    return blob;
  } catch (error) {
    console.error(':: Background: Error creating document:', error);
    throw error;
  }
}

// Function to wait for page load
function waitForPageLoad(tabId) {
  return new Promise((resolve) => {
    sendLogToDebug(`:: Background: Waiting for page load on tab ${tabId}`);
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        sendLogToDebug(`:: Background: Page load complete for tab ${tabId}`);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

// Function to wait for network idle
function waitForNetworkIdle(tabId) {
  return new Promise((resolve) => {
    sendLogToDebug(`:: Background: Waiting for network idle on tab ${tabId}`);
    let timer;
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'loading') {
        sendLogToDebug(`:: Background: Tab ${tabId} is loading`);
        clearTimeout(timer);
      } else if (updatedTabId === tabId && changeInfo.status === 'complete') {
        sendLogToDebug(`:: Background: Tab ${tabId} completed loading`);
        clearTimeout(timer);
        timer = setTimeout(() => {
          sendLogToDebug(`:: Background: Network is idle for tab ${tabId}`);
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

// Generic function to open any website
async function openWebsite(url, siteName) {
  sendLogToDebug(`:: Background: Opening ${siteName}`);
  sendLogToDebug(`Opening ${siteName}`);
  sendStepUpdate(`Opening ${siteName}`);
  
  const tab = await chrome.tabs.create({ url: url });
  sendLogToDebug(`:: Background: Tab created with ID: ${tab.id}`);
  sendLogToDebug(`Tab created with ID: ${tab.id}`);
  
  return tab;
}

// Function to create download folder
async function createDownloadFolder() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const folderName = `ASN-Evidence-${timestamp}`;
  sendLogToDebug(`:: Background: Creating download folder: ${folderName}`);
  return folderName;
}

// Function to store screenshot URLs
async function storeScreenshotUrl(folderName, asn, profileName, screenshotUrl) {
  const data = await chrome.storage.local.get(['screenshotUrls']);
  const screenshotUrls = data.screenshotUrls || {};
  if (!screenshotUrls[folderName]) {
    screenshotUrls[folderName] = {};
  }
  if (!screenshotUrls[folderName][asn]) {
    screenshotUrls[folderName][asn] = {};
  }
  screenshotUrls[folderName][asn][profileName] = screenshotUrl;
  await chrome.storage.local.set({ screenshotUrls });
}

// Generic function to capture and save screenshot
async function captureAndSaveScreenshot(prefix = 'screenshot', folderName) {
  sendLogToDebug(':: Background: Attempting to capture screenshot...');
  sendLogToDebug('Taking screenshot');
  sendStepUpdate('Capturing screenshot');
  
  const screenshot = await chrome.tabs.captureVisibleTab();
  sendLogToDebug('Screenshot captured successfully');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${folderName}/${prefix}-${timestamp}.png`;
  
  sendLogToDebug(':: Background: Initiating screenshot download...');
  await chrome.downloads.download({
    url: screenshot,
    filename: filename,
    saveAs: false
  });
  sendLogToDebug(':: Background: Screenshot download initiated');
  
  return screenshot; // Return the screenshot URL
}

// Function to process a single ASN
async function processASN(webName, url, asn, folderName) {
  sendLogToDebug(`:: Background: Starting to process ASN: ${asn}`);
  sendLogToDebug(`Starting to process ASN: ${asn}`);
  let tab = null;
  
  try {
    // Open GitHub profile
    tab = await openWebsite(url, webName);
    
    // Wait for the page to load
    sendLogToDebug(':: Background: Waiting for initial page load');
    sendLogToDebug('Waiting for initial page load');
    sendStepUpdate('Waiting for GitHub to load');
    await waitForPageLoad(tab.id);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capture and save screenshot
    const screenshotUrl = await captureAndSaveScreenshot(asn+"-"+webName, folderName);
    await storeScreenshotUrl(folderName, asn, webName, screenshotUrl);

    sendLogToDebug(':: Background: ASN processing completed successfully');
    sendLogToDebug('ASN processing completed successfully', 'success');
    return true;
  } catch (error) {
    console.error(':: Background: Error processing ASN:', error);
    sendLogToDebug(`Error processing ASN: ${error.message}`, 'error');
    throw error;
  } finally {
    if (tab) {
      try {
        await chrome.tabs.remove(tab.id);
      } catch (error) {
        sendLogToDebug(`Error closing tab: ${error.message}`, 'error');
      }
    }
  }
}

// Function to create Word document with all screenshots
async function createSummaryDocument(folderName, asns) {
  sendLogToDebug(':: Background: Creating summary document');
  try {
    // Get stored screenshot URLs
    const data = await chrome.storage.local.get(['screenshotUrls']);
    const screenshotUrls = data.screenshotUrls?.[folderName] || {};

    // Create sections for each ASN
    const asnSections = asns.map(asn => {
      const asnData = screenshotUrls[asn] || {};
      return `
        <div class="asn-section">
          <h2 class="asn-title">ASN: ${asn}</h2>
          <div class="screenshot-title">GitHub Profile 1</div>
          <img class="screenshot" src="${asnData['GitHub Profile 1'] || ''}" alt="GitHub Profile 1">
          <div class="screenshot-title">GitHub Profile 2</div>
          <img class="screenshot" src="${asnData['GitHub Profile 2'] || ''}" alt="GitHub Profile 2">
        </div>
      `;
    }).join('');

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ASN Evidence Summary</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .header { margin-bottom: 30px; }
          .timestamp { color: #666; margin-bottom: 20px; }
          .asn-section { margin-bottom: 40px; page-break-after: always; }
          .asn-title { font-size: 24px; color: #333; margin-bottom: 20px; }
          .screenshot { max-width: 100%; margin-bottom: 20px; }
          .screenshot-title { font-size: 18px; color: #444; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ASN Evidence Summary</h1>
          <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
        </div>
        ${asnSections}
      </body>
      </html>
    `;

    // Create Word document content
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="UTF-8">
        <title>ASN Evidence Summary</title>
        <style>
          @page { size: 8.5in 11in; margin: 1in; }
          body { font-family: Arial, sans-serif; }
          .header { margin-bottom: 30px; }
          .timestamp { color: #666; margin-bottom: 20px; }
          .asn-section { margin-bottom: 40px; page-break-after: always; }
          .asn-title { font-size: 24px; color: #333; margin-bottom: 20px; }
          .screenshot { max-width: 100%; margin-bottom: 20px; }
          .screenshot-title { font-size: 18px; color: #444; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ASN Evidence Summary</h1>
          <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
        </div>
        ${asnSections}
      </body>
      </html>
    `;

    // Save HTML version
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const htmlBlobUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(htmlBlob);
    });
    
    await chrome.downloads.download({
      url: htmlBlobUrl,
      filename: `${folderName}/ASN-Evidence-Summary.html`,
      saveAs: false
    });

    // Save Word version
    const wordBlob = new Blob([wordContent], { type: 'application/msword' });
    const wordBlobUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(wordBlob);
    });
    
    await chrome.downloads.download({
      url: wordBlobUrl,
      filename: `${folderName}/ASN-Evidence-Summary.doc`,
      saveAs: false
    });
    
    // Clean up stored URLs
    const updatedScreenshotUrls = data.screenshotUrls || {};
    delete updatedScreenshotUrls[folderName];
    await chrome.storage.local.set({ screenshotUrls: updatedScreenshotUrls });
    
    sendLogToDebug(':: Background: Summary documents created successfully');
    return true;
  } catch (error) {
    console.error(':: Background: Error creating summary documents:', error);
    sendLogToDebug(`Error creating summary documents: ${error.message}`, 'error');
    throw error;
  }
}

// Function to process next ASN
async function processNextASN() {
  sendLogToDebug(':: Background: Starting to process next ASN');
  const data = await chrome.storage.local.get(['pendingASNs', 'currentASNIndex', 'totalASNs', 'downloadFolder']);
  const { pendingASNs, currentASNIndex, totalASNs, downloadFolder } = data;
  
  if (currentASNIndex >= totalASNs) {
    sendLogToDebug(':: Background: All ASNs processed');
    sendLogToDebug('All ASNs processed', 'success');
    sendStepUpdate('Creating summary document');
    
    try {
      // Create summary document with all screenshots
      await createSummaryDocument(downloadFolder, pendingASNs);
      sendLogToDebug('Summary document created successfully', 'success');
    } catch (error) {
      sendLogToDebug(`Error creating summary document: ${error.message}`, 'error');
    }
    
    sendStepUpdate('All ASNs processed');
    return;
  }

  try {
    const asn = pendingASNs[currentASNIndex];
    sendLogToDebug(`:: Background: Processing ASN ${currentASNIndex + 1}/${totalASNs}: ${asn}`);
    sendLogToDebug(`Processing ASN ${currentASNIndex + 1}/${totalASNs}: ${asn}`);
    sendProgressUpdate(currentASNIndex + 1, totalASNs);
    
    const githubUrl = 'https://github.com/'.concat(asn);
    await processASN('GitHub Profile 1', githubUrl, asn, downloadFolder);
    await processASN('GitHub Profile 2', githubUrl, asn, downloadFolder);
    // Update index and process next ASN
    await chrome.storage.local.set({ currentASNIndex: currentASNIndex + 1 });
    processNextASN();
  } catch (error) {
    console.error(':: Background: Error in processNextASN:', error);
    sendLogToDebug(`Error in processNextASN: ${error.message}`, 'error');
  }
}

// Function to process comma-separated ASNs
async function processASNList(asnList) {
  // Split the comma-separated list and trim whitespace
  const asns = asnList.split(',').map(asn => asn.trim());
  
  // Create download folder
  const folderName = await createDownloadFolder();
  
  // Store the ASNs and reset the index
  await chrome.storage.local.set({
    pendingASNs: asns,
    currentASNIndex: 0,
    totalASNs: asns.length,
    downloadFolder: folderName
  });
  
  // Start processing
  return processNextASN();
}

// Listen for messages from debug page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  sendLogToDebug(':: Background: Received message: ' + JSON.stringify(request));
  
  if (request.action === 'startProcessing') {
    sendLogToDebug(':: Background: Starting ASN processing');
    if (request.asnList) {
      processASNList(request.asnList).then(() => {
        sendLogToDebug(':: Background: Processing completed successfully');
        sendResponse({ success: true });
      }).catch((error) => {
        console.error(':: Background: Processing failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    } else {
      sendResponse({ success: false, error: 'No ASN list provided' });
    }
    return true; // Keep the message channel open for async response
  }
}); 