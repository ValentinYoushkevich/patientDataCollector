# Referral Data Collector

Browser extension (Manifest V3) for Chrome/Edge that collects patient referral fields from EMR pages, allows manual completion, attaches saved provider data, and sends JSON to a configured endpoint.

## Required patient fields

- First Name
- Last Name
- State (2-letter code or full state name)
- Phone Number (US format)
- Email

## Required provider fields

- Clinician first name
- Clinician last name
- Clinician email
- NPI number
- Organization name
- Organization state

## Main flow

1. Parse patient data from the active EMR page (heuristic parser).
2. Review parsed values and fill missing fields:
   - direct edit in popup;
   - field picker from page (crosshair mode).
3. Verify provider settings are complete.
4. Send referral JSON (`patient`, `clinician`, `organization`) to endpoint.
5. See success/error status in popup.

Send is blocked until all required fields are present and valid.

## Quick start

```bash
npm install
npm run dev
```

Build production package:

```bash
npm run build
```

Load extension in browser:

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select `dist`

## Mock site

Run:

```bash
npx serve mock-site -p 3001
```

Pages:

- `http://localhost:3001/patient-full.html` — all required patient fields are filled.
- `http://localhost:3001/patient-partial.html` — some required patient fields are intentionally empty.
- `http://localhost:3001/patient-invalid.html` — required fields present but malformed.

## Notes

- No retry queue is implemented.
- No external NPI lookup/validation is implemented.
- Data is stored only in browser local storage.
