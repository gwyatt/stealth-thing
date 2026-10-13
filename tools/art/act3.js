import { PALETTES as P, eyes, glow, flame, tatters } from './lib.js';

export const ART = {};

ART.ash_wraith = {
  w: 210, h: 260, pal: P.ash,
  body: `
  <path d="M104 40 C74 40 64 70 62 100 C58 150 50 200 30 250 C60 236 70 252 90 236 C100 252 120 236 132 250 C140 230 160 244 176 232 C150 190 146 140 144 100 C142 66 132 40 104 40 Z" fill="url(#cloth)"/>
  <path d="M30 250 C40 220 60 210 50 190 M176 232 C170 210 180 196 172 176" stroke="#8b8580" stroke-width="1.5" fill="none" opacity="0.4"/>
  <g fill="#bdb5ab" opacity="0.5"><circle cx="40" cy="236" r="2"/><circle cx="24" cy="214" r="1.4"/><circle cx="186" cy="220" r="1.6"/><circle cx="60" cy="256" r="1.2"/><circle cx="160" cy="256" r="1.5"/><circle cx="14" cy="190" r="1"/></g>
  <path d="M70 110 C50 120 34 130 24 136 L28 146 C44 140 60 134 78 128 Z" fill="url(#cloth)"/>
  <path d="M24 136 L10 132 M26 140 L10 142 M28 144 L14 152 M24 136 L16 124" stroke="url(#bone)" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M84 70 C84 56 124 56 124 70 L122 104 C112 112 96 112 86 104 Z" fill="#030303"/>
  ${eyes([[96, 84], [112, 84]], 2.2)}`,
};

ART.cinder_golem = {
  w: 250, h: 260, pal: P.magma,
  body: `
  <path d="M70 90 L180 84 L200 160 L176 200 L190 250 L146 250 L136 206 L112 206 L100 250 L56 250 L72 200 L50 160 Z" fill="url(#body)"/>
  <path d="M70 92 L30 120 L18 190 L50 196 L60 140 L84 124 Z" fill="url(#body)"/>
  <path d="M10 186 L58 190 L56 222 L14 220 Z" fill="url(#body)"/>
  <path d="M178 88 L222 120 L232 186 L200 192 L192 140 L170 124 Z" fill="url(#bodyDark)"/>
  <path d="M196 186 L238 182 L240 214 L200 218 Z" fill="url(#bodyDark)"/>
  <path d="M96 40 L156 36 L164 86 L90 90 Z" fill="url(#body)"/>
  <g stroke="#ff7a2a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M110 100 L120 130 L104 150 L118 180"/><path d="M150 96 L142 120 L160 140 L150 170"/><path d="M30 140 L44 160 L36 180"/>
    <path d="M206 130 L214 156"/><path d="M80 214 L76 236"/><path d="M164 212 L170 236"/>
  </g>
  <g stroke="#ffd27a" stroke-width="1" fill="none"><path d="M110 100 L120 130 L104 150 L118 180"/><path d="M150 96 L142 120 L160 140 L150 170"/></g>
  <circle cx="128" cy="140" r="40" fill="#ff7a2a" opacity="0.15" filter="url(#b8)"/>
  <path d="M104 60 L148 58" stroke="#0a0504" stroke-width="10"/>
  ${eyes([[114, 60], [138, 59]], 2.6)}`,
};

ART.flame_cultist = {
  w: 200, h: 260, pal: P.ember,
  body: `
  <path d="M100 60 C72 66 62 120 64 170 L50 250 ${tatters(50, 154, 250, 12, 8).slice(1)} L154 250 L140 168 C142 118 128 66 100 60 Z" fill="url(#cloth)"/>
  <path d="M100 120 L100 250" stroke="#7a1f14" stroke-width="10" opacity="0.6"/>
  <path d="M72 120 C60 130 50 140 46 150 L56 156 C62 146 70 140 80 134 Z" fill="url(#cloth)"/>
  <path d="M46 150 L26 170 L30 174 L50 156" fill="url(#metal)"/>
  <path d="M26 170 C14 172 10 162 18 156 L30 164 Z" fill="url(#metal)"/>
  <path d="M100 26 C80 28 70 50 72 74 C74 90 84 98 100 100 C116 98 126 90 128 74 C130 50 120 28 100 26 Z" fill="url(#cloth)"/>
  <path d="M86 56 C88 48 112 48 114 56 L112 86 C106 92 94 92 88 86 Z" fill="#030202"/>
  <rect x="78" y="14" width="6" height="16" fill="#d8ccb0"/><rect x="97" y="6" width="6" height="22" fill="#d8ccb0"/><rect x="116" y="14" width="6" height="16" fill="#d8ccb0"/>
  ${flame(81, 12, 0.32)}${flame(100, 4, 0.38)}${flame(119, 12, 0.32)}
  ${eyes([[94, 68], [106, 68]], 1.8)}`,
};

ART.obsidian_sentry = {
  w: 200, h: 270, pal: P.obsidian,
  body: `
  <path d="M100 10 L136 70 L128 210 L100 236 L72 210 L64 70 Z" fill="url(#body)"/>
  <path d="M100 10 L100 236" stroke="#000" stroke-width="2" opacity="0.6"/>
  <path d="M100 10 L64 70 L100 80 L136 70 Z" fill="#8a8396" opacity="0.35"/>
  <path d="M30 100 L48 90 L52 130 L36 136 Z" fill="url(#body)"/><path d="M152 90 L170 100 L164 136 L148 130 Z" fill="url(#bodyDark)"/>
  <path d="M40 170 L54 160 L58 190 L44 196 Z" fill="url(#body)"/><path d="M146 160 L160 170 L156 196 L142 190 Z" fill="url(#bodyDark)"/>
  <ellipse cx="100" cy="120" rx="22" ry="14" fill="#0a0408"/>
  <circle cx="100" cy="120" r="30" fill="#ff4a2a" opacity="0.35" filter="url(#b8)"/>
  <ellipse cx="100" cy="120" rx="14" ry="9" fill="#ff4a2a"/><ellipse cx="100" cy="120" rx="5" ry="7" fill="#1a0505"/><circle cx="97" cy="117" r="2" fill="#fff"/>
  <path d="M100 236 L100 262" stroke="#ff4a2a" stroke-width="3" opacity="0.4" filter="url(#b1)"/>`,
};

ART.ember_imp = {
  w: 170, h: 180, pal: P.ember,
  body: `
  <path d="M100 70 C120 40 150 40 164 60 C146 60 140 70 146 84 C132 76 120 80 110 92 Z" fill="url(#bodyDark)"/>
  <path d="M30 20 L40 170" stroke="#3a2a1a" stroke-width="4"/>
  <path d="M22 26 L24 4 L30 22 L32 2 L38 22 L40 6 L42 28 Z" fill="url(#metal)"/>
  <path d="M70 90 C60 110 62 140 66 170 L80 170 L86 146 L96 146 L100 170 L114 170 C116 140 114 106 102 90 Z" fill="url(#body)"/>
  <path d="M72 100 C60 104 48 102 38 98 L38 108 C50 112 62 112 74 110 Z" fill="url(#body)"/>
  <path d="M114 140 C130 150 140 160 150 156 C142 150 144 140 150 136 C136 140 126 136 114 130 Z" fill="url(#bodyDark)"/>
  <path d="M86 50 C68 50 62 66 66 80 C70 92 80 96 88 96 C98 96 108 88 108 76 C108 62 100 50 86 50 Z" fill="url(#body)"/>
  <path d="M72 54 C66 40 60 34 52 34 C60 42 64 50 66 60 Z M100 54 C108 40 116 34 124 36 C114 42 108 52 104 62 Z" fill="url(#bone)"/>
  <path d="M74 84 Q86 92 98 84" stroke="#2a0a04" stroke-width="2" fill="none"/>
  <path d="M78 86 L80 90 L82 86 M90 86 L92 90 L94 86" fill="#fff1a8"/>
  ${eyes([[78, 72], [94, 72]], 2.2)}`,
};

ART.phoenix_knight = {
  w: 290, h: 290, pal: P.ember,
  body: `
  <path d="M120 100 C80 60 30 50 4 80 C30 86 26 100 10 116 C40 112 40 128 26 146 C56 136 70 146 70 170 C90 146 106 130 122 124 Z" fill="url(#fire)" opacity="0.9"/>
  <path d="M170 100 C210 60 260 50 286 80 C260 86 264 100 280 116 C250 112 250 128 264 146 C234 136 220 146 220 170 C200 146 184 130 168 124 Z" fill="url(#fire)" opacity="0.75"/>
  <circle cx="145" cy="120" r="80" fill="#ff7a2a" opacity="0.15" filter="url(#b8)"/>
  <path d="M124 110 C106 120 104 170 108 206 L100 280 L130 280 L138 220 L154 220 L162 280 L192 280 L184 206 C188 170 186 120 168 110 Z" fill="url(#metal)"/>
  <path d="M118 130 L174 130 L180 214 ${tatters(180, 112, 214, 22, 5).slice(1)} L112 214 Z" fill="#5a1a10"/>
  <path d="M70 40 L84 270" stroke="url(#metal)" stroke-width="5" stroke-linecap="round"/>
  <path d="M66 46 L70 10 L78 44 Z" fill="url(#metal)"/>
  <path d="M120 118 C100 124 90 136 82 150 L92 158 C100 146 110 138 126 134 Z" fill="url(#metal)"/>
  <path d="M124 56 L166 56 L170 110 L120 110 Z" fill="url(#metal)"/>
  <path d="M124 56 C128 40 162 40 166 56 Z" fill="url(#metal)"/>
  <path d="M128 76 L162 76 L162 82 L128 82 Z" fill="#050404"/>
  <path d="M146 40 C140 20 150 6 164 0 C158 14 166 22 160 40 Z" fill="url(#fire)"/>
  ${eyes([[138, 79], [152, 79]], 1.8)}`,
};

ART.magma_behemoth = {
  w: 320, h: 280, pal: P.magma,
  body: `
  <path d="M60 120 C70 70 130 50 190 56 C250 62 300 100 296 160 C294 190 280 210 270 220 L280 270 L240 270 L232 228 L120 228 L112 270 L72 270 L80 220 C60 200 54 160 60 120 Z" fill="url(#body)"/>
  <path d="M80 90 L90 70 L100 88 L116 62 L124 84 L140 58 L148 80 L166 56 L170 78 L190 58 L190 80" fill="url(#bodyDark)"/>
  <path d="M70 120 C46 104 22 110 14 130 C8 148 18 168 36 172 C56 176 72 160 76 146 Z" fill="url(#body)"/>
  <path d="M40 110 C30 90 34 70 50 60 C46 80 52 96 60 108 Z M58 104 C58 84 70 70 86 68 C76 82 74 96 76 110 Z" fill="url(#bone)"/>
  <path d="M20 160 Q36 168 54 160" stroke="#ff7a2a" stroke-width="3" fill="none"/>
  <g stroke="#ff7a2a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M110 120 L130 150 L120 180 L140 210"/><path d="M190 100 L180 130 L200 160 L190 200"/><path d="M250 130 L240 160 L256 190"/><path d="M90 230 L86 260"/><path d="M256 232 L262 260"/>
  </g>
  <g stroke="#ffd27a" stroke-width="1.4" fill="none"><path d="M110 120 L130 150 L120 180 L140 210"/><path d="M190 100 L180 130 L200 160 L190 200"/></g>
  <circle cx="170" cy="160" r="70" fill="#ff7a2a" opacity="0.14" filter="url(#b8)"/>
  ${eyes([[30, 132], [46, 130]], 2.8)}`,
};

ART.ember_tyrant = {
  w: 320, h: 360, pal: P.obsidian,
  body: `
  <circle cx="170" cy="150" r="120" fill="#ff4a2a" opacity="0.13" filter="url(#b8)"/>
  <path d="M118 150 C88 176 82 240 92 290 L66 352 ${tatters(66, 268, 352, 14, 11).slice(1)} L268 352 L244 288 C254 238 248 174 220 150 Z" fill="url(#cloth)"/>
  <path d="M150 220 L150 352 M190 220 L192 352" stroke="#ff4a2a" stroke-width="1.5" opacity="0.35"/>
  <path d="M120 150 C140 166 200 166 220 150 L214 214 C190 228 150 228 126 214 Z" fill="url(#metal)"/>
  <path d="M132 176 Q170 188 208 176 M134 196 Q170 208 206 196" stroke="#0a0606" stroke-width="2" fill="none"/>
  <path d="M110 160 C80 172 64 204 58 240 L78 246 C84 214 96 194 120 182 Z" fill="url(#metal)"/>
  <path d="M230 160 C258 172 272 204 274 240 L256 244 C252 214 242 194 220 182 Z" fill="url(#bodyDark)"/>
  <path d="M62 236 L66 352" stroke="url(#metal)" stroke-width="13" stroke-linecap="round"/>
  <path d="M66 250 L66 340" stroke="#ff4a2a" stroke-width="2.5" opacity="0.7" filter="url(#b1)"/>
  <path d="M40 232 L92 232" stroke="#3a2a1a" stroke-width="9" stroke-linecap="round"/>
  <path d="M62 232 L62 214" stroke="#2a1d12" stroke-width="7"/><circle cx="62" cy="210" r="6" fill="#ff4a2a"/>
  <path d="M106 152 C88 140 88 118 104 110 L124 136 Z M234 152 C252 140 252 118 236 110 L216 136 Z" fill="url(#metal)"/>
  <path d="M170 68 C146 68 134 92 136 116 C138 140 154 156 170 156 C186 156 202 140 204 116 C206 92 194 68 170 68 Z" fill="url(#body)"/>
  <path d="M140 96 C118 78 108 54 114 28 C126 50 136 64 152 74 Z M200 96 C222 78 232 54 226 28 C214 50 204 64 188 74 Z" fill="url(#bone)"/>
  <path d="M150 124 L156 140 L164 130 L170 144 L176 130 L184 140 L190 124" stroke="#ff4a2a" stroke-width="2" fill="none" opacity="0.85"/>
  ${flame(150, 72, 0.5)}${flame(170, 60, 0.75)}${flame(190, 72, 0.5)}
  <path d="M144 74 L196 74" stroke="url(#metal)" stroke-width="6"/>
  ${eyes([[156, 106], [184, 106]], 3.2)}`,
};
