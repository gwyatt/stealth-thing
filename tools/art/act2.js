import { PALETTES as P, eyes, glow, tatters } from './lib.js';

export const ART = {};

ART.sporeling = {
  w: 170, h: 170, pal: P.spore,
  body: `
  <path d="M66 100 C60 120 62 140 58 160 L74 160 L80 132 L92 132 L96 160 L112 160 C108 140 110 120 104 100 Z" fill="url(#body)"/>
  <path d="M14 96 C14 50 50 28 86 28 C122 28 156 50 156 96 C130 104 40 104 14 96 Z" fill="url(#body)"/>
  <path d="M24 96 C50 104 120 104 146 96 L140 106 C110 112 60 112 30 106 Z" fill="#1a1219"/>
  <path d="M34 104 L40 98 M50 107 L54 99 M70 108 L72 100 M90 108 L90 100 M110 107 L108 99 M128 104 L124 98" stroke="#e7a8ff" stroke-width="1.5" opacity="0.6"/>
  <g fill="#e7a8ff"><circle cx="54" cy="56" r="7" opacity="0.7"/><circle cx="92" cy="44" r="5" opacity="0.6"/><circle cx="122" cy="66" r="6" opacity="0.4"/><circle cx="76" cy="74" r="4" opacity="0.6"/></g>
  <g fill="#e7a8ff" opacity="0.6"><circle cx="30" cy="40" r="1.4"/><circle cx="140" cy="30" r="1.2"/><circle cx="10" cy="130" r="1"/></g>
  ${eyes([[74, 118], [90, 118]], 2)}`,
};

ART.myconid_brute = {
  w: 250, h: 260, pal: P.rot,
  body: `
  <path d="M80 80 C50 100 46 160 64 200 L56 250 L92 250 L100 210 L150 210 L158 250 L194 250 L186 196 C204 150 196 96 160 78 Z" fill="url(#body)"/>
  <path d="M84 96 C56 110 34 140 26 180 L20 214 L50 218 L58 184 C66 160 80 140 96 128 Z" fill="url(#body)"/>
  <ellipse cx="36" cy="222" rx="22" ry="16" fill="url(#body)"/>
  <path d="M168 96 C196 110 214 150 218 190 L196 196 C192 164 180 140 160 126 Z" fill="url(#bodyDark)"/>
  <ellipse cx="208" cy="200" rx="20" ry="15" fill="url(#bodyDark)"/>
  <path d="M90 120 C110 112 130 112 150 120 M92 150 C112 140 132 140 152 150" stroke="#0d0f08" stroke-width="2" fill="none" opacity="0.5"/>
  <path d="M70 140 C60 132 52 136 52 146 C62 146 68 146 74 150 Z M168 150 C182 142 192 148 190 158 C180 156 174 156 166 160 Z M110 180 C100 170 88 174 88 184 C98 182 104 184 112 188 Z" fill="#c9a86a"/>
  <path d="M100 76 C100 56 112 46 126 46 C140 46 150 56 150 76 C140 82 112 82 100 76 Z" fill="url(#body)"/>
  <path d="M86 58 C92 24 160 24 166 58 C150 64 102 64 86 58 Z" fill="#7a5a3a"/>
  <path d="M86 58 C92 24 160 24 166 58" stroke="#c9a86a" stroke-width="2" fill="none" opacity="0.6"/>
  <g fill="#e8d6a0" opacity="0.7"><circle cx="110" cy="40" r="4"/><circle cx="136" cy="34" r="3"/><circle cx="152" cy="48" r="3"/></g>
  ${eyes([[114, 70], [134, 70]], 2.2)}`,
};

ART.fungal_shaman = {
  w: 200, h: 260, pal: P.spore,
  body: `
  <path d="M40 60 L50 250" stroke="#3a2a1a" stroke-width="5" stroke-linecap="round"/>
  <circle cx="40" cy="52" r="20" fill="#e7a8ff" opacity="0.45" filter="url(#b8)"/>
  <circle cx="40" cy="52" r="9" fill="#e7a8ff" opacity="0.9"/><circle cx="40" cy="52" r="4" fill="#fff"/>
  <path d="M30 60 C34 66 46 66 50 60" stroke="#3a2a1a" stroke-width="3" fill="none"/>
  <path d="M100 96 C76 104 64 150 66 200 L56 250 ${tatters(56, 150, 250, 14, 7).slice(1)} L150 250 L140 196 C142 150 128 104 108 96 Z" fill="url(#cloth)"/>
  <path d="M96 116 C80 120 64 120 52 118 L52 130 C66 132 82 132 100 128 Z" fill="url(#body)"/>
  <path d="M90 108 C88 90 94 80 104 80 C114 80 118 90 116 108 Z" fill="url(#body)"/>
  <path d="M50 84 C50 30 160 30 160 84 C136 92 74 92 50 84 Z" fill="url(#body)"/>
  <path d="M60 86 C80 94 130 94 150 86" stroke="#1a1219" stroke-width="4" fill="none"/>
  <g fill="#e7a8ff"><circle cx="80" cy="54" r="6" opacity="0.8"/><circle cx="108" cy="44" r="4" opacity="0.7"/><circle cx="132" cy="60" r="5" opacity="0.5"/><circle cx="96" cy="68" r="3" opacity="0.8"/></g>
  <path d="M90 120 L92 170 M110 120 L114 176" stroke="#2a1f2c" stroke-width="2" opacity="0.8"/>
  ${eyes([[98, 98], [110, 98]], 1.8)}`,
};

ART.cave_stalker = {
  w: 240, h: 170, pal: P.obsidian,
  body: `
  <path d="M180 100 C210 96 230 70 226 40 C220 64 204 82 178 86 Z" fill="url(#bodyDark)"/>
  <path d="M56 104 C70 74 110 70 150 76 C176 80 192 96 188 116 C184 134 170 140 160 140 L60 140 C50 134 50 116 56 104 Z" fill="url(#body)"/>
  <path d="M80 80 L86 70 L92 80 L100 68 L106 78 L116 68 L120 78 L132 70 L134 80 L146 74 L146 84" fill="url(#bodyDark)"/>
  <path d="M60 104 C46 92 28 94 16 104 C10 112 16 120 26 122 C40 124 54 118 62 112 Z" fill="url(#body)"/>
  <path d="M20 118 L16 126 L22 122 L24 130 L28 122" fill="#e2d6bb"/>
  <path d="M30 98 L26 84 L38 94 Z" fill="url(#body)"/>
  <path d="M66 136 L50 160 L64 160 L80 140 M90 138 L86 160 L98 160 L102 140 M150 138 L156 160 L168 160 L164 136 M168 132 L184 158 L196 158 L182 128" fill="url(#bodyDark)" stroke="#000" stroke-width="1"/>
  <path d="M90 100 Q120 110 160 100" stroke="#ff4a2a" stroke-width="1" fill="none" opacity="0.35"/>
  ${eyes([[30, 104], [42, 102]], 2)}`,
};

ART.blight_beetle = {
  w: 230, h: 180, pal: P.rot,
  body: `
  <path d="M50 140 L30 170 M70 146 L60 172 M150 146 L160 172 M170 140 L196 168 M60 120 L22 130 M164 120 L206 128" stroke="#1a1d10" stroke-width="5" stroke-linecap="round"/>
  <path d="M40 126 C36 70 80 40 126 44 C172 48 200 80 192 126 C170 150 64 150 40 126 Z" fill="url(#body)"/>
  <path d="M116 46 L118 140" stroke="#0d0f08" stroke-width="3"/>
  <path d="M60 80 C80 56 110 50 116 52 M128 52 C150 54 176 70 184 96" stroke="#d8ffb0" stroke-width="3" fill="none" opacity="0.3" stroke-linecap="round"/>
  <g fill="#0d0f08"><path d="M66 70 L60 56 L74 66 Z"/><path d="M96 54 L94 40 L104 52 Z"/><path d="M146 54 L152 40 L154 56 Z"/><path d="M176 76 L188 64 L184 80 Z"/></g>
  <path d="M46 124 C26 118 14 104 16 92 C30 96 40 106 50 112 Z" fill="url(#body)"/>
  <path d="M30 100 C18 80 10 60 18 40 C24 60 34 76 40 92 Z" fill="url(#metal)"/>
  <circle cx="160" cy="100" r="5" fill="#b9d77a" opacity="0.5"/><circle cx="90" cy="96" r="4" fill="#b9d77a" opacity="0.4"/>
  ${eyes([[34, 108]], 2.4)}`,
};

ART.spore_mother = {
  w: 270, h: 280, pal: P.spore,
  body: `
  <path d="M60 270 C40 240 50 200 30 170 M210 270 C230 240 220 200 246 176 M100 270 C96 250 110 236 100 216 M170 270 C176 246 164 236 172 214" stroke="url(#bodyDark)" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M136 60 C70 60 40 120 50 180 C58 230 100 260 136 260 C176 260 216 230 222 180 C230 120 200 60 136 60 Z" fill="url(#body)"/>
  <path d="M96 170 C110 196 160 196 176 170 C166 210 106 210 96 170 Z" fill="#120a12"/>
  <path d="M104 178 L110 188 L116 180 L122 192 L128 182 L136 194 L142 182 L150 192 L156 180 L162 188 L168 178" stroke="#e8dcc0" stroke-width="2" fill="none"/>
  <g fill="#e7a8ff"><circle cx="80" cy="120" r="10" opacity="0.75"/><circle cx="190" cy="130" r="8" opacity="0.5"/><circle cx="110" cy="96" r="6" opacity="0.8"/><circle cx="170" cy="92" r="7" opacity="0.6"/><circle cx="70" cy="200" r="7" opacity="0.6"/><circle cx="206" cy="200" r="6" opacity="0.4"/></g>
  <g fill="#fff" opacity="0.7"><circle cx="80" cy="120" r="3"/><circle cx="110" cy="96" r="2"/><circle cx="70" cy="200" r="2"/></g>
  <path d="M100 70 C96 40 70 30 54 40 C70 46 84 60 92 76 Z M170 70 C176 36 210 26 226 40 C206 46 190 60 180 78 Z M130 62 C126 28 150 10 170 20 C154 28 146 42 142 62 Z" fill="url(#bodyDark)"/>
  <circle cx="135" cy="140" r="70" fill="#e7a8ff" opacity="0.08" filter="url(#b8)"/>
  <g fill="#e7a8ff" opacity="0.7"><circle cx="40" cy="60" r="1.6"/><circle cx="240" cy="90" r="1.4"/><circle cx="20" cy="140" r="1.2"/><circle cx="250" cy="160" r="1.4"/></g>
  ${eyes([[110, 140], [130, 134], [150, 136], [168, 144]], 2.4)}`,
};

ART.rootbound_knight = {
  w: 250, h: 280, pal: P.rot,
  body: `
  <path d="M100 100 C80 110 76 160 80 200 L72 270 L104 270 L112 210 L140 210 L148 270 L180 270 L172 200 C176 160 172 110 152 100 Z" fill="url(#metal)"/>
  <path d="M96 120 L156 120 L162 210 ${tatters(162, 90, 210, 26, 5).slice(1)} L90 210 Z" fill="url(#cloth)"/>
  <path d="M30 110 C30 90 90 90 90 110 L86 190 C80 220 40 220 34 190 Z" fill="url(#metal)"/>
  <path d="M60 104 L60 210 M34 140 L86 140" stroke="#2c331c" stroke-width="5"/>
  <path d="M40 120 C50 150 44 170 56 200 M74 116 C66 150 80 170 70 206" stroke="#4a3a20" stroke-width="3" fill="none"/>
  <path d="M168 104 C188 110 196 140 196 170 L182 172 C180 150 174 130 160 120 Z" fill="url(#metal)"/>
  <path d="M190 168 L206 40" stroke="url(#metal)" stroke-width="7" stroke-linecap="round"/>
  <path d="M180 170 L202 172" stroke="#4a3a20" stroke-width="5"/>
  <path d="M104 44 L148 44 L152 100 L100 100 Z" fill="url(#metal)"/>
  <path d="M104 44 C108 30 144 30 148 44 Z" fill="url(#metal)"/>
  <path d="M110 66 L142 66 L142 72 L110 72 Z" fill="#050404"/>
  <path d="M96 60 C80 40 90 20 104 30 M150 50 C170 34 166 14 152 22 M88 110 C70 130 80 150 66 170 M160 130 C176 150 160 180 176 200 M110 210 C104 230 116 246 106 268" stroke="#4a3a20" stroke-width="4" fill="none" stroke-linecap="round"/>
  <g fill="#6d8a3a"><path d="M100 30 C92 20 96 10 106 14 C106 22 104 26 100 30Z"/><path d="M156 22 C164 12 172 16 168 26 C162 26 160 24 156 22Z"/><path d="M68 168 C58 164 56 156 64 152 C68 158 68 162 68 168Z"/></g>
  ${eyes([[120, 69], [134, 69]], 1.8)}`,
};

ART.carrion_lord = {
  w: 280, h: 270, pal: P.flesh,
  body: `
  <path d="M120 90 C80 60 30 60 6 100 C30 98 40 110 30 130 C50 120 60 130 50 152 C70 140 84 150 80 172 C96 150 110 140 120 130 Z" fill="url(#body)"/>
  <path d="M160 90 C200 60 250 60 274 100 C250 98 240 110 250 130 C230 120 220 130 230 152 C210 140 196 150 200 172 C184 150 170 140 160 130 Z" fill="url(#bodyDark)"/>
  <path d="M120 100 C104 120 100 170 108 210 L100 262 L124 262 L130 220 L150 220 L156 262 L180 262 L172 210 C180 170 176 120 160 100 Z" fill="url(#cloth)"/>
  <path d="M112 100 C120 112 160 112 168 100 L164 120 C150 126 130 126 116 120 Z" fill="#3a2a22"/>
  <path d="M140 40 C124 40 116 54 118 70 C120 86 130 96 140 96 C152 96 160 86 162 70 C164 54 156 40 140 40 Z" fill="url(#body)"/>
  <path d="M120 64 C104 66 92 74 88 84 C100 86 112 82 124 76 Z" fill="#c9b89a"/>
  <path d="M88 84 L92 90 L96 84" fill="#c9b89a"/>
  <path d="M118 46 L120 26 L128 42 L134 20 L140 40 L146 20 L152 42 L160 26 L162 46" stroke="url(#bone)" stroke-width="4" fill="none" stroke-linejoin="round"/>
  <path d="M126 130 L112 160 M154 130 L168 160" stroke="#d8ccb0" stroke-width="2" opacity="0.5"/>
  ${eyes([[130, 62]], 2.6)}`,
};

ART.rot_colossus = {
  w: 320, h: 340, pal: P.rot,
  body: `
  <path d="M110 330 C100 300 80 290 60 300 M210 330 C220 300 240 292 262 302" stroke="url(#bodyDark)" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M120 80 C90 110 90 200 100 250 L90 330 L140 330 L146 270 L176 270 L182 330 L232 330 L220 250 C232 200 230 110 200 80 Z" fill="url(#body)"/>
  <path d="M130 120 C140 160 132 220 140 260 M180 110 C172 160 186 220 176 262 M150 90 C156 140 150 200 158 250" stroke="#0d0f08" stroke-width="3" fill="none" opacity="0.6"/>
  <path d="M120 100 C80 100 50 120 30 160 C20 180 24 200 30 220 L46 214 C44 190 50 168 70 150 C90 136 110 132 130 132 Z" fill="url(#body)"/>
  <path d="M30 220 L16 240 M36 220 L30 246 M44 216 L46 242" stroke="#353a25" stroke-width="5" stroke-linecap="round"/>
  <path d="M200 100 C240 100 270 130 286 170 L300 210 L284 216 L270 180 C258 156 236 138 196 134 Z" fill="url(#bodyDark)"/>
  <path d="M300 210 L310 230 M294 212 L298 236" stroke="#1a1d10" stroke-width="5" stroke-linecap="round"/>
  <path d="M120 80 C110 40 130 10 160 10 C190 10 210 40 200 80 C190 100 130 100 120 80 Z" fill="url(#body)"/>
  <path d="M136 50 C140 40 152 40 154 52 C150 62 140 62 136 50 Z M166 52 C168 40 182 40 184 50 C180 62 170 62 166 52 Z" fill="#050604"/>
  <path d="M140 76 C150 70 170 70 180 76 L176 90 C166 84 154 84 144 90 Z" fill="#050604"/>
  <path d="M122 20 C100 0 80 10 70 -4 M198 20 C220 0 240 10 250 -4 M140 14 C130 -10 150 -10 146 -20" stroke="url(#bodyDark)" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M100 160 C86 150 74 156 76 168 C88 166 94 168 104 174 Z M214 150 C230 140 242 148 238 160 C226 158 220 160 210 166 Z M160 200 C146 190 132 196 134 208 C146 206 152 208 162 214 Z M120 240 C108 232 96 238 98 248 C108 246 114 248 122 252 Z" fill="#c9a86a"/>
  <g fill="#b9d77a" opacity="0.6"><circle cx="60" cy="100" r="2"/><circle cx="270" cy="80" r="1.6"/><circle cx="40" cy="280" r="1.4"/><circle cx="290" cy="260" r="1.8"/></g>
  ${eyes([[145, 52], [175, 52]], 3)}`,
};
