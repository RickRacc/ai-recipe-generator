# 🍳 AI Recipe Generator

<div align="center">
  <img alt="AI Recipe Generator" src="https://via.placeholder.com/800x300?text=AI+Recipe+Generator" />
  <h3>Transform ingredients into delicious recipes with AI</h3>
</div>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#quick-start"><strong>Quick Start</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#deployment"><strong>Deployment</strong></a>
</p>
<br/>

## ✨ Features

### Core Functionality
- **🤖 AI-Powered Recipe Generation**: Uses Claude AI to create detailed, practical recipes
- **⚡ Real-time Streaming**: Watch recipes generate with typewriter effect
- **🧠 Smart Ingredient Validation**: Autocomplete and validation for 500+ ingredients
- **📚 Recipe History**: Save, search, and manage your generated recipes
- **🔐 User Authentication**: Secure user accounts with Supabase Auth

### User Experience
- **📱 Responsive Design**: Works seamlessly on all devices
- **🎨 Advanced Animations**: Framer Motion and Anime.js for smooth interactions
- **♿ Accessibility First**: Full ARIA support, keyboard navigation, screen reader friendly
- **⚡ Performance Optimized**: Edge runtime, code splitting, optimized bundles
- **🌙 Dark/Light Theme**: Built-in theme switching

### Security & Performance
- **🛡️ Rate Limiting**: Prevents abuse with user-based limits
- **🔒 Input Sanitization**: XSS protection and validation
- **🚨 Error Boundaries**: Graceful error handling throughout the app
- **📊 Performance Monitoring**: Built-in metrics and Web Vitals tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-recipe-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI Configuration
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Optional: Rate Limiting
   MAX_REQUESTS_PER_HOUR_GUEST=5
   MAX_REQUESTS_PER_HOUR_USER=20
   ```

4. **Set up the database**
   
   Run this SQL in your Supabase SQL editor:
   ```sql
   -- Create recipes table
   CREATE TABLE recipes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     ingredients TEXT[] NOT NULL,
     recipe_content TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- Enable Row Level Security
   ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

   -- RLS Policies
   CREATE POLICY "Users can view own recipes" ON recipes
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own recipes" ON recipes
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can delete own recipes" ON recipes
     FOR DELETE USING (auth.uid() = user_id);

   -- Create indexes for better performance
   CREATE INDEX idx_recipes_user_created ON recipes(user_id, created_at DESC);
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Anime.js** - Advanced animations
- **Radix UI** - Accessible UI components

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Edge Runtime** - Optimal streaming performance
- **Supabase** - Database, authentication, and real-time features
- **Claude AI (Haiku)** - Recipe generation AI model

### Development & Deployment
- **Vercel** - Hosting and deployment
- **ESLint** - Code linting
- **TypeScript** - Static type checking

## 🚀 Deployment

### Deploy to Vercel

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - automatic deployments on git push

### Environment Variables for Production
Make sure to set these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

### Health Check
Monitor your deployment health at `/health`

---

**Built with ❤️ using Next.js, Supabase, and Claude AI**

*Happy cooking! 🍳*
