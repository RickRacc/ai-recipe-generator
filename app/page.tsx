import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { RecipeGenerator } from "@/components/recipe/recipe-generator";
import { AuthProtectedLink } from "@/components/auth-protected-link";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-8 min-w-0 flex-1">
            <Link href="/" className="text-xl sm:text-2xl font-bold hover:text-primary transition-all duration-300 font-recipe-title truncate">
              <span className="text-primary">🍳</span> <span className="hidden xs:inline">AI Recipe Generator</span><span className="xs:hidden">Recipes</span>
            </Link>
            <AuthProtectedLink href="/dashboard" className="hidden sm:block text-sm text-muted-foreground hover:text-primary transition-all duration-200 font-medium px-4 py-2 rounded-lg hover:bg-primary/10">
              My Recipes
            </AuthProtectedLink>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeSwitcher />
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 container mx-auto py-8 sm:py-12 px-4 sm:px-6">
        {hasEnvVars ? (
          <RecipeGenerator />
        ) : (
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold font-recipe-title text-foreground">
                Welcome to <span className="text-primary">AI Recipe Generator</span>
              </h1>
              <p className="text-xl text-muted-foreground font-recipe-content leading-relaxed">
                Transform your ingredients into culinary masterpieces with AI-powered recipe generation.
              </p>
            </div>
            <div className="bg-card/60 border border-border rounded-2xl p-8 backdrop-blur-sm">
              <EnvVarWarning />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground font-recipe-content">
              Powered by{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                className="font-semibold text-secondary hover:text-secondary/80 transition-colors"
                rel="noreferrer"
              >
                Supabase
              </a>
              {" "} and {" "}
              <a
                href="https://anthropic.com"
                target="_blank"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
                rel="noreferrer"
              >
                Claude AI
              </a>
            </p>
            <p className="text-sm text-muted-foreground/80">
              Discover, create, and share amazing recipes with the power of artificial intelligence
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
