// Data definitions for the Laniakea supercluster visualization

export type RegionKey =
  | "local"
  | "hydraCentaurus"
  | "pavoIndus"
  | "southern";

export interface RegionDef {
  key: RegionKey;
  name: string;
  englishName: string;
  description: string;
  // Center in 3D space (relative to Laniakea center)
  position: [number, number, number];
  // Ellipsoid radii for galaxy distribution
  radius: [number, number, number];
  // Color (hex)
  color: string;
  // Core color (hotter, brighter)
  coreColor: string;
  // Number of simulated galaxies
  count: number;
  // Notable members
  members: string[];
  // Approximate distance from Milky Way (Mly)
  distance: string;
}

// Great Attractor is the center of gravity of Laniakea
export const GREAT_ATTRACTOR: {
  position: [number, number, number];
  name: string;
  description: string;
  distance: string;
} = {
  position: [0, 0, 0],
  name: "Великий аттрактор",
  description:
    "Область пространства в Сверхскоплении Гидры-Центавра, к которой согласованно движутся галактики Ланиакеи. Это гравитационный центр всего сверхскопления. Скорость притяжения нашей Галактики к нему — около 600 км/с.",
  distance: "~200–250 млн св. лет",
};

// Milky Way position - far edge of Local supercluster, distant from Great Attractor
export const MILKY_WAY: {
  position: [number, number, number];
  name: string;
  description: string;
  distance: string;
} = {
  // Placed at the outer edge of the Local supercluster, on the side opposite to GA
  position: [20, 7, -5],
  name: "Млечный Путь",
  description:
    "Наша Галактика — спиральная галактика с перемычкой, содержащая 100–400 млрд звёзд. Находится в Местной группе, на периферии Местного сверхскопления, на расстоянии ~250 млн св. лет от Великого аттрактора, к которому движется со скоростью ~600 км/с вместе со всей Ланикеей.",
  distance: "Мы здесь",
};

export const REGIONS: RegionDef[] = [
  {
    key: "local",
    name: "Местное сверхскопление",
    englishName: "Local Supercluster (Virgo)",
    description:
      "Содержит Местную группу галактик, в которую входят Млечный Путь и Солнечная система. Ядро — скопление Девы.",
    position: [12, 4, -3],
    radius: [9, 5, 6],
    color: "#ffd166",
    coreColor: "#fff3b0",
    count: 7000,
    members: [
      "Млечный Путь",
      "Скопление Девы",
      "Местная группа",
      "Андромеда (M31)",
    ],
    distance: "от нас до 65 млн св. лет",
  },
  {
    key: "hydraCentaurus",
    name: "Сверхскопление Гидры-Центавра",
    englishName: "Hydra-Centaurus Supercluster",
    description:
      "Самая массивная часть Ланиакеи. Содержит Великий аттрактор, скопления Насоса, Гидры и Центавра.",
    position: [-2, -1, 2],
    radius: [13, 7, 8],
    color: "#ef476f",
    coreColor: "#ffb3c1",
    count: 12000,
    members: [
      "Великий аттрактор",
      "Скопление Центавра",
      "Скопление Гидры",
      "Скопление Насоса (Antlia)",
    ],
    distance: "~150–250 млн св. лет",
  },
  {
    key: "pavoIndus",
    name: "Сверхскопление Павлина-Индейца",
    englishName: "Pavo-Indus Supercluster",
    description:
      "Южное крыло Ланиакеи. Протянулось в направлении созвездий Павлина и Индейца.",
    position: [-9, -8, 6],
    radius: [10, 6, 7],
    color: "#06d6a0",
    coreColor: "#a0f0d8",
    count: 8000,
    members: ["Скопление Павлина", "Скопление Индейца", "Abell 3627"],
    distance: "~220–340 млн св. лет",
  },
  {
    key: "southern",
    name: "Южное сверхскопление",
    englishName: "Southern Supercluster",
    description:
      "Включает скопления Печи и Эридана. Образует южную границу Ланиакеи.",
    position: [6, -9, -8],
    radius: [9, 5, 6],
    color: "#118ab2",
    coreColor: "#80d4ef",
    count: 6500,
    members: ["Скопление Печи (Fornax)", "Скопление Эридана"],
    distance: "~60–200 млн св. лет",
  },
];

// Neighbor supercluster (not part of Laniakea, shown for context)
export const NEIGHBOR: {
  name: string;
  englishName: string;
  description: string;
  position: [number, number, number];
  radius: [number, number, number];
  color: string;
  coreColor: string;
  count: number;
  distance: string;
} = {
  name: "Персей-Рыбы",
  englishName: "Perseus-Pisces Supercluster",
  description:
    "Сосед Ланиакеи, входит в цепь Персея-Пегаса. Не является частью Ланиакеи, но близок к нам.",
  position: [22, 10, -14],
  radius: [10, 5, 6],
  color: "#9d4edd",
  coreColor: "#d4a8ff",
  count: 7000,
  distance: "~200 млн св. лет",
};

export const LANIAKEA_FACTS = [
  {
    label: "Диаметр",
    value: "~520 млн св. лет",
    icon: "ruler" as const,
  },
  {
    label: "Галактик",
    value: "~100 000",
    icon: "sparkles" as const,
  },
  {
    label: "Масса",
    value: "10¹⁷ M☉",
    icon: "scale" as const,
  },
  {
    label: "Карта создана",
    value: "сентябрь 2014",
    icon: "calendar" as const,
  },
  {
    label: "Каталог движений",
    value: "Cosmicflows-2",
    icon: "database" as const,
  },
  {
    label: "Главный исследователь",
    value: "Р. Брент Талли",
    icon: "user" as const,
  },
];

export const INFO_INTRO = {
  title: "Ланиакея",
  subtitle: "«Необъятные небеса» (гавайский)",
  description:
    "Сверхскопление галактик, в котором находится наша Галактика. Содержит Местную группу с Млечным Путём, Сверхскопление Девы и Великий аттрактор — область, где расположен центр тяжести всего сверхскопления. Название предложил Нава'а Наполеон из Гонолулу в дань уважения полинезийским мореходам, использовавшим звёзды для навигации по Тихому океану.",
};
