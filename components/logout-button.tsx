"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    // Show confirmation dialog
    const confirmed = confirm("Are you sure you want to log out?");
    
    if (!confirmed) {
      return; // User cancelled, don't logout
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/"); // Redirect to home page instead of login
  };

  return <Button onClick={logout}>Logout</Button>;
}
