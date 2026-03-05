import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const password = process.env.DEV_PASSWORD;

    // If no password set in env, skip protection
    if (!password) {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;

    // Allow access to login page and public assets
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico')
    ) {
        return NextResponse.next();
    }

    const devPasswordCookie = request.cookies.get('dev_password')?.value;

    if (devPasswordCookie !== password) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
