# AI Prefill Feature - Complete Testing Guide

## Prerequisites
✓ Backend compiled successfully
✓ Frontend built successfully  
✓ PostgreSQL running
✓ Database schema fixed (see SETUP.md)

## Step-by-Step Test Flow

### Step 1: Fix Database Schema
Before starting the backend, run ONE of these in PostgreSQL:

**Option A - Clean Slate (Recommended for testing):**
```sql
DROP TABLE IF EXISTS receipts;
```

**Option B - Keep existing data:**
```sql
ALTER TABLE receipts DROP COLUMN IF EXISTS raw_ai_response;
ALTER TABLE receipts ALTER COLUMN image_url TYPE TEXT;
```

### Step 2: Start Services

1. **PostgreSQL**: Make sure it's running on `localhost:5432`

2. **Backend**: 
   ```bash
   cd back-end
   mvn spring-boot:run
   ```
   ✅ Wait for: `Started TpApplication in X seconds`

3. **Frontend**:
   ```bash
   cd front-end
   npm run dev
   ```
   ✅ Wait for: Application running at `http://localhost:3000`

### Step 3: Test the Upload Flow

1. Open http://localhost:3000 in your browser

2. **Upload a receipt image**:
   - Drag and drop a receipt image, or click to select
   - Form should appear with **EMPTY** fields (no auto-prefill)
   - "Prefill with AI" button visible below the header

### Step 4: Test the Prefill Button

1. **Click "Prefill with AI"** button:
   - ✅ Button text changes to "Prefilling with AI..."
   - ✅ Spinner icon appears
   - ✅ Button is disabled while loading

2. **Wait for AI response** (2-5 seconds):
   - Check browser Network tab (F12 → Network)
   - Look for POST to `http://localhost:8080/api/gemini/prefill`
   - Request body should have `imageData` (base64) and `mimeType`

### Step 5: Verify Success

**If prefill succeeds:**
- ✅ Button returns to normal state
- ✅ Form fields auto-populate:
  - Merchant Name: e.g., "Starbucks"
  - Transaction Date: e.g., "May 13, 2026"
  - Total Amount: e.g., "25.50"
  - Currency: e.g., "MYR"
- ✅ You can manually edit any field
- ✅ Click "CONFIRM & SAVE" to persist to database

**If prefill fails - Error Message Cases:**

Case 1: Rate Limit (429 error):
- ✅ Red error box: "max rate reached for ai api"
- ✅ Button returns to normal
- ✅ You can manually fill or retry after 1 minute

Case 2: Other failure (500, network error, etc):
- ✅ Red error box: "ai failed"
- ✅ Button returns to normal
- ✅ You can manually fill or retry

### Step 6: Manual Form Fill (Alternative)

If AI prefill fails or you prefer:
1. Click in any field
2. Type or select values manually
3. Click "CONFIRM & SAVE" to persist

### Step 7: View History

1. Click "View History" to see all saved receipts
2. Verify the receipt you just saved appears with correct data
3. Status should show as "PENDING"

## Troubleshooting

### Prefill button doesn't appear
- ❌ Frontend didn't build properly
- ✅ Solution: `cd front-end && npm run build` and check for errors

### Prefill button does nothing (no loading spinner)
- ❌ Browser console might have errors
- ✅ Solution: Open DevTools (F12 → Console) and look for JavaScript errors

### Prefill button loads but always shows error
- ❌ Backend not running or not accessible
- ❌ GEMINI_API_KEY not set
- ✅ Solution: Check backend logs for errors

### "value too long for type character varying(255)" error in backend
- ❌ Database schema not fixed
- ✅ Solution: Run the migration script from Step 1

### Prefill works but fields don't populate
- ❌ Service not merging AI data into form
- ✅ Check browser console for any errors during merge

## Browser DevTools Debugging

Press F12 and:

1. **Console tab**: Look for JavaScript errors
2. **Network tab**: 
   - Filter by "prefill"
   - Click prefill button
   - Should see: `POST /api/gemini/prefill`
   - Response should be JSON with receipt fields or error message
3. **Application tab** → Storage → LocalStorage: Check if draft is saved

## Expected Response Format (Success)

```json
{
  "merchantName": "Starbucks",
  "date": "2026-05-13",
  "totalAmount": 25.50,
  "currency": "MYR",
  "items": [],
  "timestamp": "2026-05-13T03:00:00Z"
}
```

## Expected Response Format (Errors)

**Rate Limit (429):**
```json
{
  "error": "max rate reached for ai api"
}
```

**Other Error (5xx):**
```json
{
  "error": "ai failed"
}
```

## Complete Manual Test Sequence

```
1. Start backend ✓
2. Start frontend ✓
3. Open http://localhost:3000 ✓
4. Upload receipt image ✓
5. Verify form is empty ✓
6. Click "Prefill with AI" ✓
7. See loading spinner ✓
8. Wait for completion ✓
9. Fields populated OR error shown ✓
10. Edit fields if needed ✓
11. Click "CONFIRM & SAVE" ✓
12. Check "View History" ✓
13. Verify receipt appears ✓
```

All tests passing? 🎉 Prefill feature is working!
