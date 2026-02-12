import { auth } from "@clerk/nextjs/server";
import { createClient } from "./supabase/server";

export async function getCurrentUser() {
    const { userId } = await auth();
    if (!userId) return null;

    const supabase = await createClient();
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', userId)
        .single();

    return user;
}

export async function checkRole(role: 'admin' | 'customer') {
    const user = await getCurrentUser();
    return user?.role === role;
}

export async function requireRole(role: 'admin' | 'customer') {
    const isAuthorized = await checkRole(role);
    if (!isAuthorized) {
        throw new Error('Unauthorized');
    }
}
