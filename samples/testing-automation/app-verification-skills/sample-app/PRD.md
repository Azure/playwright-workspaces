# Planning Guide

An enterprise-grade invoice processing application that streamlines vendor invoice entry through a multi-step workflow, from vendor details through approval and submission, designed to demonstrate agent-driven form automation with strategic human intervention points.


1. **Efficient** - Minimize friction in repetitive data entry with smart autocomplete, auto-calculations, and quick-copy features
2. **Authoritative** - Convey trust and reliability through structured validation, clear status indicators, and formal approval workflows
3. **Progressive** - Guide users through complex invoice processing with clear step indicators and contextual information at each stage

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a multi-view application with a list/queue view, five-step form wizard, dynamic line item management, approval workflows, and persistent state management across multiple data entities (invoices, vendors, line items).

- **Trigger**: User c

### Page 2: Bill To / Ship To
- **Functionality**: Display all invoices in a sortable, filterable table with status badges
- **Purpose**: Provides overview of all invoices and their current processing state
- **Trigger**: App loads or user clicks "Back to Queue" from invoice form
- **Functionality**: Dynamic table for adding multiple invoice line items with auto-calculation
- **Trigger**: User completes Page 2 and clicks "Continue"

### Page 4: Payment & Compliance
- **Purpose**: Record banking information and enforce approval controls (dem
- **Progression**: Form loads → User fills payment details → User selects cost cent

- **Functionality**: Read-only summary of all invoice data with submit action
- **Trigger**: User completes Page 4 (including approval)

## Edge Case Handling
- **Empty Queue** - Display empty state with illustration and "Add New Invoice" CTA
- **Missing Required Fields** - Highlight fields in red with clear error messages
- **Zero Line Items** - Prevent navigation from Page 3 if 
- **Duplicate Invoice Numbers** - Warn user if invoice number already exists in system



- **Functionality**: Dynamic table for adding multiple invoice line items with auto-calculation

- **Trigger**: User completes Page 2 and clicks "Continue"
  - Dark Blue (oklch(0.30 0.08 240)) - Darker shade for header borders and emphasis
- **Accent Color**: Interactive Blue (oklch(0.52 0.12 220)) - For links, focus states, and interactive elements

### Page 4: Payment & Compliance
- **Foreground/Background Pairings**:
  - Light Blue Background (oklch(0.90 0.03 240)): Dark Blue text (oklch(0.30 0.08 240)) - Ratio 11.2:1 
  - Background (oklch(0.97 0.005 240)): Foreground text (o
## Font Selection
Typography should match SAP Concur's corporate aesthetic with clean, business-appropriate fonts optimized for data-dense


- **Functionality**: Read-only summary of all invoice data with submit action
  - H3 (Form Labels): Open Sans Semibold / 14px / 0em letter spacing 
- **Trigger**: User completes Page 4 (including approval)
  - Table Headers: Open Sans Semibold / 11px / 0.05em letter spacing / 1.4 line height / uppercase
## Animations

## Edge Case Handling

- **Empty Queue** - Display empty state with illustration and "Add New Invoice" CTA


  - Header: Fixed blue header bar with white Concur logo and user 
  - Card: White cards with subtle shadow and minimal border radius (0.25rem)
  - Label: Small, semibold labels positioned above inputs
- **Duplicate Invoice Numbers** - Warn user if invoice number already exists in system
  - Calendar (via Popover): Compact date picker

  - Progress: Numbe

  - Corporate header: Blue bar with white logo and navigation

  - Status badges:

  - Inputs: Default (thin border) → Focus (blue border) → Error (red border) → Disabl

- **Icon Selection**:
- **Secondary Colors**: 
  - User (user profile)
  - Medium gray (oklch(0.65 0.02 250)) - Secondary text and borders

- **Status Colors**:
  - Form sections: gap-4 between secti
  - Table cells: px-4 py-2.5 (dense)
  - Minimal border radius: 0.25rem through
- **Mobile**:
  - Invoice queue: Switch to card-bas
  - Primary (oklch(0.35 0.05 250)): White text (oklch(1 0 0)) - Ratio 9.2:1 ✓
  - Touch targets: 44x44px minimum
  - Background (oklch(0.99 0.005 250)): Dark slate text (oklch(0.25 0.03 250)) - Ratio 14.1:1 ✓

















## Animations













  - Table: Custom table with shadcn's base styling for invoice queue

  - Input: Text inputs with clear focus states for all form fields

  - Button: Primary (filled), Secondary (outline), and Ghost variants

  - Select: Dropdowns for currency, unit, cost centre, expense category, approver

  - Checkbox: "Copy Bill To" and "Requires Approval" toggles

  - Separator: Visual breaks between form sections







  - Auto-complete input: Enhanced input with dropdown suggestions for vendor name



- **States**:



  - Step indicators: Inactive (gray) → Active (accent) → Complete (success green with checkmark)

- **Icon Selection**:
  - Plus (add new invoice, add line item)
  - Trash (remove line item)
  - ArrowRight (continue/next step)
  - ArrowLeft (previous step)
  - Check (approved status, completed steps)
  - Clock (pending status)
  - FileText (draft status)
  - PaperPlaneRight (submitted status)
  - Warning (validation errors)
  - Buildings (vendor/company)
  - CreditCard (payment info)
  - Receipt (invoice)

- **Spacing**:
  - Page padding: p-8 on desktop, p-4 on mobile
  - Card padding: p-6
  - Form sections: gap-6 between sections, gap-4 between fields
  - Buttons: px-6 py-2.5
  - Table cells: px-4 py-3
  - Step indicator: gap-2 between steps

- **Mobile**:
  - Invoice queue: Switch from table to card-based list view with key info stacked
  - Form: Single column layout with full-width inputs
  - Step indicator: Horizontal scrollable strip or simplified dots-only version
  - Line items: Stack fields vertically per line item instead of table rows
  - Review page: Stack all sections vertically with collapsible sections for line items
  - Reduce font sizes by 1-2px across all hierarchy levels
  - Increase touch targets to minimum 44x44px for all buttons
