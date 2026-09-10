# Online Paste - Real-time Clipboard Sharing Platform

A real-time clipboard sharing platform built with Next.js and Vercel KV, allowing users to share and synchronize content across multiple clients in real-time through room-based sessions.

## Features

- 🚀 **Real-time Synchronization**: Content syncs automatically across all connected clients every 2 seconds
- 🔒 **Room-based Sharing**: Private rooms with unique IDs for secure content sharing
- 💾 **Persistent Storage**: Content is saved to Vercel KV and persists for 7 days
- ⚡ **Optimized Performance**: Debounced saves (1 second) to reduce API calls
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎨 **Acrylic UI**: Frosted panels, subtle grid backgrounds, and compact rounded corners
- 🌓 **Light and Dark Themes**: Light blue and dark palettes, with a system preference option. Use the header controls to switch; your choice is remembered on this browser.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Vercel KV (Redis)
- **Styling**: CSS Modules
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Vercel account (for KV database)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd online_paste
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Get your Vercel KV credentials from the Vercel dashboard
   - Update the values in `.env.local`

```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

### Step 1: Create a Vercel Project

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository

### Step 2: Set up Redis

Create a Redis Cloud database (or use your existing Redis provider) and copy its Redis connection URL. This project connects directly through `ioredis`.

### Step 3: Configure Environment Variables

In the Vercel project's **Settings → Environment Variables**, add these to **Production**:

- `REDIS_URL`: Your complete `redis://username:password@host:port` connection URL (or `rediss://` if the provider requires TLS).
- `CRON_SECRET`: A separate random secret of at least 32 characters for the daily keep-alive endpoint. Vercel sends it automatically as `Authorization: Bearer <CRON_SECRET>`.

Generate a cron secret locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Store credentials only in environment variables, never in source control. Redis REST variables such as `KV_REST_API_URL` are not used by this project.

### Step 4: Deploy

1. Click "Deploy" in the Vercel dashboard
2. Your application will be built and deployed automatically
3. You'll receive a production URL (e.g., `your-app.vercel.app`)

### Daily Redis Keep-alive

`vercel.json` schedules `/api/cron/redis-keepalive` once per day at **02:00 UTC (10:00 Asia/Shanghai)**. Vercel Hobby may run it anywhere within that hour. Cron jobs run on the production deployment, including when no users have the website open; local development and preview deployments do not start this schedule.

Each authenticated invocation writes the current timestamp to one dedicated key, `online-paste:keepalive`, with a 3-day expiry. The same key is overwritten each day, without creating rooms or changing clipboard contents and their existing 7-day expiry. A real Redis write is used because [Redis Cloud's inactivity policy](https://support.redislabs.com/hc/en-us/articles/33138489404818-Free-Redis-Cloud-Database-Deleted-Due-to-Inactivity) describes deletion of free databases after 14 consecutive days without read/write activity.

After setting `REDIS_URL` and `CRON_SECRET`, deploy these changes to Production. In **Settings → Cron Jobs**, confirm the daily job is enabled, run it once, and inspect its logs. Success returns `200` with `ok: true` and `lastKeepAlive`; Redis failures or missing configuration return `503`, and unauthorized requests return `401`. The endpoint always disables response caching and closes its short-lived Redis connection. Vercel does not automatically retry failed cron invocations, so investigate failures in its logs.

This prevents inactivity only while writes keep succeeding; it cannot restore an already-deleted database or override provider policy changes. See [Vercel Cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs) and [Hobby scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## How It Works

### Room Creation and Joining

1. **Create Room**: Click "Create New Room" to generate a unique room ID
2. **Join Room**: Enter an existing room ID to join a shared session
3. **Share**: Copy the room ID and share it with others to collaborate

### Real-time Synchronization

- **Automatic Polling**: The app polls the server every 2 seconds for updates
- **Debounced Saves**: Changes are saved 1 second after you stop typing
- **Version Control**: Each update increments a version number to prevent conflicts
- **Conflict Resolution**: The app only updates content if the remote version is newer

### Data Persistence

- Content is stored in Vercel KV (Redis)
- Each room's data expires after 7 days of inactivity
- Room data includes:
  - Content text
  - Version number
  - Last modified timestamp

## Project Structure

```
online_paste/
├── app/
│   ├── api/
│   │   └── room/
│   │       └── [roomId]/
│   │           └── route.ts          # API endpoints for room operations
│   ├── room/
│   │   └── [roomId]/
│   │       ├── page.tsx              # Room page with editor
│   │       └── page.module.css       # Room page styles
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   ├── page.module.css               # Home page styles
│   └── globals.css                   # Global styles
├── public/                           # Static assets
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── next.config.js                    # Next.js configuration
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript configuration
├── vercel.json                       # Vercel deployment config
└── README.md                         # This file
```

## API Routes

### GET `/api/room/[roomId]`

Fetch room content and metadata.

**Response:**
```json
{
  "content": "string",
  "version": 0,
  "lastModified": "2025-12-31T00:00:00.000Z"
}
```

### POST `/api/room/[roomId]`

Save room content.

**Request Body:**
```json
{
  "content": "string"
}
```

**Response:**
```json
{
  "content": "string",
  "version": 1,
  "lastModified": "2025-12-31T00:00:00.000Z"
}
```

## Configuration

### Polling Interval

To change the sync frequency, edit the polling interval in `app/room/[roomId]/page.tsx`:

```typescript
// Poll every 2 seconds (default)
pollIntervalRef.current = setInterval(() => {
  fetchContent()
}, 2000)
```

### Save Debounce

To change the save delay, edit the timeout in `app/room/[roomId]/page.tsx`:

```typescript
// Debounce save by 1 second (default)
saveTimeoutRef.current = setTimeout(() => {
  saveContent(newContent)
}, 1000)
```

### Data Expiration

To change how long rooms persist, edit the expiration in `app/api/room/[roomId]/route.ts`:

```typescript
// Save to KV with 7 days expiration (default)
await kv.set(`room:${roomId}`, roomData, { ex: 60 * 60 * 24 * 7 })
```

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Keep-alive Endpoint Checks

```bash
npm test
```

These use Node's built-in test runner and a simulated Redis client to check authentication, successful heartbeat writes, and failure handling without contacting a live database.

## Troubleshooting

### KV Connection Issues

If you see errors related to KV:
1. Ensure your `.env.local` file has the correct KV credentials
2. Verify the KV database is created in your Vercel project
3. Check that environment variables are properly set in Vercel dashboard

### Sync Not Working

If content isn't syncing:
1. Check browser console for errors
2. Verify the API routes are accessible
3. Ensure multiple clients are using the same room ID
4. Check network tab to confirm polling requests are being made

## Security Considerations

- Room IDs are randomly generated (8 characters)
- No authentication required (rooms are semi-private by obscurity)
- Content expires after 7 days
- For sensitive data, consider adding:
  - Password protection for rooms
  - End-to-end encryption
  - User authentication

## Future Enhancements

- WebSocket support for true real-time sync (instead of polling)
- Room password protection
- User authentication
- Rich text editing
- File upload support
- Room history/versioning
- Export to file
- Syntax highlighting for code
- Collaborative cursors

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
