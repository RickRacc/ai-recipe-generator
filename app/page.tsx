import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { RecipeGenerator } from "@/components/recipe/recipe-generator";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">
              🍳 AI Recipe Generator
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              My Recipes
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 container mx-auto py-8 px-4">
        {hasEnvVars ? (
          <RecipeGenerator />
        ) : (
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">Welcome to AI Recipe Generator</h1>
            <p className="text-muted-foreground">
              Please configure your environment variables to get started.
            </p>
            <EnvVarWarning />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              className="font-medium hover:text-foreground transition-colors"
              rel="noreferrer"
            >
              Supabase
            </a>
            {" "} and {" "}
            <a
              href="https://anthropic.com"
              target="_blank"
              className="font-medium hover:text-foreground transition-colors"
              rel="noreferrer"
            >
              Claude AI
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
