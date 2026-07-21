# Todo List - Vercel JSON Error Fix

## Steps

- [X] ✅ Read all files and understand the problem
- [X] ✅ Plan approved by user
- [X] 1. **package.json** - Downgrade express ^5.2.1 → ^4.21.2, multer ^2.2.0 → ^1.4.5-lts.2
- [X] 2. **server/index.js** - Remove unconditional app.listen(), add Vercel conditional, add global error handler
- [X] 3. **server/routes/assess.js** - Better error handling (always return JSON)
- [X] 4. **public/app.js** - Check content-type before parsing JSON response
- [X] 5. Install dependencies with `npm install`
- [X] 6. Test locally ✅

