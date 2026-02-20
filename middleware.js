import { NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!_next|favicon.ico|api/health).*)"]
};

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Applemed Private", charset="UTF-8"'
    }
  });
}

export function middleware(req) {
  const user = process.env.BASIC_AUTH_USER || "Applemed";
  const pass = process.env.BASIC_AUTH_PASSWORD || "Applemed";

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Basic ")) return unauthorized();

  const b64 = auth.split(" ")[1];
  let decoded = "";
  try {
    decoded = Buffer.from(b64, "base64").toString("utf-8");
  } catch {
    return unauthorized();
  }

  const [u, p] = decoded.split(":");
  if (u !== user || p !== pass) return unauthorized();

  return NextResponse.next();
}
