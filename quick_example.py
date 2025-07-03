"""
Quick Example: Using the simple SharePoint uploader with ASN Evidence Collector

Set these environment variables first:
export SHAREPOINT_URL="https://yourcompany.sharepoint.com/sites/yoursite"
export SHAREPOINT_FOLDER="/Shared Documents/ASN Reports"  
export SHAREPOINT_CLIENT_ID="your-client-id"
export SHAREPOINT_CLIENT_SECRET="your-client-secret"
"""

import os
from upload_to_sharepoint import upload_document

def upload_asn_reports():
    """Example: Upload all ASN reports in a directory"""
    
    # Find the latest ASN evidence directory
    evidence_dirs = [d for d in os.listdir('.') if d.startswith('ASN_Evidence_')]
    if not evidence_dirs:
        print("❌ No ASN evidence directories found")
        return
    
    latest_dir = max(evidence_dirs)
    print(f"📁 Found evidence directory: {latest_dir}")
    
    # Upload all .docx files
    uploaded_links = []
    for file in os.listdir(latest_dir):
        if file.endswith('.docx'):
            file_path = os.path.join(latest_dir, file)
            sharepoint_link = upload_document(file_path)
            
            if sharepoint_link:
                uploaded_links.append({
                    'file': file,
                    'link': sharepoint_link
                })
    
    # Print summary
    print(f"\n🎯 Upload Summary:")
    print(f"📊 Total files uploaded: {len(uploaded_links)}")
    
    if uploaded_links:
        print(f"\n📋 SharePoint Links:")
        for item in uploaded_links:
            print(f"  • {item['file']}")
            print(f"    {item['link']}")
    
    return uploaded_links

if __name__ == "__main__":
    # Simple usage examples
    
    print("Example 1: Upload single document")
    single_file = "./ASN_Evidence_20241201_143022/ASN123_Evidence_Report.docx"
    link = upload_document(single_file)
    
    print("\nExample 2: Upload all ASN reports")
    upload_asn_reports() 