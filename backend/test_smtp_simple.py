import smtplib
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS") or os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))

def test_smtp_connection():
    print("--- SMTP CONNECTION TEST ---")
    print(f"EMAIL_USER: {EMAIL_USER}")
    print(f"SMTP_SERVER: {SMTP_SERVER}")
    print(f"SMTP_PORT: {SMTP_PORT}")
    print(f"PASSWORD SET: {'Yes' if EMAIL_PASS else 'No'}")
    
    if not EMAIL_USER or not EMAIL_PASS:
        print("\nERROR: EMAIL_USER or EMAIL_PASSWORD not found in .env")
        return

    if "your_email" in EMAIL_USER or "your_gmail_app_password" in EMAIL_PASS:
        print("\nERROR: You are still using placeholder values in .env")
        print("Please update your .env file with real credentials.")
        return

    try:
        print(f"\nConnecting to {SMTP_SERVER}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.set_debuglevel(1)
        server.starttls()
        
        print(f"Logging in as {EMAIL_USER}...")
        server.login(EMAIL_USER, EMAIL_PASS)
        
        print("\n✅ SUCCESS: SMTP Login successful!")
        server.quit()
    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        print("\nCommon issues:")
        print("1. Incorrect Gmail App Password (not your normal password)")
        print("2. 2-Step Verification not enabled on Google Account")
        print("3. Firewall/Network blocking port 587")

if __name__ == "__main__":
    test_smtp_connection()
