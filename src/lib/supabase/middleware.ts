import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createLocalePath, isLocale, type Locale } from "@/lib/i18n/config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  const [, maybeLocale, section] = request.nextUrl.pathname.split("/");
  const locale = isLocale(maybeLocale || "")
    ? (maybeLocale as Locale)
    : null;

  if (!user && locale && section === "dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = createLocalePath(locale, "/login");
    return NextResponse.redirect(url);
  }

  return response;
}
