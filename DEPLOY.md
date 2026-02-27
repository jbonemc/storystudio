# Story Studio Content Tool — Deployment Guide

## How to push to GitHub and go live on Vercel

### Step 1: Open Terminal and navigate to this folder

On a Mac, open Terminal and type:
```
cd "[path to this folder]"
```
Or drag the `storystudio-web` folder onto the Terminal window.

### Step 2: Set up Git in this folder (first time only)

```bash
git init
git remote add origin https://github.com/jbonemc/storystudio.git
```

### Step 3: Push the project to GitHub

```bash
git add .
git commit -m "Add Story Studio Content Tool web app"
git branch -M main
git push -u origin main
```

GitHub will ask for your username and password (use a Personal Access Token as password — see https://github.com/settings/tokens).

### Step 4: Set your Anthropic API key in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your key from https://console.anthropic.com
   - **Environments:** Production, Preview, Development (tick all three)
4. Click **Save**

### Step 5: Vercel will auto-deploy

Once you push to GitHub and set the API key, Vercel will automatically build and deploy your app. The URL will look like: `https://storystudio.vercel.app`

---

## Making changes in future

Whenever you want to update the tool:
1. Edit the files
2. Run `git add . && git commit -m "your change description" && git push`
3. Vercel rebuilds automatically within ~60 seconds

---

## Notes

- **Without the API key:** The app works in demo mode using example suggestions
- **With the API key:** Real Claude AI generates personalised suggestions based on each user's documents
- The API key is kept secret on Vercel's servers — users never see it
- To embed on Squarespace: use an Embed block with `<iframe src="https://your-vercel-url.vercel.app" width="100%" height="900px" frameborder="0"></iframe>`
