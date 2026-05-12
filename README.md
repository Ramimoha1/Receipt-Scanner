# Receipt Scanner AI

An AI-powered receipt digitization application that extracts receipt details using Google's Gemini 2.5 Flash API and stores them in PostgreSQL.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Spring Boot 4.0.6 + Java 21
- **Database**: PostgreSQL 17.5
- **AI**: Google Gemini 2.5 Flash API
- **UI**: Tailwind CSS + Lucide React Icons

## Prerequisites

- **Java 21+** (for backend)
- **Node.js 18+** (for frontend)
- **PostgreSQL 15+** (local or remote)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

## Quick Start (3 minutes)

### 1. Clone & Setup

```bash
git clone <repository-url>
cd tp
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
# Copy template
cp .env.example .env

# Edit .env with your credentials
```

### 3. Start Services

**Terminal 1 - Backend:**
```bash
cd back-end
mvn spring-boot:run
# Runs on http://localhost:8080
```

**Terminal 2 - Frontend:**
```bash
cd front-end
npm install
npm run dev
# Runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

## How to Use

1. **Upload Receipt** → Click upload area or drag & drop image
2. **Review Form** → Empty form appears with receipt image
3. **Prefill with AI** → Click "Prefill with AI" button
4. **Loading** → See spinner in button while processing
5. **Edit & Save** → Modify fields if needed, click "CONFIRM & SAVE"
6. **View History** → Switch to "History" tab to see all receipts

## Environment Setup

Create `.env` file in project root:

```env
# Google Gemini API
GEMINI_API_KEY=sk_your_api_key_here

# PostgreSQL Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/receipt_scanner_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
```

**First time setup:**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE receipt_scanner_db;"

# Tables created automatically by Spring Boot on startup
```

## Project Structure

```
tp/
├── README.md
├── .env.example
│
├── back-end/              # Spring Boot + Java 21
│   ├── pom.xml           
│   └── src/main/java/com/recieptScanner/tp/
│       ├── model/Receipt.java          (database entity)
│       ├── controller/GeminiController.java   (AI endpoint)
│       └── service/GeminiService.java        (Gemini integration)
│
├── front-end/             # React + TypeScript
│   ├── package.json
│   ├── src/App.tsx       (main UI)
│   └── src/services/gemini.ts  (API calls)
│
└── docs/
    └── databaseSchema.md
```

## API Endpoints

### Receipts (CRUD)
- `GET /api/receipts` - List all
- `POST /api/receipts` - Create
- `PUT /api/receipts/{id}` - Update
- `DELETE /api/receipts/{id}` - Delete

### AI
- `POST /api/gemini/prefill` - Extract receipt fields from image (returns `merchantName`, `date`, `totalAmount`, `currency`)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Port 8080 in use** | `mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"` |
| **Port 5173 in use** | `npm run dev -- --port 5174` |
| **PostgreSQL won't connect** | Verify server running, check credentials in `.env` |
| **Gemini API 429 error** | Rate limit hit - wait a moment before retrying |
| **Node modules missing** | `cd front-end && npm install` |
| **Maven won't compile** | `mvn clean install` |

## Production Build

**Backend:**
```bash
cd back-end
mvn clean package
java -jar target/tp-0.0.1-SNAPSHOT.jar
```

**Frontend:**
```bash
cd front-end
npm run build
# dist/ ready for deployment
```

## Notes

- Images stored as Base64 in PostgreSQL
- AI prefill is **opt-in** (manual button click, not automatic)
- Rate limited by Gemini API quota
- All receipts stored locally in your database

---

**Created**: May 2026