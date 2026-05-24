import { createClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createServerClient = (token: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

export async function requireAuth(
  req: Request
): Promise<NextResponse | { user: User; supabase: ReturnType<typeof createServerClient> }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const supabaseClient = createServerClient(token);
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (!user || error) {
    return NextResponse.json({ error: "User not found or session invalid" }, { status: 401 });
  }
  return { user, supabase: supabaseClient };
}
