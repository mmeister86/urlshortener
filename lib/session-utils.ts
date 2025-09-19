import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData, generateAnonymousId } from "./session";

/**
 * Get or create session for current request
 * Automatically creates anonymous session if none exists
 */
export async function getOrCreateSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  // Create anonymous session if none exists
  if (!session.anonymousId && !session.userId) {
    session.anonymousId = generateAnonymousId();
    session.createdAt = new Date().toISOString();
    session.isLoggedIn = false;
    await session.save();

    console.log("🍪 Created new anonymous session:", session.anonymousId);
  }

  return session;
}

/**
 * Get existing session without creating new one
 */
export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  return await getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Update session when user logs in
 */
export async function promoteSessionToUser(
  userId: string
): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  console.log("🔄 Promoting session to user:", {
    oldAnonymousId: session.anonymousId,
    newUserId: userId,
  });

  // Keep anonymousId for migration, but mark as logged in
  session.userId = userId;
  session.isLoggedIn = true;
  await session.save();

  return session;
}

/**
 * Clear session on logout
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  console.log("🧹 Clearing session for user:", session.userId);

  session.destroy();
}
