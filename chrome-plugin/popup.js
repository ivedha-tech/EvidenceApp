// ICX Navigation functionality
console.log('Extension popup initialized');

document.getElementById('icxBtn').addEventListener('click', async () => {
  console.log('ICX Navigation button clicked');
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Active tab found:', tab.id);
    
    // Execute script to navigate and select items
    console.log('Executing navigation script...');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        console.log('Navigation script started');
        // Helper to simulate a real user click
        function realClick(element) {
          if (!element) {
            console.log('Click failed: element not found');
            return false;
          }
          console.log('Simulating click on element:', element);
          const rect = element.getBoundingClientRect();
          element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: rect.left + 1, clientY: rect.top + 1 }));
          element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: rect.left + 1, clientY: rect.top + 1 }));
          element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: rect.left + 1, clientY: rect.top + 1 }));
          element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.left + 1, clientY: rect.top + 1 }));
          console.log('Click simulation completed');
          return true;
        }

        // Step 1: Click the tab
        console.log('Attempting to click tab...');
        const tabEl = document.evaluate('//*[@id=":r2:"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (tabEl) {
          console.log('Tab element found, clicking...');
          realClick(tabEl);
        } else {
          console.log('Tab element not found');
        }

        // Step 2: Wait and click the dropdown
        console.log('Setting up dropdown click...');
        setTimeout(() => {
          console.log('Attempting to find and click dropdown...');
          let dropdown = document.evaluate('//*[@id=":r7:"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (!dropdown) {
            console.log('Dropdown not found by XPath, trying alternative method...');
            dropdown = Array.from(document.querySelectorAll('button,div')).find(el => el.textContent.includes('items selected'));
          }
          if (dropdown) {
            console.log('Dropdown found, clicking...');
            realClick(dropdown);
          } else {
            console.log('Dropdown element not found');
          }

          // Step 3: Wait for dropdown to open, then click the first visible checkbox
          console.log('Setting up checkbox click...');
          setTimeout(() => {
            console.log('Attempting to find and click checkbox...');
            let checkbox = document.querySelector('div[role="listbox"] input[type="checkbox"]');
            if (!checkbox) {
              console.log('Checkbox not found by selector, trying XPath...');
              checkbox = document.evaluate('//*[@id=":r7:"]/div[2]/div/li[1]/div[1]/span/input', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            }
            if (checkbox) {
              console.log('Checkbox found, clicking...');
              realClick(checkbox);
            } else {
              console.log('Checkbox not found, trying label...');
              let label = document.querySelector('div[role="listbox"] li label, div[role="listbox"] li span');
              if (label) {
                console.log('Label found, clicking...');
                realClick(label);
              } else {
                console.log('No clickable elements found in dropdown');
              }
            }
          }, 1200);
        }, 1500);
      }
    });
    console.log('Navigation script execution completed');

    // Wait for navigation to complete before taking screenshot
    console.log('Setting up screenshot capture...');
    setTimeout(async () => {
      try {
        console.log('Attempting to capture screenshot...');
        const screenshot = await chrome.tabs.captureVisibleTab();
        console.log('Screenshot captured successfully');
        
        // Create a download link
        const link = document.createElement('a');
        const timestamp = new Date().toISOString();
        link.download = `icx-navigation-screenshot-${timestamp}.png`;
        link.href = screenshot;
        
        console.log('Initiating screenshot download...');
        link.click();
        console.log('Screenshot download initiated');
      } catch (error) {
        console.error('Error taking screenshot:', error);
      }
    }, 4000);

  } catch (error) {
    console.error('Error in ICX navigation:', error);
  }
}); 