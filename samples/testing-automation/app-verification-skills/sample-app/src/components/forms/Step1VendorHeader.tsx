import { useState } from 'react'
import { Invoice } from '@/lib/types'
import { mockVendors, currencies } from '@/lib/helpers'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DatePickerInput } from '@/components/ui/date-picker-input'
import { Checkbox } from '@/components/ui/checkbox'

interface Step1Props {
  data: Partial<Invoice>
  onChange: (data: Partial<Invoice>) => void
  onNext: () => void
}

export function Step1VendorHeader({ data, onChange, onNext }: Step1Props) {
  const [vendorSearch, setVendorSearch] = useState(data.vendorName || '')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredVendors = mockVendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(vendorSearch.toLowerCase())
  )

  const handleVendorSelect = (vendor: typeof mockVendors[0]) => {
    onChange({
      ...data,
      vendorName: vendor.name,
      vendorId: vendor.id,
      vendorAddress: vendor.address,
      vendorEmail: vendor.email,
    })
    setVendorSearch(vendor.name)
    setShowSuggestions(false)
  }

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
    if (
      data.vendorName && data.invoiceNumber && data.invoiceDate && data.currency &&
      data.billToCompany && data.billToAddress && data.shipToCompany && data.shipToAddress
    ) {
      onNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-concur-dark-blue border-b border-border pb-2">Vendor Details</h2>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative sm:col-span-2">
            <Label htmlFor="vendorName" className="text-xs font-semibold">
              Vendor Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vendorName"
              data-field-id="vendorName"
              aria-label="Vendor Name"
              value={vendorSearch}
              onChange={(e) => {
                setVendorSearch(e.target.value)
                setShowSuggestions(true)
                onChange({ ...data, vendorName: e.target.value })
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Start typing vendor name..."
              className="h-9 text-sm"
              required
            />
            {showSuggestions && filteredVendors.length > 0 && vendorSearch && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded shadow-lg max-h-60 overflow-auto">
                {filteredVendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    type="button"
                    onClick={() => handleVendorSelect(vendor)}
                    className="w-full px-3 py-2 text-left hover:bg-concur-light-blue transition-colors text-sm"
                  >
                    <div className="font-medium">{vendor.name}</div>
                    <div className="text-xs text-muted-foreground">{vendor.id}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="vendorId" className="text-xs font-semibold">Vendor ID</Label>
            <Input
              id="vendorId"
              data-field-id="vendorId"
              aria-label="Vendor ID"
              value={data.vendorId || ''}
              onChange={(e) => onChange({ ...data, vendorId: e.target.value })}
              placeholder="VND-001"
              className="h-9 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="vendorAddress" className="text-xs font-semibold">Vendor Address</Label>
            <Input
              id="vendorAddress"
              data-field-id="vendorAddress"
              aria-label="Vendor Address"
              value={data.vendorAddress || ''}
              onChange={(e) => onChange({ ...data, vendorAddress: e.target.value })}
              placeholder="123 Main St, City, State ZIP"
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-concur-dark-blue border-b border-border pb-2">Invoice Details</h2>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="invoiceNumber" className="text-xs font-semibold">
              Invoice Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invoiceNumber"
              data-field-id="invoiceNumber"
              aria-label="Invoice Number"
              value={data.invoiceNumber || ''}
              onChange={(e) => onChange({ ...data, invoiceNumber: e.target.value })}
              placeholder="INV-2024-001"
              className="h-9 text-sm"
              required
            />
          </div>

          <div>
            <Label htmlFor="currency" className="text-xs font-semibold">
              Currency <span className="text-destructive">*</span>
            </Label>
            <SearchableSelect
              id="currency"
              data-field-id="currency"
              aria-label="Currency"
              value={data.currency || ''}
              onValueChange={(value) => onChange({ ...data, currency: value })}
              options={currencies}
              placeholder="Type or select currency"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">
              Invoice Date <span className="text-destructive">*</span>
            </Label>
            <DatePickerInput
              data-field-id="invoiceDate"
              aria-label="Invoice Date"
              value={data.invoiceDate}
              onChange={(val) => onChange({ ...data, invoiceDate: val })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-concur-dark-blue border-b border-border pb-2">Bill To</h2>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="billToCompany" className="text-xs font-semibold">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="billToCompany"
              data-field-id="billToCompany"
              aria-label="Bill To Company Name"
              value={data.billToCompany || ''}
              onChange={(e) => onChange({ ...data, billToCompany: e.target.value })}
              placeholder="Your Company Inc."
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="billToAddress" className="text-xs font-semibold">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="billToAddress"
              data-field-id="billToAddress"
              aria-label="Bill To Address"
              value={data.billToAddress || ''}
              onChange={(e) => onChange({ ...data, billToAddress: e.target.value })}
              placeholder="123 Business Rd, City, State ZIP"
              className="h-9 text-sm"
              required
            />
          </div>

          <div>
            <Label htmlFor="billToTaxId" className="text-xs font-semibold">Tax ID / GST</Label>
            <Input
              id="billToTaxId"
              data-field-id="billToTaxId"
              aria-label="Bill To Tax ID"
              value={data.billToTaxId || ''}
              onChange={(e) => onChange({ ...data, billToTaxId: e.target.value })}
              placeholder="XX-XXXXXXX"
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        <Checkbox
          id="copyBillTo"
          data-field-id="copyBillToShip"
          aria-label="Copy billing information to shipping"
          onCheckedChange={handleCopyBillToShip}
        />
        <Label
          htmlFor="copyBillTo"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Copy billing information to shipping
        </Label>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-concur-dark-blue border-b border-border pb-2">Ship To</h2>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="shipToCompany" className="text-xs font-semibold">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shipToCompany"
              data-field-id="shipToCompany"
              aria-label="Ship To Company Name"
              value={data.shipToCompany || ''}
              onChange={(e) => onChange({ ...data, shipToCompany: e.target.value })}
              placeholder="Shipping Location Name"
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="shipToAddress" className="text-xs font-semibold">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shipToAddress"
              data-field-id="shipToAddress"
              aria-label="Ship To Address"
              value={data.shipToAddress || ''}
              onChange={(e) => onChange({ ...data, shipToAddress: e.target.value })}
              placeholder="456 Shipping St, City, State ZIP"
              className="h-9 text-sm"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t">
        <Button type="submit" className="bg-concur-blue hover:bg-concur-dark-blue">
          Continue
        </Button>
      </div>
    </form>
  )
}
