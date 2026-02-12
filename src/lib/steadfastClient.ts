import axios, { AxiosInstance } from 'axios';

interface SteadfastConfig {
  apiKey: string;
  secretKey: string;
  baseUrl?: string;
}

interface CreateOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export class SteadfastClient {
  private client: AxiosInstance;

  constructor(config: SteadfastConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://portal.steadfast.com.bd/api/v1',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': config.apiKey,
        'Secret-Key': config.secretKey,
      },
      transformRequest: [
        (data, headers) => {
          // Steadfast API sometimes requires specific headers or transformations
          return JSON.stringify(data);
        },
      ],
    });
  }

  async createOrder(payload: CreateOrderPayload) {
    try {
      const response = await this.client.post('/create_order', payload);
      return response.data;
    } catch (error) {
      console.error('Steadfast Create Order Error:', error);
      throw error;
    }
  }

  async checkDeliveryStatus(consignmentId: string) {
    try {
      const response = await this.client.get(`/status_by_cid/${consignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Steadfast Status Check Error:', error);
      throw error;
    }
  }

  async getBalance() {
    try {
      const response = await this.client.get('/get_balance');
      return response.data;
    } catch (error) {
      console.error('Steadfast Get Balance Error:', error);
      throw error;
    }
  }
}

export const steadfastClient = new SteadfastClient({
  apiKey: process.env.STEADFAST_API_KEY!,
  secretKey: process.env.STEADFAST_SECRET_KEY!,
});
