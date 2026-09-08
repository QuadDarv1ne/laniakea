// Timeline of key discoveries about the large-scale structure of the universe
// and the Laniakea supercluster, from Hubble (1929) to Tully et al. (2014).

export interface TimelineEvent {
  year: number;
  title: string;
  description: string;
  person?: string;
  // Category for color coding
  category: "discovery" | "measurement" | "theory" | "mapping" | "naming";
  // Optional source/credits
  source?: string;
  // Camera fly-to target when this event is clicked.
  // Maps to a tour point key (see TOUR_POINTS in LaniakeaCanvas).
  // If undefined, clicking the event only shows the description.
  flyTo?:
    | "overview"
    | "milkyway"
    | "greatAttractor"
    | "hydraCentaurus"
    | "pavoIndus"
    | "southern"
    | "local";
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    year: 1924,
    title: "Галактики — острова во Вселенной",
    description:
      "Эдвин Хаббл доказал, что туманность Андромеды (M31) находится за пределами Млечного Пути. Это была отдельная галактика. Внезапно Вселенная стала в разы больше.",
    person: "Эдвин Хаббл",
    category: "discovery",
    source: "Mt. Wilson Observatory",
    flyTo: "milkyway",
  },
  {
    year: 1929,
    title: "Закон Хаббла — Вселенная расширяется",
    description:
      "Хаббл показал, что чем дальше галактика, тем больше её красное смещение. Это означало, что Вселенная расширяется. Возникла концепция Большого взрыва.",
    person: "Эдвин Хаббл",
    category: "theory",
    source: "PNAS, 15, 168",
    flyTo: "overview",
  },
  {
    year: 1932,
    title: "Первые карты скоплений галактик",
    description:
      "Харлоу Шепли и Эдвин Хьюббл начали каталогизировать скопления галактик. Стало ясно, что галактики не распределены равномерно — они образуют группы и скопления.",
    person: "Шепли, Эймс",
    category: "mapping",
    source: "Harvard Observatory",
    flyTo: "overview",
  },
  {
    year: 1953,
    title: "Сверхскопление Девы",
    description:
      "Жерар де Вокулёр описал местное сверхскопление — плоскую структуру, в центре которой скопление Девы. Млечный Путь оказался на периферии этой структуры.",
    person: "Жерар де Вокулёр",
    category: "discovery",
    source: "AJ, 58, 30",
    flyTo: "local",
  },
  {
    year: 1976,
    title: "Карта сверхскоплений Абелла",
    description:
      "На основе каталога скоплений Абелла была построена первая глобальная карта крупномасштабной структуры Вселенной. Появились «стены» и «войды».",
    person: "Аббэл, Хучра, Ши",
    category: "mapping",
    source: "ApJ, 207, 1",
    flyTo: "overview",
  },
  {
    year: 1981,
    title: "Войд Волопаса",
    description:
      "Был обнаружен огромный пустой регион — войд Волопаса, диаметром около 330 миллионов световых лет. Это показало, что крупномасштабная структура имеет ячеистую природу.",
    person: "Киршнер, Оемлер, Шектер",
    category: "discovery",
    source: "ApJ, 248, L57",
    flyTo: "overview",
  },
  {
    year: 1986,
    title: "Великая Стена CfA",
    description:
      "Маргарет Геллер и Джон Хукра обнаружили «Великую Стену» — гигантский лист галактик протяжённостью более 500 миллионов световых лет. Крупномасштабная структура стала явной.",
    person: "Геллер, Хукра",
    category: "mapping",
    source: "Science, 246, 897",
    flyTo: "overview",
  },
  {
    year: 1987,
    title: "Гипотеза о Великом аттракторе",
    description:
      "Команда из 7 астрономов обнаружила согласованное движение сотен галактик в направлении созвездия Центавра. Получило название «Великий аттрактор».",
    person: "Дреслер, Фабер и др.",
    category: "theory",
    source: "ApJ, 313, L37",
    flyTo: "greatAttractor",
  },
  {
    year: 1988,
    title: "Каталог расстояний до галактик",
    description:
      "Брент Талли и Ричард Фишер опубликовали «Каталог близких галактик» — первый систематический список расстояний до галактик, основанный на соотношении Талли-Фишера.",
    person: "Талли, Фишер",
    category: "measurement",
    source: "Cambridge Univ. Press",
    flyTo: "local",
  },
  {
    year: 2000,
    title: "Обзор 2dF Galaxy Redshift Survey",
    description:
      "Начался масштабный обзор красных смещений 250 000 галактик. Он показал, что сверхскопления образуют нитеобразную структуру с гигантскими пустотами между ними.",
    person: "2dFGRS Team",
    category: "mapping",
    source: "MNRAS, 328, 1039",
    flyTo: "overview",
  },
  {
    year: 2008,
    title: "Первая карта потоков Cosmicflows",
    description:
      "Талли и его коллеги опубликовали первый каталог пекулярных скоростей галактик Cosmicflows. Стало возможным видеть направление движения галактик, а не только их положение.",
    person: "Талли и др.",
    category: "measurement",
    source: "ApJ, 676, 184",
    flyTo: "hydraCentaurus",
  },
  {
    year: 2013,
    title: "Cosmicflows-2: 8000 галактик",
    description:
      "Каталог Cosmicflows-2 содержал расстояния и скорости более 8000 галактик. Это был самый полный на тот момент набор данных для исследования крупномасштабных течений.",
    person: "Талли и др.",
    category: "measurement",
    source: "AJ, 146, 86",
    flyTo: "overview",
  },
  {
    year: 2014,
    title: "Открытие Ланиакеи",
    description:
      "Брент Талли и его команда из Гавайского университета определили границы сверхскопления, в котором мы живём, и дали ему имя — Ланиакея («необъятные небеса» на гавайском). Статья опубликована в журнале Nature.",
    person: "Талли, Кутре, Фишер и др.",
    category: "discovery",
    source: "Nature, 513, 71",
    flyTo: "overview",
  },
  {
    year: 2014,
    title: "Название «Ланиакея»",
    description:
      "Наваа Наполеон, преподаватель из Гонолулу, предложил название «Ланиакея» в дань уважения полинезийским мореходам, которые веками использовали звёзды для навигации по Тихому океану.",
    person: "Наваа Наполеон",
    category: "naming",
    source: "Nature, 513, 71",
    flyTo: "overview",
  },
  {
    year: 2014,
    title: "Ланиакея в контексте Вселенной",
    description:
      "Карта показала, что Ланиакея — лишь одно из множества сверхскоплений в наблюдаемой Вселенной. Её размер — 520 млн св. лет, содержит ~100 000 галактик. Сосед — сверхскопление Персея-Рыб.",
    person: "Талли и др.",
    category: "mapping",
    source: "Nature, 513, 71",
    flyTo: "overview",
  },
];
