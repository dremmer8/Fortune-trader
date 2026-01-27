# Fortune Trader - Singleplayer Edition

This is a standalone, offline version of Fortune Trader that works without Firebase or internet connection.

## Features

✅ **Fully Offline** - No internet connection required  
✅ **Local Storage** - All game progress saved locally in your browser  
✅ **No Login Required** - Start playing immediately  
✅ **All Game Features** - Trading, banking, shop, expenses, and more  

## Differences from Online Version

- ❌ **No Leaderboard** - Leaderboard is disabled (singleplayer only)
- ❌ **No Cloud Sync** - Progress is saved locally only (no cross-device sync)
- ❌ **No Multiplayer** - Singleplayer experience only
- ✅ **Simpler Login** - Just enter a name (or use default "Player")

## How to Play

1. Open `index.html` in your web browser
2. The game will auto-login and load your saved progress (if any)
3. Start trading and building your fortune!

## Saving Progress

Your game progress is automatically saved to your browser's localStorage. This means:
- Progress persists between browser sessions
- Each browser profile has its own save file
- Clearing browser data will delete your progress

## Deployment

This version is perfect for:
- **Itch.io** - No file limit issues (no Firebase dependencies)
- **Local hosting** - Works offline, no server needed
- **Standalone distribution** - Just zip and share!

## File Structure

```
singleplayer/
├── index.html          # Main game file
├── css/               # Stylesheets
├── js/                # Game JavaScript (Firebase removed)
├── images/            # Game images and icons
├── audio/             # Sound effects
└── README.md          # This file
```

## Notes

- This version removes all Firebase dependencies
- Save/load system uses localStorage only
- Login is simplified (name only, no password)
- Leaderboard shows a message that it's not available in singleplayer mode

Enjoy playing Fortune Trader offline! 🎮
