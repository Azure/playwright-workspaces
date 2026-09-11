import { test, expect, Page } from '@playwright/test'

// ── Mock Data ──────────────────────────────────────────────────────────

const mockInvoice = {
  id: 'INV-EDIT-001',
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
  ],
  subtotal: 250.0,
  taxPercent: 0,
  taxAmount: 0,
  totalAmount: 250.0,
  accountName: 'Acme Corp',
  accountNumber: '1234567890',
  bankName: 'Test Bank',
  paymentMethod: 'Wire Transfer',
  costCentre: 'Operations',
  expenseCategory: '',
  requiresApproval: false,
  approver: '',
  approvalStatus: '',
  status: 'submitted' as const,
  assignedTo: 'System',
  lastUpdated: '2024-06-15T10:00:00.000Z',
  createdAt: '2024-06-15T09:00:00.000Z',
}

// ── Helpers ────────────────────────────────────────────────────────────

async function setupApiMocksWithInvoice(page: Page, invoices: typeof mockInvoice[]) {
  const store = [...invoices]

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

// ── Edit Invoice E2E ───────────────────────────────────────────────────

test.describe('Edit Invoice Flow — End to End', () => {
  test('edit invoice fields and resubmit via PUT', async ({ page }) => {
    await setupApiMocksWithInvoice(page, [mockInvoice])
    await page.goto('/')

    // Click existing invoice to edit
    await page.getByText('Acme Corporation').click()
    await expect(page.getByText('Edit Invoice')).toBeVisible()
    await expect(page.getByText(`Invoice ID: ${mockInvoice.id}`)).toBeVisible()

    // Step 1 — modify vendor address
    await page.locator('[data-field-id="vendorAddress"]').fill('456 Updated Ave, Boston, MA 02101')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 2 — modify line item quantity
    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
    await page.getByLabel('Line item quantity').first().fill('20')
    await page.getByLabel('Line item unit price').first().fill('25')

    // Verify recalculated amount: 20 * 25 = 500
    await expect(page.getByRole('table').getByText('$500.00')).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3 — verify review summary reflects changes, then submit
    await expect(page.getByText('Payment Information')).toBeVisible()
    await expect(page.getByText('$500.00').first()).toBeVisible()

    // Approval is off for this invoice, so submit directly
    const putPromise = page.waitForRequest(
      (req) => req.url().includes('/api/invoices/') && req.method() === 'PUT'
    )

    await page.getByRole('button', { name: /Submit Invoice/i }).click()

    // Verify PUT request payload
    const putRequest = await putPromise
    const payload = putRequest.postDataJSON()
    expect(payload.id).toBe(mockInvoice.id)
    expect(payload.vendorAddress).toBe('456 Updated Ave, Boston, MA 02101')
    expect(payload.lineItems[0].quantity).toBe(20)
    expect(payload.status).toBe('submitted')

    // Verify success toast and return to queue
    await expect(page.getByText('Invoice submitted successfully')).toBeVisible({ timeout: 5000 })
  })

  test('edited invoice appears in queue after resubmit', async ({ page }) => {
    await setupApiMocksWithInvoice(page, [mockInvoice])
    await page.goto('/')

    await expect(page.getByText('1 invoice in queue')).toBeVisible()
    await page.getByText('Acme Corporation').click()

    // Quick edit — just change invoice number
    await page.locator('[data-field-id="invoiceNumber"]').fill('INV-2024-UPDATED')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Payment Information')).toBeVisible()

    await page.getByRole('button', { name: /Submit Invoice/i }).click()
    await expect(page.getByText('Invoice submitted successfully')).toBeVisible({ timeout: 5000 })

    // Should be back on queue with the invoice
    await expect(page.getByText('1 invoice in queue')).toBeVisible()
  })
})
