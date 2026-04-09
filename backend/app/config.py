from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str
    DATABASE_NAME: str
    SECRET_KEY: str
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GITHUB_TOKEN: str
    GITHUB_REPO: str
    GITHUB_BRANCH: str = 'main'
    DOCS_FOLDER: str = 'docs-site/docs'
    FRONTEND_URL: str = 'http://localhost:3000'
    VERCEL_DEPLOY_HOOK_URL: str = ''
    # Resend email (for OTP password reset)
    RESEND_API_KEY: str = ''
    FROM_EMAIL: str = 'onboarding@resend.dev'
    
    # Phase 2 — Twilio & Email
    TWILIO_ACCOUNT_SID: str = ''
    TWILIO_AUTH_TOKEN: str = ''
    TWILIO_PHONE_NUMBER: str = ''
    SENDGRID_API_KEY: str = ''
    # Brevo (Sendinblue) — primary email service (HTTP API, works on Render)
    BREVO_API_KEY: str = ''
    BREVO_SENDER_EMAIL: str = ''
    BREVO_SENDER_NAME: str = 'Delta Labs'
    EMAIL_FROM_ADDRESS: str = ''
    SMTP_HOST: str = ''
    SMTP_PORT: int = 587
    SMTP_USER: str = ''
    SMTP_PASSWORD: str = ''
    GOOGLE_SCRIPT_URL: str = ''

    class Config:
        env_file = '.env'
        extra = 'ignore'

settings = Settings()