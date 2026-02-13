import { createAdminClient } from '@/lib/supabase/server'
import { WebhookEvent } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'

export async function POST(req: Request) {
  try {
    // ── 1. Validate signing secret ──────────────────────────────────────
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET
    if (!SIGNING_SECRET) {
      console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not set')
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      )
    }

    // ── 2. Extract & validate Svix headers ──────────────────────────────
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('[clerk-webhook] Missing Svix headers')
      return NextResponse.json(
        { error: 'Missing Svix headers' },
        { status: 400 }
      )
    }

    // ── 3. Verify webhook signature ─────────────────────────────────────
    const body = await req.text()
    const payload = JSON.parse(body)

    let evt: WebhookEvent
    try {
      const wh = new Webhook(SIGNING_SECRET)
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent
    } catch (err) {
      console.error('[clerk-webhook] Signature verification failed:', err)
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 400 }
      )
    }

    const eventType = evt.type
    console.log(`[clerk-webhook] Received event: ${eventType}`)

    // ── 4. Handle user.created / user.updated ───────────────────────────
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, public_metadata } =
        evt.data

      const email = email_addresses?.[0]?.email_address
      const role =
        (public_metadata as { role?: string })?.role || 'customer'

      if (!email) {
        console.error(
          `[clerk-webhook] No email found for user ${id}. email_addresses:`,
          JSON.stringify(email_addresses)
        )
        return NextResponse.json(
          { error: 'No email address found on user' },
          { status: 400 }
        )
      }

      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            clerk_id: id,
            email,
            first_name: first_name ?? null,
            last_name: last_name ?? null,
            role,
          },
          { onConflict: 'clerk_id' }
        )
        .select()

      if (error) {
        console.error('[clerk-webhook] Supabase upsert failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        return NextResponse.json(
          { error: 'Database operation failed', details: error.message },
          { status: 500 }
        )
      }

      console.log(
        `[clerk-webhook] Successfully synced user ${id} (${email})`,
        data
      )

      // ── 5. Handle user.deleted ──────────────────────────────────────
    } else if (eventType === 'user.deleted') {
      const { id } = evt.data
      if (!id) {
        console.error('[clerk-webhook] user.deleted event missing user ID')
        return NextResponse.json(
          { error: 'Missing user ID' },
          { status: 400 }
        )
      }

      const supabase = createAdminClient()
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('clerk_id', id)

      if (error) {
        console.error('[clerk-webhook] Supabase delete failed:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        return NextResponse.json(
          { error: 'Database operation failed', details: error.message },
          { status: 500 }
        )
      }

      console.log(`[clerk-webhook] Successfully deleted user ${id}`)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    // Catch-all for unexpected errors
    console.error('[clerk-webhook] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
