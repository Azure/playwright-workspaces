import { test, expect, Page } from '@playwright/test'

// ── Mock Data ──────────────────────────────────────────────────────────

const mockInvoice = {
  id: 'INV-TEST-001',
  vendorName: 'Acme Corporation',
  vendorId: 'VND-001',
  vendorAddress: '123 Main Street, New York, NY 10001',
  vendorEmail: 'billing@acmecorp.com',
  invoiceNumber: 'INV-2024-100',
  invoiceDate: '2024-06-15T00:00:00.000Z',
  dueDate: '',
  currency: 'USD',
  purchaseOrderRef: '',
  billToCompany: 'Test Corp',
  billToAddress: '789 Test Ave, Test City, TS 00000',
  billToTaxId: 'TX-12345',
  billToEmail: '',
  shipToCompany: 'Test Corp Warehouse',
  shipToAddress: '101 Warehouse Rd, Test City, TS 00001',
  shipToContact: '',
  lineItems: [
    { id: 'li-1', description: 'Widget A', quantity: 10, unit: 'unit', unitPrice: 25.0, amount: 250.0 },
    { id: 'li-2', description: 'Widget B', quantity: 5, unit: 'unit', unitPrice: 50.0, amount: 250.0 },
  ],
  subtotal: 500.0,
  taxPercent: 5,
  taxAmount: 25.0,
  totalAmount: 525.0,
  accountName: 'Acme Corp',
  accountNumber: '1234567890',
  bankName: 'Test Bank',
  paymentMethod: 'Wire Transfer',
  costCentre: 'Operations',
  expenseCategory: '',
  requiresApproval: true,
  approver: 'John Smith',
  approvalStatus: 'Approved',
  status: 'submitted' as const,
  assignedTo: 'System',
  lastUpdated: '2024-06-15T10:00:00.000Z',
  createdAt: '2024-06-15T09:00:00.000Z',
}

// ── Helpers ────────────────────────────────────────────────────────────

async function setupApiMocks(page: Page, initialInvoices: typeof mockInvoice[] = []) {
  const store = [...initialInvoices]

  await page.route('**/api/invoices', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(store) })
    } else if (method === 'POST') {
      const body = route.request().postDataJSON()
      store.push(body)
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(body) })
    } else {
      await route.continue()
    }
  })

  await page.route('**/api/invoices/*', async (route) => {
    const method = route.request().method()
    if (method === 'PUT') {
      const body = route.request().postDataJSON()
      const idx = store.findIndex((inv) => inv.id === body.id)
      if (idx >= 0) store[idx] = body
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    } else {
      await route.continue()
    }
  })
}

async function selectSearchableOption(page: Page, fieldId: string, value: string) {
  const input = page.locator(`[data-field-id="${fieldId}"]`)
  await input.click()
  await input.fill(value)
  await page.getByRole('option', { name: value }).click()
}

async function fillStep1(page: Page) {
  const vendorInput = page.locator('[data-field-id="vendorName"]')
  await vendorInput.fill('Acme')
  await page.getByText('Acme Corporation').click()

  await page.locator('[data-field-id="invoiceNumber"]').fill('INV-2024-200')

  await selectSearchableOption(page, 'currency', 'USD')

  const dateInput = page.locator('[data-field-id="invoiceDate"]')
  await dateInput.fill('01/15/2025')
  await dateInput.press('Tab')

  await page.locator('[data-field-id="billToCompany"]').fill('My Company Inc')
  await page.locator('[data-field-id="billToAddress"]').fill('100 Business Rd, City, ST 12345')

  await page.locator('[data-field-id="copyBillToShip"]').click()
}

async function fillStep2(page: Page) {
  const descInputs = page.getByLabel('Line item description')
  await descInputs.first().fill('Consulting Services')

  const qtyInputs = page.getByLabel('Line item quantity')
  await qtyInputs.first().fill('10')

  const priceInputs = page.getByLabel('Line item unit price')
  await priceInputs.first().fill('150')
}

async function fillStep3(page: Page) {
  await page.locator('[data-field-id="accountName"]').fill('Test Account')
  await page.locator('[data-field-id="accountNumber"]').fill('9876543210')
  await page.locator('[data-field-id="bankName"]').fill('National Bank')

  await selectSearchableOption(page, 'paymentMethod', 'Wire Transfer')
  await selectSearchableOption(page, 'costCentre', 'Operations')

  await selectSearchableOption(page, 'approver', 'John Smith')
}

async function navigateToStep2(page: Page) {
  await page.getByRole('button', { name: /Create New Invoice/i }).click()
  await fillStep1(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
}

async function navigateToStep3(page: Page) {
  await navigateToStep2(page)
  await fillStep2(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Payment Information')).toBeVisible()
}

// ── Edit Invoice Tests ─────────────────────────────────────────────────

test.describe('Edit Invoice Flow', () => {
  test('edit form pre-fills with existing invoice data', async ({ page }) => {
    await setupApiMocks(page, [mockInvoice])
    await page.goto('/')

    await page.getByText('Acme Corporation').click()
    await expect(page.getByText('Edit Invoice')).toBeVisible()

    await expect(page.locator('[data-field-id="vendorName"]')).toHaveValue('Acme Corporation')
    await expect(page.locator('[data-field-id="vendorId"]')).toHaveValue('VND-001')
    await expect(page.locator('[data-field-id="invoiceNumber"]')).toHaveValue('INV-2024-100')
    await expect(page.locator('[data-field-id="billToCompany"]')).toHaveValue('Test Corp')
    await expect(page.locator('[data-field-id="billToAddress"]')).toHaveValue('789 Test Ave, Test City, TS 00000')
  })

  test('edit form shows invoice ID badge', async ({ page }) => {
    await setupApiMocks(page, [mockInvoice])
    await page.goto('/')

    await page.getByText('Acme Corporation').click()

    await expect(page.getByText(`Invoice ID: ${mockInvoice.id}`)).toBeVisible()
  })
})

// ── Multiple Line Items Tests ──────────────────────────────────────────

test.describe('Multiple Line Items', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await navigateToStep2(page)
  })

  test('adding multiple line items calculates correct subtotal', async ({ page }) => {
    // Fill first line item
    await page.getByLabel('Line item description').first().fill('Item A')
    await page.getByLabel('Line item quantity').first().fill('2')
    await page.getByLabel('Line item unit price').first().fill('100')

    // Add second line item
    await page.getByRole('button', { name: /Add Line Item/i }).click()
    const descInputs = page.getByLabel('Line item description')
    await descInputs.nth(1).fill('Item B')
    await page.getByLabel('Line item quantity').nth(1).fill('3')
    await page.getByLabel('Line item unit price').nth(1).fill('50')

    // Subtotal = (2*100) + (3*50) = 350
    await expect(page.getByText('$350.00').first()).toBeVisible()
  })

  test('adding three line items with tax calculates correctly', async ({ page }) => {
    await page.getByLabel('Line item description').first().fill('Service A')
    await page.getByLabel('Line item quantity').first().fill('1')
    await page.getByLabel('Line item unit price').first().fill('1000')

    await page.getByRole('button', { name: /Add Line Item/i }).click()
    await page.getByLabel('Line item description').nth(1).fill('Service B')
    await page.getByLabel('Line item quantity').nth(1).fill('2')
    await page.getByLabel('Line item unit price').nth(1).fill('500')

    await page.getByRole('button', { name: /Add Line Item/i }).click()
    await page.getByLabel('Line item description').nth(2).fill('Service C')
    await page.getByLabel('Line item quantity').nth(2).fill('5')
    await page.getByLabel('Line item unit price').nth(2).fill('200')

    // Subtotal = 1000 + 1000 + 1000 = 3000
    const taxInput = page.locator('[data-field-id="taxPercent"]')
    await taxInput.fill('8')

    // Tax = 3000 * 8% = 240, Total = 3240
    await expect(page.getByText('$3,000.00').first()).toBeVisible()
    await expect(page.getByText('$240.00')).toBeVisible()
    await expect(page.getByText('$3,240.00')).toBeVisible()
  })
})

// ── OTP Dialog Tests ───────────────────────────────────────────────────

test.describe('OTP Approval Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await navigateToStep3(page)
    await fillStep3(page)
    await page.getByRole('button', { name: /Request Approval & Submit/i }).click()
    await expect(page.getByText('Approval Required')).toBeVisible()
  })

  test('OTP dialog shows approver name', async ({ page }) => {
    const dialog = page.getByLabel('Approval Required')
    await expect(dialog.getByText('John Smith')).toBeVisible()
  })

  test('closing OTP dialog returns to form without submitting', async ({ page }) => {
    await page.getByRole('button', { name: /Close/i }).click()

    await expect(page.getByText('Approval Required')).not.toBeVisible()
    await expect(page.getByText('Payment Information')).toBeVisible()
  })
})

// ── Data Retention Across Steps ────────────────────────────────────────

test.describe('Data Retention Across Steps', () => {
  test('Step 1 data is preserved when going back from Step 2', async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await navigateToStep2(page)

    await page.getByRole('button', { name: /^Back$/ }).click()
    await expect(page.getByText('Vendor Details')).toBeVisible()

    await expect(page.locator('[data-field-id="vendorName"]')).toHaveValue('Acme Corporation')
    await expect(page.locator('[data-field-id="invoiceNumber"]')).toHaveValue('INV-2024-200')
    await expect(page.locator('[data-field-id="billToCompany"]')).toHaveValue('My Company Inc')
  })

  test('Step 2 line item data is preserved when going back from Step 3', async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await navigateToStep3(page)

    await page.getByRole('button', { name: /^Back$/ }).click()
    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()

    await expect(page.getByLabel('Line item description').first()).toHaveValue('Consulting Services')
    await expect(page.getByLabel('Line item quantity').first()).toHaveValue('10')
    await expect(page.getByLabel('Line item unit price').first()).toHaveValue('150')
  })

  test('review summary in Step 3 shows all entered data', async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await navigateToStep3(page)

    // Vendor info
    await expect(page.getByText('Name: Acme Corporation')).toBeVisible()
    await expect(page.getByText('ID: VND-001')).toBeVisible()

    // Invoice details
    await expect(page.getByText('Invoice Number: INV-2024-200')).toBeVisible()
    await expect(page.getByText('Currency: USD')).toBeVisible()

    // Bill To
    await expect(page.getByText('My Company Inc').first()).toBeVisible()

    // Line Items
    await expect(page.getByText('Consulting Services')).toBeVisible()
    await expect(page.getByText('$1,500.00').first()).toBeVisible()
  })
})

// ── Invoice Queue — Multiple Invoices ──────────────────────────────────

test.describe('Invoice Queue — Multiple Invoices', () => {
  test('displays count for multiple invoices', async ({ page }) => {
    const invoice2 = {
      ...mockInvoice,
      id: 'INV-TEST-002',
      vendorName: 'Beta Industries',
      invoiceNumber: 'INV-2024-200',
      totalAmount: 1200.0,
    }
    await setupApiMocks(page, [mockInvoice, invoice2])
    await page.goto('/')

    await expect(page.getByText('2 invoices in queue')).toBeVisible()
    await expect(page.getByText('Acme Corporation')).toBeVisible()
    await expect(page.getByText('Beta Industries')).toBeVisible()
  })
})
