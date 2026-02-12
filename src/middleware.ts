import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  '/cart(.*)',
  '/orders(.*)',
  '/profile(.*)',
  '/checkout(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  // Protect Admin Routes
  if (isAdminRoute(req)) {
     if (!userId) {
       return redirectToSignIn();
     }
     
     // NOTE: For strict RBAC at the edge, we recommend setting a custom claim in Clerk
     // containing the user role. For now, we'll allow authenticated users to hit the route,
     // but the layout/page will perform the DB check to redirect if not admin.
     // Alternatively, sync Supabase role to Clerk publicMetadata.
  }

  // Protect User Routes
  if (isProtectedRoute(req)) {
      if (!userId) {
          return redirectToSignIn();
      }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
