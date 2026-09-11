import { useState } from 'react'
import { Invoice } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ArrowLeft, ShieldCheck, PaperPlaneRight } from '@phosphor-icons/react'
import { paymentMethods, costCentres, approvers, formatCurrency, formatDate, getStatusColor } from '@/lib/helpers'

interface Step4Props {
  data: Partial<Invoice>
  onChange: (data: Partial<Invoice>) => void
  onSubmit: () => void
  onBack: () => void
}

export function Step4PaymentCompliance({ data, onChange, onSubmit, onBack }: Step4Props) {
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [otpValue, setOtpValue] = useState('')

  const isFormValid =
    data.accountName &&
    data.accountNumber &&
    data.bankName &&
    data.paymentMethod &&
    data.costCentre

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) return

    if (data.requiresApproval && !data.approvalStatus) {
      setShowApprovalModal(true)
    } else {
      onSubmit()
    }
  }

  const handleOtpComplete = (value: string) => {
    setOtpValue(value)
    if (value.length === 6) {
      setTimeout(() => {
        onChange({ ...data, approvalStatus: 'Approved' })
        setShowApprovalModal(false)
        onSubmit()
      }, 500)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Payment Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="accountName">
                Account Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountName"
                data-field-id="accountName"
                aria-label="Account Name"
                value={data.accountName || ''}
                onChange={(e) => onChange({ ...data, accountName: e.target.value })}
                placeholder="Account Holder Name"
                required
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">
                Account Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountNumber"
                data-field-id="accountNumber"
                aria-label="Account Number"
                value={data.accountNumber || ''}
                onChange={(e) => onChange({ ...data, accountNumber: e.target.value })}
                placeholder="XXXXXXXXXX"
                required
              />
            </div>

            <div>
              <Label htmlFor="bankName">
                Bank Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bankName"
                data-field-id="bankName"
                aria-label="Bank Name"
                value={data.bankName || ''}
                onChange={(e) => onChange({ ...data, bankName: e.target.value })}
                placeholder="Bank Name"
                required
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod">
                Payment Method <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                id="paymentMethod"
                data-field-id="paymentMethod"
                aria-label="Payment Method"
                value={data.paymentMethod || ''}
                onValueChange={(value) => onChange({ ...data, paymentMethod: value })}
                options={paymentMethods}
                placeholder="Type or select method"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Compliance & Approval</h2>

          <div>
            <Label htmlFor="costCentre">
              Cost Centre <span className="text-destructive">*</span>
            </Label>
            <SearchableSelect
              id="costCentre"
              data-field-id="costCentre"
              aria-label="Cost Centre"
              value={data.costCentre || ''}
              onValueChange={(value) => onChange({ ...data, costCentre: value })}
              options={costCentres}
              placeholder="Type or select cost centre"
              required
            />
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex-1">
              <Label htmlFor="requiresApproval" className="text-base font-medium">
                Requires Approval
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Enable if this invoice requires manager approval
              </p>
            </div>
            <Switch
              id="requiresApproval"
              data-field-id="requiresApproval"
              aria-label="Requires Approval"
              checked={data.requiresApproval || false}
              onCheckedChange={(checked) => onChange({ ...data, requiresApproval: checked })}
            />
          </div>

          {data.requiresApproval && (
            <div>
              <Label htmlFor="approver">
                Approver <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                id="approver"
                data-field-id="approver"
                aria-label="Approver"
                value={data.approver || ''}
                onValueChange={(value) => onChange({ ...data, approver: value })}
                options={approvers}
                placeholder="Type or select approver"
                required
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Review Summary</h2>
          <p className="text-muted-foreground text-sm">
            Please review all invoice details before submitting
          </p>

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
                  {data.lineItems?.map((item) => (
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
                    <span className="text-muted-foreground">Tax ({data.taxPercent ?? 5}%)</span>
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

              {data.requiresApproval && (
                <div className="border rounded-lg p-6 space-y-4 bg-card">
                  <h3 className="font-semibold text-lg">Approval</h3>
                  <Separator />
                  <div className="space-y-3 text-sm">
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft size={16} weight="bold" className="mr-2" />
            Back
          </Button>
          <Button type="submit" size="lg" className="min-w-[200px]">
            <PaperPlaneRight size={20} weight="bold" className="mr-2" />
            {data.requiresApproval && !data.approvalStatus ? 'Request Approval & Submit' : 'Submit Invoice'}
          </Button>
        </div>
      </form>

      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-accent/20 p-4 rounded-full">
                <ShieldCheck size={48} weight="duotone" className="text-accent" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Approval Required</DialogTitle>
            <DialogDescription className="text-center">
              This invoice requires approval from <strong>{data.approver}</strong>. Please enter
              the 6-digit OTP sent to the approver to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6">
            <InputOTP maxLength={6} value={otpValue} onChange={handleOtpComplete} data-field-id="approvalOtp" aria-label="Approval OTP code">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-muted-foreground text-center">
              Demo mode: Enter any 6 digits to approve
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
