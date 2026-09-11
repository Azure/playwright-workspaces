import { Invoice } from '@/lib/types'

const API_BASE = '/api/invoices'

export async function fetchInvoices(): Promise<Invoice[]> {
  const response = await fetch(API_BASE)
  if (!response.ok) {
    throw new Error(`Failed to fetch invoices: ${response.status}`)
  }
  return response.json()
}

export async function createInvoice(invoice: Invoice): Promise<Invoice> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice),
  })
  if (!response.ok) {
    throw new Error(`Failed to create invoice: ${response.status}`)
  }
  return response.json()
}

export async function updateInvoice(invoice: Invoice): Promise<Invoice> {
  const response = await fetch(`${API_BASE}/${invoice.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice),
  })
  if (!response.ok) {
    throw new Error(`Failed to update invoice: ${response.status}`)
  }
  return response.json()
}
