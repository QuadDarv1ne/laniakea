// Data about neighboring superclusters for comparison mode.
// These are real superclusters in our cosmic neighborhood.

export interface NeighborSupercluster {
  key: string;
  name: string;
  englishName: string;
  description: string;
  // Approximate distance from Milky Way in Mpc
  distanceMpc: number;
  // Approximate diameter in Mpc
  diameterMpc: number;
  // Approximate number of galaxies
  galaxyCount: string;
  // Position in supergalactic coords (sgl, sgb) — approximate direction from MW
  sgl: number;
  sgb: number;
  // Mass in solar masses (log10)
  massLog10: number;
  // Color for visualization
  color: string;
  // Notable features
  features: string[];
}

export const NEIGHBOR_SUPERCLUSTERS: NeighborSupercluster[] = [
  {
    key: "laniakea",
    name: "Ланиакея",
    englishName: "Laniakea Supercluster",
    description:
      "Наше сверхскопление. Содержит ~100 000 галактик, включая Млечный Путь. Гравитационный центр — Великий аттрактор.",
    distanceMpc: 0, // We are inside it
    diameterMpc: 160,
    galaxyCount: "~100 000",
    sgl: 0,
    sgb: 0,
    massLog10: 17,
    color: "#ffd166",
    features: [
      "Великий аттрактор — гравитационный центр",
      "4 основных региона: Местное, Гидра-Центавр, Павлин-Индеец, Южное",
      "Открыто в 2014 (Tully et al.)",
    ],
  },
  {
    key: "perseusPisces",
    name: "Персей-Рыбы",
    englishName: "Perseus-Pisces Supercluster",
    description:
      "Ближайший крупный сосед Ланиакеи. Протянулся в цепи Персея-Пегаса. Не связан с нами гравитационно, но видим как протяжённую стену галактик.",
    distanceMpc: 70,
    diameterMpc: 150,
    galaxyCount: "~1000",
    sgl: 110,
    sgb: -5,
    massLog10: 16.5,
    color: "#9d4edd",
    features: [
      "Скопление Персея (Abell 426) — одно из самых массивных в местной Вселенной",
      "Часть Великой Стены CfA2",
      "Протяжённая нить галактик",
    ],
  },
  {
    key: "shapley",
    name: "Шепли",
    englishName: "Shapley Supercluster",
    description:
      "Один из самых массивных сверхскоплений в местной Вселенной. Находится за Великой Стеной и вносит вклад в «тёмный поток» — аномальное движение всей Ланиакеи.",
    distanceMpc: 200,
    diameterMpc: 120,
    galaxyCount: "~8000",
    sgl: 145,
    sgb: 25,
    massLog10: 16.8,
    color: "#ef476f",
    features: [
      "Масса в ~10 раз больше Ланиакеи",
      "Содержит ~25 скоплений галактик",
      "Источник «тёмного потока» — аномального движения нашей Галактики",
    ],
  },
  {
    key: "horologiumReticulum",
    name: "Хорологий-Сетка",
    englishName: "Horologium-Reticulum Supercluster",
    description:
      "Далёкое сверхскопление в южном небе. Одно из крупнейших известных скоплений сверхскоплений.",
    distanceMpc: 280,
    diameterMpc: 220,
    galaxyCount: "~5000",
    sgl: 230,
    sgb: -20,
    massLog10: 16.7,
    color: "#06d6a0",
    features: [
      "Протяжённость ~700 млн св. лет",
      "Содержит скопление Horologium",
      "Один из крупнейших в местной Вселенной",
    ],
  },
  {
    key: "centaurus",
    name: "Центаур (Pavo-Indus-Telescopium)",
    englishName: "Pavo-Indus-Telescopium Supercluster",
    description:
      "Массивное сверхскопление за Ланиакеей. Частично перекрывается с нашим сверхскоплением в проекции.",
    distanceMpc: 180,
    diameterMpc: 130,
    galaxyCount: "~3000",
    sgl: 195,
    sgb: -15,
    massLog10: 16.4,
    color: "#118ab2",
    features: [
      "Часть Южной Стены галактик",
      "Содержит скопления Павлина и Индейца",
      "Связан с Ланиакеей нитью галактик",
    ],
  },
];
