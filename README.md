# ASN Screenshot Generator

This application takes a list of ASN names and a URL, then creates screenshots with timestamps and saves them in individual Word documents.

## Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Install Playwright browsers:
```bash
playwright install
```

## Usage

Run the script with comma-separated ASN names and a URL:

```bash
python asn_screenshot.py "ASN1,ASN2,ASN3" "https://example.com"
```

For example:
```bash
python asn_screenshot.py "AS12345,AS67890" "https://example.com"
```

## Output

The script will:
1. Create a `screenshots` directory containing timestamped screenshots
2. Generate individual Word documents for each ASN (named `{ASN}_report.docx`)
3. Each Word document will contain:
   - ASN name
   - URL
   - Timestamp
   - Screenshot with timestamp overlay

## Notes

- Screenshots are saved in the `screenshots` directory
- Each screenshot includes a timestamp overlay
- Word documents are saved in the current directory
- The script processes ASNs sequentially 