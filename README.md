# Current LEX v1.0 Prototype

A lecture platform prototype based on the Coursera learning experience. Watch lectures, browse course content, and follow along with interactive transcripts.

## Project Structure

```
lecture-app/
├── index.html      # Main entry point
├── css/
│   └── styles.css  # Styles
├── js/
│   └── main.js     # Application logic
├── package.json
└── README.md
```

## Getting Started

### Option 1: Open directly
Open `index.html` in your browser. The prototype starts at the homepage with the intro modal.

### Option 2: Run with dev server
```bash
npm start
```
Then visit http://localhost:3000 (or the port shown).

## Features

- **Header**: Logo, course badge, progress tracker, language/coach icons
- **Sidebar**: Collapsible course modules and lecture list
- **Video player**: Placeholder with play button and controls
- **Tabs**: About and Transcript sections
- **Transcript**: Timestamped lecture content

## Tech Stack

- HTML5
- CSS3 (custom properties, flexbox)
- Vanilla JavaScript
- [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) font
