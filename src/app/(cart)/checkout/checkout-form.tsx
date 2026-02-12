'use client';

/**
 * CheckoutForm — Client component for COD delivery details.
 * Collects recipient name, phone, address, city, area, and notes.
 * Calls createCodOrder server action with CheckoutFormData shape.
 */

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createCodOrder } from '@/server-actions/order';
import { Loader2, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface FormFields {
  recipientName: string;
  phoneNumber: string;
  address: string;
  city: string;
  area: string;
  note: string;
}

export function CheckoutForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [formData, setFormData] = useState<FormFields>({
    recipientName: '',
    phoneNumber: '',
    address: '',
    city: '',
    area: '',
    note: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FormFields]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormFields, string>> = {};

    if (!formData.recipientName.trim()) errors.recipientName = 'Recipient name is required';
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^01[3-9]\d{8}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = 'Enter a valid Bangladesh phone number (e.g. 01712345678)';
    }
    if (!formData.address.trim()) errors.address = 'Delivery address is required';
    if (!formData.city.trim()) errors.city = 'City is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    startTransition(async () => {
      try {
        const result = await createCodOrder({
          phoneNumber: formData.phoneNumber.trim(),
          recipientName: formData.recipientName.trim(),
          shippingAddress: {
            address: formData.address.trim(),
            city: formData.city.trim(),
            area: formData.area.trim(),
            note: formData.note.trim() || undefined,
          },
        });

        if (result.success) {
          router.push(`/profile?order=success`);
        } else {
          setError(result.error || 'Failed to place order. Please try again.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-gray-400" />
        <h2 className="font-semibold text-gray-900">Delivery Details</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Recipient Name"
          name="recipientName"
          placeholder="Enter recipient's full name"
          value={formData.recipientName}
          onChange={handleChange}
          error={fieldErrors.recipientName}
          required
        />
        <Input
          label="Phone Number"
          name="phoneNumber"
          type="tel"
          placeholder="01712345678"
          value={formData.phoneNumber}
          onChange={handleChange}
          error={fieldErrors.phoneNumber}
          required
        />
      </div>

      <Input
        label="Delivery Address"
        name="address"
        placeholder="House, Road, Area details"
        value={formData.address}
        onChange={handleChange}
        error={fieldErrors.address}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="City"
          name="city"
          placeholder="e.g. Dhaka"
          value={formData.city}
          onChange={handleChange}
          error={fieldErrors.city}
          required
        />
        <Input
          label="Area / Thana"
          name="area"
          placeholder="e.g. Mirpur"
          value={formData.area}
          onChange={handleChange}
          error={fieldErrors.area}
        />
      </div>

      <Textarea
        label="Order Notes (Optional)"
        name="note"
        placeholder="Any special instructions for delivery..."
        value={formData.note}
        onChange={handleChange}
        rows={3}
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Placing Order…
          </>
        ) : (
          'Place Order — Cash on Delivery'
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        By placing your order, you agree to our terms and conditions.
        You will pay the delivery person upon receiving your package.
      </p>
    </form>
  );
}
