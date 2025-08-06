import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { RecipeHistory } from "@/components/recipe/recipe-history";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">
              🍳 AI Recipe Generator
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-primary">
              My Recipes
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <AuthButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 container mx-auto py-8 px-4">
        <RecipeHistory />
      </div>
    </main>
  );
}