import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ??
      (() => {
        if (process.env.NODE_ENV === 'production')
          throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
        return 'http://localhost:54321';
      })(),
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ??
      (() => {
        if (process.env.NODE_ENV === 'production')
          throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
        return 'local-anon-key';
      })(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session
  let user: { id: string } | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

  const pathname = request.nextUrl.pathname;

  // If no user, redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Check role — must be admin or crew
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error ?? !data) {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    const role = data.role;
    if (role !== 'admin' && role !== 'crew') {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = '/unauthorized';
    return NextResponse.redirect(url);
  }

  // Suppress unused variable warning — pathname is used conceptually
  void pathname;

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|login|unauthorized|dev/login).*)'],
};
