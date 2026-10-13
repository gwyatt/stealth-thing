import { PALETTES as P, eyes, glow, flame, tatters } from './lib.js';

export const ART = {};

// ── The Lanternkeeper: hooded knight, lantern held forward, sword lowered ──
ART.player = {
  w: 220, h: 260, pal: P.player, lightFrom: 'right',
  body: `
  <circle cx="160" cy="160" r="44" fill="#ffb347" opacity="0.16" filter="url(#b8)"/>
  <!-- cloak (behind) -->
  <path d="M74 74 C52 110 44 170 40 236 ${tatters(40, 150, 236, 16, 9).slice(1)} L150 236 C146 180 138 120 128 76 Z" fill="url(#cloth)"/>
  <!-- sword, lowered behind -->
  <path d="M79 132 L44 242 L49 244 L86 134 Z" fill="url(#metal)"/>
  <path d="M70 128 L96 140" stroke="#5a4a32" stroke-width="5" stroke-linecap="round"/>
  <rect x="80" y="118" width="7" height="16" rx="2" fill="#3a2a1a" transform="rotate(18 83 126)"/>
  <!-- legs -->
  <path d="M88 168 L84 228 L72 236 L96 236 L98 172 Z" fill="url(#metal)"/>
  <path d="M110 168 L118 228 L114 236 L138 236 L126 226 L122 168 Z" fill="url(#metal)"/>
  <path d="M84 196 L100 196 M114 196 L126 196" stroke="#0b0a09" stroke-width="2"/>
  <!-- skirt of mail and cloth -->
  <path d="M80 136 L126 136 L134 182 ${tatters(134, 76, 182, 10, 6).slice(1)} L76 182 Z" fill="url(#cloth)"/>
  <!-- chestplate -->
  <path d="M78 74 L124 74 L128 112 L120 140 L84 140 L76 112 Z" fill="url(#metal)"/>
  <path d="M101 76 L101 138" stroke="#0b0a09" stroke-width="1.5" opacity="0.7"/>
  <path d="M82 104 Q101 112 124 104" stroke="#0b0a09" stroke-width="1.5" fill="none" opacity="0.6"/>
  <rect x="80" y="134" width="46" height="7" fill="#2a1d12"/>
  <rect x="98" y="133" width="8" height="9" fill="#8a6a3a"/>
  <!-- scarf / mantle -->
  <path d="M72 70 C84 62 118 62 130 70 L134 88 C120 80 84 80 70 90 Z" fill="url(#cloth)"/>
  <path d="M70 90 L66 112 L74 104 L78 116 L82 96 Z" fill="url(#cloth)"/>
  <!-- pauldrons -->
  <path d="M64 86 C64 70 80 64 90 72 L88 92 C80 96 70 96 64 86 Z" fill="url(#metal)"/>
  <path d="M136 86 C136 70 122 64 112 72 L114 92 C122 96 132 96 136 86 Z" fill="url(#metal)"/>
  <!-- off arm resting on sword -->
  <path d="M68 90 L64 120 L76 128 L80 96 Z" fill="url(#metal)"/>
  <!-- lantern arm, extended -->
  <path d="M126 82 C140 92 150 104 160 118 L152 124 C142 112 132 102 120 96 Z" fill="url(#metal)"/>
  <circle cx="158" cy="122" r="7" fill="#2a2018"/>
  <!-- hood and helm -->
  <path d="M101 18 C80 20 70 40 72 60 C74 70 80 76 86 78 L118 78 C126 72 130 62 129 50 C128 34 118 20 101 18 Z" fill="url(#cloth)"/>
  <path d="M101 18 C92 12 82 14 76 24 C84 22 90 22 96 24 Z" fill="url(#cloth)"/>
  <path d="M90 40 C94 34 112 34 118 42 L118 66 C112 72 96 72 90 66 Z" fill="#050404"/>
  <path d="M93 46 L116 46 L116 50 L93 50 Z" fill="#1a1612"/>
  ${eyes([[100, 48], [110, 48]], 1.4)}
  <!-- lantern on a short chain -->
  <path d="M159 128 L161 142" stroke="#3a2f22" stroke-width="2"/>
  <circle cx="162" cy="162" r="26" fill="#ffb347" opacity="0.4" filter="url(#b8)"/>
  <path d="M150 146 L174 146 L170 140 L154 140 Z" fill="#3a2f22"/>
  <rect x="150" y="146" width="24" height="30" rx="3" fill="#ffcf7a" opacity="0.95"/>
  <ellipse cx="162" cy="162" rx="7" ry="10" fill="#fff4c2"/>
  <path d="M150 146 L150 176 M158 146 L158 176 M166 146 L166 176 M174 146 L174 176" stroke="#2a2018" stroke-width="2.4"/>
  <path d="M148 176 L176 176 L172 182 L152 182 Z" fill="#3a2f22"/>`,
};

// ── Act 1: The Sunken Crypt ──
ART.crypt_rat = {
  w: 200, h: 150, pal: P.flesh,
  body: `
  <path d="M150 112 C176 112 192 96 186 78 C184 92 172 104 150 104 Z" fill="url(#bodyDark)"/>
  <path d="M36 118 C30 92 52 66 92 60 C130 54 164 72 166 102 C168 118 156 130 140 132 L56 132 C46 132 38 126 36 118 Z" fill="url(#body)"/>
  <path d="M60 66 L66 54 L72 64 L80 50 L86 62 L96 48 L102 60 L112 50 L116 62 L128 54 L130 66 L142 62 L140 76 Z" fill="url(#bodyDark)"/>
  <path d="M46 92 C30 92 16 100 10 112 C20 114 34 116 50 112 Z" fill="url(#body)"/>
  <path d="M10 112 L6 116 L14 116 Z" fill="#2a1a1a"/>
  <path d="M48 84 L44 66 L58 80 Z" fill="url(#body)"/>
  <path d="M52 132 L46 140 M58 132 L56 141 M120 132 L118 141 M128 132 L130 141" stroke="#1a1210" stroke-width="3" stroke-linecap="round"/>
  <path d="M14 116 L18 122 L22 116" fill="#d8ccb0"/>
  ${eyes([[36, 100]], 2.6)}`,
};

ART.drowned_thrall = {
  w: 200, h: 240, pal: P.crypt,
  body: `
  <path d="M86 92 C70 110 66 150 70 190 L64 232 L82 232 L88 196 L100 196 L106 232 L124 232 L118 186 C124 150 122 112 112 92 Z" fill="url(#body)"/>
  <path d="M84 96 C76 120 72 160 76 196 ${tatters(76, 124, 196, 22, 6).slice(1)} L124 196 C122 160 120 120 114 96 Z" fill="url(#cloth)" opacity="0.92"/>
  <path d="M90 96 C70 106 54 130 46 166 L40 192 L48 194 L56 168 C62 146 72 130 84 120 Z" fill="url(#body)"/>
  <path d="M40 192 L34 204 M43 194 L40 207 M47 194 L47 206" stroke="#3a4448" stroke-width="2" stroke-linecap="round"/>
  <path d="M110 98 C122 112 128 140 126 170 L120 172 C118 146 114 126 104 112 Z" fill="url(#bodyDark)"/>
  <path d="M74 66 C70 50 80 36 94 36 C108 36 114 50 110 66 C108 78 100 88 92 88 C84 88 76 80 74 66 Z" fill="url(#body)"/>
  <path d="M80 70 C84 64 90 64 92 70 M96 70 C98 64 104 64 106 70" stroke="#050606" stroke-width="5" fill="none"/>
  <path d="M84 80 C88 84 96 84 100 80" stroke="#050606" stroke-width="3" fill="none"/>
  <path d="M76 52 C70 66 72 90 70 104 M108 50 C116 70 112 92 116 110" stroke="#2b3a2a" stroke-width="3" fill="none" opacity="0.9"/>
  <path d="M60 130 L60 150 M98 200 L98 214 M118 150 L118 162" stroke="#9fd4e6" stroke-width="1.2" opacity="0.6"/>
  ${eyes([[86, 70], [100, 70]], 1.8)}`,
};

ART.bone_archer = {
  w: 200, h: 240, pal: P.bone,
  body: `
  <path d="M82 54 C70 64 66 100 70 132 ${tatters(70, 132, 132, 30, 6).slice(1)} L132 132 C134 100 128 64 116 54 Z" fill="url(#cloth)"/>
  <g stroke="url(#bone)" stroke-linecap="round" fill="none">
    <path d="M100 76 L100 150" stroke-width="6"/>
    <path d="M86 88 Q100 82 114 88 M84 98 Q100 92 116 98 M86 108 Q100 102 114 108 M88 118 Q100 113 112 118" stroke-width="4"/>
    <path d="M92 150 L84 190 L88 230 M108 150 L116 190 L112 230" stroke-width="6"/>
    <path d="M90 82 L62 98 L40 92" stroke-width="5"/>
    <path d="M110 82 L120 104 L64 106" stroke-width="5"/>
  </g>
  <path d="M86 144 Q100 158 114 144 L110 156 L90 156 Z" fill="url(#bone)"/>
  <path d="M36 30 C6 70 6 140 36 186" stroke="#3a2a1a" stroke-width="6" fill="none"/>
  <path d="M36 30 C10 70 10 140 36 186" stroke="#6b4d2e" stroke-width="2" fill="none"/>
  <path d="M36 30 L64 106 L36 186" stroke="#d8ccb0" stroke-width="1" fill="none" opacity="0.8"/>
  <path d="M64 106 L14 104" stroke="#5a4a32" stroke-width="2.4"/>
  <path d="M14 104 L22 100 L22 108 Z" fill="url(#metal)"/>
  <path d="M100 30 C86 30 82 44 84 56 C86 66 92 72 100 72 C108 72 114 66 116 56 C118 44 114 30 100 30 Z" fill="url(#bone)"/>
  <path d="M84 40 C88 24 112 24 118 40 C118 30 110 18 100 18 C90 18 82 28 84 40 Z" fill="url(#cloth)"/>
  <path d="M88 50 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M102 50 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0" fill="#0a0806"/>
  <path d="M94 64 L106 64" stroke="#0a0806" stroke-width="2"/>
  ${eyes([[93, 50], [107, 50]], 1.6)}`,
};

ART.lantern_moth = {
  w: 220, h: 200, pal: P.spore,
  body: `
  <g opacity="0.95">
    <path d="M108 90 C80 30 20 20 10 60 C4 90 40 110 100 104 Z" fill="url(#body)"/>
    <path d="M112 90 C140 30 200 20 210 60 C216 90 180 110 120 104 Z" fill="url(#bodyDark)"/>
    <path d="M102 106 C70 110 30 130 36 160 C44 178 80 160 104 118 Z" fill="url(#body)"/>
    <path d="M118 106 C150 110 190 130 184 160 C176 178 140 160 116 118 Z" fill="url(#bodyDark)"/>
  </g>
  <path d="M30 60 C50 50 80 60 96 88 M190 60 C170 50 140 60 124 88" stroke="#0a080b" stroke-width="2" fill="none" opacity="0.7"/>
  <circle cx="54" cy="62" r="14" fill="#140f15"/><circle cx="54" cy="62" r="9" fill="url(#glow)"/>
  <circle cx="166" cy="62" r="14" fill="#140f15"/><circle cx="166" cy="62" r="9" fill="url(#glow)" opacity="0.6"/>
  <circle cx="66" cy="144" r="7" fill="url(#glow)"/><circle cx="154" cy="144" r="7" fill="url(#glow)" opacity="0.6"/>
  <ellipse cx="110" cy="112" rx="11" ry="40" fill="url(#bodyV)"/>
  <path d="M100 96 L120 96 M99 108 L121 108 M100 120 L120 120 M102 132 L118 132" stroke="#1a1418" stroke-width="2"/>
  <circle cx="110" cy="74" r="11" fill="url(#body)"/>
  <path d="M104 66 C96 46 86 40 76 40 M116 66 C124 46 134 40 144 40" stroke="#5a4a5c" stroke-width="2" fill="none"/>
  <g fill="#ffe9a8" opacity="0.8"><circle cx="40" cy="120" r="1.5"/><circle cx="70" cy="180" r="1.2"/><circle cx="150" cy="186" r="1.4"/><circle cx="190" cy="110" r="1"/><circle cx="24" cy="92" r="1"/></g>
  ${eyes([[104, 74], [116, 74]], 2.2)}`,
};

ART.grave_slime = {
  w: 220, h: 180, pal: P.rot,
  body: `
  <path d="M20 168 C10 120 40 60 110 56 C180 60 210 120 200 168 Z" fill="url(#body)" opacity="0.92"/>
  <path d="M40 160 C36 120 60 80 110 76 C150 78 176 110 176 160 Z" fill="#000" opacity="0.25"/>
  <path d="M86 116 C78 116 74 126 78 134 C80 140 92 142 98 136 C104 128 98 116 86 116 Z" fill="url(#bone)" opacity="0.75"/>
  <path d="M82 124 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M90 124 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" fill="#0a0806" opacity="0.7"/>
  <path d="M120 140 L150 120 M126 146 L156 128" stroke="url(#bone)" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
  <path d="M130 96 L140 104 L134 110" stroke="url(#bone)" stroke-width="4" fill="none" opacity="0.5"/>
  <path d="M60 80 C76 66 100 62 118 64" stroke="#d8ffb0" stroke-width="3" fill="none" opacity="0.35" stroke-linecap="round"/>
  <path d="M40 168 C42 176 46 178 48 168 M150 168 C152 180 158 180 158 168 M100 168 C100 174 104 176 106 168" fill="url(#body)"/>
  <circle cx="70" cy="96" r="4" fill="#d8ffb0" opacity="0.4"/><circle cx="160" cy="110" r="3" fill="#d8ffb0" opacity="0.3"/>
  ${eyes([[60, 112], [76, 108]], 2.4)}`,
};

ART.ghoul = {
  w: 220, h: 230, pal: P.flesh,
  body: `
  <path d="M96 70 C120 60 160 70 170 110 C176 140 164 166 150 180 L160 222 L142 222 L134 186 L110 186 L106 222 L88 222 L94 176 C80 150 78 100 96 70 Z" fill="url(#body)"/>
  <path d="M110 64 L114 52 L120 64 L128 50 L132 64 L142 54 L144 68 L156 62 L154 78" fill="url(#bodyDark)"/>
  <path d="M98 88 C76 100 54 120 40 150 L28 176 L38 180 L50 156 C62 136 80 120 100 110 Z" fill="url(#body)"/>
  <path d="M28 176 L14 186 M32 178 L22 194 M38 180 L34 196" stroke="#d8ccb0" stroke-width="3" stroke-linecap="round"/>
  <path d="M110 110 C100 132 92 150 72 168 L66 176 L76 180 L86 168 C100 154 112 140 120 122 Z" fill="url(#bodyDark)"/>
  <path d="M66 176 L56 188 M70 178 L64 192" stroke="#bfb39a" stroke-width="3" stroke-linecap="round"/>
  <path d="M120 120 Q136 126 150 120 M118 132 Q136 138 152 132 M120 144 Q136 150 150 144" stroke="#0e0a09" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M100 74 C88 60 66 60 58 74 C52 86 60 100 74 102 C88 104 98 92 100 74 Z" fill="url(#body)"/>
  <path d="M58 88 L64 94 L66 88 L70 96 L72 88 L76 96" stroke="#e8dcc0" stroke-width="2" fill="none"/>
  ${eyes([[66, 78], [80, 76]], 2.4)}`,
};

ART.gravewarden = {
  w: 260, h: 290, pal: P.iron,
  body: `
  <path d="M40 30 L58 30 L58 270 L52 270 Z" fill="#2a1d12"/>
  <path d="M60 22 C10 24 -4 74 20 110 C34 92 48 88 60 90 Z" fill="url(#metal)"/>
  <path d="M60 22 C30 30 16 60 22 96" stroke="#d8ccb0" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M102 100 C80 110 74 160 80 200 L70 278 L106 278 L116 210 L144 210 L154 278 L190 278 L180 200 C186 160 180 110 158 100 Z" fill="url(#metal)"/>
  <path d="M96 120 L164 120 L170 214 ${tatters(170, 90, 214, 30, 6).slice(1)} L90 214 Z" fill="url(#cloth)"/>
  <path d="M96 96 C76 86 64 96 60 112 L56 150 L72 156 L82 120 Z" fill="url(#metal)"/>
  <path d="M164 96 C184 86 196 96 200 112 L206 160 L190 164 L178 120 Z" fill="url(#metal)"/>
  <rect x="48" y="146" width="22" height="20" rx="4" fill="url(#metal)"/>
  <path d="M190 164 L196 200" stroke="#3a2f22" stroke-width="10" stroke-linecap="round"/>
  <path d="M188 200 Q200 230 186 262" stroke="#4a4038" stroke-width="3" fill="none" stroke-dasharray="6 3"/>
  <path d="M100 40 L160 40 L164 96 L96 96 Z" fill="url(#metal)"/>
  <path d="M100 40 C104 26 156 26 160 40 Z" fill="url(#metal)"/>
  <path d="M106 64 L154 64 L154 70 L106 70 Z" fill="#050404"/>
  <path d="M130 70 L130 96 M118 78 L118 92 M142 78 L142 92" stroke="#050404" stroke-width="3"/>
  ${eyes([[118, 67], [140, 67]], 2)}`,
};

ART.ember_wisp = {
  w: 180, h: 220, pal: P.ember,
  body: `
  <path d="M90 200 C60 190 50 160 60 130 C66 110 60 90 70 70 C76 90 84 92 86 80 C90 60 84 40 96 20 C110 46 124 66 122 100 C120 120 132 130 126 156 C120 182 110 196 90 200 Z" fill="url(#fire)" opacity="0.95"/>
  <path d="M92 196 C76 186 72 166 78 150 C82 160 88 160 90 152 C92 140 96 132 102 124 C108 140 112 156 106 176 C102 188 98 194 92 196 Z" fill="#fff4c2" opacity="0.6"/>
  <circle cx="92" cy="112" r="60" fill="#ff7a2a" opacity="0.25" filter="url(#b8)"/>
  <path d="M74 96 C74 76 110 76 110 96 C110 108 104 112 102 120 L82 120 C80 112 74 108 74 96 Z" fill="#1a0e08" opacity="0.92"/>
  <path d="M84 120 L84 126 M90 120 L90 127 M96 120 L96 126" stroke="#1a0e08" stroke-width="3"/>
  ${eyes([[84, 98], [100, 98]], 2.6)}`,
};

ART.bog_hag = {
  w: 230, h: 260, pal: P.rot,
  body: `
  <path d="M44 40 L56 250" stroke="#3a2a1a" stroke-width="6" stroke-linecap="round"/>
  <path d="M34 28 C34 14 56 14 56 28 C56 40 46 44 44 50 C42 44 34 40 34 28 Z" fill="url(#bone)"/>
  <circle cx="44" cy="62" r="10" fill="#b9d77a" opacity="0.6" filter="url(#b3)"/><circle cx="44" cy="62" r="4" fill="#e9ffb0"/>
  <path d="M110 70 C82 80 70 120 70 170 L58 250 ${tatters(58, 186, 250, 14, 9).slice(1)} L186 250 L170 160 C168 110 150 74 128 66 Z" fill="url(#cloth)"/>
  <path d="M96 100 C80 108 64 112 54 112 L52 124 C66 124 84 120 102 114 Z" fill="url(#body)"/>
  <path d="M52 112 L44 108 M52 116 L42 118 M54 122 L46 128" stroke="#b9ad94" stroke-width="2" stroke-linecap="round"/>
  <path d="M118 40 C96 36 80 52 82 72 C84 90 100 98 116 94 C132 90 138 72 134 56 C132 46 126 42 118 40 Z" fill="url(#body)"/>
  <path d="M86 70 C74 76 66 84 70 88 C76 86 82 84 90 80 Z" fill="url(#body)"/>
  <path d="M84 86 Q96 92 104 86" stroke="#0a0b06" stroke-width="2" fill="none"/>
  <path d="M120 30 C90 24 76 46 80 66 L86 58 C92 44 108 38 124 46 C138 54 142 72 136 96 L150 112 C160 80 150 36 120 30 Z" fill="url(#cloth)"/>
  <path d="M104 44 C100 70 96 90 104 120 M120 46 C126 70 130 100 126 130" stroke="#5a5a4a" stroke-width="2" fill="none" opacity="0.6"/>
  ${eyes([[92, 64], [106, 62]], 2)}`,
};

ART.drowned_king = {
  w: 300, h: 330, pal: P.crypt,
  body: `
  <path d="M40 20 L48 320" stroke="#3b4a4f" stroke-width="8" stroke-linecap="round"/>
  <path d="M20 40 L24 6 L32 34 M44 36 L44 0 L52 34 M68 40 L68 6 L58 34 M18 44 L72 40" stroke="url(#metal)" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M150 110 C100 116 84 180 90 240 L70 322 ${tatters(70, 240, 322, 18, 10).slice(1)} L240 322 L214 236 C222 180 204 116 150 110 Z" fill="url(#cloth)"/>
  <path d="M110 130 C84 140 64 150 50 150 L48 168 C68 170 96 162 122 150 Z" fill="url(#body)"/>
  <path d="M190 130 C214 150 226 190 222 230 L206 232 C206 196 196 166 180 150 Z" fill="url(#bodyDark)"/>
  <path d="M116 120 C116 160 184 160 184 120 L176 200 L124 200 Z" fill="url(#body)" opacity="0.9"/>
  <path d="M126 140 Q150 150 174 140 M124 156 Q150 166 176 156 M128 172 Q150 180 172 172" stroke="#0b0d0e" stroke-width="2.5" fill="none"/>
  <path d="M150 50 C126 50 116 72 118 94 C120 116 134 130 150 130 C166 130 180 116 182 94 C184 72 174 50 150 50 Z" fill="url(#body)"/>
  <path d="M124 104 C126 140 140 170 150 186 C160 170 174 140 176 104 C166 116 134 116 124 104 Z" fill="#253a30" opacity="0.9"/>
  <path d="M132 120 L136 160 M150 124 L150 178 M168 120 L164 160" stroke="#3f5a46" stroke-width="2" opacity="0.8"/>
  <path d="M128 84 C134 78 142 78 146 86 M154 86 C158 78 166 78 172 84" stroke="#050606" stroke-width="7" fill="none"/>
  <path d="M116 56 L120 22 L132 46 L140 14 L150 42 L160 14 L168 46 L180 22 L184 56 Z" fill="url(#metal)"/>
  <path d="M116 56 L184 56" stroke="#9fd4e6" stroke-width="2" opacity="0.5"/>
  <circle cx="150" cy="42" r="4" fill="#9fd4e6"/>
  <g fill="#9fd4e6" opacity="0.5"><circle cx="196" cy="220" r="2"/><circle cx="104" cy="250" r="1.6"/><circle cx="130" cy="210" r="1.4"/></g>
  ${eyes([[136, 88], [164, 88]], 3)}`,
};

// ── The merchant: hunched under an enormous pack, a dim lantern at the hip ──
ART.merchant = {
  w: 220, h: 230, pal: P.iron,
  body: `
  <path d="M120 40 C170 30 200 60 196 110 C194 150 176 170 150 176 L110 176 C96 140 96 70 120 40 Z" fill="url(#bodyDark)"/>
  <path d="M130 50 C160 46 184 66 184 100 M126 90 L190 96 M124 130 L186 136" stroke="#5a4a32" stroke-width="3" fill="none"/>
  <path d="M150 30 L156 10 L164 30 Z M168 40 L184 22 L180 44 Z" fill="url(#metal)"/>
  <path d="M74 90 C56 110 50 160 52 200 L44 222 ${tatters(44, 150, 222, 10, 8).slice(1)} L150 222 L140 170 C140 130 124 96 104 86 Z" fill="url(#cloth)"/>
  <path d="M60 130 C46 140 40 150 40 158 L52 160 C54 152 62 146 72 142 Z" fill="url(#cloth)"/>
  <path d="M40 160 L40 176" stroke="#3a2f22" stroke-width="2"/>
  <circle cx="40" cy="186" r="18" fill="#ffb347" opacity="0.3" filter="url(#b8)"/>
  <rect x="33" y="176" width="14" height="18" rx="2" fill="#ffcf7a" opacity="0.85"/>
  <path d="M33 176 V194 M40 176 V194 M47 176 V194" stroke="#2a2018" stroke-width="1.6"/>
  <path d="M84 50 C64 52 56 70 60 88 C64 102 76 108 90 106 C106 102 114 86 110 70 C106 56 98 48 84 50 Z" fill="url(#cloth)"/>
  <path d="M64 70 C68 62 90 60 98 70 L96 94 C88 100 74 100 68 94 Z" fill="#050404"/>
  <path d="M70 94 C74 104 82 110 86 120 C90 108 92 100 94 92" fill="#8a8070" opacity="0.7"/>
  ${eyes([[74, 80], [86, 80]], 1.5)}`,
};
