/* =========================================================
   GÉNÉRATEUR D'ILLUSTRATIONS "BONHOMME-BÂTON"
   Dessine une petite silhouette SVG pour chaque exercice,
   100% locale (aucune image téléchargée), donc ça marche
   même hors ligne.
========================================================= */

function stickFigureSVG(pose) {
  const stroke = "#3a2f1c";
  const weightColor = "#c1502e";
  const arrowColor = "#8a4a2f";

  let s = `<svg viewBox="0 0 200 190" xmlns="http://www.w3.org/2000/svg" class="pose-svg">`;
  s += `<rect x="0" y="0" width="200" height="190" rx="16" fill="#d4c483"/>`;
  s += `<line x1="14" y1="176" x2="186" y2="176" stroke="${stroke}" stroke-width="2" opacity="0.25"/>`;

  (pose.limbs || []).forEach(([x1, y1, x2, y2]) => {
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>`;
  });

  (pose.weights || []).forEach(([x, y, w, h, rot]) => {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${weightColor}" transform="rotate(${rot || 0} ${x + w / 2} ${y + h / 2})"/>`;
  });

  (pose.arrows || []).forEach(([x1, y1, x2, y2]) => {
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${arrowColor}" stroke-width="2.5" stroke-dasharray="4 3" marker-end="url(#arrow)"/>`;
  });

  if (pose.head) {
    s += `<circle cx="${pose.head[0]}" cy="${pose.head[1]}" r="12" fill="${stroke}"/>`;
  }

  s += `<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
    <path d="M0,0 L8,4 L0,8 Z" fill="${arrowColor}"/></marker></defs>`;
  s += `</svg>`;
  return s;
}

/* Bibliothèque de poses. Coordonnées approximatives, but conçues
   pour être reconnaissables au premier coup d'oeil. */
const POSES = {
  squat_front: {
    head: [100, 42],
    limbs: [
      [100, 54, 100, 118],            // torse
      [100, 118, 76, 148], [76, 148, 80, 176],   // jambe G (hanche-genou-pied)
      [100, 118, 124, 148], [124, 148, 120, 176], // jambe D
      [100, 70, 80, 100], [80, 100, 100, 112],    // bras G tenant la masse
      [100, 70, 120, 100], [120, 100, 100, 112],  // bras D
    ],
    weights: [[88, 100, 24, 16, 0]],
  },
  squat_wide: {
    head: [100, 42],
    limbs: [
      [100, 54, 100, 116],
      [100, 116, 68, 150], [68, 150, 74, 176],
      [100, 116, 132, 150], [132, 150, 126, 176],
      [100, 72, 92, 108], [100, 72, 108, 108],
    ],
    weights: [[90, 106, 20, 18, 0]],
  },
  lunge: {
    head: [92, 42],
    limbs: [
      [92, 54, 96, 112],
      [96, 112, 70, 130], [70, 130, 66, 176],   // jambe avant fléchie
      [96, 112, 118, 150], [118, 150, 128, 176], // jambe arrière tendue
      [92, 68, 76, 96], [92, 68, 108, 96],
    ],
    weights: [[82, 96, 20, 16, 0]],
  },
  lunge_jump: {
    head: [100, 34],
    limbs: [
      [100, 46, 104, 100],
      [104, 100, 82, 122], [82, 122, 90, 160],
      [104, 100, 122, 130], [122, 130, 136, 158],
      [100, 60, 82, 88], [100, 60, 116, 88],
    ],
    weights: [[88, 84, 20, 15, 0]],
    arrows: [[100, 170, 100, 150]],
  },
  lunge_rear_elevated: {
    head: [88, 42],
    limbs: [
      [88, 54, 92, 112],
      [92, 112, 66, 132], [66, 132, 62, 176],
      [92, 112, 116, 150], [116, 150, 132, 166], // pied arrière surélevé
      [88, 68, 74, 96], [88, 68, 102, 96],
    ],
    weights: [[78, 96, 18, 14, 0]],
  },
  rdl: {
    head: [128, 68],
    limbs: [
      [118, 78, 92, 116],              // dos droit incliné
      [92, 116, 88, 146], [88, 146, 90, 176],
      [92, 116, 100, 146], [100, 146, 100, 176],
      [118, 84, 108, 130],
    ],
    weights: [[98, 122, 20, 15, 0]],
  },
  hip_thrust: {
    head: [46, 150],
    limbs: [
      [58, 150, 96, 150],               // dos au sol
      [96, 150, 100, 120], [100, 120, 100, 176], // jambe pliée pied au sol
      [96, 150, 130, 150], [130,150,132,178],
    ],
    weights: [[86, 132, 26, 14, 0]],
  },
  calf_raise: {
    head: [100, 40],
    limbs: [
      [100, 52, 100, 112],
      [100, 112, 90, 150], [90, 150, 92, 178],
      [100, 112, 110, 150], [110, 150, 108, 178],
      [100, 68, 92, 108], [100, 68, 108, 108],
    ],
    weights: [[86, 108, 12, 30, 0], [102, 108, 12, 30, 0]],
    arrows: [[70, 170, 70, 150]],
  },
  jumping_jack: {
    head: [100, 36],
    limbs: [
      [100, 48, 100, 104],
      [100, 104, 72, 176], [100, 104, 128, 176],
      [100, 58, 66, 30], [100, 58, 134, 30],
    ],
  },
  mountain_climber: {
    head: [150, 96],
    limbs: [
      [140, 100, 90, 118],             // dos (position planche)
      [140, 100, 152, 176],            // bras d'appui
      [90, 118, 60, 96], [60, 96, 60, 130], // genou ramené
      [90, 118, 110, 150], [110, 150, 118, 176],
    ],
  },
  burpee: {
    head: [150, 100],
    limbs: [
      [140, 104, 86, 120],
      [140, 104, 152, 176],
      [86, 120, 70, 176], [86, 120, 100, 176],
    ],
    arrows: [[60, 60, 90, 30]],
  },
  row_bent: {
    head: [130, 66],
    limbs: [
      [120, 76, 96, 118],               // dos incliné
      [96, 118, 92, 148], [92, 148, 94, 176],
      [96, 118, 104, 148], [104, 148, 102, 176],
      [120, 82, 118, 60], [118, 60, 100, 108], // bras tirant vers le buste
    ],
    weights: [[92, 100, 18, 14, 0]],
  },
  shoulder_press: {
    head: [100, 46],
    limbs: [
      [100, 58, 100, 116],
      [100, 116, 88, 148], [88, 148, 90, 176],
      [100, 116, 112, 148], [112, 148, 110, 176],
      [100, 68, 78, 28], [100, 68, 122, 28],
    ],
    weights: [[68, 16, 20, 14, -20], [112, 16, 20, 14, 20]],
  },
  pushup: {
    head: [154, 110],
    limbs: [
      [144, 112, 66, 130],              // corps aligné horizontal
      [144, 112, 156, 176], [66, 130, 60, 176],
      [110, 118, 118, 150],             // bras plié
    ],
  },
  lateral_raise: {
    head: [100, 40],
    limbs: [
      [100, 52, 100, 112],
      [100, 112, 88, 176], [100, 112, 112, 176],
      [100, 66, 60, 66], [100, 66, 140, 66],
    ],
    weights: [[46, 60, 16, 12, 0], [138, 60, 16, 12, 0]],
  },
  russian_twist: {
    head: [86, 90],
    limbs: [
      [98, 100, 60, 76],                // buste penché arrière
      [98, 100, 130, 118], [130, 118, 150, 130], // jambes relevées
      [98, 100, 96, 176],
      [72, 80, 96, 96],                 // bras tenant la masse, tourné
    ],
    weights: [[86, 90, 20, 14, 25]],
  },
  plank: {
    head: [156, 108],
    limbs: [
      [146, 110, 66, 132],
      [146, 110, 148, 176],
      [66, 132, 62, 176],
    ],
  },
  side_plank: {
    head: [150, 96],
    limbs: [
      [140, 100, 60, 122],
      [140, 100, 150, 150],
      [60, 122, 56, 176], [100, 111, 96, 60],
    ],
  },
  jump_rope: {
    head: [100, 34],
    limbs: [
      [100, 46, 100, 108],
      [100, 108, 88, 176], [100, 108, 112, 176],
      [100, 60, 76, 96], [100, 60, 124, 96],
    ],
    arrows: [[60, 96, 60, 30, 60], [140, 96, 140, 30]],
  },
  shrug: {
    head: [100, 42],
    limbs: [
      [100, 56, 100, 116],
      [100, 116, 88, 176], [100, 116, 112, 176],
      [100, 62, 78, 110], [100, 62, 122, 110],
    ],
    weights: [[66, 108, 16, 26, 0], [118, 108, 16, 26, 0]],
    arrows: [[100, 46, 100, 34]],
  },
  superman: {
    head: [166, 128],
    limbs: [
      [154, 128, 100, 130],
      [100, 130, 44, 118],              // jambes levées
      [154, 128, 176, 106],             // bras levé
    ],
  },
  farmer_walk: {
    head: [100, 40],
    limbs: [
      [100, 52, 100, 112],
      [100, 112, 82, 148], [82, 148, 90, 176],
      [100, 112, 116, 146], [116, 146, 108, 176],
      [100, 64, 84, 112], [100, 64, 116, 112],
    ],
    weights: [[76, 110, 14, 34, 0], [110, 110, 14, 34, 0]],
  },
  walk: {
    head: [100, 40],
    limbs: [
      [100, 52, 98, 112],
      [98, 112, 76, 140], [76, 140, 82, 176],
      [98, 112, 122, 146], [122, 146, 112, 176],
      [100, 64, 82, 88], [100, 64, 120, 92],
    ],
  },
  stretch: {
    head: [100, 36],
    limbs: [
      [100, 48, 100, 116],
      [100, 116, 86, 176], [100, 116, 114, 176],
      [100, 58, 70, 40], [100, 58, 130, 40],
    ],
  },
};

function pose(id) {
  return POSES[id] ? stickFigureSVG(POSES[id]) : "";
}

/* =========================================================
   PROGRAMME DE SERGE
   (retranscrit du document fourni)
========================================================= */

const PROGRAM = {
  meta: {
    objectif: "Forme générale / endurance",
    niveau: "Pratique occasionnelle",
    materiel: "3 masses artisanales — 10 kg / 25 kg / 35 kg",
    frequence: "5 à 7 jours / semaine, ~1h par séance",
  },
  days: [
    {
      id: "j1",
      title: "Jour 1 — Bas du corps + cardio",
      type: "circuit",
      circuitInfo: "4 tours, 45 sec effort / 15 sec repos, 2 min repos entre tours",
      rounds: 4,
      work: 45,
      rest: 15,
      roundRest: 120,
      exercises: [
        { name: "Squat goblet", masse: "25 kg", detail: "45 sec", pose: "squat_front" },
        { name: "Fentes alternées (masse tenue devant)", masse: "10 kg", detail: "45 sec", pose: "lunge" },
        { name: "Soulevé de terre roumain", masse: "35 kg", detail: "45 sec", pose: "rdl" },
        { name: "Jumping jacks", masse: "—", detail: "45 sec", pose: "jumping_jack" },
        { name: "Squat sumo", masse: "25 kg", detail: "45 sec", pose: "squat_wide" },
        { name: "Mountain climbers", masse: "—", detail: "45 sec", pose: "mountain_climber" },
      ],
    },
    {
      id: "j2",
      title: "Jour 2 — Haut du corps (poussée) + gainage",
      type: "sets",
      exercises: [
        { name: "Développé militaire debout", masse: "10 kg", detail: "3 x 12 reps", pose: "shoulder_press" },
        { name: "Pompes (lestées si possible)", masse: "10 kg", detail: "3 x 10-15 reps", pose: "pushup" },
        { name: "Élévations latérales", masse: "10 kg", detail: "3 x 15 reps", pose: "lateral_raise" },
        { name: "Russian twist", masse: "10 kg", detail: "3 x 20 reps (10/côté)", pose: "russian_twist" },
        { name: "Gainage planche", masse: "—", detail: "3 x 45 sec", pose: "plank" },
        { name: "Gainage latéral", masse: "—", detail: "3 x 30 sec/côté", pose: "side_plank" },
        { name: "Corde à sauter / jumping jacks", masse: "—", detail: "10 min continu", pose: "jump_rope" },
      ],
    },
    {
      id: "j3",
      title: "Jour 3 — Cardio / endurance générale",
      type: "emom",
      emomInfo: "EMOM — un exercice par minute, cycle de 5 min x 8",
      cycle: [
        { name: "Burpees", masse: "—", detail: "x8", pose: "burpee" },
        { name: "Squat avec masse", masse: "25 kg", detail: "x12", pose: "squat_front" },
        { name: "Mountain climbers", masse: "—", detail: "x30", pose: "mountain_climber" },
        { name: "Rowing penché", masse: "35 kg", detail: "x10", pose: "row_bent" },
        { name: "Repos actif (marche sur place)", masse: "—", detail: "1 min", pose: "walk" },
      ],
      repeats: 8,
    },
    {
      id: "j4",
      title: "Jour 4 — Haut du corps (tirage) + gainage",
      type: "sets",
      exercises: [
        { name: "Rowing penché", masse: "35 kg", detail: "3 x 12 reps", pose: "row_bent" },
        { name: "Tirage buste (dos droit, vers la taille)", masse: "25 kg", detail: "3 x 12 reps", pose: "row_bent" },
        { name: "Shrugs (haussements d'épaules)", masse: "35 kg", detail: "3 x 15 reps", pose: "shrug" },
        { name: "Superman", masse: "—", detail: "3 x 15 reps", pose: "superman" },
        { name: "Gainage planche + touches d'épaule", masse: "—", detail: "3 x 40 sec", pose: "plank" },
      ],
    },
    {
      id: "j5",
      title: "Jour 5 — Bas du corps + mobilité",
      type: "sets",
      exercises: [
        { name: "Squat bulgare (pied arrière surélevé)", masse: "10 kg", detail: "3 x 12 reps/jambe", pose: "lunge_rear_elevated" },
        { name: "Hip thrust avec masse", masse: "25 kg", detail: "3 x 15 reps", pose: "hip_thrust" },
        { name: "Mollets debout (calf raises)", masse: "35 kg", detail: "3 x 20 reps", pose: "calf_raise" },
        { name: "Mobilité (hanches, ischios, chevilles)", masse: "—", detail: "15 min", pose: "stretch" },
      ],
    },
    {
      id: "j6",
      title: "Jour 6 — Full body endurance (circuit intense)",
      type: "circuit",
      circuitInfo: "5 tours, 40 sec effort / 20 sec repos",
      rounds: 5,
      work: 40,
      rest: 20,
      roundRest: 90,
      exercises: [
        { name: "Squat + press", masse: "10 kg", detail: "40 sec", pose: "shoulder_press" },
        { name: "Farmer walk", masse: "25-35 kg", detail: "40 sec", pose: "farmer_walk" },
        { name: "Fentes sautées", masse: "—", detail: "40 sec", pose: "lunge_jump" },
        { name: "Rowing avec masse", masse: "35 kg", detail: "40 sec", pose: "row_bent" },
        { name: "Gainage dynamique (touches genoux)", masse: "—", detail: "40 sec", pose: "plank" },
        { name: "Jumping jacks", masse: "—", detail: "40 sec", pose: "jumping_jack" },
      ],
    },
    {
      id: "j7",
      title: "Jour 7 — Repos actif",
      type: "rest",
      exercises: [
        { name: "Marche", masse: "—", detail: "30-45 min", pose: "walk" },
        { name: "Étirements complets", masse: "—", detail: "15 min", pose: "stretch" },
      ],
    },
  ],
};

const NUTRITION = {
  principes: [
    "3 repas + 1-2 collations, hydratation régulière (eau, éviter le sucre liquide)",
    "Un repas = glucides complexes + protéines + légumes/fruits + un peu de bon gras",
    "Privilégier les féculents complets (flocon d'avoine, riz, macabo, plantain, patate douce)",
  ],
  journee: [
    { moment: "Petit-déjeuner", detail: "Flocons d'avoine + banane écrasée + arachides ou beurre de cacahuète, 2 œufs" },
    { moment: "Collation matin", detail: "Un fruit (orange, mangue, banane) + poignée d'arachides grillées" },
    { moment: "Déjeuner", detail: "Riz complet / plantain / macabo + poisson, poulet, œufs ou haricots + légumes verts + un peu d'huile" },
    { moment: "Collation après-midi", detail: "Avocat sur pain complet, ou banane (surtout les jours d'entraînement)" },
    { moment: "Dîner", detail: "Légumineuses + légumes, ou soupe de légumes + un peu de féculent" },
    { moment: "Avant séance (30-45 min)", detail: "Une banane ou quelques dattes" },
    { moment: "Après séance", detail: "Œufs + avocat, ou flocons d'avoine + fruit" },
  ],
  aliments: [
    { cat: "Glucides complexes", ex: "Flocon d'avoine, riz complet, plantain, macabo, patate douce" },
    { cat: "Protéines", ex: "Œufs, poulet, poisson, haricots, niébé, arachides" },
    { cat: "Bons gras", ex: "Avocat, arachides, huile d'arachide (petite quantité)" },
    { cat: "Fruits", ex: "Banane, orange, mangue, papaye, ananas" },
    { cat: "Légumes", ex: "Folon, morelle noire, épinard, tomate, carotte, chou" },
    { cat: "Hydratation", ex: "Eau, eau de coco si disponible" },
  ],
};
