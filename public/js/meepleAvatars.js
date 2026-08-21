/**
 * TVmunk - bgn Meeple Avatar Generator
 * Generates adorable, colorful human-faced Meeple vector avatars
 */

const MEEPLE_COLORS = {
  red: { main: '#ee2726', light: '#ff5c5c', name: 'bgn Red' },
  pink: { main: '#ec4899', light: '#f472b6', name: 'Sakura Pink' },
  purple: { main: '#8b5cf6', light: '#a78bfa', name: 'Royal Purple' },
  orange: { main: '#f97316', light: '#fb923c', name: 'Sunset Orange' },
  blue: { main: '#0ea5e9', light: '#38bdf8', name: 'Sky Blue' },
  green: { main: '#10b981', light: '#34d399', name: 'Emerald Green' },
  yellow: { main: '#eab308', light: '#facc15', name: 'Sunshine Yellow' },
  teal: { main: '#14b8a6', light: '#2dd4bf', name: 'Aqua Mint' },
  indigo: { main: '#6366f1', light: '#818cf8', name: 'Deep Indigo' },
  rose: { main: '#f43f5e', light: '#fb7185', name: 'Coral Rose' },
  violet: { main: '#a855f7', light: '#c084fc', name: 'Soft Lavender' },
  amber: { main: '#d97706', light: '#fbbf24', name: 'Warm Amber' }
};

function generateMeepleSvg({ color = 'red', face = 'happy', accessory = 'none', bg = '#121216' }) {
  const c = MEEPLE_COLORS[color] || MEEPLE_COLORS.red;
  const gradId = `grad-meeple-${color}-${Math.random().toString(36).substr(2, 4)}`;

  // Face Elements
  let faceSvg = '';
  if (face === 'happy') {
    // Round sparkling eyes + big smile + pink cheeks
    faceSvg = `
      <ellipse cx="43" cy="27" rx="2.5" ry="3.5" fill="#ffffff" />
      <circle cx="44" cy="26" r="1.2" fill="#111827" />
      <ellipse cx="57" cy="27" rx="2.5" ry="3.5" fill="#ffffff" />
      <circle cx="56" cy="26" r="1.2" fill="#111827" />
      <ellipse cx="40" cy="32" rx="3.5" ry="2" fill="#ff4d79" opacity="0.75" />
      <ellipse cx="60" cy="32" rx="3.5" ry="2" fill="#ff4d79" opacity="0.75" />
      <path d="M 45,32 Q 50,38 55,32" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    `;
  } else if (face === 'wink') {
    // One sparkling eye + one wink arc + cute mouth + cheeks
    faceSvg = `
      <ellipse cx="43" cy="27" rx="2.5" ry="3.5" fill="#ffffff" />
      <circle cx="44" cy="26" r="1.2" fill="#111827" />
      <path d="M 54,27 Q 57,24 60,27" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
      <ellipse cx="40" cy="32" rx="3.5" ry="2" fill="#ff4d79" opacity="0.75" />
      <ellipse cx="60" cy="32" rx="3.5" ry="2" fill="#ff4d79" opacity="0.75" />
      <path d="M 46,33 Q 50,37 54,33" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    `;
  } else if (face === 'cool') {
    // Cool sunglasses + confident smile
    faceSvg = `
      <rect x="38" y="24" width="10" height="7" rx="3" fill="#18181b" stroke="#ffffff" stroke-width="1.2" />
      <rect x="52" y="24" width="10" height="7" rx="3" fill="#18181b" stroke="#ffffff" stroke-width="1.2" />
      <line x1="48" y1="27" x2="52" y2="27" stroke="#ffffff" stroke-width="1.5" />
      <ellipse cx="40" cy="33" rx="2.5" ry="1.5" fill="#ff4d79" opacity="0.6" />
      <ellipse cx="60" cy="33" rx="2.5" ry="1.5" fill="#ff4d79" opacity="0.6" />
      <path d="M 46,34 Q 50,38 54,34" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
    `;
  } else if (face === 'blush') {
    // Anime smile eyes ^^ + cute blush + cat smile :3
    faceSvg = `
      <path d="M 40,27 Q 43,23 46,27" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
      <path d="M 54,27 Q 57,23 60,27" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
      <ellipse cx="39" cy="31" rx="4" ry="2.2" fill="#ff3366" opacity="0.85" />
      <ellipse cx="61" cy="31" rx="4" ry="2.2" fill="#ff3366" opacity="0.85" />
      <path d="M 46,33 Q 48,35 50,33 Q 52,35 54,33" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
    `;
  } else if (face === 'sparkle') {
    // Anime star sparkle eyes + joyous open mouth
    faceSvg = `
      <polygon points="43,23 44.5,26.5 48,27 45,29.5 46,33 43,30.5 40,33 41,29.5 38,27 41.5,26.5" fill="#fef08a" />
      <polygon points="57,23 58.5,26.5 62,27 59,29.5 60,33 57,30.5 54,33 55,29.5 52,27 55.5,26.5" fill="#fef08a" />
      <ellipse cx="40" cy="33" rx="3" ry="1.8" fill="#ff4d79" opacity="0.75" />
      <ellipse cx="60" cy="33" rx="3" ry="1.8" fill="#ff4d79" opacity="0.75" />
      <path d="M 46,33 Q 50,39 54,33 Z" fill="#ffffff" />
    `;
  } else if (face === 'glasses') {
    // Cute round glasses + smiling eyes
    faceSvg = `
      <circle cx="43" cy="27" r="5.5" fill="none" stroke="#ffffff" stroke-width="1.5" />
      <circle cx="57" cy="27" r="5.5" fill="none" stroke="#ffffff" stroke-width="1.5" />
      <line x1="48.5" y1="27" x2="51.5" y2="27" stroke="#ffffff" stroke-width="1.5" />
      <circle cx="43" cy="27" r="2" fill="#ffffff" />
      <circle cx="57" cy="27" r="2" fill="#ffffff" />
      <ellipse cx="38" cy="33" rx="3" ry="1.8" fill="#ff4d79" opacity="0.75" />
      <ellipse cx="62" cy="33" rx="3" ry="1.8" fill="#ff4d79" opacity="0.75" />
      <path d="M 46,34 Q 50,38 54,34" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
    `;
  } else {
    // Cheerful default
    faceSvg = `
      <ellipse cx="43" cy="27" rx="2.5" ry="3.5" fill="#ffffff" />
      <circle cx="44" cy="26" r="1.2" fill="#111827" />
      <ellipse cx="57" cy="27" rx="2.5" ry="3.5" fill="#ffffff" />
      <circle cx="56" cy="26" r="1.2" fill="#111827" />
      <ellipse cx="40" cy="32" rx="3" ry="1.8" fill="#ff4d79" opacity="0.7" />
      <ellipse cx="60" cy="32" rx="3" ry="1.8" fill="#ff4d79" opacity="0.7" />
      <path d="M 46,32 Q 50,36 54,32" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
    `;
  }

  // Accessories
  let accSvg = '';
  if (accessory === 'crown') {
    // Gold mini crown on head
    accSvg = `
      <polygon points="42,14 44,8 47,12 50,7 53,12 56,8 58,14" fill="#facc15" stroke="#ca8a04" stroke-width="0.8" />
      <circle cx="50" cy="8" r="1" fill="#ef4444" />
    `;
  } else if (accessory === 'bowtie') {
    // Cute red/white bow tie on neck
    accSvg = `
      <polygon points="45,43 50,45 45,47" fill="#ffffff" />
      <polygon points="55,43 50,45 55,47" fill="#ffffff" />
      <circle cx="50" cy="45" r="1.5" fill="#ef4444" />
    `;
  } else if (accessory === 'tie') {
    // Necktie on chest
    accSvg = `
      <polygon points="48,44 52,44 53,54 50,58 47,54" fill="#ffffff" />
    `;
  } else if (accessory === 'flower') {
    // Little flower on head
    accSvg = `
      <circle cx="37" cy="18" r="2.5" fill="#f43f5e" />
      <circle cx="34" cy="16" r="2.5" fill="#f43f5e" />
      <circle cx="34" cy="20" r="2.5" fill="#f43f5e" />
      <circle cx="32" cy="18" r="2.5" fill="#f43f5e" />
      <circle cx="34.5" cy="18" r="1.5" fill="#facc15" />
    `;
  } else if (accessory === 'star') {
    // Gold star badge on chest
    accSvg = `
      <polygon points="50,49 51.5,52.5 55,53 52,55.5 53,59 50,56.5 47,59 48,55.5 45,53 48.5,52.5" fill="#facc15" />
    `;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <radialGradient id="${gradId}" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${c.light}" />
      <stop offset="100%" stop-color="${c.main}" />
    </radialGradient>
    <filter id="meeple-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background tile -->
  <rect width="100" height="100" rx="26" fill="${bg}" />

  <!-- Meeple Body -->
  <g filter="url(#meeple-shadow)">
    <!-- Meeple Silhouette Path -->
    <path d="M 50,14 C 59,14 66,21 66,30 C 66,36 62,41 57,43 C 66,47 79,53 87,63 C 90,66 88,71 84,72 C 77,73 71,70 66,65 L 66,79 C 66,82 71,85 75,87 C 78,89 77,93 73,93 L 55,93 C 53,93 52,89 52,85 L 52,74 C 52,72 48,72 48,74 L 48,85 C 48,89 47,93 45,93 L 27,93 C 23,93 22,89 25,87 C 29,85 34,82 34,79 L 34,65 C 29,70 23,73 16,72 C 12,71 10,66 13,63 C 21,53 34,47 43,43 C 38,41 34,36 34,30 C 34,21 41,14 50,14 Z" fill="url(#${gradId})" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.35" />

    <!-- Meeple Cute Human Face -->
    ${faceSvg}

    <!-- Accessories -->
    ${accSvg}
  </g>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Preset Character Meeple Gallery
const MEEPLE_PRESETS = [
  { id: 'wat', name: '🔴 Meeple พี่วัฒน์ (Boss Red)', color: 'red', face: 'cool', accessory: 'crown' },
  { id: 'milk', name: '🌸 Meeple พี่มิ้ว (Boss Pink)', color: 'pink', face: 'blush', accessory: 'crown' },
  { id: 'arth', name: '🟣 Meeple เซอร์อาร์ธ (Purple Knight)', color: 'purple', face: 'sparkle', accessory: 'tie' },
  { id: 'mook', name: '🟠 Meeple มุก (Orange Wink)', color: 'orange', face: 'wink', accessory: 'bowtie' },
  { id: 'aon', name: '🔵 Meeple อร (Sky Cheerful)', color: 'blue', face: 'happy', accessory: 'flower' },
  { id: 'pao', name: '🟢 Meeple เปา (Green Glasses)', color: 'green', face: 'glasses', accessory: 'star' },
  { id: 'sunshine', name: '🟡 Meeple ซันไชน์ (Sunshine Smile)', color: 'yellow', face: 'happy', accessory: 'bowtie' },
  { id: 'mint', name: '🩵 Meeple อความินต์ (Aqua Star)', color: 'teal', face: 'sparkle', accessory: 'star' },
  { id: 'indigo', name: '💙 Meeple ไนท์อินดิโก้ (Night Cool)', color: 'indigo', face: 'cool', accessory: 'tie' },
  { id: 'rose', name: '🌺 Meeple คอรัลโรส (Coral Blush)', color: 'rose', face: 'blush', accessory: 'flower' },
  { id: 'lavender', name: '💜 Meeple ลาเวนเดอร์ (Soft Wink)', color: 'violet', face: 'wink', accessory: 'bowtie' },
  { id: 'amber', name: '🍯 Meeple อำพัน (Warm Smile)', color: 'amber', face: 'glasses', accessory: 'tie' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateMeepleSvg, MEEPLE_PRESETS, MEEPLE_COLORS };
}
