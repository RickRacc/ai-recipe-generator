# AI Recipe Generator

A sophisticated web application that transforms ingredient lists into detailed, personalized recipes using AI. Built with modern web technologies and designed for scalability, performance, and user experience.

**🌐 [Live Demo](https://ai-recipe-generator-rakesh.vercel.app/)**

## Key Features

### Intelligent Recipe Generation
- **AI-Powered Content Creation**: Leverages Claude AI (Anthropic) to generate creative, practical recipes from user-provided ingredients
- **Real-time Streaming Interface**: Recipes appear with smooth typewriter effects using Server-Sent Events for enhanced user engagement
- **Smart Ingredient Recognition**: Advanced autocomplete system with 500+ ingredient database and input validation
- **Contextual Recipe Suggestions**: AI considers ingredient combinations, cooking methods, and dietary preferences

### Advanced User Experience
- **Progressive Web Application**: Responsive design optimized for desktop, tablet, and mobile devices
- **Sophisticated Animation System**: Implemented using Framer Motion and Anime.js for micro-interactions
- **Comprehensive Accessibility**: Full ARIA compliance, keyboard navigation, and screen reader compatibility
- **Performance Optimization**: Edge runtime deployment, code splitting, and bundle optimization for sub-second load times
- **Theme Management**: Dynamic dark/light mode switching with system preference detection

### Enterprise-Grade Security & Performance
- **Intelligent Rate Limiting**: Redis-backed rate limiting with differentiated limits for authenticated vs. guest users
- **Comprehensive Input Sanitization**: XSS protection, SQL injection prevention, and data validation at all entry points
- **Robust Error Handling**: React Error Boundaries and graceful fallback mechanisms throughout the application
- **Real-time Performance Monitoring**: Integrated Web Vitals tracking and performance metrics collection
- **Authentication & Authorization**: Secure user management with Row Level Security (RLS) policies

### Data Management
- **Personal Recipe Library**: Users can save, categorize, and search through their generated recipes
- **Database Optimization**: Efficient PostgreSQL queries with proper indexing and caching strategies
- **Real-time Synchronization**: Instant updates across devices using Supabase real-time subscriptions

## Technical Architecture

### Frontend Stack
- **Next.js 15** - Modern React framework with App Router and optimization features
- **TypeScript** - Strict type safety ensuring code reliability and developer productivity
- **Tailwind CSS** - Utility-first CSS framework with custom design system implementation
- **Framer Motion** - Advanced animation library for smooth transitions and micro-interactions
- **Radix UI** - Headless, accessible UI component library for consistent user interface

### Backend Infrastructure
- **Next.js API Routes** - Serverless API endpoints with Edge Runtime for optimal performance
- **Supabase** - Full-stack backend providing PostgreSQL database, authentication, and real-time features
- **Claude AI (Anthropic)** - language model for recipe generation
- **Redis (Upstash)** - High-performance caching and rate limiting infrastructure

### Development & Deployment
- **Vercel Platform** - Edge-optimized hosting with automatic scaling and global CDN
- **ESLint & Prettier** - Code quality enforcement and consistent formatting
- **TypeScript Strict Mode** - Enhanced type checking for production-grade code quality

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Anthropic API key
- Redis instance (Upstash recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RickRacc/ai-recipe-generator.git
   cd ai-recipe-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**  
   Configure your environment variables in .env.loval:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Configuration
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Rate Limiting (Redis)
   REDIS_URL=your_redis_connection_string
   MAX_REQUESTS_PER_HOUR_GUEST=5
   MAX_REQUESTS_PER_HOUR_USER=20

   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Database Setup**
   
   Execute in your Supabase SQL editor:
   ```sql
   -- Create recipes table with optimized schema
   CREATE TABLE recipes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     ingredients TEXT[] NOT NULL,
     recipe_content TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );

   -- Enable Row Level Security for data protection
   ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

   -- Create optimized RLS policies
   CREATE POLICY "Users can view own recipes" ON recipes
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own recipes" ON recipes
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can delete own recipes" ON recipes
     FOR DELETE USING (auth.uid() = user_id);

   -- Performance optimization indexes
   CREATE INDEX idx_recipes_user_created ON recipes(user_id, created_at DESC);
   CREATE INDEX idx_recipes_title_search ON recipes USING GIN(to_tsvector('english', title));
   ```

5. **Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   Navigate to `http://localhost:3000`

## Deployment

### Production Deployment (Vercel)

1. **Repository Connection**: Connect your Git repository to Vercel
2. **Environment Variables**: Configure production environment variables in Vercel dashboard
3. **Automatic Deployment**: Continuous deployment on git push to main branch

### Production Environment Variables
Configure these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `REDIS_URL`

### Health Monitoring
Application health status available at `/api/health` endpoint with comprehensive service checks.

## Project Highlights for Resume

### Technical Achievements
- **Full-Stack Application**: End-to-end development using modern React/Next.js ecosystem
- **AI Integration**: Practical implementation of large language models for content generation
- **Performance Engineering**: Edge computing, caching strategies, and optimization techniques
- **Security Implementation**: Comprehensive security measures including authentication, authorization, and input validation
- **Scalable Architecture**: Designed for high availability and horizontal scaling

### Key Technologies Demonstrated
- Next.js 15 with App Router and Edge Runtime
- TypeScript for type-safe development
- Supabase for backend-as-a-service integration
- Claude AI API integration with streaming responses
- Advanced CSS with Tailwind and custom animations
- Redis for caching and rate limiting
- PostgreSQL with optimized queries and indexing

---

**Built with modern web technologies for production-grade performance and scalability**