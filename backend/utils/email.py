import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from pathlib import Path


from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)
# Explicitly load .env from the backend directory


EMAIL_USER = os.getenv("EMAIL_USER")
# Check both EMAIL_PASS and EMAIL_PASSWORD for compatibility
EMAIL_PASS = os.getenv("EMAIL_PASS") or os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))

# --- DEBUG: Verify .env Loading ---
print("--- [DEBUG] SMTP CONFIGURATION ---")
print(f"EMAIL_USER: {EMAIL_USER}")
print(f"EMAIL_PASSWORD EXISTS: {bool(EMAIL_PASS)}")
print(f"EMAIL_PASSWORD LENGTH: {len(EMAIL_PASS)}")
print(f"SMTP_SERVER: {SMTP_SERVER}")
print(f"SMTP_PORT: {SMTP_PORT}")
print("----------------------------------")

async def send_otp_email(email: str, otp: str):
    """
    Send OTP email using SMTP
    """
    print("\n" + "="*50)
    print("📧 [EMAIL] SENDING OTP...")
    print(f"📧 [EMAIL] TO: {email}")
    print(f"📧 [EMAIL] USER: {EMAIL_USER}")
    print("="*50)
    
    if not EMAIL_USER or not EMAIL_PASS:
        error_msg = "EMAIL_USER or EMAIL_PASS not set in .env"
        print(f"❌ [EMAIL] CRITICAL ERROR: {error_msg}")
        raise Exception(error_msg)

    # Check for placeholder values
    if "your_email" in EMAIL_USER or "your_gmail_app_password" in EMAIL_PASS:
        error_msg = "Placeholder values detected in .env. Please update EMAIL_USER and EMAIL_PASSWORD."
        print(f"❌ [EMAIL] ERROR: {error_msg}")
        print("⚠️  Registration blocked until real SMTP credentials are provided.")
        raise Exception(error_msg)

    # Create message
    msg = MIMEMultipart()
    msg['From'] = EMAIL_USER
    msg['To'] = email
    msg['Subject'] = f"{otp} is your Tripsphere Verification Code"

    # HTML body
    body = f"""
    <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h1 style="color: #6B4EFF; margin: 0;">Tripsphere</h1>
                    <p style="color: #8E70FF; font-weight: 600; margin: 5px 0 0 0;">Your Journey Starts Here</p>
                </div>
                
                <h2 style="color: #1F2937; text-align: center; font-size: 24px;">Verify Your Email</h2>
                <p>Hello,</p>
                <p>Thank you for choosing <strong>Tripsphere</strong>! To complete your registration and start exploring, please use the 6-digit verification code below:</p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <div style="display: inline-block; font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #6B4EFF; background: #F5F3FF; padding: 20px 40px; border-radius: 16px; border: 2px solid #8E70FF;">
                        {otp}
                    </div>
                </div>
                
                <p style="text-align: center; color: #6B7280; font-size: 14px;">This code will expire in <strong>5 minutes</strong> for your security.</p>
                
                <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin-top: 30px;">
                    <p style="margin: 0; font-size: 13px; color: #4B5563;">
                        <strong>Security Note:</strong> If you did not request this code, someone may be trying to access your account. Please ignore this email or contact support if you have concerns.
                    </p>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #9CA3AF; text-align: center;">&copy; 2026 Tripsphere. Explore Tamil Nadu like never before.</p>
            </div>
        </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))

    try:
        # Connect to SMTP Server
        print(f"[EMAIL] Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
        server.set_debuglevel(1)  # Detailed SMTP logs
        server.starttls()
        
        print(f"[EMAIL] Logging in as {EMAIL_USER}...")
        server.login(EMAIL_USER, EMAIL_PASS)
        
        print(f"[EMAIL] Sending message to {email}...")
        server.send_message(msg)
        server.quit()
        
        print(f"[EMAIL] SUCCESS: OTP {otp} sent to {email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"SMTP AUTH ERROR: Invalid credentials (535). Check your Gmail App Password. Details: {str(e)}"
        print(f"❌ [EMAIL] {error_msg}")
        raise Exception(error_msg)
    except smtplib.SMTPConnectError as e:
        error_msg = f"SMTP CONNECTION ERROR: Could not connect to {SMTP_SERVER}. Details: {str(e)}"
        print(f"❌ [EMAIL] {error_msg}")
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"UNEXPECTED SMTP ERROR: {type(e).__name__}: {str(e)}"
        print(f"❌ [EMAIL] {error_msg}")
        raise Exception(error_msg)
