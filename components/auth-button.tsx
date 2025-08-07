import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  // Check if environment variables are available
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    // During build time or when env vars are missing, show sign-in/sign-up buttons
    return (
      <div className="flex gap-1 sm:gap-2">
        <Button asChild size="sm" variant={"outline"} className="text-xs sm:text-sm px-2 sm:px-4">
          <Link href="/auth/login"><span className="hidden xs:inline">Sign in</span><span className="xs:hidden">In</span></Link>
        </Button>
        <Button asChild size="sm" variant={"default"} className="text-xs sm:text-sm px-2 sm:px-4">
          <Link href="/auth/sign-up"><span className="hidden xs:inline">Sign up</span><span className="xs:hidden">Up</span></Link>
        </Button>
      </div>
    );
  }

  try {
    const supabase = await createClient();

    // You can also use getUser() which will be slower.
    const { data } = await supabase.auth.getClaims();

    const user = data?.claims;

    return user ? (
      <LogoutButton />
    ) : (
      <div className="flex gap-1 sm:gap-2">
        <Button asChild size="sm" variant={"outline"} className="text-xs sm:text-sm px-2 sm:px-4">
          <Link href="/auth/login"><span className="hidden xs:inline">Sign in</span><span className="xs:hidden">In</span></Link>
        </Button>
        <Button asChild size="sm" variant={"default"} className="text-xs sm:text-sm px-2 sm:px-4">
          <Link href="/auth/sign-up"><span className="hidden xs:inline">Sign up</span><span className="xs:hidden">Up</span></Link>
        </Button>
      </div>
    );
  } catch {
    // If there's an error creating the client, show sign-in/sign-up buttons
    return (
      <div className="flex gap-1 sm:gap-2">
        <Button asChild size="sm" variant={"outline"} className="text-xs sm:text-sm px-2 sm:px-4">
          <Link href="/auth/login"><span className="hidden xs:inline">Sign in</span><span className="xs:hidden">In</span></Link>
        </Button>
        <Button asChild size="sm" variant={"default"} className="text-xs sm:text-sm px-2 sm:px-4">
          <Link href="/auth/sign-up"><span className="hidden xs:inline">Sign up</span><span className="xs:hidden">Up</span></Link>
        </Button>
      </div>
    );
  }
}
