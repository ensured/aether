"use server";
import { cookies } from "next/headers";

const TOKEN_COOKIE_NAME = "iagon_token";

// Store token in secure HTTP-only cookie - this is the only Server Action we need
export async function setIagonToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value;
}
