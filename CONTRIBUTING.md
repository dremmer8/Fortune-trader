# Contributing to Fortune Trader

Thanks for your interest in contributing! This is a learning project, and contributions are welcome.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/Fortune-trader.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit: `git commit -m "Add: your feature description"`
7. Push: `git push origin feature/your-feature-name`
8. Create a Pull Request

## 📋 Development Setup

### Prerequisites
- Node.js 18+ (for Firebase Functions)
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (free tier is fine)

### Local Development
```bash
# Install dependencies
cd functions
npm install
cd ..

# Run Firebase emulators (optional)
firebase emulators:start

# Or just open index.html in a browser
# The game works without a local server
```

## 🎯 Areas for Contribution

### Easy (Good First Issues)
- [ ] Add new fortune cookie texts
- [ ] Add sound effects
- [ ] Improve mobile responsiveness
- [ ] Add keyboard shortcuts
- [ ] Improve error messages
- [ ] Add loading animations

### Medium
- [ ] New prophecy types (e.g., "price ceiling", "volume spike")
- [ ] Additional stock symbols
- [ ] Chart indicators (RSI, MACD, etc.)
- [ ] Daily challenges/achievements
- [ ] Profile customization
- [ ] Dark mode

### Hard
- [ ] Multiplayer features
- [ ] Real-time chat
- [ ] Tournament system
- [ ] Advanced AI opponents
- [ ] WebSocket price feeds
- [ ] Mobile app (React Native)

## 📝 Code Style

### JavaScript
- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names
- Add comments for complex logic
- Keep functions small and focused

### Example
```javascript
// Good
const calculatePortfolioValue = (balance, holdings) => {
    return balance + holdings.reduce((sum, h) => sum + h.value, 0);
};

// Avoid
function calc(b, h) {
    var t = b;
    for (var i = 0; i < h.length; i++) t += h[i].value;
    return t;
}
```

### CSS
- Use BEM naming convention
- Keep selectors shallow
- Group related properties
- Use CSS variables for colors/sizes

### File Organization
```
js/
├── main.js          # Initialization
├── state.js         # State management
├── trading.js       # Game logic
├── ui.js            # UI updates
├── chart.js         # Chart rendering
└── config.js        # Configuration
```

## 🔒 Security Considerations

### Important Rules
1. **Never commit secrets** (API keys that aren't meant to be public)
2. **Test security features** before submitting PRs
3. **Don't disable security** without discussion
4. **Document security changes** thoroughly

### Firebase API Keys
- The Firebase config in `firebase.js` is **safe to commit**
- These API keys are designed to be public
- Real security is in Firestore Rules (server-side)

### Testing Security Changes
```javascript
// Test anti-cheat by trying to cheat
state.bankBalance = 999999999;
// Should see: ⚠️ Warning and value doesn't change

// Test validation
saveGameState();
// Should see: ✅ Cloud validation passed
```

## 🧪 Testing

### Manual Testing Checklist
Before submitting a PR, test:
- [ ] Game loads without errors
- [ ] Firebase authentication works
- [ ] Trades execute correctly
- [ ] Balance updates properly
- [ ] Charts render smoothly
- [ ] Sounds play (if applicable)
- [ ] Mobile view works
- [ ] Leaderboard displays
- [ ] Anti-cheat blocks manipulation

### Browser Testing
Test in at least 2 browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)

## 📦 Pull Request Process

### Before Submitting
1. **Test thoroughly** - The game should work perfectly
2. **Update documentation** - If you changed functionality
3. **Check console** - No errors or warnings
4. **Verify security** - Anti-cheat still works
5. **Clean code** - Remove console.logs, commented code

### PR Description Template
```markdown
## What does this PR do?
Brief description of the changes

## Why is this needed?
Explain the problem or feature request

## How was this tested?
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Verified anti-cheat works
- [ ] Checked for console errors

## Screenshots (if applicable)
Add screenshots for UI changes

## Breaking changes?
Yes/No - Explain if yes
```

### Review Process
1. Maintainer will review within a few days
2. May request changes
3. Once approved, PR will be merged
4. You'll be added to contributors! 🎉

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Clear browser cache and test again
3. Test in incognito mode
4. Check browser console for errors

### Bug Report Template
```markdown
**Describe the bug**
Clear description of what happened

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should have happened

**Screenshots**
If applicable

**Environment**
- Browser: [e.g. Chrome 120]
- OS: [e.g. Windows 11]
- Game Version: [e.g. 2.0]

**Console Errors**
Paste any console errors here
```

## 💡 Feature Requests

We're open to ideas! Before requesting:
1. Check existing feature requests
2. Consider if it fits the game's theme
3. Think about implementation complexity

### Feature Request Template
```markdown
**Feature Description**
What feature do you want?

**Why is this useful?**
How does it improve the game?

**Possible Implementation**
Your ideas on how to implement it

**Alternatives Considered**
Other ways to achieve the same goal
```

## 📞 Questions?

- **Discord**: [Your Discord Server]
- **Email**: [Your Email]
- **Issues**: GitHub Issues for bugs/features
- **Discussions**: GitHub Discussions for questions

## 🎯 Coding Principles

1. **User First** - Prioritize player experience
2. **Security Second** - Don't compromise anti-cheat
3. **Performance Matters** - Keep the game smooth
4. **Mobile Friendly** - Consider mobile users
5. **Accessibility** - Make it usable for everyone

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🎉

Every contribution, no matter how small, makes this project better.
