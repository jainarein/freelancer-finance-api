import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth/login') || 
                     request.nextUrl.pathname.startsWith('/auth/sign-up')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  // For dashboard routes, we'll let the client-side handle auth
  // since we're using localStorage for tokens
  // The AuthContext will redirect if not authenticated
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
