

# Live Body Measurement Feature

## Overview
Add a "Live Measurement" button to the Sizes tab. When clicked, a unique QR code appears on screen. Scanning it on a mobile phone opens a camera page where the person stands in front of the camera. The app captures a full-body photo, sends it to an AI model that extracts the body measurements relevant to the selected garment category, and pushes the results back to the desktop session in real-time.

## User Flow

```text
Desktop (Sizes Tab)                        Mobile (via QR scan)
---------------------                      ---------------------
1. Click "Live Measurement"
2. QR code appears with               -->  3. Scan QR, page opens
   session ID embedded                     4. Guide overlay shown
                                            5. User stands, taps "Capture"
                                            6. Photo sent to AI
                                            7. Measurements extracted
8. Results appear in real-time   <--        8. Success confirmation
   on desktop via Realtime
```

## Components to Build

### 1. Database: `body_measurement_sessions` table
- `id` (uuid, primary key)
- `project_id` (text, references project)
- `category` (text -- footwear, jacket, dress, tshirt)
- `status` (text -- pending, processing, completed, failed)
- `measurements` (jsonb -- extracted measurement results)
- `image_url` (text -- base64 or stored image)
- `created_at`, `updated_at`
- RLS: Allow insert/select for authenticated users on their own sessions; allow anonymous update by session ID for the mobile page
- Enable Realtime on this table so the desktop can subscribe to changes

### 2. Public Mobile Page: `/measure/:sessionId`
- New route in App.tsx (public, no auth required)
- New page: `src/pages/BodyMeasure.tsx`
- Features:
  - Camera viewfinder using `navigator.mediaDevices.getUserMedia` (rear camera preferred)
  - Semi-transparent body silhouette overlay as a positioning guide (stand here, arms slightly apart)
  - Category-aware instructions (e.g., "Stand straight, arms slightly away from body" for upper-body garments; "Include full body from head to toe" for dresses)
  - "Capture" button that takes a snapshot from the video stream
  - Photo review screen with "Retake" / "Submit" options
  - Loading state while AI processes
  - Results display showing extracted measurements

### 3. Edge Function: `extract-body-measurements`
- Receives: session ID, base64 image, category
- Uses AI (google/gemini-2.5-pro) with vision to analyze the full-body photo
- Prompt instructs the model to estimate body measurements relevant to the category's measurement definitions (from categoryConfig)
- Returns structured JSON with measurement key-value pairs
- Updates the `body_measurement_sessions` row with results and status = "completed"

### 4. Desktop UI: QR Code + Results Panel (in SizesTab)
- "Live Measurement" button with a body-scan icon
- On click: creates a session row in DB, generates QR code pointing to `/measure/:sessionId`
- QR code rendered using a lightweight inline SVG generator (no extra dependency -- will use a simple QR code generation approach via a small utility or the existing canvas API)
- Subscribes to Realtime changes on the session row
- When measurements arrive:
  - Displays them in a comparison table alongside the garment's required measurements
  - "Apply to Grading" button that uses the body measurements as the base for size grading
  - Size recommendation badge (e.g., "Recommended: L" based on closest match)

### 5. Smart Features
- **Size Recommendation**: Compares extracted body measurements against the category's size chart to recommend the best-fit size
- **Fit Visualization**: Shows which measurements are tight/loose relative to each size
- **Category-Aware Extraction**: Only extracts measurements relevant to the garment type (e.g., foot length for footwear, chest/waist/hip for dresses)
- **Guide Overlay**: The mobile camera shows a translucent human silhouette so the user knows exactly how to position themselves

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/BodyMeasure.tsx` | Mobile camera + capture page (public route) |
| `src/components/project/LiveMeasurementPanel.tsx` | QR code display + results panel for SizesTab |
| `src/lib/qrcode.ts` | Lightweight QR code SVG generator utility |
| `supabase/functions/extract-body-measurements/index.ts` | AI-powered body measurement extraction |

### Files to Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add public route `/measure/:sessionId` |
| `src/components/project/SizesTab.tsx` | Add "Live Measurement" button and integrate LiveMeasurementPanel |
| `src/config/categoryConfig.ts` | Add `bodyMeasurementKeys` mapping per category (which body measurements map to which garment measurements) |

### Database Migration
```sql
CREATE TABLE public.body_measurement_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  category text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  measurements jsonb DEFAULT '{}',
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.body_measurement_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create and read their sessions
CREATE POLICY "Users can manage own sessions"
  ON public.body_measurement_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Anonymous access for mobile page to update by session ID
CREATE POLICY "Anyone can update session by id"
  ON public.body_measurement_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can read session by id"
  ON public.body_measurement_sessions FOR SELECT
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.body_measurement_sessions;
```

### AI Prompt Strategy (Edge Function)
The prompt will be category-aware, requesting specific measurements. For example, for a "dress" category:
- "Analyze this full-body photo. Estimate the following body measurements in centimeters: bust circumference, waist circumference, hip circumference, shoulder width, total height, arm length, neck circumference. Return as JSON."
- The model will use visual proportional analysis (height reference, body ratios) to estimate measurements
- A height input field on mobile will improve accuracy (used as a reference scale)

### QR Code Generation
Will use a lightweight pure-JS QR code encoder (no external dependency) that outputs an SVG string. This keeps the bundle small and avoids adding npm packages.

