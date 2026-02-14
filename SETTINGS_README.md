# System Settings Configuration

## Overview
The Super Admin Settings panel provides centralized configuration for the entire platform. Settings are stored securely in a dedicated `SystemSettings` table with encryption for sensitive data.

## Environment Variables

### Required
```env
# Database connection
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# NextAuth.js authentication
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Encryption Key (REQUIRED - 32 bytes/256-bit)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="your-32-byte-encryption-key-here"
```

### Encryption Key Generation
```bash
# Generate a secure 32-byte encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Settings Categories

### 🔐 Integrations (Encrypted)
- **Telegram Bot Token**: Global bot token for all schools
  - Format: `bot<token>` or `<number>:<string>`
  - Encrypted storage for security
  - Used for notifications and zoom links

### 🌐 General Settings (Public)
- **Platform Name**: Display name for the platform
- **Platform Description**: Brief description
- **Support Email**: Contact email for users
- **Default Timezone**: Default timezone for new schools
- **Default Currency**: Default currency for new schools

### 🛡️ Security & Limits (Protected)
- **Maintenance Mode**: Restrict access during maintenance
- **Enable Registration**: Allow new school registrations
- **Session Timeout**: User session duration in minutes
- **Max Schools per Admin**: Limit schools per super admin

## Database Schema

### SystemSettings Table
```sql
CREATE TABLE system_settings (
  id VARCHAR(191) PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description VARCHAR(255),
  category VARCHAR(50) DEFAULT 'general',
  isEncrypted BOOLEAN DEFAULT FALSE,
  isPublic BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdById VARCHAR(191),
  updatedById VARCHAR(191)
);
```

## Security Features

### Encryption
- Sensitive settings (telegramBotToken) are encrypted using AES-256-GCM
- Encryption key must be set in environment variables
- Failed decryption returns empty strings safely

### Access Control
- Only super admins can access settings
- All changes are audited with user tracking
- Settings are categorized by sensitivity level

## API Endpoints

### GET /api/super-admin/settings
- Returns all system settings (decrypted for sensitive data)
- Requires super admin authentication

### PUT /api/super-admin/settings
- Updates multiple settings at once
- Handles encryption automatically
- Audits all changes

### POST /api/super-admin/settings/test-bot
- Tests Telegram bot token validity
- Makes API call to Telegram servers
- Returns bot information if valid

## Usage Examples

### Setting Up Telegram Bot
1. Create bot with @BotFather on Telegram
2. Copy the token (format: `bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
3. Paste in Settings → Integrations → Telegram Bot Token
4. Click "Test Token" to verify
5. Save settings

### Configuring Platform Defaults
1. Go to Settings → General Settings
2. Update platform name and description
3. Set default timezone (Africa/Addis_Ababa for Ethiopia)
4. Set default currency (ETB for Ethiopian Birr)
5. Configure support email
6. Save settings

### Security Configuration
1. Enable/disable maintenance mode
2. Control new school registration
3. Set session timeout (default 8 hours)
4. Configure admin limits
5. Save settings

## Migration Notes

### From SuperAdmin.telegramBotToken
The system has been migrated from storing the bot token in the SuperAdmin table to the new SystemSettings table with encryption. Existing tokens will need to be re-entered through the settings panel.

### Database Migration
Run `npx prisma db push` to create the new SystemSettings table. The migration will safely remove the telegramBotToken column from the super_admins table.

## Troubleshooting

### Encryption Key Issues
- Ensure `ENCRYPTION_KEY` is set in environment variables
- Key must be exactly 32 bytes (64 hex characters)
- Regenerate if key appears corrupted

### Token Validation
- Telegram tokens must start with `bot` or follow `<number>:<string>` format
- Test tokens before saving to ensure they're valid
- Invalid tokens will show format errors

### Permission Errors
- Only super admin users can access settings
- Ensure proper authentication is configured
- Check NextAuth.js session validity
