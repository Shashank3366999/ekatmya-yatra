/**
 * The sacred geography of the Advaita tradition.
 *
 * The Yatra team's central point about the map: the 2027 itinerary is only part
 * of the story. Adi Shankaracharya's Digvijaya Yatra covered the whole of
 * Bharat, and the product should convey that depth. These sites are drawn on
 * the map alongside the route.
 *
 * Grouped by why each place matters:
 *   char_dham            the four Dhams
 *   amnaya_peetham       the four Mathas he established
 *   jyotirlinga          the twelve Jyotirlingas
 *   shakti_peetha        Shakti Peethas
 *   saptapuri            the seven holy cities
 *   shankaracharya_site  places tied directly to his life and works
 *
 * `beyondReach` marks a site the Yatra cannot visit. Entries carrying it are
 * **not shown anywhere on the site** — the Yatra team asked for the "Beyond
 * reach today" section to be removed. The entry and the flag are kept so the
 * decision is reversible: `listHeritagePlaces` and `heritageCounts` in
 * src/lib/queries.ts filter on it, and MapLegend would need its row back.
 *
 * NOTE: coordinates are for map display. The canonical list of sites the Yatra
 * will actually halt at must come from the Yatra team — see
 * docs/TEAM-QUESTIONS.md Q1.
 */

export type HeritageType =
  | "char_dham"
  | "amnaya_peetham"
  | "jyotirlinga"
  | "shakti_peetha"
  | "saptapuri"
  | "shankaracharya_site";

export type HeritageSite = {
  name: string;
  stateCode: string;
  district?: string;
  lat: number;
  lng: number;
  types: HeritageType[];
  significance: string;
  /** Cannot be visited on this Yatra (across a border). */
  beyondReach?: boolean;
};

export const HERITAGE_SITES: HeritageSite[] = [
  /* ---------------------------------------------- Amnaya Peethams (Mathas) */
  {
    name: "Sringeri Sharada Peetham",
    stateCode: "KA",
    district: "Chikkamagaluru",
    lat: 13.4167,
    lng: 75.2528,
    types: ["amnaya_peetham"],
    significance: "The southern Matha, established by Adi Shankaracharya.",
  },
  {
    name: "Dwarka Sharada Peetham",
    stateCode: "GJ",
    district: "Devbhumi Dwarka",
    lat: 22.2394,
    lng: 68.9678,
    types: ["amnaya_peetham", "char_dham", "saptapuri"],
    significance: "The western Matha, a Char Dham and one of the seven holy cities.",
  },
  {
    name: "Govardhana Peetham, Puri",
    stateCode: "OD",
    district: "Puri",
    lat: 19.8135,
    lng: 85.8312,
    types: ["amnaya_peetham", "char_dham"],
    significance: "The eastern Matha, established beside the Jagannatha temple.",
  },
  {
    name: "Jyotirmath, Joshimath",
    stateCode: "UK",
    district: "Chamoli",
    lat: 30.5548,
    lng: 79.5645,
    types: ["amnaya_peetham"],
    significance: "The northern Matha, in the Himalaya.",
  },
  {
    name: "Kanchi Kamakoti Peetham",
    stateCode: "TN",
    district: "Kanchipuram",
    lat: 12.8342,
    lng: 79.7036,
    types: ["amnaya_peetham", "saptapuri", "shankaracharya_site"],
    significance: "A historic seat of Advaita scholarship in the south.",
  },

  /* ------------------------------------------------------- The Char Dham */
  {
    name: "Badrinath",
    stateCode: "UK",
    district: "Chamoli",
    lat: 30.7433,
    lng: 79.4938,
    types: ["char_dham", "shankaracharya_site"],
    significance: "Re-established by Adi Shankaracharya in the Himalaya.",
  },
  {
    name: "Rameswaram",
    stateCode: "TN",
    district: "Ramanathapuram",
    lat: 9.2876,
    lng: 79.3129,
    types: ["char_dham", "jyotirlinga"],
    significance: "The southern Dham and a Jyotirlinga.",
  },

  /* ---------------------------------------------- The twelve Jyotirlingas */
  {
    name: "Somnath",
    stateCode: "GJ",
    district: "Junagadh",
    lat: 20.888,
    lng: 70.4012,
    types: ["jyotirlinga"],
    significance: "The first of the twelve Jyotirlingas, on the Saurashtra coast.",
  },
  {
    name: "Mallikarjuna, Srisailam",
    stateCode: "AP",
    district: "Kurnool",
    lat: 16.0733,
    lng: 78.8683,
    types: ["jyotirlinga", "shakti_peetha"],
    significance: "A Jyotirlinga and a Shakti Peetha on the Krishna river.",
  },
  {
    name: "Mahakaleshwar, Ujjain",
    stateCode: "MP",
    district: "Ujjain",
    lat: 23.1828,
    lng: 75.7681,
    types: ["jyotirlinga", "saptapuri"],
    significance: "Jyotirlinga and one of the four Kumbh cities.",
  },
  {
    name: "Omkareshwar",
    stateCode: "MP",
    district: "Khandwa",
    lat: 22.2451,
    lng: 76.1508,
    types: ["jyotirlinga", "shankaracharya_site"],
    significance:
      "Where Adi Shankaracharya met his guru Govindapada. Home of the Statue of Oneness.",
  },
  {
    name: "Kedarnath",
    stateCode: "UK",
    district: "Rudraprayag",
    lat: 30.7346,
    lng: 79.0669,
    types: ["jyotirlinga", "shankaracharya_site"],
    significance: "The Jyotirlinga where Adi Shankaracharya's journey concluded.",
  },
  {
    name: "Bhimashankar",
    stateCode: "MH",
    district: "Pune",
    lat: 19.0722,
    lng: 73.5355,
    types: ["jyotirlinga"],
    significance: "Jyotirlinga in the Sahyadri hills.",
  },
  {
    name: "Kashi Vishwanath",
    stateCode: "UP",
    district: "Varanasi",
    lat: 25.3109,
    lng: 83.0107,
    types: ["jyotirlinga", "saptapuri", "shankaracharya_site"],
    significance:
      "Where Adi Shankaracharya composed and debated; the enduring centre of learning.",
  },
  {
    name: "Trimbakeshwar",
    stateCode: "MH",
    district: "Nashik",
    lat: 19.9322,
    lng: 73.5301,
    types: ["jyotirlinga"],
    significance: "Jyotirlinga at the source of the Godavari.",
  },
  {
    name: "Baidyanath, Deoghar",
    stateCode: "JH",
    district: "Deoghar",
    lat: 24.4924,
    lng: 86.7003,
    types: ["jyotirlinga", "shakti_peetha"],
    significance: "Jyotirlinga and Shakti Peetha in the east.",
  },
  {
    name: "Nageshwar, Dwarka",
    stateCode: "GJ",
    district: "Devbhumi Dwarka",
    lat: 22.3361,
    lng: 69.0865,
    types: ["jyotirlinga"],
    significance: "Jyotirlinga near Dwarka.",
  },
  {
    name: "Grishneshwar, Ellora",
    stateCode: "MH",
    district: "Aurangabad",
    lat: 20.0259,
    lng: 75.1792,
    types: ["jyotirlinga"],
    significance: "The twelfth Jyotirlinga, beside the Ellora caves.",
  },

  /* ------------------------------------------------------- The Saptapuris */
  {
    name: "Ayodhya",
    stateCode: "UP",
    district: "Ayodhya",
    lat: 26.7996,
    lng: 82.2041,
    types: ["saptapuri"],
    significance: "One of the seven holy cities.",
  },
  {
    name: "Mathura",
    stateCode: "UP",
    district: "Mathura",
    lat: 27.4924,
    lng: 77.6737,
    types: ["saptapuri"],
    significance: "One of the seven holy cities.",
  },
  {
    name: "Haridwar",
    stateCode: "UK",
    district: "Haridwar",
    lat: 29.9457,
    lng: 78.1642,
    types: ["saptapuri"],
    significance: "Where the Ganga enters the plains; gateway to the Himalayan seats.",
  },

  /* ----------------------------------------------------- Shakti Peethas */
  {
    name: "Kamakhya, Guwahati",
    stateCode: "AS",
    district: "Kamrup Metropolitan",
    lat: 26.1664,
    lng: 91.7058,
    types: ["shakti_peetha"],
    significance: "A principal Shakti Peetha in the east.",
  },
  {
    name: "Kalighat, Kolkata",
    stateCode: "WB",
    district: "Kolkata",
    lat: 22.5203,
    lng: 88.3426,
    types: ["shakti_peetha"],
    significance: "Shakti Peetha on the Hooghly.",
  },
  {
    name: "Vaishno Devi, Trikuta",
    stateCode: "JK",
    district: "Udhampur",
    lat: 33.0301,
    lng: 74.9497,
    types: ["shakti_peetha"],
    significance: "Shakti shrine in the Trikuta hills.",
  },
  {
    name: "Jwalamukhi",
    stateCode: "HP",
    district: "Kangra",
    lat: 31.8757,
    lng: 76.3193,
    types: ["shakti_peetha"],
    significance: "Shakti Peetha of the eternal flame.",
  },
  {
    name: "Mahalakshmi, Kolhapur",
    stateCode: "MH",
    district: "Kolhapur",
    lat: 16.6949,
    lng: 74.2223,
    types: ["shakti_peetha"],
    significance: "Shakti Peetha and a major western gathering point.",
  },
  {
    name: "Kamakshi, Kanchipuram",
    stateCode: "TN",
    district: "Kanchipuram",
    lat: 12.8419,
    lng: 79.7036,
    types: ["shakti_peetha"],
    significance: "Shakti Peetha beside the Kamakoti seat.",
  },
  {
    name: "Mookambika, Kollur",
    stateCode: "KA",
    district: "Udupi",
    lat: 13.8636,
    lng: 74.8103,
    types: ["shakti_peetha", "shankaracharya_site"],
    significance: "Shakti shrine closely associated with Adi Shankaracharya's life.",
  },

  /* ------------------------------------ His life, works and debates */
  {
    name: "Kalady",
    stateCode: "KL",
    district: "Ernakulam",
    lat: 10.1747,
    lng: 76.4358,
    types: ["shankaracharya_site"],
    significance: "Birthplace of Adi Shankaracharya, on the banks of the Periyar.",
  },
  {
    name: "Thrissur (Vadakkunnathan)",
    stateCode: "KL",
    district: "Thrissur",
    lat: 10.5276,
    lng: 76.2144,
    types: ["shankaracharya_site"],
    significance: "Traditionally held to be where he attained samadhi.",
  },
  {
    name: "Chidambaram",
    stateCode: "TN",
    district: "Cuddalore",
    lat: 11.3994,
    lng: 79.6934,
    types: ["shankaracharya_site"],
    significance: "Ancient Shaiva centre visited on the southern journey.",
  },
  {
    name: "Prayagraj (Triveni Sangam)",
    stateCode: "UP",
    district: "Allahabad (Prayagraj)",
    lat: 25.4358,
    lng: 81.8463,
    types: ["shankaracharya_site"],
    significance: "Confluence of the Ganga, Yamuna and Saraswati.",
  },
  {
    name: "Rishikesh",
    stateCode: "UK",
    district: "Dehradun",
    lat: 30.0869,
    lng: 78.2676,
    types: ["shankaracharya_site"],
    significance: "A living centre of Vedanta study and monastic institutions.",
  },
  {
    name: "Mahishmati (Maheshwar)",
    stateCode: "MP",
    district: "Khargone",
    lat: 22.1771,
    lng: 75.5878,
    types: ["shankaracharya_site"],
    significance:
      "Where Adi Shankaracharya debated Mandana Mishra, a turning point in the Digvijaya.",
  },
  {
    name: "Kanyakumari",
    stateCode: "TN",
    district: "Kanyakumari",
    lat: 8.0883,
    lng: 77.5385,
    types: ["shankaracharya_site"],
    significance: "The southern tip of Bharat, where the three seas meet.",
  },
  {
    name: "Madurai",
    stateCode: "TN",
    district: "Madurai",
    lat: 9.9252,
    lng: 78.1198,
    types: ["shankaracharya_site"],
    significance: "Ancient temple city and a centre of Tamil learning and debate.",
  },

  /* ------------------------------------- Not shown: see the header note */
  {
    name: "Sharada Peeth, Kashmir",
    stateCode: "JK",
    lat: 34.7983,
    lng: 74.1911,
    types: ["shankaracharya_site", "shakti_peetha"],
    significance:
      "The Sharada temple and ancient seat of learning that Adi Shankaracharya reached in the far north. In Pakistan-occupied Kashmir, so the Yatra cannot halt here, but the journey is not complete without it.",
    beyondReach: true,
  },
  {
    name: "Shankaracharya Temple, Srinagar",
    stateCode: "JK",
    district: "Srinagar",
    lat: 34.0847,
    lng: 74.8319,
    types: ["shankaracharya_site"],
    significance:
      "On Gopadri hill above Srinagar, marking the northern reach of his journey.",
  },
];

/** Human labels for the heritage groupings. */
export const HERITAGE_LABELS: Record<HeritageType, string> = {
  char_dham: "Char Dham",
  amnaya_peetham: "Amnaya Peetham (Matha)",
  jyotirlinga: "Jyotirlinga",
  shakti_peetha: "Shakti Peetha",
  saptapuri: "Saptapuri",
  shankaracharya_site: "Acharya Shankar site",
};
