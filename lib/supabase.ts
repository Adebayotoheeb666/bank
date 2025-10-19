'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createSessionClient() {
  const cookieStore = cookies();
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
    auth: {
      persistSession: false,
    },
  });

  return {
    get auth() {
      return client.auth;
    },
    get from() {
      return client.from.bind(client);
    },
    get rpc() {
      return client.rpc.bind(client);
    },
  };
}

export async function createAdminClient() {
  const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return {
    get auth() {
      return client.auth;
    },
    get from() {
      return client.from.bind(client);
    },
    get rpc() {
      return client.rpc.bind(client);
    },
  };
}

export async function createBrowserClient() {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
