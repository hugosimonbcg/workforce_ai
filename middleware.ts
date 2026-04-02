import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // Keep local/dev usable if env vars are not set.
  if (!user || !pass) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const separator = decoded.indexOf(":");
      if (separator !== -1) {
        const username = decoded.slice(0, separator);
        const password = decoded.slice(separator + 1);
        if (username === user && password === pass) {
          return NextResponse.next();
        }
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Workforce AI Planning"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
