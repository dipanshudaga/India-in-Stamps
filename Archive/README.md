# Archive

## App Mobile (Expo)

The React Native / Expo app (SDK 57) that was the active app until the project moved to the web
(`../web`, Next.js). Kept for reference; not maintained.

It contains the finished Timeline (paged carousel + sliding ruler), Calendar, Search and Explore
(infinite shelf grid) screens, and the Skia-free Three.js "Wall" spike built on `expo-gl`. Its
`node_modules` was removed to save space - run `npm install` inside it to revive it. The data
scripts in `../Scripts` now write into `../web`, so this copy's `src/data/*.json` is a frozen snapshot.

Why it was archived: stamps are something you browse, share and find via search, and a website gives
every stamp a link, works on every device with no install, and runs Three.js without the `expo-gl`
limits (partial WebGL2, local-file textures, no worklets).
