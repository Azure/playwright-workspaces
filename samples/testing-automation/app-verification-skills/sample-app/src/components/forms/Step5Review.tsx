import { Invoice } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, PaperPlaneRight } from '@phosphor-icons/react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/helpers'

interface Step5Props {
  data: Partial<Invoice>
  onSubmit: () => void
  onBack: () => void
}

export function Step5Review({ data, onSubmit, onBack }: Step5Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Review & Submit</h2>
        <p className="text-muted-foreground mt-1">
          Please review all invoice details before submitting
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-4 bg-card">
            <h3 className="font-semibold text-lg">Vendor Information</h3>
            <Separator />
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>{' '}
                <span className="font-medium">{data.vendorName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">ID:</span>{' '}
                <span className="font-mono">{data.vendorId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Address:</span>{' '}
                <span>{data.vendorAddress}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4 bg-card">
            <h3 className="font-semibold text-lg">Invoice Details</h3>
            <Separator />
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Invoice Number:</span>{' '}
                <span className="font-mono font-medium">{data.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Invoice Date:</span>{' '}
                <span>{data.invoiceDate && formatDate(data.invoiceDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Currency:</span>{' '}
                <span className="font-medium">{data.currency}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4 bg-card">
            <h3 className="font-semibold text-lg">Bill To</h3>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="font-medium">{data.billToCompany}</div>
              <div className="text-muted-foreground">{data.billToAddress}</div>
              {data.billToTaxId && (
                <div className="text-muted-foreground">Tax ID: {data.billToTaxId}</div>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4 bg-card">
            <h3 className="font-semibold text-lg">Ship To</h3>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="font-medium">{data.shipToCompany}</div>
              <div className="text-muted-foreground">{data.shipToAddress}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-4 bg-card">
            <h3 className="font-semibold text-lg">Line Items</h3>
            <Separator />
            <div className="space-y-4">
              {data.lineItems?.map((item, index) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start gap-4 pb-4 last:pb-0 border-b last:border-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.quantity} × {formatCurrency(item.unitPrice, data.currency)}
                    </div>
                  </div>
                  <div className="font-mono font-medium">
                    {formatCurrency(item.amount, data.currency)}
                  </div>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatCurrency(data.subtotal || 0, data.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({data.taxPercent}%)</span>
                <span className="font-mono">{formatCurrency(data.taxAmount || 0, data.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="font-mono">
                  {formatCurrency(data.totalAmount || 0, data.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4 bg-card">
            <h3 className="font-semibold text-lg">Payment Details</h3>
            <Separator />
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Account Name:</span>{' '}
                <span className="font-medium">{data.accountName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Account Number:</span>{' '}
                <span className="font-mono">{data.accountNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Bank Name:</span>{' '}
                <span>{data.bankName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Payment Method:</span>{' '}
                <span>{data.paymentMethod}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4 bg-card">
            <h3 className="font-semibold text-lg">Compliance</h3>
            <Separator />
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Cost Centre:</span>{' '}
                <span className="font-medium">{data.costCentre}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Expense Category:</span>{' '}
                <span className="font-medium">{data.expenseCategory}</span>
              </div>
              {data.requiresApproval && (
                <>
                  <div>
                    <span className="text-muted-foreground">Approver:</span>{' '}
                    <span className="font-medium">{data.approver}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Approval Status:</span>{' '}
                    <Badge className={getStatusColor('approved')} variant="secondary">
                      {data.approvalStatus || 'Pending'}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back
        </Button>
        <Button onClick={onSubmit} size="lg" className="min-w-[200px]">
          <PaperPlaneRight size={20} weight="bold" className="mr-2" />
          Submit Invoice
        </Button>
      </div>
    </div>
  )
}
