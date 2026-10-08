# Launching Daily Sprint

The app is ready. The steps below need **your own accounts**, so they're yours to do (Claude can help at each step: just say which step you're on).

## 1. Put it online (GitHub Pages, free)
1. Create a free account at github.com.
2. Tell Claude "publish to GitHub Pages". Claude will create the repository, upload the files and turn on Pages (you'll be asked to log in once).
3. You get an address like `https://<your-username>.github.io/daily-sprint/`. Open it on your phone: in Chrome, menu → **Add to Home screen**.

## 2. Turn on the worldwide leaderboard (Supabase, free)
1. Create a free account at supabase.com and a **New project** (any name, pick the region closest to you, save the database password somewhere safe).
2. In the project, open **SQL Editor** → **New query**, paste the whole of `supabase/schema.sql`, click **Run**.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
4. Give both to Claude ("here are my Supabase details"), or paste them into `ONLINE` near the "Leaderboard" section of `index.html`.
   The anon key is designed to be public; never share the `service_role` key.

## 3. Privacy policy
Replace `[CONTACT EMAIL]` in `privacy.html` with an email address you're happy to publish (a separate one is a good idea).

## 4. Google Play Store
1. Create a **Google Play Console** developer account (one-time $25 fee, identity check).
2. Go to pwabuilder.com, enter your GitHub Pages address, choose **Android → Generate**. Keep the signing key file it gives you somewhere safe: you need it for every future update.
3. Put the `assetlinks.json` file from that download into a `.well-known` folder in this project and publish again (this removes the browser bar inside the app).
4. In Play Console: create the app, upload the `.aab` file, and fill in:
   - **Store listing**: name, short and full description, the 512px icon (`icon-512.png`), a 1024×500 feature graphic, and phone screenshots.
   - **Privacy policy URL**: `https://<your-username>.github.io/daily-sprint/privacy.html`
   - **Data safety**: the app collects a nickname, a country and game scores, used for the leaderboard only, not shared with third parties, and users can delete them in the app.
   - **Content rating** questionnaire and **target audience** (13+).
5. New personal developer accounts must currently run a **closed test** (at least 12 testers for 14 days) before a public release. Check Play Console for the current rule.

## Before launch checklist
- [ ] Online at GitHub Pages and installed on your phone
- [ ] Supabase connected, test score appears on the leaderboard from two devices
- [ ] Contact email in `privacy.html`
- [ ] Offline mode checked on the phone (airplane mode, app still opens)
- [ ] Play Console: listing, data safety, content rating, closed test
