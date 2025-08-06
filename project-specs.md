# AI Recipe Generator – Complete Specification

An AI-powered recipe generator where users input ingredients and receive personalized recipes
with smooth streaming text display and user account management.

---

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS  
- **Backend:** Next.js API Routes, Supabase  
- **Database:** Supabase (PostgreSQL)  
- **Authentication:** Supabase Auth  
- **AI Integration:** Anthropic Claude API (Haiku model)  
- **Animations:** Framer Motion, Anime.js  
- **Hosting:** Vercel  
- **Runtime:** Vercel Edge Runtime for streaming APIs  

---

## Database Setup
- Supabase database connected via `.env.local`
- `recipes` table exists with **Row-Level Security (RLS)**
- User auth via built-in `auth.users` table
- Auto-generated TypeScript types: `/types/supabase.ts`

## Database Overview (updated)

| Column / Policy   | Definition / Purpose                                                                           |
|-------------------|------------------------------------------------------------------------------------------------|
| **id**            | `UUID` **PK**, `DEFAULT gen_random_uuid()`                                                     |
| **user_id**       | `UUID` FK → `auth.users(id)`&nbsp;`ON DELETE CASCADE`                                          |
| **title**         | `TEXT NOT NULL` – short human-readable recipe name                                             |
| **ingredients**   | `TEXT[] NOT NULL` – list of raw ingredients                                                    |
| **recipe_content**| `TEXT NOT NULL` – full generated recipe in Markdown / plain text                               |
| **created_at**    | `TIMESTAMPTZ DEFAULT now()`                                                                    |
| **RLS:** *SELECT* | `USING (auth.uid() = user_id)` &nbsp;→ each user sees only their own recipes                   |
| **RLS:** *INSERT* | `WITH CHECK (auth.uid() = user_id)` &nbsp;→ a user may insert rows where `user_id = auth.uid()`|
| **RLS:** *DELETE* | `USING (auth.uid() = user_id)` &nbsp;→ a user may delete their own recipes                     |
| *(optional)*      | **RLS:** *UPDATE* – add if you plan to allow edits: `USING (auth.uid() = user_id)`             |
| **Indexes**       | Consider basic B-tree on `user_id, created_at` for fast per-user queries & reverse-chron lists |

> **Types** – full column definitions are auto-generated in `/types/supabase.ts`; this table is only a quick reference.

---

## 🚀 Core Features
### 1 · Ingredient Input System
- Require **≥ 3** ingredients  
- Real-time validation — reject non-food items  
- Live ingredient counter & feedback  
- Add/remove with smooth animations  
- Autocomplete suggestions for common foods  

### 2 · Recipe Generation
- Model: **`claude-3-haiku-20240307`** (cost-efficient)  
- Streaming typing animation (~ 50 ms/char) with blinking cursor  
- Animated loading indicators  
- Graceful fallback UI for API errors  

### 3 · User Authentication
- Email/password via Supabase Auth  
- Email verification required  
- “Forgot password” flow  
- Persistent sessions (JWT)  
- Protected routes (history, profile)  

### 4 · Recipe History
- Auto-save generated recipes  
- Browse/search/filter history  
- View full recipe & ingredients list  
- Regenerate variations  
- Delete recipes  

### 5 · Animations & Micro-interactions
- Hover, tilt, scroll, glitch, inertia scroll  
- Smooth transitions for inputs & forms  
- Powered by Framer Motion + Anime.js  

---

## Technical Implementation
### Claude API Configuration
```js
{
  model: "claude-3-haiku-20240307",
  max_tokens: 1500,
  temperature: 0.7,
  system: "You are a helpful chef assistant. Create detailed, practical recipes using only the provided ingredients. Include cooking instructions, prep time, and serving suggestions. Format the response in a clear, easy-to-follow structure."
}
```

### Streaming Implementation
- **Server-Sent Events (SSE)** from API route  
- Browser consumption via `ReadableStream`  
- Character delay: ~ 50 ms  
- Cancel on navigation/unmount  
- Fallback to full response if stream fails  
- Retry logic for dropped connections  

### Ingredient Validation Strategy
- **Whitelist** of common ingredients  
- **AI fallback:** use Claude to validate unknowns  
- **Blacklist:** metals, chemicals, obvious non-foods  
- **Fuzzy matching** → correct typos (`tomatoe` → `tomato`)  
- Friendly rejection messages  

### Performance Optimization
- Bundle/code splitting & dynamic imports  
- Next.js Image Optimization  
- Per-user rate limiting to control Claude cost  
- Debounced ingredient-validation calls  
- Lazy-load animation libs  
- DB indexes on `user_id`, `created_at`  

### User Flow
#### New Users
1. Visit homepage  
2. Enter ≥ 3 ingredients → **Generate**  
3. Watch live-streaming recipe  
4. Prompt to **Create account** to save history  

#### Returning Users
1. **Log in**  
2. Dashboard shows recent recipes  
3. Generate new or reuse past ones  

---

## API Routes
| Route                         | Method | Auth      | Purpose                       |
|-------------------------------|--------|-----------|-------------------------------|
| `/api/auth/*`                | varies | —         | Supabase auth handlers        |
| `/api/recipes/generate`      | POST   | optional  | Generate recipe (streams)     |
| `/api/recipes/history`       | GET    | required  | Fetch user’s recipes          |
| `/api/recipes/save`          | POST   | required  | Persist recipe                |
| `/api/ingredients/validate`  | POST   | —         | Validate single ingredient    |

**Example payloads**
```jsonc
// POST /api/recipes/generate
{
  "ingredients": ["tomato", "basil", "olive oil"]
}
```

```jsonc
// POST /api/recipes/save
{
  "title": "Tomato Basil Pasta",
  "ingredients": ["tomato", "basil", "olive oil"],
  "content": "<markdown recipe here>"
}
```

---

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
ANTHROPIC_API_KEY=…
```

---

## Vercel Deployment
`vercel.json`
```json
{
  "functions": {
    "app/api/recipes/generate/route.ts": {
      "runtime": "edge"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

---

## Error Handling
### API-level
- **429** Too Many Requests → include `Retry-After`  
- **401** Unauthorized → redirect to login  
- **400** Bad Request → validation details  
- **500** Server Error → generic fallback  

### Client-side
- Offline detection & retry  
- Stream fallbacks  
- Real-time ingredient errors  
- Auto re-auth on session expiry  

---

## Animation Specs
| Interaction     | Effect                           |
|-----------------|----------------------------------|
| Hover Buttons   | 0 .2 s scale + color             |
| Card Tilt       | 5° 3D tilt on hover              |
| Scroll Fade     | Fade + slide-up on enter         |
| Glitch Loading  | Text distortion while generating |
| Typing Cursor   | Blinking block cursor            |

---

## Performance Targets
- **FCP:** < 1 .5 s  
- **LCP:** < 2 .5 s  
- **TTI:** < 3 s  
- **Stream Start:** < 2 s  
- Maintain **60 fps** animations  

---

## Security Considerations
- Claude API key **server-side only**  
- Input sanitization (XSS/SQL-inj)  
- Supabase RLS enforced everywhere  
- Rate limiting & abuse detection  
- Proper CORS headers  
- Secure session cookies  

---

## Testing Strategy
- **Unit:** utilities & validation  
- **Integration:** API ↔ Supabase  
- **E2E (Playwright):** sign-up → generate → history  
- **Performance:** API latency & stream start time  
- **Visual:** frame-rate & layout stability  

---

## Launch Checklist
- [ ] Database schema & RLS  
- [ ] Auth flow verified  
- [ ] Claude integration live  
- [ ] Streaming works in prod  
- [ ] History UI functional  
- [ ] Ingredient validation accurate  
- [ ] Animations performant  
- [ ] Errors handled gracefully  
- [ ] Env vars set on Vercel  
- [ ] Security audit passed  
- [ ] Performance meets targets  

---

*End of specification*
