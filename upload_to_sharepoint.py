#!/usr/bin/env python3
"""
Simple SharePoint Document Uploader

Just one function: upload_document(file_path)
"""

import os
from office365.runtime.auth.client_credential import ClientCredential
from office365.sharepoint.client_context import ClientContext

def upload_document(file_path):
    """
    Upload a document to SharePoint and return the link
    
    Args:
        file_path (str): Path to the document file
    
    Returns:
        str: SharePoint URL of uploaded file, or None if failed
        
    Setup required:
    Set these environment variables:
    - SHAREPOINT_URL=https://yourcompany.sharepoint.com/sites/yoursite
    - SHAREPOINT_FOLDER=/Shared Documents/ASN Reports
    - SHAREPOINT_CLIENT_ID=your-client-id
    - SHAREPOINT_CLIENT_SECRET=your-client-secret
    """
    
    # Get configuration from environment variables
    sharepoint_url = os.getenv('SHAREPOINT_URL')
    sharepoint_folder = os.getenv('SHAREPOINT_FOLDER') 
    client_id = os.getenv('SHAREPOINT_CLIENT_ID')
    client_secret = os.getenv('SHAREPOINT_CLIENT_SECRET')
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return None
    
    # Check if environment variables are set
    if not all([sharepoint_url, sharepoint_folder, client_id, client_secret]):
        print("❌ Missing environment variables. Set:")
        print("   SHAREPOINT_URL, SHAREPOINT_FOLDER, SHAREPOINT_CLIENT_ID, SHAREPOINT_CLIENT_SECRET")
        return None
    
    try:
        print(f"📤 Uploading {os.path.basename(file_path)} to SharePoint...")
        
        # Authenticate with SharePoint using App Registration
        credentials = ClientCredential(client_id, client_secret)
        ctx = ClientContext(sharepoint_url).with_credentials(credentials)
        
        # Get target folder
        target_folder = ctx.web.get_folder_by_server_relative_url(sharepoint_folder)
        
        # Upload file
        with open(file_path, 'rb') as file_content:
            file_name = os.path.basename(file_path)
            target_folder.upload_file(file_name, file_content)
            ctx.execute_query()
        
        # Create SharePoint URL
        base_url = sharepoint_url.rstrip('/') if sharepoint_url else ''
        folder_path = sharepoint_folder.rstrip('/') if sharepoint_folder else ''
        file_url = f"{base_url}{folder_path}/{file_name}"
        
        print(f"✅ Upload successful!")
        print(f"🔗 SharePoint URL: {file_url}")
        
        return file_url
        
    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        return None

# Example usage
if __name__ == "__main__":
    # Example: Upload a document
    document_path = "./ASN_Evidence_20241201_143022/ASN123_Evidence_Report.docx"
    
    sharepoint_link = upload_document(document_path)
    
    if sharepoint_link:
        print(f"Document available at: {sharepoint_link}")
    else:
        print("Upload failed!") 