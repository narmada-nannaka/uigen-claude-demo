// @vitest-environment node
import { test, expect, vi, beforeEach, describe } from "vitest";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(payload: Record<string, unknown>, expiresIn = "7d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  test("sets a cookie named auth-token", async () => {
    await createSession("user-1", "test@example.com");
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      expect.any(String),
      expect.any(Object)
    );
  });

  test("sets cookie as httpOnly with sameSite lax and path /", async () => {
    await createSession("user-1", "test@example.com");
    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("sets cookie expiry approximately 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const after = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const { expires } = mockCookieStore.set.mock.calls[0][2];
    expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDays - 1000);
    expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDays + 1000);
  });

  test("stores a valid JWT containing userId and email", async () => {
    await createSession("user-1", "test@example.com");
    const token = mockCookieStore.set.mock.calls[0][1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    expect(payload.userId).toBe("user-1");
    expect(payload.email).toBe("test@example.com");
  });
});

describe("getSession", () => {
  test("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    expect(await getSession()).toBeNull();
  });

  test("returns null for a malformed token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not-a-valid-jwt" });
    expect(await getSession()).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const token = await makeToken(
      { userId: "user-1", email: "test@example.com" },
      "-1s"
    );
    mockCookieStore.get.mockReturnValue({ value: token });
    expect(await getSession()).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await makeToken({ userId: "user-1", email: "test@example.com", expiresAt });
    mockCookieStore.get.mockReturnValue({ value: token });
    const session = await getSession();
    expect(session?.userId).toBe("user-1");
    expect(session?.email).toBe("test@example.com");
  });

  test("reads the auth-token cookie by name", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await getSession();
    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  });
});

describe("deleteSession", () => {
  test("deletes the auth-token cookie", async () => {
    await deleteSession();
    expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
  });
});

describe("verifySession", () => {
  test("returns null when request has no auth-token cookie", async () => {
    const request = new NextRequest("http://localhost/api/test");
    expect(await verifySession(request)).toBeNull();
  });

  test("returns null for a malformed token in request", async () => {
    const request = new NextRequest("http://localhost/api/test", {
      headers: { cookie: "auth-token=bad-token" },
    });
    expect(await verifySession(request)).toBeNull();
  });

  test("returns null for an expired token in request", async () => {
    const token = await makeToken(
      { userId: "user-1", email: "test@example.com" },
      "-1s"
    );
    const request = new NextRequest("http://localhost/api/test", {
      headers: { cookie: `auth-token=${token}` },
    });
    expect(await verifySession(request)).toBeNull();
  });

  test("returns session payload for a valid token in request", async () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await makeToken({ userId: "user-42", email: "user@example.com", expiresAt });
    const request = new NextRequest("http://localhost/api/test", {
      headers: { cookie: `auth-token=${token}` },
    });
    const session = await verifySession(request);
    expect(session?.userId).toBe("user-42");
    expect(session?.email).toBe("user@example.com");
  });

  test("returns null for a token signed with a different secret", async () => {
    const wrongSecret = new TextEncoder().encode("wrong-secret");
    const token = await new SignJWT({ userId: "user-1", email: "test@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .sign(wrongSecret);
    const request = new NextRequest("http://localhost/api/test", {
      headers: { cookie: `auth-token=${token}` },
    });
    expect(await verifySession(request)).toBeNull();
  });
});
