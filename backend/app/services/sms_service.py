from twilio.rest import Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def format_phone_number(phone: str) -> str:
    """Format phone number for Twilio (supports Ethiopian +251)."""
    phone = phone.strip()
    if phone.startswith("+"):
        return phone  # already international format
    if phone.startswith("0"):
        return "+251" + phone[1:]  # Ethiopian local format
    return "+251" + phone  # no prefix, assume Ethiopian

def send_otp_sms(phone_number: str, otp: str):
    """
    Sends an OTP SMS using Twilio.
    Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER
    to your Render environment variables dashboard before deploying.
    """
    try:
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            logger.warning("Twilio credentials not configured. Skipping SMS.")
            return

        print(f"[SMS] Formatting number: {phone_number}")
        formatted_number = format_phone_number(phone_number)
        
        print(f"[SMS] Sending OTP to: {formatted_number}")
        logger.info(f"Initiating Twilio SMS to {formatted_number}")
        
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            body=f"Your Delta Labs admin verification code is: {otp}. It expires in 5 minutes.",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=formatted_number
        )
        
        print(f"[SMS] OTP sent successfully to: {formatted_number}")
        logger.info(f"OTP SMS sent to {formatted_number}. SID: {message.sid}")
    except Exception as e:
        print(f"[SMS] Twilio error: {str(e)}")
        logger.error(f"Failed to send OTP SMS: {str(e)}")
        # Raise exception as per requirement
        raise Exception(f"Failed to send SMS: {str(e)}")
