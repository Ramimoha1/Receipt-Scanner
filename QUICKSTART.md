# Quick Start Checklist

## Pre-Flight (5 minutes)

- [ ] Java 21+ installed (`java -version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 15+ running (`psql --version`)
- [ ] Git installed (`git --version`)

## Setup (5 minutes)

- [ ] Clone repository: `git clone <url> && cd tp`
- [ ] Copy config: `cp .env.example .env`
- [ ] Get Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- [ ] Edit `.env` with your credentials:
  ```
  GEMINI_API_KEY=your_key_here
  SPRING_DATASOURCE_USERNAME=postgres
  SPRING_DATASOURCE_PASSWORD=your_password
  ```
- [ ] Create database: `psql -U postgres -c "CREATE DATABASE receipt_scanner_db;"`

## Launch (1 minute)

### Terminal 1 - Backend
```bash
cd back-end
mvn spring-boot:run
# Wait for "Tomcat started on port 8080"
```

### Terminal 2 - Frontend
```bash
cd front-end
npm install
npm run dev
# Wait for "Local: http://localhost:5173"
```

### Browser
- Open [http://localhost:5173](http://localhost:5173)
- Start uploading receipts! 📸

## Test It Works

1. Upload a receipt image
2. Click "Prefill with AI" button
3. See fields auto-fill with extracted data
4. Click "CONFIRM & SAVE"
5. Check History tab for saved receipt

## Stuck?

| Error | Quick Fix |
|-------|-----------|
| `ERROR: Java 21 not found` | Install Java from oracle.com/java |
| `Cannot find module '@react'` | Run `npm install` in `front-end/` |
| `Connection refused (localhost:5432)` | Start PostgreSQL service |
| `Invalid GEMINI_API_KEY` | Get new key from aistudio.google.com/apikey |
| `Port 8080 in use` | `mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"` |

## Files Reference

- **README.md** - Full documentation & architecture
- **SETUP.md** - Detailed setup walkthrough  
- **.env.example** - Environment variables template
- **setup-windows.bat** - Windows automated setup
- **setup-unix.sh** - Linux/Mac automated setup

---

**Your project is ready to share!** 🚀
