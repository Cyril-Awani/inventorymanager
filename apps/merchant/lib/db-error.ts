import { NextResponse } from "next/server";

/**
 * Check if an error is a Prisma database connection/authentication error.
 * Use this to return 503 and a stable code so the client can fall back to cache.
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as Error).name;
  const message = (error as Error).message ?? "";
  return (
    name === "PrismaClientInitializationError" ||
    name === "PrismaClientKnownRequestError" ||
    /Authentication failed|Connection|ECONNREFUSED|connect/i.test(String(message))
  );
}

/**
 * Return a 503 JSON response for database unavailable, with a code the client can use.
 */
export function databaseUnavailableResponse(message = "Database unavailable") {
  return NextResponse.json(
    { error: message, code: "DATABASE_UNAVAILABLE" },
    { status: 503 }
  );
}
