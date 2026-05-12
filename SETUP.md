# Setup Guide

## System Requirements

- **Java 21+** - [Download](https://www.oracle.com/java/technologies/downloads/#java21)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

## Installation Steps

### Windows Users

1. **Run setup script:**
   ```batch
   setup-windows.bat
   ```

2. **Edit .env file:**
   - Open `.env` in any text editor
   - Add your `GEMINI_API_KEY` from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   - Set PostgreSQL credentials

3. **Start services:**
   
   Terminal 1:
   ```batch
   cd back-end
   mvn spring-boot:run
   ```
   
   Terminal 2:
   ```batch
   cd front-end
   npm install
   npm run dev
   ```

### Mac/Linux Users

1. **Run setup script:**
   ```bash
   chmod +x setup-unix.sh
   ./setup-unix.sh
   ```

2. **Edit .env file:**
   ```bash
   nano .env
   ```
   - Add your `GEMINI_API_KEY`
   - Set PostgreSQL credentials

3. **Start services:**
   
   Terminal 1:
   ```bash
   cd back-end
   mvn spring-boot:run
   ```
   
   Terminal 2:
   ```bash
   cd front-end
   npm install
   npm run dev
   ```

## Database Setup

PostgreSQL automatically creates tables on first backend startup, but you need to create the database:

```bash
# Using psql command line
psql -U postgres -c "CREATE DATABASE receipt_scanner_db;"

# Or using GUI tools like pgAdmin4
```

## Getting Gemini API Key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key and paste into `.env` as `GEMINI_API_KEY`

## Verify Setup

Once running:

- **Backend health**: Visit `http://localhost:8080/api/receipts`
- **Frontend**: Visit `http://localhost:5173`
- **API docs**: Check Console logs for any errors

## Common Issues

### "Java not found"
```bash
# Verify Java installation
java -version

# Should show: Java 21.x.x
```

### "Port 8080 already in use"
```bash
# Use different port
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
```

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
# Verify credentials in .env
# Try connecting directly:
psql -U postgres -h localhost -d receipt_scanner_db
```

### "Gemini API Key invalid"
- Double-check key is correctly copied
- Verify it starts with `sk_`
- Try regenerating key at aistudio.google.com/apikey

## Need Help?

- Check logs in console for error messages
- Verify all `.env` variables are set correctly
- Ensure all prerequisites are installed with correct versions
- Check internet connection for Gemini API calls

---

**Happy scanning!** 📸
