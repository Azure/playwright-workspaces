import { Invoice } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft } from '@phosphor-icons/react'

interface Step2Props {
  data: Partial<Invoice>
  onChange: (data: Partial<Invoice>) => void
  onNext: () => void
  onBack: () => void
}

export function Step2BillShipTo({ data, onChange, onNext, onBack }: Step2Props) {
  const handleCopyBillToShip = (checked: boolean) => {
    if (checked) {
      onChange({
        ...data,
        shipToCompany: data.billToCompany,
        shipToAddress: data.billToAddress,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.billToCompany && data.billToAddress && data.shipToCompany && data.shipToAddress) {
      onNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Bill To</h2>
        
        <div className="grid gap-4">
          <div>
            <Label htmlFor="billToCompany">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="billToCompany"
              value={data.billToCompany || ''}
              onChange={(e) => onChange({ ...data, billToCompany: e.target.value })}
              placeholder="Your Company Inc."
              required
            />
          </div>

          <div>
            <Label htmlFor="billToAddress">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="billToAddress"
              value={data.billToAddress || ''}
              onChange={(e) => onChange({ ...data, billToAddress: e.target.value })}
              placeholder="123 Business Rd, City, State ZIP"
              required
            />
          </div>

          <div>
            <Label htmlFor="billToTaxId">Tax ID / GST</Label>
            <Input
              id="billToTaxId"
              value={data.billToTaxId || ''}
              onChange={(e) => onChange({ ...data, billToTaxId: e.target.value })}
              placeholder="XX-XXXXXXX"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 py-4">
        <Checkbox
          id="copyBillTo"
          onCheckedChange={handleCopyBillToShip}
        />
        <Label
          htmlFor="copyBillTo"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Copy billing information to shipping
        </Label>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Ship To</h2>
        
        <div className="grid gap-4">
          <div>
            <Label htmlFor="shipToCompany">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shipToCompany"
              value={data.shipToCompany || ''}
              onChange={(e) => onChange({ ...data, shipToCompany: e.target.value })}
              placeholder="Shipping Location Name"
              required
            />
          </div>

          <div>
            <Label htmlFor="shipToAddress">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shipToAddress"
              value={data.shipToAddress || ''}
              onChange={(e) => onChange({ ...data, shipToAddress: e.target.value })}
              placeholder="456 Shipping St, City, State ZIP"
              required
            />
          </div>


        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back
        </Button>
        <Button type="submit" size="lg">
          Continue
        </Button>
      </div>
    </form>
  )
}
