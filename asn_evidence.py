from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time
import os
from datetime import datetime
from docx import Document
from docx.shared import Inches
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ASNEvidenceCollector:
    def __init__(self):
        self.setup_driver()
        self.create_output_directory()

    def setup_driver(self):
        """Set up the Chrome WebDriver with appropriate options"""
        chrome_options = Options()
        chrome_options.add_argument('--start-maximized')
        chrome_options.add_argument('--disable-notifications')
        
        # Initialize the Chrome WebDriver
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)

    def create_output_directory(self):
        """Create a timestamped directory for storing evidence"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.output_dir = f'ASN_Evidence_{timestamp}'
        os.makedirs(self.output_dir, exist_ok=True)
        logger.info(f'Created output directory: {self.output_dir}')

    def wait_for_page_load(self):
        """Wait for the page to load completely"""
        try:
            self.wait.until(lambda driver: driver.execute_script('return document.readyState') == 'complete')
            time.sleep(2)  # Additional wait for dynamic content
        except TimeoutException:
            logger.warning('Page load timeout')

    def capture_screenshot(self, asn, profile_num):
        """Capture screenshot of the GitHub profile"""
        try:
            self.wait_for_page_load()
            screenshot_path = os.path.join(self.output_dir, f'{asn}_profile_{profile_num}.png')
            self.driver.save_screenshot(screenshot_path)
            logger.info(f'Screenshot saved: {screenshot_path}')
            return screenshot_path
        except Exception as e:
            logger.error(f'Error capturing screenshot: {str(e)}')
            return None

    def process_asn(self, asn):
        """Process a single ASN by visiting its GitHub profile"""
        logger.info(f'Processing ASN: {asn}')
        github_url = f'https://github.com/{asn}'
        
        try:
            self.driver.get(github_url)
            screenshot_path = self.capture_screenshot(asn, 1)
            return screenshot_path
        except Exception as e:
            logger.error(f'Error processing ASN {asn}: {str(e)}')
            return None

    def create_summary_document(self, asn_screenshots):
        """Create a Word document with all screenshots"""
        doc = Document()
        doc.add_heading('ASN Evidence Summary', 0)
        doc.add_paragraph(f'Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')

        for asn, screenshot_path in asn_screenshots.items():
            if screenshot_path and os.path.exists(screenshot_path):
                doc.add_heading(f'ASN: {asn}', level=1)
                doc.add_paragraph('GitHub Profile:')
                doc.add_picture(screenshot_path, width=Inches(6))
                doc.add_page_break()

        summary_path = os.path.join(self.output_dir, 'ASN_Evidence_Summary.docx')
        doc.save(summary_path)
        logger.info(f'Summary document created: {summary_path}')
        return summary_path

    def process_asn_list(self, asn_list):
        """Process a list of ASNs"""
        asn_screenshots = {}
        
        try:
            for asn in asn_list:
                asn = asn.strip()
                if asn:
                    screenshot_path = self.process_asn(asn)
                    asn_screenshots[asn] = screenshot_path

            # Create summary document
            self.create_summary_document(asn_screenshots)
            
        except Exception as e:
            logger.error(f'Error in processing ASN list: {str(e)}')
        finally:
            self.cleanup()

    def cleanup(self):
        """Clean up resources"""
        try:
            self.driver.quit()
            logger.info('WebDriver closed successfully')
        except Exception as e:
            logger.error(f'Error during cleanup: {str(e)}')

def main():
    print("ASN Evidence Collector")
    print("=====================")
    
    # Get ASN list from user
    asn_input = input("Enter ASN numbers (comma-separated): ")
    asn_list = [asn.strip() for asn in asn_input.split(',') if asn.strip()]
    
    if not asn_list:
        print("No valid ASNs provided. Exiting...")
        return
    
    print(f"\nProcessing {len(asn_list)} ASN(s)...")
    
    # Initialize and run the collector
    collector = ASNEvidenceCollector()
    collector.process_asn_list(asn_list)
    
    print("\nProcessing completed!")
    print(f"Evidence has been saved in: {collector.output_dir}")

if __name__ == "__main__":
    main() 