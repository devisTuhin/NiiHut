import { SupabaseClient } from '@supabase/supabase-js';

// Define the structure of the risk analysis result
export interface RiskAnalysisResult {
    score: number;
    flagged: boolean;
    blocked: boolean;
    factors: { factor: string; points: number }[];
    action: 'approve' | 'flag' | 'block';
}

interface RiskFactor {
    factor: string;
    points: number;
}

export class RiskEngine {
    private supabase: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Main function to evaluate risk for an order
     */
    async evaluateOrder(
        userId: string | null,
        phone: string,
        totalAmount: number,
        shippingAddress: any
    ): Promise<RiskAnalysisResult> {
        let score = 0;
        const factors: RiskFactor[] = [];

        // Constants (Hardcoded for now as risk_rules table is missing in observed schema)
        const THRESHOLD_FLAG = 30;
        const THRESHOLD_BLOCK = 70;
        const HIGH_VALUE_LIMIT = 5000;
        
        // 1. Fetch User Stats (if user exists)
        let user: any = null;
        if (userId) {
             const { data } = await this.supabase
            .from('users')
            .select('created_at') // Add other stats if available in schema, simplified for now
            .eq('id', userId)
            .single();
            user = data;
        }

        // 2. New User Check
        if (user) {
            const hrsSinceCreation = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60);
            if (hrsSinceCreation < 24) {
                const points = 10;
                score += points;
                factors.push({ factor: 'New Account (<24h)', points });
            }
        }

        // 3. High Value Order
        if (totalAmount > HIGH_VALUE_LIMIT) {
             score += 20;
             factors.push({ factor: 'High Value Order', points: 20 });
        }

        // 4. Order Velocity (Hoarding Check)
        // Count active orders for this phone in the last 24h
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: recentOrders } = await this.supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('phone_number', phone)
            .gte('created_at', yesterday)
            .neq('status', 'cancelled')
            .neq('status', 'delivered'); // Only count pending/processing

        if (recentOrders && recentOrders >= 2) {
             const points = recentOrders >= 3 ? 40 : 10;
             score += points;
             factors.push({ factor: `High Order Velocity (${recentOrders} active)`, points });
        }

        // 5. Blocked Phone Check
        const { data: blockedPhone } = await this.supabase
            .from('blocked_phones')
            .select('*')
            .eq('phone_number', phone)
            .single();

        if (blockedPhone) {
            score += 100; // Immediate block
            factors.push({ factor: `Phone Number Blocked: ${blockedPhone.reason}`, points: 100 });
        }

        // Final Decision
        let action: 'approve' | 'flag' | 'block' = 'approve';
        if (score >= THRESHOLD_BLOCK) action = 'block';
        else if (score >= THRESHOLD_FLAG) action = 'flag';

        return {
            score,
            flagged: action !== 'approve',
            blocked: action === 'block',
            factors,
            action
        };
    }
}
