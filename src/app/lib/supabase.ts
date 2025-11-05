import { createClient , Session} from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl , supabaseAnonKey );

export const createServerClient = (token: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};


export const getServerUser = async (token: string) => {
  const supabaseServer = createServerClient(token);
  const { data: { user }, error } = await supabaseServer.auth.getUser();
  return { user, error };
};