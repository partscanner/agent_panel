# Vercel Deployment Configuration

## Environment Variables Setup

To fix the `ERR_CONNECTION_REFUSED` error in your Vercel deployment, you need to configure environment variables in Vercel's dashboard.

### Step 1: Go to Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Required Variables

Add the following environment variables:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `VITE_API_BASE_URL` | `https://chatbot-server-isl4.onrender.com` | Production, Preview, Development |
| `VITE_SOCKET_URL` | `https://chatbot-server-isl4.onrender.com` | Production, Preview, Development |

### Step 3: Redeploy

After adding the environment variables:

1. Go to **Deployments**
2. Click the **three dots** on the latest deployment
3. Select **Redeploy**

OR

1. Make any small change to your code (e.g., add a comment)
2. Commit and push to trigger a new deployment

## How Environment Variables Work in Vite

**Important:** Vite replaces `import.meta.env.VITE_*` variables at **build time**, not runtime.

- If a variable is **not set** during build, Vite replaces it with `undefined`
- The fallback `||` operator won't work if the value is the string `'undefined'`
- That's why we use: `envValue && envValue !== 'undefined' ? envValue : fallback`

## Verification

After redeploying, your frontend should:

1. ✅ Connect to `https://chatbot-server-isl4.onrender.com` instead of `localhost:3000`
2. ✅ Successfully complete login requests
3. ✅ Establish WebSocket connections

## Troubleshooting

If you still see connection errors:

1. Check browser DevTools → Console for the actual URL being used
2. Verify environment variables are set correctly in Vercel dashboard
3. Make sure you redeployed after adding the variables
4. Check that your backend at `https://chatbot-server-isl4.onrender.com` is running

## Local Development

For local development, uncomment this line in `.env`:

```bash
VITE_API_BASE_URL=http://localhost:3000/dev
```

And make sure your local backend is running on port 3000.
