#!/usr/bin/env python3
"""
Environment Setup Script for ASN Evidence Collector with SharePoint Integration

This script helps you securely set up environment variables for SharePoint authentication
and email configuration without hardcoding sensitive information.
"""

import os
from dotenv import load_dotenv
import getpass

def create_env_file():
    """Interactive setup to create .env file"""
    print("🔧 SharePoint Authentication Setup")
    print("="*50)
    print("This will help you create a secure .env configuration file.")
    print("Choose your authentication method:\n")
    
    print("1. App Registration (RECOMMENDED - No password needed)")
    print("2. User Authentication (Less secure - requires password)")
    print()
    
    choice = input("Enter your choice (1 or 2): ").strip()
    
    env_content = []
    
    if choice == "1":
        print("\n📋 App Registration Setup")
        print("You'll need these from Azure AD App Registration:")
        
        sharepoint_url = input("SharePoint Site URL (e.g., https://company.sharepoint.com/sites/yoursite): ").strip()
        sharepoint_folder = input("SharePoint Folder Path (e.g., /Shared Documents/ASN Reports): ").strip()
        client_id = input("Application (Client) ID: ").strip()
        client_secret = getpass.getpass("Client Secret (hidden input): ").strip()
        tenant_id = input("Directory (Tenant) ID: ").strip()
        
        env_content.extend([
            "# SharePoint App Registration Authentication (Secure)",
            "SHAREPOINT_AUTH_TYPE=app",
            f"SHAREPOINT_URL={sharepoint_url}",
            f"SHAREPOINT_FOLDER={sharepoint_folder}",
            f"SHAREPOINT_CLIENT_ID={client_id}",
            f"SHAREPOINT_CLIENT_SECRET={client_secret}",
            f"SHAREPOINT_TENANT_ID={tenant_id}",
            ""
        ])
        
    elif choice == "2":
        print("\n⚠️  User Authentication Setup (Less Secure)")
        
        sharepoint_url = input("SharePoint Site URL: ").strip()
        sharepoint_folder = input("SharePoint Folder Path: ").strip()
        username = input("SharePoint Username/Email: ").strip()
        password = getpass.getpass("SharePoint Password (hidden input): ").strip()
        
        env_content.extend([
            "# SharePoint User Authentication (Less Secure)",
            "SHAREPOINT_AUTH_TYPE=user",
            f"SHAREPOINT_URL={sharepoint_url}",
            f"SHAREPOINT_FOLDER={sharepoint_folder}",
            f"SHAREPOINT_USERNAME={username}",
            f"SHAREPOINT_PASSWORD={password}",
            ""
        ])
    else:
        print("❌ Invalid choice. Exiting...")
        return False
    
    # Email configuration
    print("\n📧 Email Configuration (Optional)")
    setup_email = input("Do you want to set up email notifications? (y/n): ").lower().strip()
    
    if setup_email in ['y', 'yes']:
        print("\nChoose email provider:")
        print("1. Gmail (recommended)")
        print("2. Outlook/Hotmail")
        print("3. Custom SMTP")
        
        email_choice = input("Enter choice (1, 2, or 3): ").strip()
        
        if email_choice == "1":
            email_address = input("Gmail address: ").strip()
            app_password = getpass.getpass("Gmail App Password (hidden input): ").strip()
            recipients = input("Recipients (comma-separated): ").strip()
            
            env_content.extend([
                "# Gmail Configuration",
                "EMAIL_SMTP_SERVER=smtp.gmail.com",
                "EMAIL_SMTP_PORT=587",
                f"EMAIL_USERNAME={email_address}",
                f"EMAIL_PASSWORD={app_password}",
                f"EMAIL_RECIPIENTS={recipients}",
                ""
            ])
            
        elif email_choice == "2":
            email_address = input("Outlook/Hotmail address: ").strip()
            password = getpass.getpass("Email password (hidden input): ").strip()
            recipients = input("Recipients (comma-separated): ").strip()
            
            env_content.extend([
                "# Outlook Configuration",
                "EMAIL_SMTP_SERVER=smtp-mail.outlook.com",
                "EMAIL_SMTP_PORT=587",
                f"EMAIL_USERNAME={email_address}",
                f"EMAIL_PASSWORD={password}",
                f"EMAIL_RECIPIENTS={recipients}",
                ""
            ])
            
        elif email_choice == "3":
            smtp_server = input("SMTP Server: ").strip()
            smtp_port = input("SMTP Port (usually 587): ").strip()
            email_username = input("Email username: ").strip()
            email_password = getpass.getpass("Email password (hidden input): ").strip()
            recipients = input("Recipients (comma-separated): ").strip()
            
            env_content.extend([
                "# Custom SMTP Configuration",
                f"EMAIL_SMTP_SERVER={smtp_server}",
                f"EMAIL_SMTP_PORT={smtp_port}",
                f"EMAIL_USERNAME={email_username}",
                f"EMAIL_PASSWORD={email_password}",
                f"EMAIL_RECIPIENTS={recipients}",
                ""
            ])
    
    # Write .env file
    try:
        with open('.env', 'w') as f:
            f.write('\n'.join(env_content))
        
        print("\n✅ .env file created successfully!")
        print("🔒 Important: .env file contains sensitive information")
        print("📝 Make sure .env is added to your .gitignore file")
        
        # Create .gitignore if it doesn't exist
        if not os.path.exists('.gitignore'):
            with open('.gitignore', 'w') as f:
                f.write(".env\n*.env\nsecrets/\n__pycache__/\n*.pyc\n")
            print("📁 Created .gitignore file to protect sensitive data")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False

def validate_environment():
    """Validate that all required environment variables are set"""
    load_dotenv()
    
    print("\n🔍 Validating Environment Configuration")
    print("="*40)
    
    # Check SharePoint configuration
    sharepoint_url = os.getenv('SHAREPOINT_URL')
    sharepoint_folder = os.getenv('SHAREPOINT_FOLDER')
    auth_type = os.getenv('SHAREPOINT_AUTH_TYPE', 'user')
    
    issues = []
    
    if not sharepoint_url:
        issues.append("SHAREPOINT_URL is not set")
    elif not sharepoint_url.startswith('https://'):
        issues.append("SHAREPOINT_URL should start with 'https://'")
    
    if not sharepoint_folder:
        issues.append("SHAREPOINT_FOLDER is not set")
    elif not sharepoint_folder.startswith('/'):
        issues.append("SHAREPOINT_FOLDER should start with '/'")
    
    if auth_type == 'app':
        required_app_vars = ['SHAREPOINT_CLIENT_ID', 'SHAREPOINT_CLIENT_SECRET', 'SHAREPOINT_TENANT_ID']
        for var in required_app_vars:
            if not os.getenv(var):
                issues.append(f"{var} is not set")
    
    elif auth_type == 'user':
        required_user_vars = ['SHAREPOINT_USERNAME', 'SHAREPOINT_PASSWORD']
        for var in required_user_vars:
            if not os.getenv(var):
                issues.append(f"{var} is not set")
    
    # Check email configuration (optional)
    email_server = os.getenv('EMAIL_SMTP_SERVER')
    if email_server:
        email_vars = ['EMAIL_SMTP_PORT', 'EMAIL_USERNAME', 'EMAIL_PASSWORD', 'EMAIL_RECIPIENTS']
        for var in email_vars:
            if not os.getenv(var):
                issues.append(f"{var} is not set (required if EMAIL_SMTP_SERVER is set)")
    
    if issues:
        print("❌ Configuration Issues Found:")
        for issue in issues:
            print(f"   • {issue}")
        return False
    else:
        print("✅ All required environment variables are properly configured!")
        print(f"📁 SharePoint URL: {sharepoint_url}")
        print(f"📁 SharePoint Folder: {sharepoint_folder}")
        print(f"🔐 Authentication Type: {auth_type}")
        if email_server:
            print(f"📧 Email Server: {email_server}")
        return True

def test_sharepoint_connection():
    """Test SharePoint connection with current configuration"""
    print("\n🧪 Testing SharePoint Connection")
    print("="*35)
    
    try:
        from sharepoint_email_utils import get_credentials_from_env
        
        config = get_credentials_from_env()
        if config is None:
            print("❌ Could not load SharePoint configuration")
            return False
        
        print(f"✅ Configuration loaded successfully")
        print(f"   URL: {config['url']}")
        print(f"   Folder: {config['folder']}")
        print(f"   Auth Type: {config['auth_type']}")
        
        # Note: Actual connection test would require the Office365 library to be properly installed
        print("ℹ️  Connection test requires Office365-REST-Python-Client to be installed")
        print("   Run: pip install -r requirements.txt")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing configuration: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 ASN Evidence Collector - SharePoint Setup")
    print("="*50)
    print()
    
    if os.path.exists('.env'):
        print("📁 .env file already exists")
        choice = input("Do you want to recreate it? (y/n): ").lower().strip()
        if choice not in ['y', 'yes']:
            print("Using existing .env file...")
        else:
            create_env_file()
    else:
        create_env_file()
    
    print()
    validate_environment()
    
    print()
    test_sharepoint_connection()
    
    print("\n🎯 Next Steps:")
    print("1. Run: pip install -r requirements.txt")
    print("2. Test your configuration with: python sharepoint_email_utils.py")
    print("3. Run your ASN evidence collector with SharePoint integration")
    print("\n📖 For detailed setup instructions, see: sharepoint_auth_guide.md")

if __name__ == "__main__":
    main() 