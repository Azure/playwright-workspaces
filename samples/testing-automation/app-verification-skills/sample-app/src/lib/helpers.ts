import { Invoice, Vendor } from './types'

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const generateInvoiceId = (): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  return `INV-${timestamp}-${random}`.toUpperCase()
}

export const calculateLineItemAmount = (quantity: number, unitPrice: number): number => {
  return Math.round(quantity * unitPrice * 100) / 100
}

export const calculateTaxAmount = (subtotal: number, taxPercent: number): number => {
  return Math.round(subtotal * (taxPercent / 100) * 100) / 100
}

export const calculateTotal = (subtotal: number, taxAmount: number): number => {
  return Math.round((subtotal + taxAmount) * 100) / 100
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'bg-[oklch(0.75_0.15_85)] text-[oklch(0.35_0.1_70)]'
    case 'pending':
      return 'bg-[oklch(0.60_0.18_240)] text-white'
    case 'approved':
      return 'bg-[oklch(0.65_0.18_145)] text-white'
    case 'submitted':
      return 'bg-[oklch(0.58_0.15_195)] text-white'
    default:
      return 'bg-secondary text-secondary-foreground'
  }
}

export const mockVendors: Vendor[] = [
  {
    name: 'Acme Corporation',
    id: 'VND-001',
    address: '123 Main Street, New York, NY 10001',
    email: 'billing@acmecorp.com',
  },
  {
    name: 'Global Supplies Ltd',
    id: 'VND-002',
    address: '456 Commerce Ave, San Francisco, CA 94102',
    email: 'accounts@globalsupplies.com',
  },
  {
    name: 'TechPro Solutions',
    id: 'VND-003',
    address: '789 Tech Park Dr, Austin, TX 78701',
    email: 'invoices@techpro.com',
  },
  {
    name: 'Premium Office Goods',
    id: 'VND-004',
    address: '321 Business Blvd, Chicago, IL 60601',
    email: 'billing@premiumoffice.com',
  },
  {
    name: 'Industrial Equipment Inc',
    id: 'VND-005',
    address: '555 Factory Lane, Detroit, MI 48201',
    email: 'ap@industrialequip.com',
  },
]

export const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
export const units = ['container', 'document', 'job', 'shipment', 'unit', 'hour', 'piece']
export const paymentMethods = ['Wire Transfer', 'ACH', 'Check', 'Credit Card']
export const costCentres = ['Operations', 'Sales', 'Marketing', 'IT', 'HR', 'Finance']
export const expenseCategories = [
  'Office Supplies',
  'Equipment',
  'Software',
  'Services',
  'Travel',
  'Utilities',
  'Professional Fees',
]
export const approvers = [
  'John Smith',
  'Sarah Johnson',
  'Michael Chen',
  'Emily Davis',
  'Robert Wilson',
]
