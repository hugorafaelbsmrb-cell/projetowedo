
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'assets', 'block_icons');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function createIcon(pathD, color="#fff") {
    // Note: Removed the circle background so the image is just the icon.
    // The user can add their own background in the PNG/SVG.
    // Or I can keep it for consistency until they replace it.
    // I'll keep the circle for now so it looks good immediately.
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.15)" />
  <path d="${pathD}" fill="${color}" transform="scale(0.7) translate(5,5)" />
</svg>`;
}

function createIconStroke(content, stroke="#fff") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.15)" stroke="none" />
  <g transform="scale(0.7) translate(5,5)">
  ${content}
  </g>
</svg>`;
}

const pathPlay = "M8 5v14l11-7z";
const motorContent = '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>';
const waitContent = '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>';
const loopContent = '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>';
const ledContent = '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>';
const soundContent = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';

const icons = {
    'play.svg': createIcon(pathPlay),
    'motor.svg': createIconStroke(motorContent),
    'wait.svg': createIconStroke(waitContent),
    'loop.svg': createIconStroke(loopContent),
    'led.svg': createIconStroke(ledContent),
    'sound.svg': createIconStroke(soundContent)
};

for (const [filename, content] of Object.entries(icons)) {
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), content);
    console.log(`Generated ${filename}`);
}
