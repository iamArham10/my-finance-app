"use server";

import { createClient, createAdminClient } from "./server";
import { cookies } from "next/headers";

export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get the current logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminSupabase = createAdminClient();

    // Delete the user from auth.users (this will cascade delete profiles/folders/items in our schema!)
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Clear session cookies locally on the server
    const cookieStore = await cookies();
    
    // Deleting the session cookies completely from the browser
    const allCookies = cookieStore.getAll();
    allCookies.forEach((cookie) => {
      cookieStore.set(cookie.name, "", { maxAge: -1, path: "/" });
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { success: false, error: message };
  }
}
