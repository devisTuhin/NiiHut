import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase credentials (URL or Service Role Key)' },
      { status: 500 }
    );
  }

  // Admin client to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({
      limit: 100, // Adjust if you have more than 100 users, or implement pagination
    });

    const results = {
      total: clerkUsers.data.length,
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const user of clerkUsers.data) {
      const email = user.emailAddresses[0]?.emailAddress;
      const role = (user.publicMetadata as { role?: string })?.role || 'customer';

      if (!email) {
        results.failed++;
        results.errors.push(`User ${user.id} has no email`);
        continue;
      }

      const { error } = await supabase.from('users').upsert({
        clerk_id: user.id,
        email: email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: role,
      }, { onConflict: 'clerk_id' });

      if (error) {
        results.failed++;
        results.errors.push(`Error upserting ${user.id}: ${error.message}`);
      } else {
        results.success++;
      }
    }

    return NextResponse.json({
      message: 'Migration completed',
      results,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Fallback migration failed', details: error.message },
      { status: 500 }
    );
  }
}
