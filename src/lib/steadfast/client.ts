import { SteadfastCreateOrderPayload, SteadfastCreateOrderResponse, SteadfastErrorResponse } from "./types";

const BASE_URL = process.env.STEADFAST_BASE_URL || "https://portal.steadfast.com.bd/api/v1";
const API_KEY = process.env.STEADFAST_API_KEY;
const SECRET_KEY = process.env.STEADFAST_SECRET_KEY;

export class SteadfastClient {
    private apiKey: string;
    private secretKey: string;

    constructor() {
        if (!API_KEY || !SECRET_KEY) {
            console.warn("Steadfast API keys are missing. Courier integration will fail.");
        }
        this.apiKey = API_KEY || "";
        this.secretKey = SECRET_KEY || "";
    }

    private getHeaders() {
        return {
            "Content-Type": "application/json",
            "Api-Key": this.apiKey,
            "Secret-Key": this.secretKey
        };
    }

    async createOrder(payload: SteadfastCreateOrderPayload): Promise<SteadfastCreateOrderResponse> {
        const response = await fetch(`${BASE_URL}/create_order`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json() as SteadfastErrorResponse;
            throw new Error(errorData.message || `Steadfast API Error: ${response.status}`);
        }

        return await response.json();
    }

    async checkStatus(consignmentId: number | string) {
        const response = await fetch(`${BASE_URL}/status_by_cid/${consignmentId}`, {
            method: "GET",
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to check status: ${response.status}`);
        }
        
        return await response.json();
    }
}

export const steadfastClient = new SteadfastClient();
