# How to Start the Server 🚀

## Quick Start

The AI PDF extraction feature requires a backend server to be running. Here's how to start it:

### Option 1: Start Server Only

```bash
npm run server
```

This starts the backend server on `http://localhost:3001`

### Option 2: Start Everything (Server + Frontend)

```bash
npm run dev:all
```

This starts both the backend server AND the frontend development server at the same time.

### Option 3: Manual Start

```bash
node server.js
```

---

## What You'll See

When the server starts successfully, you'll see:

```
🚀 PDF processing server running on http://localhost:3001
📄 PDF extraction endpoint: http://localhost:3001/api/extract-pdf-text
❤️ Health check: http://localhost:3001/api/health
```

---

## Troubleshooting

### "Port 3001 already in use"

Another process is using port 3001. Options:

1. **Find and stop the process**:
   ```bash
   # Windows PowerShell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process
   ```

2. **Use a different port**:
   ```bash
   PORT=3002 node server.js
   ```

### "Cannot find package 'express'"

Install dependencies:
```bash
npm install
```

### Server won't start

Check for errors in the terminal:
```bash
npm run server
```

Look for error messages and fix the issues.

---

## Important Notes

⚠️ **The server must be running for AI PDF extraction to work!**

- The frontend calls `http://localhost:3001/api/extract-ai-menu`
- If the server is not running, you'll see "Failed to fetch" error
- Always start the server before testing AI PDF extraction

---

## For Production

In production, you'll need to:

1. **Run the server separately** or use a process manager like PM2
2. **Update the API URL** in `src/lib/llamaExtractUtils.ts`:
   ```typescript
   const response = await fetch('YOUR_PRODUCTION_API_URL/api/extract-ai-menu', {
   ```

3. **Set environment variables**:
   ```bash
   LLAMA_EXTRACT_API_KEY=llx-YOUR_API_KEY_HERE
   PORT=3001
   ```

---

## Development Workflow

**Recommended workflow for testing:**

1. Open Terminal 1:
   ```bash
   npm run server
   ```

2. Open Terminal 2:
   ```bash
   npm run dev
   ```

3. Test in browser:
   - Go to http://localhost:5173
   - Navigate to Restaurant Dashboard
   - Try AI PDF extraction

Or simply:
```bash
npm run dev:all
```

---

**Happy developing!** 🎉











