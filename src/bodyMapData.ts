// Original vector paths in a 200 × 430 coordinate system, mirrored around x=100.
// Surface anatomy is illustrative; deep structures still use group projections.
export type BodyView = 'front' | 'back';
export type BodyRegion = { front?: string; back?: string };
export const bodyOutline =
  'M91 48 L90 59 Q73 62 62 69 Q50 73 48 92 L43 121 L36 157 L24 197 Q18 215 22 223 L30 221 L35 201 L43 183 L53 155 L62 127 L66 150 L68 171 Q61 198 65 229 L71 280 L72 297 L67 338 L71 383 L68 405 Q69 415 91 411 L90 394 L93 348 L96 305 L100 245 L100 48 Z';

// These small planes give the unmarked body the same readable muscle structure as
// the highlighted one. They are visual only: taps and IDs remain on bodyRegions.
export const bodySurface: Record<BodyView, string[]> = {
  front: [
    'M89 50 Q91 60 98 66 L96 76 Q89 70 85 61 Z', // sternocleidomastoid
    'M63 72 Q70 71 76 75 L69 84 L60 88 Q58 79 63 72 Z', // deltoid cap
    'M58 87 L68 83 Q67 94 54 103 Q52 96 58 87 Z',
    'M70 78 Q82 74 97 80 L97 89 Q87 91 69 90 Z', // upper pec
    'M69 93 Q83 94 97 92 L97 107 Q85 114 69 102 Z', // lower pec
    'M66 106 Q70 110 75 113 L72 119 L66 114 Z', // serratus teeth
    'M67 117 L74 121 L72 127 L67 123 Z',
    'M68 126 L75 130 L73 136 L69 133 Z',
    'M77 115 L84 118 L82 129 L75 124 Z', // oblique facets
    'M75 126 L82 130 L83 147 L72 137 Z',
    'M72 140 L83 151 L83 169 L73 163 Z',
    'M86 118 L97 116 L97 130 L85 130 Z', // rectus abdominis
    'M85 133 L97 133 L97 146 L85 146 Z',
    'M85 149 L97 149 L97 162 L86 162 Z',
    'M86 165 L97 165 L97 177 L88 174 Z',
    'M72 174 Q83 181 95 182 L89 197 L69 193 Z', // iliac crest / hip
    'M69 198 L88 201 L78 213 L67 208 Z',
    'M53 106 Q58 101 63 101 L59 131 Q53 143 46 148 L48 131 Z', // biceps
    'M45 152 L53 147 L47 169 L39 183 L35 180 Z', // brachioradialis
    'M40 157 L45 155 L38 177 L32 188 L29 190 Z',
    'M37 183 L43 176 L34 199 L28 203 Z',
    'M68 210 Q74 214 78 224 L77 267 L75 282 Q68 264 66 240 Z', // vastus lateralis
    'M78 214 Q85 219 87 231 L85 266 L81 279 Q76 252 78 214 Z', // rectus femoris
    'M89 218 L95 229 L91 266 L86 280 L86 251 Z', // vastus medialis
    'M96 231 L98 236 L94 258 L91 268 Z', // adductor
    'M76 286 Q82 282 88 287 L86 299 Q81 303 76 297 Z', // patella
    'M74 306 L81 308 L78 344 L75 368 L71 341 Z', // fibularis
    'M82 307 L89 305 L87 340 L84 379 L80 382 L79 346 Z', // tibialis
    'M72 343 L76 373 L75 391 L72 387 Z',
    'M76 394 L86 394 L89 409 Q79 412 70 408 Z', // foot
  ],
  back: [
    'M88 50 Q93 59 98 64 L98 77 L83 67 Z', // upper trapezius
    'M77 72 L98 81 L98 90 L82 88 Z',
    'M82 92 L98 97 L98 120 L90 107 Z', // lower trapezius
    'M61 72 Q67 70 73 75 L68 87 L56 96 Q55 81 61 72 Z', // rear deltoid
    'M55 96 L68 87 L66 98 L53 105 Z',
    'M70 94 L81 97 L83 107 L68 105 Z', // supraspinatus
    'M68 108 L82 110 L85 125 L72 119 Z', // infraspinatus
    'M69 121 L82 125 L82 133 L69 130 Z', // teres
    'M83 108 L98 111 L98 123 L86 122 Z', // rhomboids
    'M84 125 L98 128 L98 140 L88 137 Z',
    'M68 133 L83 139 L91 149 L93 161 L74 173 L69 152 Z', // latissimus
    'M95 144 L98 143 L98 185 L94 172 Z', // spinal erectors
    'M79 176 L94 169 L96 194 L77 186 Z',
    'M53 106 L63 100 L60 130 L48 149 L46 136 Z', // triceps
    'M44 152 L53 146 L47 169 L37 185 L33 182 Z', // forearm
    'M39 157 L44 154 L37 177 L30 192 L27 193 Z',
    'M36 186 L43 176 L34 200 L28 204 Z',
    'M72 193 L97 202 L97 213 L69 209 Z', // glute medius
    'M69 212 Q84 211 97 216 L97 235 Q84 248 67 230 Z', // glute max
    'M67 239 Q74 246 78 250 L78 278 L74 289 L68 264 Z', // biceps femoris
    'M79 249 L85 250 L86 283 L81 295 L78 277 Z', // semitendinosus
    'M87 248 L95 241 L92 279 L87 296 L85 281 Z', // semimembranosus
    'M76 294 Q82 297 88 293 L88 301 L75 302 Z', // popliteal fossa
    'M73 309 Q77 303 82 309 L81 335 L75 351 L69 334 Z', // lateral calf
    'M83 309 Q88 303 91 313 L89 335 L84 354 L81 336 Z', // medial calf
    'M74 349 L82 354 L83 379 L79 387 L75 378 Z', // soleus
    'M76 392 L85 392 L88 409 Q79 412 70 408 Z', // foot
  ],
};

// Fine tendon and fibre boundaries stay visible over both neutral and colored
// areas. Kept separate from the touch regions so the overlay cannot steal taps.
export const bodySurfaceLines: Record<BodyView, string[]> = {
  front: [
    'M91 52 Q89 64 97 72',
    'M58 83 Q60 94 54 101 M65 77 Q64 88 58 96',
    'M70 80 Q82 85 96 85 M69 94 Q81 99 96 95',
    'M68 105 Q78 115 97 110',
    'M67 111 L74 118 M67 120 L74 127 M68 129 L75 136',
    'M83 117 Q85 143 84 168 M85 132 L97 132 M85 148 L97 148 M85 164 L97 164',
    'M76 121 L82 130 M72 139 L82 150 M73 162 L82 169',
    'M70 176 Q83 185 96 184 M69 197 Q81 199 93 207',
    'M56 107 Q53 121 48 139 M61 109 Q57 125 53 139',
    'M47 151 Q43 165 37 178 M51 151 L42 179 M41 178 L32 197',
    'M70 215 Q72 240 75 271 M79 217 Q77 248 82 277 M87 223 Q88 247 85 270',
    'M76 284 Q82 280 89 285 M77 299 Q82 302 87 298',
    'M76 309 Q78 341 76 364 M83 309 Q80 342 82 379 M87 312 Q85 346 84 371',
  ],
  back: [
    'M87 55 Q90 66 98 72 M79 75 Q88 80 98 83 M82 92 Q90 97 98 102',
    'M57 84 Q61 94 54 103 M66 79 Q62 89 58 96',
    'M69 104 Q77 103 83 108 M69 110 Q77 113 84 126 M70 121 Q77 126 83 130',
    'M84 111 Q91 114 98 114 M85 125 Q91 128 98 130',
    'M72 137 Q83 148 92 153 M75 170 Q85 161 93 164 M95 142 L95 186',
    'M76 178 Q85 183 95 191 M76 189 Q88 195 97 197',
    'M55 109 Q52 127 47 141 M61 107 Q57 126 52 141',
    'M47 151 Q42 168 36 183 M51 151 L42 178 M40 182 L31 198',
    'M70 210 Q84 219 97 213 M71 230 Q83 238 97 230',
    'M70 242 Q77 255 75 281 M79 251 Q83 271 81 292 M89 250 Q89 273 85 290',
    'M75 301 Q81 299 88 302 M76 311 Q80 325 76 346 M85 311 Q87 327 82 349',
    'M75 352 Q79 357 83 355 M79 357 L80 383',
  ],
};
export const bodyRegions: Record<string, BodyRegion> = {
  neck: { front: 'M91 48 L98 53 L98 71 L88 62 Z', back: 'M90 48 L98 50 L98 65 L87 61 Z' },
  chest: { front: 'M66 78 Q80 73 98 80 L98 109 Q81 117 67 103 Z' },
  shoulders: {
    front: 'M62 69 L74 73 L65 91 L52 103 Q49 80 62 69 Z',
    back: 'M62 69 L74 74 L67 92 L52 103 Q49 80 62 69 Z',
  },
  'elbow-flexors': { front: 'M53 106 L63 98 L59 132 L48 151 L45 143 Z' },
  triceps: { back: 'M53 106 L64 97 L60 133 L48 151 L45 143 Z' },
  forearms: {
    front: 'M44 151 L54 144 L44 179 L32 201 L27 197 Z',
    back: 'M44 151 L54 144 L44 179 L32 201 L27 197 Z',
  },
  serratus: { front: 'M67 108 L77 118 L76 137 L68 129 Z' },
  abs: { front: 'M79 117 L98 114 L98 177 L72 166 L69 134 L77 140 Z' },
  'hip-flexors': { front: 'M70 172 L97 182 L95 213 L67 202 Z' },
  quads: { front: 'M67 207 L88 217 L94 270 L88 289 L76 287 L68 249 Z' },
  adductors: { front: 'M89 216 L98 221 L98 242 L93 271 Z' },
  'lower-leg': { front: 'M75 304 L90 303 L88 350 L85 391 L76 391 L72 342 Z' },
  trapezius: { back: 'M89 62 L98 66 L98 103 L81 96 L75 75 Z' },
  scapular: { back: 'M82 98 L98 106 L98 133 L85 126 Z' },
  cuff: { back: 'M69 94 L80 98 L83 120 L69 114 Z' },
  lats: { back: 'M67 117 L82 126 L92 145 L94 164 L74 176 L69 152 Z' },
  spinal: { back: 'M96 135 L98 135 L98 199 L77 189 L76 179 L94 166 Z' },
  glutes: { back: 'M73 192 L98 202 L98 235 Q84 249 67 231 L66 211 Z' },
  hamstrings: { back: 'M68 240 Q84 254 96 241 L93 278 L87 297 L75 292 Z' },
  calves: { back: 'M74 308 Q82 300 89 308 L90 339 L83 380 L76 380 L69 343 Z' },
};
// Dedicated areas for clearly representable surface muscles / portions.
// Others intentionally retain the group's approximate location (see map caption).
export const bodyDetails: Record<string, BodyRegion> = {
  'pectoralis-major': bodyRegions.chest,
  'pectoralis-clavicular': { front: 'M66 78 Q80 73 98 80 L98 90 L69 91 Z' },
  'pectoralis-sternocostal': { front: 'M69 94 L98 93 L98 109 Q81 117 67 103 Z' },
  'deltoid-anterior': { front: 'M64 72 L74 73 L65 91 L59 94 Z' },
  'deltoid-lateral': {
    front: 'M61 71 L60 94 L52 103 Q49 80 61 71 Z',
    back: 'M61 71 L60 94 L52 103 Q49 80 61 71 Z',
  },
  'deltoid-posterior': { back: 'M64 72 L74 74 L67 92 L59 96 Z' },
  biceps: bodyRegions['elbow-flexors'],
  brachioradialis: { front: 'M46 148 L51 150 L38 181 L34 181 Z' },
  'rectus-abdominis': { front: 'M85 117 L98 114 L98 177 L84 170 Z' },
  'external-oblique': { front: 'M79 122 L81 169 L72 166 L69 134 L77 140 Z' },
  'serratus-anterior': bodyRegions.serratus,
  latissimus: bodyRegions.lats,
  'teres-major': { back: 'M67 117 L82 126 L82 137 L69 128 Z' },
  'trapezius-upper': { back: 'M89 62 L98 66 L98 82 L75 75 Z' },
  'trapezius-middle': { back: 'M78 79 L98 86 L98 94 L81 90 Z' },
  'trapezius-lower': { back: 'M83 94 L98 99 L98 119 L90 107 Z' },
  infraspinatus: bodyRegions.cuff,
  'gluteus-maximus': { back: 'M71 207 L98 212 L98 235 Q84 249 67 231 L66 217 Z' },
  'gluteus-medius': { back: 'M73 192 L98 202 L97 209 L68 211 Z' },
  'rectus-femoris': { front: 'M77 212 Q84 215 87 227 L86 262 L81 281 Q77 260 77 236 Z' },
  'vastus-lateralis': { front: 'M67 207 Q75 210 78 219 L78 252 L81 280 L75 285 Q68 264 66 239 Z' },
  'vastus-medialis': { front: 'M88 236 Q92 247 94 267 L89 289 L81 285 Q87 268 87 253 Z' },
  'biceps-femoris': { back: 'M68 240 L78 248 L81 283 L76 292 Z' },
  semitendinosus: { back: 'M83 250 L89 248 L88 279 L84 296 L81 282 Z' },
  semimembranosus: { back: 'M91 246 L96 241 L93 278 L87 297 L90 279 Z' },
  gastrocnemius: { back: 'M74 308 Q82 300 89 308 L90 339 L83 357 L74 351 L69 333 Z' },
  'tibialis-anterior': { front: 'M82 305 L90 303 L88 350 L85 391 L80 390 Z' },
  'fibularis-longus': { front: 'M75 307 L79 311 L78 349 L75 374 L72 342 Z' },
};
