# Build a Premium Privacy-First File Utility Dashboard

I want you to build a production-quality web application for a personal project: a **privacy-first daily file utility suite** where users can perform common PDF and image operations from one beautiful dashboard.

The application should feel like a premium product, not a generic PDF-tools clone.

Think:

**Linear + Raycast + Apple + Arc + premium cybersecurity aesthetic**

The core product philosophy is:

> **Your files stay yours. Process locally whenever technically possible.**

The first implementation should contain ONE unified dashboard and these 7 fully designed tool experiences:

1. Luxury Dashboard
2. PDF Password / Security
3. PDF Compressor
4. PDF Merge
5. Image Compressor
6. AI Image Upscaler / Resolution Enhancer
7. Privacy Center

The architecture must make it easy to add 30–40 additional tools later.

---

# 1. IMPORTANT PRODUCT REQUIREMENTS

Do NOT create seven unrelated mini websites.

Build:

```text
Application Shell
      │
      ├── Dashboard
      │
      ├── PDF Tools
      │     ├── PDF Security
      │     ├── PDF Compress
      │     └── PDF Merge
      │
      ├── Image Tools
      │     ├── Image Compress
      │     └── Image Upscale
      │
      └── Privacy Center
```

Every tool must open from the dashboard through routing/navigation.

Use reusable components so future tools can be added without redesigning the entire application.

---

# 2. DESIGN DIRECTION

The primary design should be:

## Luxury Dark

Use an elegant, restrained, premium dark interface.

Visual references in terms of design language:

- Linear
- Raycast
- Arc
- Apple
- Vercel
- premium fintech/security dashboards

Do NOT copy any existing website.

Create an original visual identity.

### Base palette

Use mostly monochrome colors:

```text
Background: #070707
Surface: #0D0D0D
Elevated surface: #121212
Borders: rgba(255,255,255,0.08)
Primary text: #F5F5F5
Secondary text: #8A8A8A
```

Use subtle category accents:

```text
PDF/security → cool blue
Images → violet
Privacy → green
AI → purple/violet
```

Do not flood the UI with colors.

The interface should feel expensive because of spacing, typography, hierarchy, motion and detail — NOT because of excessive gradients.

---

# 3. DESIGN RULE

Follow:

> 95% calm UI + 5% spectacular interaction.

Avoid:

- excessive glassmorphism
- giant gradients
- excessive glowing elements
- constant particles
- unnecessary 3D objects
- huge shadows
- excessive rounded cards
- generic SaaS templates
- emoji-heavy UI

Use subtle:

- glass surfaces
- fine borders
- ambient gradients
- blur
- micro-interactions
- elegant transitions
- carefully timed animations

---

# 4. TYPOGRAPHY

Use a premium modern type system.

Prefer:

- Geist or Inter for primary UI
- Geist/modern display typography for large headings
- JetBrains Mono for technical metadata/numbers

Large headings should have strong visual hierarchy.

Use generous whitespace.

---

# 5. APPLICATION SHELL

Create a persistent application shell.

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Logo                         Search ⌘K       Theme   Settings │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ Home          │                                             │
│               │                                             │
│ PDF           │                Main content                  │
│  Security     │                                             │
│  Compress     │                                             │
│  Merge        │                                             │
│               │                                             │
│ Image         │                                             │
│  Compress     │                                             │
│  Upscale      │                                             │
│               │                                             │
│ Privacy       │                                             │
│               │                                             │
│ ★ Favorites   │                                             │
│ ◷ Recent      │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

Sidebar should collapse elegantly.

Mobile should use a bottom navigation / compact navigation pattern.

The application must be fully responsive.

---

# 6. GLOBAL COMMAND PALETTE

Implement a command palette opened by:

```text
Cmd/Ctrl + K
```

It should allow users to search tools.

Example:

```text
┌──────────────────────────────────────────┐
│ ⌕  What do you want to do?               │
├──────────────────────────────────────────┤
│ PDF                                      │
│   Compress PDF                           │
│   Merge PDFs                             │
│   PDF Security                           │
│                                          │
│ IMAGE                                    │
│   Compress Image                         │
│   Upscale Image                          │
│                                          │
│ PRIVACY                                  │
│   Privacy Center                         │
└──────────────────────────────────────────┘
```

Search should instantly filter tools.

Keyboard navigation should work.

---

# 7. DASHBOARD

The dashboard is the heart of the application.

Hero:

```text
YOUR FILES.
YOUR DEVICE.
YOUR PRIVACY.

Everything you need to work with PDFs and images —
processed locally whenever possible.
```

Then provide:

### Quick Actions

- PDF Security
- Compress PDF
- Merge PDF
- Compress Image
- Upscale Image
- Privacy Center

Each card must be clickable and route to its corresponding tool.

---

# 8. DASHBOARD TOOL CARDS

Cards should feel premium and interactive.

Each card contains:

- minimal icon
- tool name
- short description
- subtle category accent
- optional keyboard shortcut
- hover animation

Example:

```text
┌──────────────────────────────┐
│ 🔐                           │
│                              │
│ PDF Security                 │
│ Protect or unlock PDFs       │
│                              │
│ Open →                       │
└──────────────────────────────┘
```

On hover:

- card slightly lifts
- border becomes more visible
- icon subtly moves
- background glow appears
- arrow transitions

Keep the animation restrained.

---

# 9. DRAG AND DROP EXPERIENCE

Allow users to drag a PDF/image anywhere onto the dashboard.

When a file is dragged over the application, transition the dashboard into a file-action mode.

Show:

```text
What would you like to do with this file?

[ Compress ]
[ Protect ]
[ Merge ]
[ Convert ]
```

For image files:

```text
[ Compress ]
[ Upscale ]
[ Resize ]
[ Convert ]
[ Remove Metadata ]
```

This should feel extremely polished.

---

# 10. GLOBAL PRIVACY INDICATOR

Throughout the application show a small status pill:

```text
🔒 Local processing
```

Clicking it opens a small privacy explanation:

```text
YOUR FILE IS PRIVATE

This operation is processed directly
on your device whenever supported.

✓ No file upload
✓ No cloud storage
✓ No account required
✓ File contents are not tracked
```

Do not falsely claim that every operation is local.

For operations that genuinely require server-side processing, clearly communicate that.

---

# 11. TOOL PAGE UX PATTERN

All tools should follow a shared workflow:

```text
SELECT
   ↓
CONFIGURE
   ↓
PROCESS
   ↓
RESULT
```

Create reusable components for:

- FileDropzone
- FilePreview
- FileInfo
- ConfigurationPanel
- ProcessingState
- ProgressIndicator
- ResultCard
- PrivacyIndicator
- DownloadButton
- ResetButton
- BeforeAfterComparison
- ToolHeader

Do not duplicate these components between pages.

---

# 12. PAGE 1 — PDF SECURITY

Route:

```text
/pdf/security
```

This page should have a security/vault visual identity.

Title:

```text
Secure your PDF.
```

Subtitle:

```text
Protect or unlock PDF files without unnecessary uploads.
```

Initial state:

```text
              🔐

        Secure your PDF

     Drop your PDF here

     or browse from device

       🔒 Local processing
```

After upload, show:

```text
┌─────────────────────┐
│                     │
│    PDF PREVIEW      │
│                     │
└─────────────────────┘

Security

Password
[ •••••••••••• ] 👁

Encryption
AES-256

[ Protect PDF ]
```

Also support:

- Add password
- Remove password

For password removal, ask for the existing password where required.

Use a vault-style animation:

Protect:

```text
PDF
 ↓
Encrypting
 ↓
🔒 Locked
```

Remove protection:

```text
🔒
 ↓
Validating
 ↓
🔓
```

Completion state:

```text
✓ Protection updated

your-file.pdf

[ Download PDF ]

Your file was processed locally.
```

---

# 13. PAGE 2 — PDF COMPRESSOR

Route:

```text
/pdf/compress
```

Visual identity:

Minimal performance-focused interface.

Title:

```text
Make PDFs lighter.
```

Subtitle:

```text
Reduce file size while keeping documents readable.
```

After upload show:

```text
Original

42.8 MB

        →

Optimized

8.4 MB
```

Display:

```text
80.4% smaller
```

Provide a quality/compression slider:

```text
Smaller                         Better quality
●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
```

Add presets:

- Maximum compression
- Balanced
- High quality

Show estimated output size dynamically.

Processing animation should communicate compression rather than use a generic spinner.

For example:

```text
████████████████
       ↓
██████████
       ↓
████
```

Result should clearly show:

- original size
- new size
- percentage saved
- download action

---

# 14. PAGE 3 — PDF MERGE

Route:

```text
/pdf/merge
```

Visual identity:

Document flow / modular design.

Title:

```text
Bring documents together.
```

Allow multiple PDF uploads.

Show draggable document cards:

```text
PDF 01
PDF 02
PDF 03
PDF 04
```

Users can:

- drag to reorder
- remove files
- add more files

Show live combined document count.

Merge animation:

```text
PDF 01 ─┐
PDF 02 ─┼──→ MERGED PDF
PDF 03 ─┘
```

Result:

```text
✓ PDFs merged

12 pages
3 documents

[ Download merged PDF ]
```

---

# 15. PAGE 4 — IMAGE COMPRESSOR

Route:

```text
/image/compress
```

Visual identity:

Premium image/pixel laboratory.

Title:

```text
Smaller images.
Same feeling.
```

Upload image.

Show large image preview.

Provide draggable before/after comparison.

Example:

```text
ORIGINAL
4.8 MB

        │ ← drag →
        │

COMPRESSED
780 KB
```

Settings:

- quality
- output format
- target size
- compression mode

Formats:

- JPG
- PNG
- WEBP

Show estimated output size while adjusting controls.

Use a beautiful compression animation.

---

# 16. PAGE 5 — IMAGE UPSCALER

Route:

```text
/image/upscale
```

This should be the most visually impressive page.

Visual identity:

Futuristic AI studio.

Title:

```text
From pixels to clarity.
```

Subtitle:

```text
Enhance image resolution while preserving important detail.
```

Show:

```text
240p
  ↓
✦ AI Enhancement ✦
  ↓
1080p
```

After upload show a large before/after comparison.

Controls:

```text
Scale
[ 2× ] [ 4× ]

Sharpness
───────●────

Noise reduction
────●────────

Face detail
──────●──────
```

Use a scanning beam animation across the image during processing.

Do not use a generic spinner.

Processing state:

```text
Analyzing image
Detecting details
Enhancing resolution
Reconstructing pixels
```

Result:

```text
✓ Enhancement complete

240p → 1080p

[ Download enhanced image ]
```

If real AI upscaling is not implemented yet, create a clean abstraction/service interface and a polished demo/mock processing state rather than pretending that actual AI enhancement is happening.

---

# 17. PAGE 6 — PRIVACY CENTER

Route:

```text
/privacy
```

This page should communicate trust.

Title:

```text
Your privacy, by design.
```

Create a beautiful security/privacy dashboard.

Show:

```text
PROCESSING MODE

● Local whenever supported

────────────────────────

FILE STORAGE

No cloud storage

────────────────────────

TEMPORARY DATA

Automatically removed

────────────────────────

TELEMETRY

Configurable

────────────────────────

PRIVACY MODE

[ ON ]
```

Create an animated privacy status indicator.

Possible visual:

```text
        ◉

     PRIVATE

Your files remain on your device
for local operations.
```

Include an explanation of which current tools are local and which may require additional processing.

Do not make misleading security claims.

---

# 18. RESULT EXPERIENCE

Every tool should have a premium result state.

Do not simply show:

```text
Download
```

Instead:

```text
                ✓

             All done.

          filename.pdf

        42.8 MB → 8.4 MB

        Saved 34.4 MB

     ┌──────────────────────┐
     │    ↓ Download file    │
     └──────────────────────┘

        Process another
```

Include a subtle success animation.

---

# 19. ANIMATION SYSTEM

Use animations intentionally.

### Basic animations

- fade
- slide
- scale
- hover
- progress

### Premium animations

- magnetic buttons
- shared layout transitions
- card expansion
- file thumbnail morphing
- drag/drop physics
- before/after slider
- smooth route transitions

### Tool-specific animations

PDF Security:

```text
lock/unlock
```

PDF Compression:

```text
file visually shrinking
```

PDF Merge:

```text
pages stacking
```

Image Compression:

```text
pixels reducing
```

Image Upscale:

```text
pixel reconstruction / scanning beam
```

Privacy:

```text
metadata/data particles disappearing
```

Avoid animation overload.

Respect:

```text
prefers-reduced-motion
```

---

# 20. RESPONSIVE DESIGN

The application must be excellent on:

- desktop
- laptop
- tablet
- mobile

Desktop:

Sidebar + content.

Tablet:

Collapsed sidebar.

Mobile:

Bottom navigation or compact top navigation.

Tool upload areas should work naturally with touch.

Before/after comparison must support touch dragging.

---

# 21. ACCESSIBILITY

Implement:

- keyboard navigation
- visible focus states
- ARIA labels
- accessible buttons
- accessible file upload
- sufficient contrast
- reduced motion support
- screen-reader-friendly status updates

---

# 22. TECHNICAL ARCHITECTURE

Use a modern frontend architecture appropriate for a production-quality React application.

Prefer:

- TypeScript
- React
- modern routing
- Tailwind CSS or an equally maintainable styling system
- component-based architecture
- reusable hooks
- clean state management

Choose the exact libraries based on the existing repository/project setup if one exists.

Do NOT unnecessarily replace an existing working stack.

---

# 23. LOCAL-FIRST FILE PROCESSING

This is a critical requirement.

For supported operations, process files in the browser/device whenever technically feasible.

Preferred architecture:

```text
User
 ↓
Browser
 ↓
File selected
 ↓
Local processing
 ↓
Web Worker / WASM where appropriate
 ↓
Result
 ↓
Download
```

Avoid sending private files to a backend unless absolutely necessary.

Use Web Workers for CPU-heavy operations where appropriate so the UI remains responsive.

If a future operation requires cloud processing, make that explicit in the architecture.

---

# 24. SECURITY / PRIVACY REQUIREMENTS

Never:

- log file contents
- send file contents to analytics
- put sensitive file data into localStorage unnecessarily
- retain temporary files unnecessarily
- claim an operation is local if it isn't

Use object URLs safely and revoke them when no longer needed.

Clear temporary processing state when appropriate.

Make privacy behavior explicit in the UI.

---

# 25. FUTURE TOOL ARCHITECTURE

The application should be designed so I can later add:

PDF:

- split
- extract pages
- delete pages
- reorder pages
- rotate
- flatten
- optimize
- PDF → JPG
- PDF → PNG
- JPG → PDF
- PNG → PDF
- OCR
- text extraction

Images:

- resize
- crop
- rotate
- flip
- JPG → PNG
- PNG → JPG
- WEBP conversion
- HEIC conversion
- sharpen
- denoise
- background removal
- old photo restoration

Privacy:

- remove EXIF
- remove GPS metadata
- strip metadata
- blur sensitive information

Other:

- QR generator
- QR scanner
- color tools
- file utilities

Do not implement all of these now.

Create the architecture and navigation so they can be added easily later.

---

# 26. EMPTY STATES

Never use boring:

```text
No files selected.
```

Instead create polished empty states.

Example:

```text
              ✦

        Ready when you are.

     Drop a PDF or image here
        to start working.

        [ Browse files ]

       🔒 Local processing
```

---

# 27. ERROR STATES

Design beautiful error states too.

Example:

```text
             !

      Something went wrong.

      We couldn't process this file.

      The original file is untouched.

          [ Try again ]
```

Errors should never expose technical stack traces to users.

---

# 28. DESIGN SYSTEM

Create reusable design tokens/components for:

- colors
- typography
- spacing
- radius
- borders
- shadows
- buttons
- inputs
- cards
- dialogs
- dropdowns
- sliders
- badges
- tool headers
- upload zones
- file cards
- progress states
- success states
- error states

Maintain consistency across all seven pages.

---

# 29. ICONOGRAPHY

Use one consistent icon library.

Do not mix random icon styles.

Icons should be thin, elegant and minimal.

Avoid using emoji as primary UI icons.

---

# 30. DASHBOARD INFORMATION ARCHITECTURE

Use:

```text
HOME

PDF
 ├── Security
 ├── Compress
 └── Merge

IMAGE
 ├── Compress
 └── Upscale

PRIVACY

────────────

Favorites
Recent

────────────

Settings
```

Every item must route correctly.

Do not create dead buttons.

---

# 31. DEMO / MVP BEHAVIOR

The UI should feel functional even if some processing engines are not fully implemented yet.

Where real processing libraries are available and appropriate, integrate them.

Where functionality requires a future engine, build a clean service abstraction:

```text
PDFService
ImageService
UpscaleService
PrivacyService
```

The UI should communicate processing states honestly.

Do NOT fake a completed operation and present it as a real transformation.

---

# 32. QUALITY BAR

This should NOT look like:

- a college project
- a generic admin dashboard
- a Bootstrap template
- an iLovePDF clone
- a basic Tailwind demo

It should feel like a real startup product that could eventually be launched publicly.

Pay particular attention to:

- spacing
- typography
- visual hierarchy
- empty states
- hover states
- loading states
- error states
- transitions
- responsive behavior
- accessibility
- micro-interactions

---

# 33. IMPLEMENTATION PROCESS

Before writing a large amount of code:

1. Inspect the existing repository.
2. Identify the current framework and structure.
3. Reuse existing infrastructure where sensible.
4. Establish the design system.
5. Build the application shell.
6. Build the dashboard.
7. Add routing.
8. Build the seven tool experiences.
9. Add responsive behavior.
10. Add animations.
11. Test all routes and interactions.
12. Fix visual inconsistencies.
13. Run lint/type checks/build/tests.

Do not stop at static mockups.

The result should be a working application.

---

# 34. FINAL EXPERIENCE

The final product should feel like:

> **A private operating system for everyday files.**

When the user opens it, they should immediately understand:

- what tools are available
- where their files go
- how to start
- that privacy is important
- that the product is fast and polished

The dashboard should be the central home.

Clicking any tool should transition naturally into its dedicated experience.

Every page should have its own personality while still clearly belonging to the same product.

Build this with exceptional attention to UI/UX, interaction design, accessibility, responsiveness and maintainable architecture.