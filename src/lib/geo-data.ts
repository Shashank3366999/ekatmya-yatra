/**
 * Reference geography and the Yatra route.
 *
 * States/UTs are the full official list. Districts are seeded only for the
 * states the Main Yatra passes through plus the larger organising states —
 * roughly 180 of India's ~780 districts. The remainder should be imported from
 * the official LGD (Local Government Directory) list once the Yatra team
 * confirms which vintage to use (docs/TEAM-QUESTIONS.md Q2).
 */

export const STATES: { code: string; name: string; ut?: boolean }[] = [
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CG", name: "Chhattisgarh" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OD", name: "Odisha" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UK", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
  { code: "AN", name: "Andaman & Nicobar Islands", ut: true },
  { code: "CH", name: "Chandigarh", ut: true },
  { code: "DH", name: "Dadra & Nagar Haveli and Daman & Diu", ut: true },
  { code: "DL", name: "Delhi", ut: true },
  { code: "JK", name: "Jammu & Kashmir", ut: true },
  { code: "LA", name: "Ladakh", ut: true },
  { code: "LD", name: "Lakshadweep", ut: true },
  { code: "PY", name: "Puducherry", ut: true },
];

/** Districts by state code. Yatra-relevant states are covered in full. */
export const DISTRICTS: Record<string, string[]> = {
  KL: [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam",
    "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta",
    "Thiruvananthapuram", "Thrissur", "Wayanad",
  ],
  TN: [
    "Chennai", "Coimbatore", "Cuddalore", "Dindigul", "Erode", "Kanchipuram",
    "Kanyakumari", "Madurai", "Nagapattinam", "Namakkal", "Ramanathapuram", "Salem", "Thanjavur",
    "Tiruchirappalli", "Tirunelveli", "Tiruvannamalai", "Vellore", "Villupuram",
    "Virudhunagar",
  ],
  KA: [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Urban", "Bengaluru Rural",
    "Bidar", "Chamarajanagar", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada",
    "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu",
    "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga",
    "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir",
  ],
  AP: [
    "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool",
    "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram",
    "West Godavari", "YSR Kadapa",
  ],
  TG: [
    "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar", "Medak", "Nalgonda",
    "Nizamabad", "Rangareddy", "Warangal",
  ],
  MH: [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
    "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Jalgaon",
    "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur",
    "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune",
    "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane",
    "Wardha", "Washim", "Yavatmal",
  ],
  MP: [
    "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani",
    "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara",
    "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda",
    "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa",
    "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch",
    "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar",
    "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri",
    "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha",
  ],
  GJ: [
    "Ahmedabad", "Amreli", "Anand", "Banaskantha", "Bharuch", "Bhavnagar",
    "Devbhumi Dwarka", "Gandhinagar", "Jamnagar", "Junagadh", "Kutch", "Mehsana",
    "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha",
    "Surat", "Surendranagar", "Vadodara", "Valsad",
  ],
  RJ: [
    "Ajmer", "Alwar", "Banswara", "Barmer", "Bharatpur", "Bhilwara", "Bikaner",
    "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur",
    "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu",
    "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand",
    "Sawai Madhopur", "Sikar", "Sirohi", "Tonk", "Udaipur",
  ],
  UP: [
    "Agra", "Aligarh", "Allahabad (Prayagraj)", "Ambedkar Nagar", "Amethi",
    "Ayodhya", "Azamgarh", "Bahraich", "Ballia", "Banda", "Barabanki",
    "Bareilly", "Basti", "Bijnor", "Budaun", "Bulandshahr", "Chandauli",
    "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur",
    "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda",
    "Gorakhpur", "Hamirpur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi",
    "Kannauj", "Kanpur Nagar", "Kaushambi", "Kushinagar", "Lakhimpur Kheri",
    "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura",
    "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit",
    "Pratapgarh", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar",
    "Shahjahanpur", "Shrawasti", "Siddharthnagar", "Sitapur", "Sonbhadra",
    "Sultanpur", "Unnao", "Varanasi",
  ],
  UK: [
    "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar",
    "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal",
    "Udham Singh Nagar", "Uttarkashi",
  ],
  OD: [
    "Angul", "Balasore", "Bargarh", "Bhadrak", "Cuttack", "Ganjam", "Jagatsinghpur",
    "Jajpur", "Kalahandi", "Kendrapara", "Keonjhar", "Khordha", "Koraput",
    "Mayurbhanj", "Puri", "Rayagada", "Sambalpur", "Sundargarh",
  ],
  WB: [
    "Bankura", "Birbhum", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri",
    "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Purba Medinipur",
    "Paschim Medinipur", "Purulia", "South 24 Parganas",
  ],
  BR: [
    "Bhagalpur", "Darbhanga", "Gaya", "Muzaffarpur", "Nalanda", "Patna",
    "Purnia", "Saran", "Vaishali",
  ],
  DL: ["Central Delhi", "New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  HP: ["Chamba", "Kangra", "Kullu", "Mandi", "Shimla", "Solan", "Una"],
  PB: ["Amritsar", "Bathinda", "Jalandhar", "Ludhiana", "Patiala", "Sangrur"],
  HR: ["Ambala", "Faridabad", "Gurugram", "Hisar", "Karnal", "Kurukshetra", "Panipat", "Rohtak"],
  JH: ["Bokaro", "Dhanbad", "Hazaribagh", "Ranchi", "East Singhbhum"],
  CG: ["Bilaspur", "Durg", "Raigarh", "Raipur", "Rajnandgaon", "Bastar"],
  AS: ["Barpeta", "Cachar", "Dibrugarh", "Jorhat", "Kamrup Metropolitan", "Nagaon", "Sonitpur"],
  GA: ["North Goa", "South Goa"],
  JK: ["Anantnag", "Baramulla", "Jammu", "Srinagar", "Udhampur"],
  PY: ["Puducherry", "Karaikal", "Mahe", "Yanam"],
};

/**
 * The Main Yatra spine: Kalady (Adi Shankaracharya's birthplace) to Kedarnath,
 * through the seats and sites central to the Advaita tradition.
 *
 * IMPORTANT: this is a researched starting route for the map, NOT the confirmed
 * itinerary. The survey teams' submissions are precisely what will refine it.
 * Dates below are placeholders spread across the 15 Jan – 15 May window.
 * See docs/TEAM-QUESTIONS.md Q1.
 */
export const MAIN_YATRA_ROUTE: {
  name: string;
  stateCode: string;
  district?: string;
  lat: number;
  lng: number;
  category:
    | "religious"
    | "educational"
    | "social"
    | "advaita_heritage"
    | "institution"
    | "crowd_gathering"
    | "civic"
    | "other";
  significance: string;
  /** Day offset from the Yatra start date. */
  dayOffset: number;
  /** Photograph of the place, under /public/places. */
  image: string;
}[] = [
  {
    name: "Kalady",
    stateCode: "KL",
    district: "Ernakulam",
    lat: 10.1747,
    lng: 76.4358,
    category: "advaita_heritage",
    significance:
      "Birthplace of Adi Shankaracharya on the banks of the Periyar. The Yatra begins here.",
    dayOffset: 0,
    image: "/places/kalady.jpg",
  },
  {
    name: "Thrissur (Vadakkunnathan)",
    stateCode: "KL",
    district: "Thrissur",
    lat: 10.5276,
    lng: 76.2144,
    category: "religious",
    significance:
      "Traditionally held to be where Adi Shankaracharya attained samadhi; a major Shaiva centre.",
    dayOffset: 4,
    image: "/places/thrissur.jpg",
  },
  {
    name: "Kanyakumari",
    stateCode: "TN",
    district: "Kanyakumari",
    lat: 8.0883,
    lng: 77.5385,
    category: "religious",
    significance: "The southern tip of Bharat, where the three seas meet.",
    dayOffset: 9,
    image: "/places/kanyakumari.jpg",
  },
  {
    name: "Madurai",
    stateCode: "TN",
    district: "Madurai",
    lat: 9.9252,
    lng: 78.1198,
    category: "crowd_gathering",
    significance: "Ancient temple city and a centre of Tamil learning and debate.",
    dayOffset: 14,
    image: "/places/madurai.jpg",
  },
  {
    name: "Rameswaram",
    stateCode: "TN",
    district: "Ramanathapuram",
    lat: 9.2876,
    lng: 79.3129,
    category: "religious",
    significance: "One of the Char Dham; the eastern anchor of the pilgrimage tradition.",
    dayOffset: 18,
    image: "/places/rameswaram.webp",
  },
  {
    name: "Kanchipuram",
    stateCode: "TN",
    district: "Kanchipuram",
    lat: 12.8342,
    lng: 79.7036,
    category: "advaita_heritage",
    significance:
      "Seat of the Kanchi Kamakoti Peetham and a historic centre of Advaita scholarship.",
    dayOffset: 24,
    image: "/places/kanchipuram.jpg",
  },
  {
    name: "Sringeri",
    stateCode: "KA",
    district: "Chikkamagaluru",
    lat: 13.4167,
    lng: 75.2528,
    category: "advaita_heritage",
    significance:
      "The Sharada Peetham, the southern Amnaya Peetham established by Adi Shankaracharya.",
    dayOffset: 32,
    image: "/places/sringeri.jpg",
  },
  {
    name: "Kollur (Mookambika)",
    stateCode: "KA",
    district: "Udupi",
    lat: 13.8636,
    lng: 74.8103,
    category: "religious",
    significance: "Shakti shrine closely associated with Adi Shankaracharya's life.",
    dayOffset: 36,
    image: "/places/kollur.webp",
  },
  {
    name: "Kolhapur",
    stateCode: "MH",
    district: "Kolhapur",
    lat: 16.705,
    lng: 74.2433,
    category: "religious",
    significance: "Mahalakshmi Shakti Peetha and a major western gathering point.",
    dayOffset: 43,
    image: "/places/kolhapur.webp",
  },
  {
    name: "Nashik (Trimbakeshwar)",
    stateCode: "MH",
    district: "Nashik",
    lat: 19.9333,
    lng: 73.5333,
    category: "religious",
    significance: "Jyotirlinga on the Godavari; a traditional Kumbh site.",
    dayOffset: 49,
    image: "/places/nashik.jpg",
  },
  {
    name: "Dwarka",
    stateCode: "GJ",
    district: "Devbhumi Dwarka",
    lat: 22.2394,
    lng: 68.9678,
    category: "advaita_heritage",
    significance:
      "Sharada Peetham, Dwarka: the western Amnaya Peetham of the Advaita tradition.",
    dayOffset: 58,
    image: "/places/dwarka.jpg",
  },
  {
    name: "Omkareshwar (Ekatma Dham)",
    stateCode: "MP",
    district: "Khandwa",
    lat: 22.2451,
    lng: 76.1508,
    category: "advaita_heritage",
    significance:
      "Where Adi Shankaracharya met his guru Govindapada. Home of the Statue of Oneness and the Ekatma Dham project.",
    dayOffset: 68,
    image: "/places/omkareshwar.jpg",
  },
  {
    name: "Ujjain (Mahakaleshwar)",
    stateCode: "MP",
    district: "Ujjain",
    lat: 23.1793,
    lng: 75.7849,
    category: "religious",
    significance: "Jyotirlinga and one of the four Kumbh Mela cities.",
    dayOffset: 73,
    image: "/places/ujjain.jpg",
  },
  {
    name: "Puri",
    stateCode: "OD",
    district: "Puri",
    lat: 19.8135,
    lng: 85.8312,
    category: "advaita_heritage",
    significance:
      "Govardhana Peetham, the eastern Amnaya Peetham established by Adi Shankaracharya.",
    dayOffset: 84,
    image: "/places/puri.jpg",
  },
  {
    name: "Varanasi (Kashi)",
    stateCode: "UP",
    district: "Varanasi",
    lat: 25.3176,
    lng: 82.9739,
    category: "crowd_gathering",
    significance:
      "Where Adi Shankaracharya composed and debated; the enduring centre of Sanatana learning.",
    dayOffset: 95,
    image: "/places/varanasi.png",
  },
  {
    name: "Prayagraj",
    stateCode: "UP",
    district: "Allahabad (Prayagraj)",
    lat: 25.4358,
    lng: 81.8463,
    category: "crowd_gathering",
    significance: "The Triveni Sangam, where the Ganga, Yamuna and Saraswati meet.",
    dayOffset: 100,
    image: "/places/prayagraj.jpg",
  },
  {
    name: "Haridwar",
    stateCode: "UK",
    district: "Haridwar",
    lat: 29.9457,
    lng: 78.1642,
    category: "religious",
    significance: "Where the Ganga enters the plains; gateway to the Himalayan seats.",
    dayOffset: 108,
    image: "/places/haridwar.webp",
  },
  {
    name: "Rishikesh",
    stateCode: "UK",
    district: "Dehradun",
    lat: 30.0869,
    lng: 78.2676,
    category: "educational",
    significance: "A living centre of Vedanta study and monastic institutions.",
    dayOffset: 112,
    image: "/places/rishikesh.jpeg",
  },
  {
    name: "Joshimath",
    stateCode: "UK",
    district: "Chamoli",
    lat: 30.5548,
    lng: 79.5645,
    category: "advaita_heritage",
    significance:
      "Jyotirmath, the northern Amnaya Peetham established by Adi Shankaracharya.",
    dayOffset: 116,
    image: "/places/joshimath.jpg",
  },
  {
    name: "Badrinath",
    stateCode: "UK",
    district: "Chamoli",
    lat: 30.7433,
    lng: 79.4938,
    category: "religious",
    significance:
      "Char Dham shrine, re-established by Adi Shankaracharya in the Himalaya.",
    dayOffset: 118,
    image: "/places/badrinath.jpg",
  },
  {
    name: "Kedarnath",
    stateCode: "UK",
    district: "Rudraprayag",
    lat: 30.7346,
    lng: 79.0669,
    category: "advaita_heritage",
    significance:
      "The Jyotirlinga where Adi Shankaracharya's journey concluded. The Yatra culminates here.",
    dayOffset: 121,
    image: "/places/kedarnath.avif",
  },
];
