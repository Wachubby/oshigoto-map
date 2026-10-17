# 推しごとマップ

## Running on Replit
- Stack: Next.js App Router, React, TypeScript, Tailwind CSS 3.
- The imported Next.js 14 release was blocked by the package security policy for a critical vulnerability. Next.js and React were updated together to compatible current releases; the app structure was preserved.
- Use the **Start application** workflow, which runs `npm run dev`.
- The server listens on `0.0.0.0:5000` for Replit Preview.
- Install dependencies with `npm install` when setting up a fresh checkout.
- Validate with `npx tsc --noEmit` and `npm run build`.
- Production command after building: `npm start`.

## Imported demo limitations
- No secrets or external services are required to run the current demo.
- Despite the imported README's YouTube/RSS instructions, the search API and SNS cards currently return sample data; no YouTube integration is implemented.
- Calendar dates and map events are also sample data. The UI labels itself `MOCK`.
- Registration is stored only in this browser's localStorage.
- Duplicate `_1` files and the original zip have been left untouched.
- Preserve the existing project structure and stack when doing setup work.
