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

async function fillStep3PaymentOnly(page: Page) {
  await page.locator('[data-field-id="accountName"]').fill('Test Account')
  await page.locator('[data-field-id="accountNumber"]').fill('9876543210')
  await page.locator('[data-field-id="bankName"]').fill('National Bank')
  await selectSearchableOption(page, 'paymentMethod', 'Wire Transfer')
  await selectSearchableOption(page, 'costCentre', 'Operations')
}

// ── Invoice Queue Tests ────────────────────────────────────────────────

test.describe('Invoice Queue', () => {
  test('shows empty state when no invoices exist', async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')

    await expect(page.getByText('No invoices yet')).toBeVisible()
    await expect(page.getByRole('button', { name: /Create New Invoice/i })).toBeVisible()
  })

  test('shows invoice table when invoices exist', async ({ page }) => {
    await setupApiMocks(page, [mockInvoice])
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Invoice Management' })).toBeVisible()
    await expect(page.getByText('1 invoice in queue')).toBeVisible()
    await expect(page.getByText('Acme Corporation')).toBeVisible()
    await expect(page.getByText('INV-TEST-001')).toBeVisible()
  })

  test('clicking "Create New Invoice" opens the form', async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')

    await page.getByRole('button', { name: /Create New Invoice/i }).click()

    await expect(page.getByText('Create New Invoice')).toBeVisible()
    await expect(page.getByText('Vendor Details')).toBeVisible()
  })

  test('clicking a table row opens the edit form', async ({ page }) => {
    await setupApiMocks(page, [mockInvoice])
    await page.goto('/')

    await page.getByText('Acme Corporation').click()

    await expect(page.getByText('Edit Invoice')).toBeVisible()
    await expect(page.getByText(`Invoice ID: ${mockInvoice.id}`)).toBeVisible()
  })
})

// ── Step 1 Tests ───────────────────────────────────────────────────────

test.describe('Step 1 — Vendor & Header Details', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await page.getByRole('button', { name: /Create New Invoice/i }).click()
    await expect(page.getByText('Vendor Details')).toBeVisible()
  })

  test('vendor autocomplete fills vendor details', async ({ page }) => {
    const vendorInput = page.locator('[data-field-id="vendorName"]')
    await vendorInput.fill('Tech')
    await page.getByText('TechPro Solutions').click()

    await expect(page.locator('[data-field-id="vendorId"]')).toHaveValue('VND-003')
    await expect(page.locator('[data-field-id="vendorAddress"]')).toHaveValue('789 Tech Park Dr, Austin, TX 78701')
  })

  test('copy billing to shipping checkbox works', async ({ page }) => {
    await page.locator('[data-field-id="billToCompany"]').fill('My Corp')
    await page.locator('[data-field-id="billToAddress"]').fill('123 Main St')

    await page.locator('[data-field-id="copyBillToShip"]').click()

    await expect(page.locator('[data-field-id="shipToCompany"]')).toHaveValue('My Corp')
    await expect(page.locator('[data-field-id="shipToAddress"]')).toHaveValue('123 Main St')
  })

  test('Continue advances to Step 2 when all required fields filled', async ({ page }) => {
    await fillStep1(page)
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
  })

  test('Continue does not advance with missing required fields', async ({ page }) => {
    const vendorInput = page.locator('[data-field-id="vendorName"]')
    await vendorInput.fill('Acme')
    await page.getByText('Acme Corporation').click()

    await page.getByRole('button', { name: 'Continue' }).click()

    // Should still be on Step 1
    await expect(page.getByText('Vendor Details')).toBeVisible()
  })
})

// ── Step 2 Tests ───────────────────────────────────────────────────────

test.describe('Step 2 — Line Items', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await page.getByRole('button', { name: /Create New Invoice/i }).click()
    await fillStep1(page)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
  })

  test('default line item exists on entry', async ({ page }) => {
    await expect(page.getByLabel('Line item description').first()).toBeVisible()
  })

  test('filling line item calculates amount', async ({ page }) => {
    await page.getByLabel('Line item description').first().fill('Test Item')
    await page.getByLabel('Line item quantity').first().fill('5')
    await page.getByLabel('Line item unit price').first().fill('20')

    // Amount appears in the table row
    await expect(page.getByRole('table').getByText('$100.00')).toBeVisible()
  })

  test('add and remove line items', async ({ page }) => {
    await page.getByRole('button', { name: /Add Line Item/i }).click()

    const descInputs = page.getByLabel('Line item description')
    await expect(descInputs).toHaveCount(2)

    const deleteButton = page.locator('button:has(svg.text-destructive)').first()
    await deleteButton.click({ force: true })

    await expect(page.getByLabel('Line item description')).toHaveCount(1)
  })

  test('tax percentage updates totals', async ({ page }) => {
    await page.getByLabel('Line item description').first().fill('Item')
    await page.getByLabel('Line item quantity').first().fill('1')
    await page.getByLabel('Line item unit price').first().fill('100')

    const taxInput = page.locator('[data-field-id="taxPercent"]')
    await taxInput.fill('10')

    await expect(page.getByText('$10.00')).toBeVisible()
    await expect(page.getByText('$110.00')).toBeVisible()
  })

  test('Back button returns to Step 1', async ({ page }) => {
    await page.getByRole('button', { name: /^Back$/ }).click()

    await expect(page.getByText('Vendor Details')).toBeVisible()
  })

  test('Continue advances to Step 3 with valid line items', async ({ page }) => {
    await fillStep2(page)
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByText('Payment Information')).toBeVisible()
  })

  test('Continue does not advance with empty description', async ({ page }) => {
    await page.getByLabel('Line item quantity').first().fill('5')
    await page.getByLabel('Line item unit price').first().fill('20')

    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
  })
})

// ── Step 3 Tests ───────────────────────────────────────────────────────

test.describe('Step 3 — Payment & Review', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await page.getByRole('button', { name: /Create New Invoice/i }).click()
    await fillStep1(page)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
    await fillStep2(page)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Payment Information')).toBeVisible()
  })

  test('shows review summary with data from previous steps', async ({ page }) => {
    await expect(page.getByText('Review Summary')).toBeVisible()
    await expect(page.getByText('Acme Corporation')).toBeVisible()
    await expect(page.getByText('INV-2024-200')).toBeVisible()
    await expect(page.getByText('My Company Inc').first()).toBeVisible()
    await expect(page.getByText('Consulting Services')).toBeVisible()
  })

  test('approval toggle shows/hides approver field', async ({ page }) => {
    await expect(page.locator('[data-field-id="approver"]')).toBeVisible()

    await page.locator('[data-field-id="requiresApproval"]').click()

    await expect(page.locator('[data-field-id="approver"]')).not.toBeVisible()
  })

  test('submit without approval skips OTP modal', async ({ page }) => {
    await page.locator('[data-field-id="requiresApproval"]').click()

    await fillStep3PaymentOnly(page)

    await page.getByRole('button', { name: /Submit Invoice/i }).click()

    await expect(page.getByText('Invoice submitted successfully')).toBeVisible()
  })

  test('submit with approval shows OTP modal', async ({ page }) => {
    await fillStep3(page)

    await page.getByRole('button', { name: /Request Approval & Submit/i }).click()

    await expect(page.getByText('Approval Required')).toBeVisible()
    await expect(page.getByText('Demo mode: Enter any 6 digits to approve')).toBeVisible()
  })

  test('entering OTP submits invoice and returns to queue', async ({ page }) => {
    await fillStep3(page)

    await page.getByRole('button', { name: /Request Approval & Submit/i }).click()
    await expect(page.getByText('Approval Required')).toBeVisible()

    const otpInput = page.locator('[data-field-id="approvalOtp"]')
    await otpInput.pressSequentially('123456')

    await expect(page.getByText('Invoice submitted successfully')).toBeVisible({ timeout: 5000 })
  })

  test('Back button returns to Step 2', async ({ page }) => {
    await page.getByRole('button', { name: /^Back$/ }).click()

    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
  })
})

// ── Full Happy Path Tests ──────────────────────────────────────────────

test.describe('Full Happy Path', () => {
  test('create invoice with approval — end to end', async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')

    await expect(page.getByText('No invoices yet')).toBeVisible()
    await page.getByRole('button', { name: /Create New Invoice/i }).click()

    // Step 1
    await fillStep1(page)
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 2
    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
    await fillStep2(page)
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3
    await expect(page.getByText('Payment Information')).toBeVisible()
    await fillStep3(page)

    const postPromise = page.waitForRequest(
      (req) => req.url().includes('/api/invoices') && req.method() === 'POST'
    )

    await page.getByRole('button', { name: /Request Approval & Submit/i }).click()
    await expect(page.getByText('Approval Required')).toBeVisible()

    const otpInput = page.locator('[data-field-id="approvalOtp"]')
    await otpInput.pressSequentially('999999')

    const postRequest = await postPromise
    const payload = postRequest.postDataJSON()

    expect(payload.vendorName).toBe('Acme Corporation')
    expect(payload.invoiceNumber).toBe('INV-2024-200')
    expect(payload.currency).toBe('USD')
    expect(payload.billToCompany).toBe('My Company Inc')
    expect(payload.shipToCompany).toBe('My Company Inc')
    expect(payload.lineItems).toHaveLength(1)
    expect(payload.lineItems[0].description).toBe('Consulting Services')
    expect(payload.accountName).toBe('Test Account')
    expect(payload.paymentMethod).toBe('Wire Transfer')
    expect(payload.status).toBe('submitted')

    await expect(page.getByText('Invoice submitted successfully')).toBeVisible({ timeout: 5000 })
  })

  test('create invoice without approval — end to end', async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')

    await page.getByRole('button', { name: /Create New Invoice/i }).click()

    // Step 1
    await fillStep1(page)
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 2
    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
    await fillStep2(page)
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3 — disable approval
    await expect(page.getByText('Payment Information')).toBeVisible()
    await page.locator('[data-field-id="requiresApproval"]').click()
    await fillStep3PaymentOnly(page)

    await page.getByRole('button', { name: /Submit Invoice/i }).click()

    await expect(page.getByText('Invoice submitted successfully')).toBeVisible({ timeout: 5000 })
  })
})

// ── Navigation Tests ───────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('"Back to Queue" button from form returns to queue', async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await page.getByRole('button', { name: /Create New Invoice/i }).click()
    await expect(page.getByText('Create New Invoice')).toBeVisible()

    await page.getByRole('button', { name: /Back to Queue/i }).click()

    await expect(page.getByText('No invoices yet')).toBeVisible()
  })

  test('header Queue button returns to queue', async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await page.getByRole('button', { name: /Create New Invoice/i }).click()
    await expect(page.getByText('Create New Invoice')).toBeVisible()

    await page.getByRole('button', { name: /Queue/i }).first().click()

    await expect(page.getByText('No invoices yet')).toBeVisible()
  })

  test('step indicator reflects current step', async ({ page }) => {
    await setupApiMocks(page, [])
    await page.goto('/')
    await page.getByRole('button', { name: /Create New Invoice/i }).click()

    await expect(page.getByText('Details', { exact: true })).toBeVisible()
    await expect(page.getByText('Payment & Review')).toBeVisible()

    await fillStep1(page)
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
  })
})

// ── API Error Handling Tests ───────────────────────────────────────────

test.describe('API Error Handling', () => {
  test('shows error toast when invoice list fails to load', async ({ page }) => {
    await page.route('**/api/invoices', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) })
      }
    })
    await page.goto('/')

    await expect(page.getByText('Failed to load invoices')).toBeVisible()
  })

  test('shows error toast when invoice submission fails', async ({ page }) => {
    await page.route('**/api/invoices', async (route) => {
      const method = route.request().method()
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      } else if (method === 'POST') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Submit failed' }) })
      }
    })
    await page.goto('/')
    await page.getByRole('button', { name: /Create New Invoice/i }).click()

    await fillStep1(page)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
    await fillStep2(page)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Payment Information')).toBeVisible()

    await page.locator('[data-field-id="requiresApproval"]').click()
    await fillStep3PaymentOnly(page)

    await page.getByRole('button', { name: /Submit Invoice/i }).click()

    await expect(page.getByText('Failed to submit invoice')).toBeVisible()
  })
})
