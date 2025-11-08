# Invitation QR App

## Overview
An Arabic RTL web application designed for event organizers to manage invitations, generate and scan QR codes/barcodes, and track attendance. It aims to streamline event guest management, enhance invitation design, and facilitate communication through features like WhatsApp integration and RSVP tracking.

## User Preferences
- Auto-fill country code +966 in phone number fields.

## System Architecture
The application is built with React, TypeScript, and Vite for the frontend, and Express.js for the backend. It utilizes a PostgreSQL database managed with Drizzle ORM.

**Key Architectural Decisions & Implementations:**
-   **Unified Server Architecture**: A single Express server serves both API routes (`/api/*`) and static frontend files (from `dist/`) in production.
-   **Database**: PostgreSQL (Supabase via Neon) with Drizzle ORM for type-safe operations.
-   **State Management**: React `useState` with API persistence.
-   **Authentication**: Username/password with role-based access (admin/user/scanner).
    -   **Admin**: Full access to all features and pages.
    -   **User**: Access to dashboard, designs, scanner, reporting, and quick invite.
    -   **Scanner**: Restricted access - only the Scanner page with simplified header (no sidebar navigation).
-   **UI/UX Design System**:
    -   Comprehensive Dark/Light mode theme system with smooth transitions.
    -   Consistent use of gradient colors (teal-to-cyan), glow effects, and glassmorphism design elements across all pages (Login, Dashboard, Reporting, Users, QuickInvite).
    -   Animated icons, custom scrollbars, and subtle pattern backgrounds (Islamic geometric, dot/grid) for enhanced visual depth.
    -   Responsive design optimized for mobile, including touch-friendly interactions and animations.
    -   Project logo (معازيم - MAAZEEM) integrated across all pages for brand consistency.
-   **QR/Barcode Generation**:
    -   **bwip-js** is used for professional, high-quality barcode generation (e.g., Code 128, QR), supporting various formats and DPI control for print quality.
    -   `QRCodeStyling` for customizable QR code generation.
    -   Invitation images are saved with a clear naming convention: `دعوة_[EventName]_[GuestName].png`.
-   **Scanning**:
    -   `html5-qrcode` library for reliable and mobile-optimized camera-based QR/barcode scanning, including torch/flashlight and zoom controls.
    -   Supports barcode type selection ("All", "QR", "Barcode") with dynamic scan box sizing.
    -   Includes audio feedback for scan success (high-pitch beep) and error (low-pitch beep).
    -   Manual barcode entry is supported.
-   **Invitation Design Editor**: Features a comprehensive design editor with font selection, size, and color pickers for Title, Body, and Guest Name, along with a live preview and clear display of final image dimensions (1080 × 1920 pixels).
-   **Event & Guest Management**: Supports creating events, managing guest lists, assigning individual scan limits, and bulk importing guests via CSV.
-   **RSVP System**: Allows guests to confirm/decline attendance, with tracking and WhatsApp integration for sending RSVP requests and status updates.
-   **WhatsApp Integration**: Enables bulk messaging with customizable templates (RSVP, thank you, follow-up). Includes smart filtering to only send invitations to confirmed guests and simplifies sharing by directly downloading images and opening WhatsApp chat.
-   **API Endpoints**:
    -   `/api/users`
    -   `/api/groups`
    -   `/api/members`
    -   `/api/scan-logs`
    -   `/api/designs`
    -   `/api/messages`
    -   `/api/init` (for database initialization)

## External Dependencies
-   **Database**: PostgreSQL (Supabase via Neon)
-   **ORM**: Drizzle ORM
-   **Backend Framework**: Express.js
-   **Frontend Framework**: React
-   **Build Tool**: Vite
-   **QR/Barcode Scanning**: `html5-qrcode`
-   **QR Code Generation**: `QRCodeStyling`
-   **Professional Barcode Generation**: `bwip-js`
-   **Styling**: Tailwind CSS (loaded via CDN)

## Recent Changes
- **2025-10-29 (Latest)**: **Guest Name Control in Design Editor**
  - Added checkbox to show/hide guest name on invitations
  - Added horizontal position slider (0-100%) for guest name placement
  - Added vertical position slider (0-100%) for guest name placement
  - Default position: 50% horizontal (centered), 65% vertical
  - Settings apply to both design preview and generated invitations
  - Updated types.ts, schema.ts, DesignEditorModal.tsx, GeneratedInvitation.tsx, generateInvitation.ts, and Designs.tsx

- **2025-10-23**: **Auto-Generate & Send Full Invitation Images**
  - "إنشاء وإرسال الدعوة" button now generates complete invitation design images (1080×1920 px)
  - Automatically downloads invitation image: `دعوة_[EventName]_[GuestName].png`
  - Opens WhatsApp with pre-filled message for immediate sharing
  - Full invitation includes: design template, event details, guest name, and QR/barcode
  - Created lib/generateInvitation.ts for reusable invitation generation logic
  - No modal required - direct one-click generation and sharing workflow
  - Updated Dashboard.tsx and MemberList.tsx

- **2025-10-29**: **Updated MAAZEEM Logo**
  - Updated to new minimalist MAAZEEM logo design
  - Features modern "M" lettermark with Arabic text "معازيم"
  - Clean black and white design for better visibility
  - Logo appears across Login, Dashboard (sidebar), and Scanner header

- **2025-10-20**: **Brand Update - New Logo**
  - Updated application logo from "دعوتي (DAWATI)" to "معازيم (MAAZEEM)"
  - New logo features modern Arabic calligraphy with circular design
  - Logo updated across all pages: Login, Dashboard (sidebar), Scanner header
  - Maintains consistent brand identity throughout the application

- **2025-10-19**: **Ticket Number System for Scannable Barcodes**
  - Added `ticketNumber` field to members table for short, scannable barcode IDs
  - Auto-generates sequential ticket numbers (e.g., "00001", "00002") per event
  - Barcode generation now uses ticketNumber instead of long UUID for better scannability
  - Scanner searches by ticketNumber first, then falls back to ID for backward compatibility
  - Barcode displays clean strips without text overlay (includetext: false)
  - Solves the issue of long UUIDs being difficult to scan with barcode scanners
  - Updated schema.ts, types.ts, server/index.ts, GeneratedInvitation.tsx, Scanner.tsx

- **2025-10-19**: **Enhanced Barcode Scanner Support**
  - Fixed barcode scanner to support all common 1D barcode formats
  - Added support for: CODE_128, CODE_39, CODE_93, CODABAR, EAN_13, EAN_8, UPC_A, UPC_E, ITF
  - Scanner now properly recognizes linear/strip barcodes in addition to QR codes
  - Improved scanning reliability for product barcodes and event tickets
  - Updated Scanner.tsx with comprehensive barcode format support

- **2025-10-19**: **PDF Export for Reports**
  - Added PDF export functionality to Reporting page using html2pdf.js
  - New "تحميل PDF" button generates professional PDF reports
  - PDF includes all visible statistics, attendance lists, and absence lists
  - Filename format: `تقرير_[EventName]_[RSVPStatus]_[Date].pdf`
  - Supports Arabic text and RTL layout in PDF output
  - Works with all filters (Event + RSVP Status) for customized reports
  - High-quality output with configurable resolution and format

- **2025-10-19**: **RSVP Status Filtering in Reports Page**
  - Added comprehensive RSVP status filtering in Reporting page
  - New filter options: All / Confirmed (مؤكدون) / Declined (معتذرون) / Pending (قيد الانتظار)
  - Visual badges display RSVP status for each guest in attendance and absence lists
  - Filter works in combination with event filter for detailed reports
  - Color-coded badges: Green (✅ مؤكد), Red (❌ معتذر), Yellow (⏳ انتظار)
  - Updated Reporting.tsx with dual-filter system (Event + RSVP Status)

- **2025-10-19**: **Scanner User Tracking & Filtering**
  - Added `scannedBy` field to track which user performed each scan
  - Scanner role users now see **only their own scan history**
  - Admin and User roles continue to see all scan logs
  - Database schema updated with new `scanned_by` column
  - Perfect for multi-scanner events where each staff member tracks their own work
  - Updated types.ts, schema.ts, Scanner.tsx, and App.tsx

- **2025-10-18**: **Scanner Role - Restricted Access**
  - Added new user role: **"Scanner" (قارئ باركود)**
  - Scanner users have restricted access:
    - ✅ Can only access the Scanner page
    - ✅ See simplified header with logo, username, theme toggle, and logout
    - ❌ Cannot access dashboard, designs, users, reporting, or quick invite
    - ❌ No sidebar navigation menu
  - Role badge in Users page: Green badge "قارئ باركود"
  - Perfect for event staff who only need to scan QR codes/barcodes
  - Updated types.ts, schema.ts, App.tsx, and Users.tsx

- **2025-10-18**: **Full-Screen Scan Status Overlay**
  - **Dramatic full-screen overlay** displays scan results (success/failure/warning)
  - **Massive icons** (128-256px) centered on screen for maximum visibility
  - **Large text** (3xl-7xl responsive) for easy reading from distance
  - **Gradient backgrounds** matching scan status:
    - Green gradient for successful scans
    - Yellow/Orange gradient for limit warnings
    - Red/Pink gradient for errors
  - **Smooth animations**:
    - FadeIn effect for overlay appearance
    - ScaleIn effect for content
    - Bounce animation for icons
  - **Auto-dismiss** after 2 seconds
  - **Backdrop blur** for professional look
  - **Decorative elements** with colored dividers
  - Fully responsive across all devices

- **2025-10-18**: **Professional Scanner Page Redesign**
  - **Complete UI/UX overhaul** for Scanner page with modern, professional design
  - **Full responsive design** optimized for all devices: Mobile, Tablet, Desktop
  - **Dark/Light theme integration** with glassmorphism effects
  - **Improved layout**:
    - Grid-based responsive layout (1 column mobile, 3 columns desktop)
    - Left sidebar: Controls (Barcode type, Start/Stop, Manual input)
    - Right area: Scanner view and scan logs
  - **Enhanced visual elements**:
    - Gradient buttons with hover effects and animations
    - Larger, more visible status icons (responsive sizes)
    - Professional color schemes matching theme
    - Custom scrollbar styling
    - Shadow effects and smooth transitions
  - **Better mobile experience**:
    - Touch-friendly button sizes
    - Optimized text sizes for all screen sizes
    - Vertical layout on mobile, horizontal on desktop
    - Improved spacing and padding
  - **Professional status display**:
    - Full-width status cards with animations
    - Clear success/warning/error states
    - Glassmorphism effects in dark mode
  - **Accessibility improvements**:
    - Better contrast ratios
    - Larger touch targets
    - Clear visual feedback

- **2025-10-18**: **Font Color Selection in Design Editor**
  - Added font color picker for all text elements: Title, Body, and Guest Name
  - Integrated color selection within FontSelector component
  - Added `nameColor` field to DesignTemplate (types.ts, schema.ts, database)
  - Live preview shows exact colors for all text elements
  - Removed duplicate color inputs for better organization