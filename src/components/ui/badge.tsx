import { cn } from "@/lib/utils";

/**
 * Badge — Status badge with predefined color variants for order statuses.
 */

type BadgeVariant =
  | "default"
  | "pending"
  | "warning"
  | "info"
  | "success"
  | "danger"
  | "purple"
  | "secondary";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  warning: "bg-orange-100 text-orange-800",
  info: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  danger: "bg-red-100 text-red-800",
  purple: "bg-purple-100 text-purple-800",
  secondary: "bg-indigo-100 text-indigo-800",
};

/** Maps order status strings to badge variants */
const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  pending: "pending",
  pending_confirmation: "danger",
  confirmed: "info",
  processing: "secondary",
  shipped: "purple",
  delivered: "success",
  cancelled: "default",
  returned: "warning",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Convenience component that auto-maps an order status to the correct color */
export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = STATUS_VARIANT_MAP[status] ?? "default";
  const label = status.replace(/_/g, " ");

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
