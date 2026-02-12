'use client';

/**
 * OrderActions — Client component for admin order management actions.
 * Provides Confirm, Ship, Cancel, and Check Status buttons based on order state.
 */

import { cancelOrder, confirmOrder, updateOrderStatus } from '@/server-actions/admin';
import { checkParcelStatus } from '@/server-actions/steadfast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function OrderActions({ order }: { order: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (action: () => Promise<any>) => {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        console.error('Order action failed:', err);
      }
    });
  };

  if (isPending) {
    return (
      <div className="flex justify-end">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Confirm */}
      {(order.status === 'pending' || order.status === 'pending_confirmation') && (
        <button
          onClick={() => handleAction(() => confirmOrder(order.id))}
          className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md hover:bg-green-100 transition-colors"
        >
          Confirm
        </button>
      )}

      {/* Ship (mark as shipped) */}
      {order.status === 'confirmed' && (
        <button
          onClick={() =>
            handleAction(() => updateOrderStatus(order.id, 'shipped'))
          }
          className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors"
        >
          Ship
        </button>
      )}

      {/* Check Status */}
      {order.tracking_number && order.status === 'shipped' && (
        <button
          onClick={() =>
            handleAction(() => checkParcelStatus(order.id))
          }
          className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md hover:bg-purple-100 transition-colors"
        >
          Check
        </button>
      )}

      {/* Cancel */}
      {!['delivered', 'cancelled', 'returned'].includes(order.status) && (
        <button
          onClick={() => handleAction(() => cancelOrder(order.id))}
          className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-md hover:bg-red-100 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
