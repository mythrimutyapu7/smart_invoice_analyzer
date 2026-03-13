# Smart Invoice Analyzer

This project provides a backend API for ingesting invoices (via OCR + extraction) and a lightweight **single-page dashboard** to view, edit, and analyze invoice spending.

## 🧰 What’s included

- **Backend (Node/Express)**
  - OCR invoice extraction (`/upload`)
  - CRUD invoice API (`/api/invoices`)
  - Summary endpoints for charts (`/api/invoices/summary`)
  - Serves a frontend dashboard from `Frontend/`

- **Frontend (React + Vite)**
  - Multi-page app: Home, Sign In, Sign Up, Dashboard, Invoices, Upload
  - Editable invoice table with sorting + pagination
  - Drag & drop invoice upload (PDF/image) with OCR extraction
  - Expense summary cards
  - Category and monthly charts (Chart.js)

## 🚀 Running the project

### Backend (API + serves frontend)

1. Navigate to the backend folder:

```bash
cd smart_invoice_analyzer/Backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your MongoDB connection string:

```ini
MONGO_URI=mongodb://localhost:27017/invoices
```

4. (Optional) Build the frontend (recommended for production):

```bash
cd ../Frontend
npm install
npm run build
cd ../Backend
```

5. Start the server:

```bash
npm start
```

6. Open the dashboard in your browser:

```text
http://localhost:4000/
```

### Frontend (React dev server)

If you want to work on the frontend with hot reload, run the Vite dev server:

```bash
cd smart_invoice_analyzer/Frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173/
```

## 🧠 API overview

- `GET /api/invoices` — list invoices (supports filtering, sorting, pagination)
- `POST /api/invoices` — create a new invoice
- `PUT /api/invoices/:id` — update an invoice
- `DELETE /api/invoices/:id` — delete an invoice
- `GET /api/invoices/summary` — aggregated category + monthly totals
- `POST /upload` — upload PDF/image invoice for OCR + field extraction

## 🧩 Notes

- The dashboard is served directly from the `Frontend/` folder.
- Uploaded invoices are stored in `Backend/uploads/` (this folder is empty by default).
- If you want a more full-featured frontend (React/Vite/etc), you can replace the `Frontend/` directory with your preferred setup.
