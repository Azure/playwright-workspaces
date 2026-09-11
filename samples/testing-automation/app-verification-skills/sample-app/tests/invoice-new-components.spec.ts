import { test, expect, Page } from '@playwright/test'

// ── Helpers ────────────────────────────────────────────────────────────

async function setupApiMocks(page: Page) {
  await page.route('**/api/invoices', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    } else if (method === 'POST') {
      const body = route.request().postDataJSON()
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(body) })
    } else {
      await route.continue()
    }
  })
}

async function navigateToStep1(page: Page) {
  await setupApiMocks(page)
  await page.goto('/')
  await page.getByRole('button', { name: /Create New Invoice/i }).click()
  await expect(page.getByText('Vendor Details')).toBeVisible()
}

// ── DatePickerInput Tests ──────────────────────────────────────────────

test.describe('DatePickerInput', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToStep1(page)
  })

  test('selecting a date from the calendar populates the input', async ({ page }) => {
    await page.getByRole('button', { name: 'Open calendar' }).click()

    const calendar = page.getByRole('grid')
    await expect(calendar).toBeVisible()

    // Select the 1st day of the currently visible month
    const dayButton = calendar.getByRole('button', { name: /1st,/ }).first()
    await dayButton.click()

    // Calendar should close and input should be populated with a formatted date
    const dateInput = page.locator('[data-field-id="invoiceDate"]')
    await expect(dateInput).not.toHaveValue('')
    // Value should match MM/DD/YYYY format
    await expect(dateInput).toHaveValue(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  test('invalid date input shows error message', async ({ page }) => {
    const dateInput = page.locator('[data-field-id="invoiceDate"]')

    await dateInput.fill('not-a-date')
    await dateInput.press('Tab')

    await expect(page.getByText('Invalid date. Try MM/DD/YYYY')).toBeVisible()

    // Fix with a valid date — error should disappear
    await dateInput.fill('01/15/2025')
    await dateInput.press('Tab')

    await expect(page.getByText('Invalid date. Try MM/DD/YYYY')).not.toBeVisible()
    await expect(dateInput).toHaveValue('01/15/2025')
  })

  test('multiple date formats are accepted', async ({ page }) => {
    const dateInput = page.locator('[data-field-id="invoiceDate"]')

    // Test MM-DD-YYYY format
    await dateInput.fill('01-15-2025')
    await dateInput.press('Tab')
    await expect(dateInput).toHaveValue('01/15/2025')

    // Test YYYY-MM-DD format
    await dateInput.fill('2025-06-20')
    await dateInput.press('Tab')
    await expect(dateInput).toHaveValue('06/20/2025')
  })
})

// ── SearchableSelect Tests ─────────────────────────────────────────────

test.describe('SearchableSelect', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToStep1(page)
  })

  test('typing filters dropdown options', async ({ page }) => {
    const currencyCombo = page.getByRole('combobox', { name: 'Currency' })
    await currencyCombo.click()
    await currencyCombo.fill('gb')

    // Only GBP should be visible
    await expect(page.getByRole('option', { name: 'GBP' })).toBeVisible()
    await expect(page.getByRole('option', { name: 'USD' })).toHaveCount(0)
    await expect(page.getByRole('option', { name: 'EUR' })).toHaveCount(0)

    // Select the filtered option
    await page.getByRole('option', { name: 'GBP' }).click()
    await expect(currencyCombo).toHaveValue('GBP')
  })

  test('shows "No matches found" for unmatched search', async ({ page }) => {
    const currencyCombo = page.getByRole('combobox', { name: 'Currency' })
    await currencyCombo.click()
    await currencyCombo.fill('xyz')

    await expect(page.getByText('No matches found')).toBeVisible()
    await expect(page.getByRole('option')).toHaveCount(0)
  })

  test('escape key closes dropdown without selecting', async ({ page }) => {
    const currencyCombo = page.getByRole('combobox', { name: 'Currency' })
    await currencyCombo.click()

    // Options should be visible
    await expect(page.getByRole('option').first()).toBeVisible()

    await currencyCombo.press('Escape')

    // Dropdown should close
    await expect(page.getByRole('option')).toHaveCount(0)
    // No value should be selected
    await expect(currencyCombo).toHaveValue('')
  })
})
