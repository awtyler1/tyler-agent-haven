# Week 1, Task 1: Sentry Error Monitoring

> Reference guide for understanding what we're building and why.

---

## What is Sentry?

Sentry is an error monitoring service. Think of it as a security camera for your code.

**Without Sentry:**
- User hits a bug → app crashes or behaves weird
- User gets frustrated, maybe leaves
- You have no idea anything happened
- Bug persists until someone bothers to email you (rare)

**With Sentry:**
- User hits a bug → Sentry captures everything automatically
- You get an alert with: which user, which page, which line of code, full error details
- You can fix it before more users are affected
- You can see patterns (is this happening to everyone or just one person?)

---

## Why This Matters for TIG Platform

You're about to roll this out to 300 agents. These are insurance agents, not tech people. When something breaks:
- They won't open browser dev tools
- They won't screenshot the error
- They'll just think "this thing doesn't work" and stop using it

Sentry lets you be proactive instead of reactive.

---

## How Sentry Works (Conceptual)

```
Your React App
│
▼
┌─────────────────────────────────────┐
│  Sentry SDK (runs in background)    │
│  - Watches for JavaScript errors    │
│  - Watches for unhandled promises   │
│  - Watches for React component crashes│
└─────────────────────────────────────┘
│
│ When error occurs, sends:
│ - Error message & stack trace
│ - User info (if configured)
│ - Browser/device info
│ - Breadcrumbs (what happened before)
▼
┌─────────────────────────────────────┐
│  Sentry Dashboard (sentry.io)       │
│  - View all errors                  │
│  - See frequency & affected users   │
│  - Get alerts via email/Slack       │
└─────────────────────────────────────┘
```

---

## Key Concepts

### DSN (Data Source Name)
A URL that identifies YOUR Sentry project. Like a mailing address for your errors.
Looks like: `https://abc123@o456.ingest.sentry.io/789`

### Sentry.init()
A function that runs once when your app starts. It:
- Connects to Sentry using your DSN
- Configures what to capture
- Sets up the background monitoring

### ErrorBoundary
A React component that wraps your app. When a component crashes, instead of the whole app dying, ErrorBoundary:
- Catches the error
- Reports it to Sentry
- Shows a fallback UI ("Something went wrong")

### Breadcrumbs
Automatic log of what happened BEFORE the error:
- Button clicks
- Page navigations
- API calls
These help you understand the path the user took to trigger the bug.

---

## What We're About to Do

1. **Create Sentry account** → Get your unique DSN
2. **Install Sentry SDK** → Add the npm package to your project
3. **Initialize Sentry** → Add Sentry.init() to your app entry point
4. **Add ErrorBoundary** → Wrap your app to catch React errors
5. **Test it** → Trigger a fake error to confirm it's working
6. **Configure alerts** → Get notified when errors happen

---

## Files We'll Touch

| File | What We'll Do |
|------|---------------|
| `package.json` | Add @sentry/react dependency |
| `src/main.tsx` | Initialize Sentry before app renders |
| `src/App.tsx` | Wrap app in Sentry ErrorBoundary |
| `.env` | Add VITE_SENTRY_DSN variable |

---

## After This Is Done

You'll be able to:
- See all errors at sentry.io/your-project
- Know which users are affected
- Get email alerts for new errors
- Fix bugs before users complain

---

## Questions to Test Your Understanding

1. Why can't you just rely on users to report bugs?
2. What information does Sentry capture when an error occurs?
3. What's the DSN and why do you need it?
4. What does ErrorBoundary do that regular try/catch doesn't?

(Answer these in your LEARNING_LOG.md after we complete the integration)
