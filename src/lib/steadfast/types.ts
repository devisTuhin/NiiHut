export interface SteadfastCreateOrderPayload {
    invoice: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    note?: string;
}

export interface SteadfastCreateOrderResponse {
    status: number;
    message: string;
    consignment: {
        consignment_id: number;
        invoice: string;
        tracking_code: string;
        recipient_name: string;
        recipient_phone: string;
        recipient_address: string;
        cod_amount: number;
        status: string;
        note: string;
        created_at: string;
        updated_at: string;
        delivery_fee: number; // Inferred, might need adjustment based on real API
    };
}

export interface SteadfastErrorResponse {
    status: number;
    errors: Record<string, string[]>;
    message: string;
}
