# ASN Evidence Collector

An automated tool for collecting screenshots from multiple web pages for each ASN (Autonomous System Number) and generating comprehensive evidence reports.

## Features

- **Individual Word Documents**: Each ASN gets its own detailed evidence report
- **Multiple Pages per ASN**: Visits multiple URLs per ASN with custom interactions
- **Timestamped Screenshots**: Every screenshot includes a timestamp overlay (white text on red background)
- **Extensible Architecture**: Easy to add new page types and interactions
- **Error Handling**: Robust error handling with detailed logging
- **Summary Reports**: Processing summary with success/failure status

## Installation

1. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

2. **Install Chrome WebDriver**:
   - Download ChromeDriver from [https://chromedriver.chromium.org/](https://chromedriver.chromium.org/)
   - Ensure it matches your Chrome browser version
   - Add ChromeDriver to your system PATH

## Usage

### Basic Usage
```bash
python asn_evidence.py
```

Enter ASN numbers when prompted (comma-separated):
```
Enter ASN numbers (comma-separated): ASN123, ASN456, ASN789
```

### Adding Custom Page Handlers

You can extend the tool by adding custom page handlers:

```python
# Example: Add a LinkedIn page handler
class LinkedInHandler(PageHandler):
    def get_url(self, asn):
        return f'https://linkedin.com/in/{asn}'
    
    def get_page_name(self):
        return 'LinkedIn Profile'
    
    def perform_interactions(self, driver, wait):
        # Custom interactions like clicking buttons, filling forms
        try:
            button = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "some-button")))
            button.click()
            time.sleep(2)
        except:
            pass

# Add to collector
collector = ASNEvidenceCollector()
collector.add_page_handler(LinkedInHandler())
```

## Output

For each ASN, the tool generates:
- **Individual Word Document**: `{ASN}_Evidence_Report.docx`
- **Screenshots**: Timestamped PNG files for each page
- **Summary Table**: Status and URLs for each page visited

## Default Pages Visited

1. **GitHub Profile**: Basic profile information
2. **GitHub Repositories**: Repository list with language filter interaction
3. **GitHub Followers**: Followers/following information

## Timestamp Overlay

Every screenshot automatically includes:
- **Position**: Bottom right corner
- **Format**: YYYY-MM-DD HH:MM:SS
- **Style**: White text on red background
- **Purpose**: Evidence of when screenshot was captured

## Customization

### Adding New Page Types
1. Create a class inheriting from `PageHandler`
2. Implement required methods: `get_url()`, `get_page_name()`, `perform_interactions()`
3. Add to collector using `add_page_handler()`

### Interaction Examples
```python
def perform_interactions(self, driver, wait):
    # Click a button
    button = wait.until(EC.element_to_be_clickable((By.ID, "button-id")))
    button.click()
    
    # Select from dropdown
    dropdown = Select(driver.find_element(By.ID, "dropdown-id"))
    dropdown.select_by_visible_text("Option")
    
    # Fill form field
    input_field = driver.find_element(By.NAME, "field-name")
    input_field.send_keys("search term")
    
    time.sleep(2)  # Wait for changes
```

## Troubleshooting

### Common Issues
1. **ChromeDriver not found**: Ensure ChromeDriver is in PATH
2. **Font errors**: The tool will fallback to default fonts if system fonts aren't found
3. **Page load timeouts**: Increase wait times for slow pages
4. **Rate limiting**: Built-in delays between requests help avoid rate limits

### Logging
All activities are logged with timestamps. Check console output for detailed information about:
- Page processing status
- Screenshot capture success/failure
- Error messages and warnings

## Requirements

- Python 3.7+
- Chrome browser
- ChromeDriver
- Internet connection
- Required Python packages (see requirements.txt) 