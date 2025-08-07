'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthProtectedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  fallbackHref?: string;
}

export function AuthProtectedLink({ 
  href, 
  children, 
  className,
  fallbackHref = "/auth/login"
}: AuthProtectedLinkProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        router.push(href);
      } else {
        router.push(fallbackHref);
      }
    } catch {
      router.push(fallbackHref);
    }
  };

  // If we don't know the auth state yet, render as a button that will check on click
  if (isAuthenticated === null) {
    return (
      <button onClick={handleClick} className={className}>
        {children}
      </button>
    );
  }

  // If authenticated, render normal link
  if (isAuthenticated) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  // If not authenticated, link to fallback
  return (
    <Link href={fallbackHref} className={className}>
      {children}
    </Link>
  );
}