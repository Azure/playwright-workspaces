import { Invoice } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/helpers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, FileText, MagnifyingGlass } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'

interface InvoiceQueueProps {
  invoices: Invoice[]
  loading?: boolean
  onAddNew: () => void
  onSelectInvoice: (invoice: Invoice) => void
}

export function InvoiceQueue({ invoices, loading, onAddNew, onSelectInvoice }: InvoiceQueueProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-concur-blue mb-4"></div>
        <p className="text-muted-foreground">Loading invoices...</p>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-secondary rounded-full p-6 mb-6">
          <FileText size={64} weight="thin" className="text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No invoices yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Get started by creating your first invoice. Track vendors, line items, and approval workflows all in one place.
        </p>
        <Button onClick={onAddNew} size="lg" className="bg-concur-blue hover:bg-concur-dark-blue">
          <Plus size={20} weight="bold" className="mr-2" />
          Create New Invoice
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border-b shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-concur-dark-blue">Invoice Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} in queue
            </p>
          </div>
          <Button onClick={onAddNew} className="bg-concur-blue hover:bg-concur-dark-blue">
            <Plus size={18} weight="bold" className="mr-2" />
            Create New Invoice
          </Button>
        </div>
      </div>

      <div className="px-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              data-field-id="queueSearch"
              aria-label="Search invoices"
              placeholder="Search invoices..." 
              className="pl-10 bg-white border-border h-9 text-sm"
            />
          </div>
        </div>

        <div className="bg-white border rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-concur-light-blue border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-concur-dark-blue uppercase tracking-wider">Invoice ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-concur-dark-blue uppercase tracking-wider">Vendor Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-concur-dark-blue uppercase tracking-wider">Invoice Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-concur-dark-blue uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-concur-dark-blue uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-concur-dark-blue uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-concur-dark-blue uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => onSelectInvoice(invoice)}
                    className="hover:bg-concur-light-blue/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-lato text-concur-blue font-semibold">{invoice.id}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-foreground">{invoice.vendorName}</div>
                      <div className="text-xs text-muted-foreground">{invoice.vendorId}</div>
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{formatDate(invoice.invoiceDate)}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-lato font-semibold text-foreground">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className={getStatusColor(invoice.status)} variant="secondary">
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{invoice.assignedTo}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatDate(invoice.lastUpdated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
