# Focus Timer - Pomodoro App

A beautiful, minimalist Pomodoro timer with glassmorphism design and ambient sounds.

## Features

- **Pomodoro Technique**: 25min work / 5min break / 15min long break
- **Multiple Techniques**: Pomodoro, Flowtime, Time Blocking, Pomodoro Plus
- **Achievement System**: Track completed cycles with badge counter
- **Ambient Sounds**: Rain, Forest, Café, and Lofi music options
- **Responsive Design**: Optimized for desktop and mobile
- **Glassmorphism UI**: Modern, elegant interface
- **Audio Feedback**: Cassette-style button sounds
- **Persistent Settings**: Saves preferences in localStorage

## Quick Start

1. **Clone or download** the project files
2. **Serve the files** using any web server:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open** `http://localhost:8000` in your browser

## File Structure

```
Timer/
├── index.html          # Main HTML file
├── style.css           # All styles and responsive design
├── script.js           # Timer logic and features
├── audio/
│   └── ui/
│       └── cassette-player-button-1.mp3  # Button sounds
└── README.md           # This file
```

## Production Deployment

### Option 1: Static Hosting (Recommended)
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect your GitHub repo
- **GitHub Pages**: Push to a repository and enable Pages
- **Firebase Hosting**: Use Firebase CLI

### Option 2: Web Server
- Upload all files to your web server
- Ensure the `audio/` folder is accessible
- No server-side processing required

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile
- **Features**: Web Audio API, localStorage, CSS Grid/Flexbox

## Customization

### Adding New Audio
1. Add audio files to `audio/` folder
2. Update the audio options in `index.html`
3. Add corresponding logic in `script.js`

### Changing Timer Durations
Edit the `loadTechnique()` method in `script.js`:
```javascript
case 'pomodoro':
    this.workTime = 25 * 60;        // 25 minutes
    this.shortBreakTime = 5 * 60;   // 5 minutes
    this.longBreakTime = 15 * 60;   // 15 minutes
    break;
```

### Styling
All styles are in `style.css` with clear comments for easy customization.

## Performance

- **Lightweight**: ~50KB total (excluding audio)
- **Fast Loading**: Optimized CSS and JavaScript
- **Offline Ready**: Works without internet after initial load
- **Mobile Optimized**: No scroll, perfect viewport fit

## License

MIT License - Feel free to use and modify.

## Support

For issues or questions, please check the code comments or create an issue in the repository.