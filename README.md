# ASN Evidence Collector

This Python script automates the process of collecting evidence from GitHub profiles for a list of ASN numbers. It captures screenshots and creates a summary document.

## Features

- Takes comma-separated ASN numbers as input
- Visits GitHub profiles for each ASN
- Captures screenshots of the profiles
- Creates a Word document with all screenshots
- Organizes evidence in timestamped directories
- Includes logging for tracking progress

## Requirements

- Python 3.7 or higher
- Chrome browser installed
- ChromeDriver (compatible with your Chrome version)

## Installation

1. Clone this repository or download the files
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Run the script:
   ```bash
   python asn_evidence.py
   ```

2. When prompted, enter the ASN numbers separated by commas:
   ```
   Enter ASN numbers (comma-separated): octocat,github
   ```

3. The script will:
   - Create a new directory with timestamp
   - Visit each GitHub profile
   - Take screenshots
   - Create a summary Word document
   - Save all evidence in the created directory

## Output

The script creates a directory named `ASN_Evidence_YYYYMMDD_HHMMSS` containing:
- Screenshots for each ASN
- A Word document (`ASN_Evidence_Summary.docx`) with all screenshots
- Log file with execution details

## Notes

- Make sure you have a stable internet connection
- The script includes appropriate waits for page loading
- Screenshots are taken after the page is fully loaded
- The Word document includes timestamps and ASN information 