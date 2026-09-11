export type InvoiceStatus = 'draft' | 'pending' | 'approved' | 'submitted'

export interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  amount: number
}

export interface Invoice {
  id: string
  vendorName: string
  vendorId: string
  vendorAddress: string
  vendorEmail: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  currency: string
  purchaseOrderRef: string
  billToCompany: string
  billToAddress: string
  billToTaxId: string
  billToEmail: string
  shipToCompany: string
  shipToAddress: string
  shipToContact: string
  lineItems: LineItem[]
  subtotal: number
  taxPercent: number
  taxAmount: number
  totalAmount: number
  accountName: string
  accountNumber: string
  bankName: string
  paymentMethod: string
  costCentre: string
  expenseCategory: string
  requiresApproval: boolean
  approver: string
  approvalStatus: string
  status: InvoiceStatus
  assignedTo: string
  lastUpdated: string
  createdAt: string
}

export interface Vendor {
  name: string
  id: string
  address: string
  email: string
}
