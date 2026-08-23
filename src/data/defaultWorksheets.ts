import { Worksheet } from "../types";

/**
 * ============================================================
 * LOCAL FALLBACK DATA (RULE 30)
 * ============================================================
 * All grade values MUST use valid class identifier strings:
 * - Primary INTER: "1 INTER", "2 INTER", "3 INTER", "4 INTER", "5 INTER", "6 INTER"
 * - Primary MQ:    "1 MQ", "2 MQ", "3 MQ", "4 MQ", "5 MQ"
 * - Secondary AE:  "7 AE", "8 AE", "9 AE", "10 AE", "11 AE", "12 AE"
 * - Secondary MQ:  "7 MQ", "8 MQ", "9 MQ", "10 MQ", "11 MQ", "12 MQ"
 *
 * Bare numbers (e.g. 1, 2, 3) are mapped to their respective program
 * (1-6 -> "X INTER", 7-12 -> "X AE") by normalizeLegacyGrade.
 * ============================================================
 */
export function normalizeLegacyGrade(rawGrade: string | number | undefined | null): string {
  if (rawGrade === null || rawGrade === undefined) return "1 INTER";
  const str = String(rawGrade).trim();
  if (/^[1-6]$/.test(str)) {
    return `${str} INTER`; // Map legacy bare primary number to INTER
  }
  if (/^(7|8|9|10|11|12)$/.test(str)) {
    return `${str} AE`; // Map legacy bare secondary number to AE
  }
  return str || "1 INTER";
}

export const defaultWorksheets: Worksheet[] = [
  // === Primary INTER (1 INTER - 6 INTER) ===
  {
    id: "M1I-0001",
    grade: "1 INTER",
    subject: "Math",
    chapter: "Chapter 1: Numbers 1 to 10",
    topic: "Counting Objects & Number Names",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_grade1_number_count_pdf"
  },
  {
    id: "M1I-0002",
    grade: "1 INTER",
    subject: "Math",
    chapter: "Chapter 1: Numbers 1 to 10",
    topic: "Comparing Numbers (Greater & Smaller)",
    type: "Quizizz",
    link: "https://wayground.com/join?gc=10293847"
  },
  {
    id: "E1I-0001",
    grade: "1 INTER",
    subject: "English",
    chapter: "Chapter 1: Phonics & Alphabet",
    topic: "Letter Sounds A-Z",
    type: "Learning Material",
    link: "https://drive.google.com/open?id=1mock_english1_phonics"
  },
  {
    id: "S2I-0001",
    grade: "2 INTER",
    subject: "Science",
    chapter: "Chapter 2: Living Things & Habitats",
    topic: "Animal Homes and Environments",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_science2_habitats"
  },
  {
    id: "M2I-0001",
    grade: "2 INTER",
    subject: "Math",
    chapter: "Chapter 13: Time & Calendar",
    topic: "Reading Clock to Half Hour & Word Problems",
    type: "PDF",
    link: "https://drive.google.com/open?id=1M4WGpze7yNa4FoKV9pULsp8PexVGLDJ"
  },
  {
    id: "M3I-0001",
    grade: "3 INTER",
    subject: "Math",
    chapter: "Chapter 1: Numbers to 10,000",
    topic: "Place Value & Expanded Form",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_grade3_placevalue_pdf"
  },
  {
    id: "M3I-0002",
    grade: "3 INTER",
    subject: "Math",
    chapter: "Chapter 1: Numbers to 10,000",
    topic: "Rounding to Nearest 10 and 100",
    type: "Quizizz",
    link: "https://wayground.com/join?gc=38475620"
  },
  {
    id: "M3I-0003",
    grade: "3 INTER",
    subject: "Math",
    chapter: "Chapter 2: Addition & Subtraction with Regrouping",
    topic: "3-Digit Addition with Regrouping",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_grade3_addition_pdf"
  },
  {
    id: "E3I-0001",
    grade: "3 INTER",
    subject: "English",
    chapter: "Chapter 1: Grammar Foundations",
    topic: "Simple Present & Daily Routines",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_english3_grammar"
  },
  {
    id: "S3I-0001",
    grade: "3 INTER",
    subject: "Science",
    chapter: "Chapter 1: Plant Biology",
    topic: "Parts of Plants & Photosynthesis Basics",
    type: "Learning Material",
    link: "https://drive.google.com/open?id=1mock_science3_plants"
  },
  {
    id: "M4I-0001",
    grade: "4 INTER",
    subject: "Math",
    chapter: "Chapter 3: Fractions & Decimals",
    topic: "Equivalent Fractions & Simplification",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_grade4_fractions"
  },
  {
    id: "S4I-0001",
    grade: "4 INTER",
    subject: "Science",
    chapter: "Chapter 2: Energy & Forces",
    topic: "Kinetic and Potential Energy",
    type: "Quizizz",
    link: "https://wayground.com/join?gc=44928172"
  },
  {
    id: "M5I-0001",
    grade: "5 INTER",
    subject: "Math",
    chapter: "Chapter 4: Geometry & Angles",
    topic: "Finding Unknown Angles in Triangles",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_grade5_angles"
  },
  {
    id: "M6I-0001",
    grade: "6 INTER",
    subject: "Math",
    chapter: "Chapter 2: Algebra & Equations",
    topic: "Linear Equations with One Variable",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_grade6_algebra"
  },
  {
    id: "M6I-0002",
    grade: "6 INTER",
    subject: "Math",
    chapter: "Chapter 5: Ratio, Proportion & Percentage",
    topic: "Solving Multi-Step Word Problems",
    type: "Quizizz",
    link: "https://wayground.com/join?gc=66019284"
  },

  // === Primary MQ (1 MQ - 6 MQ) ===
  {
    id: "Q1M-0001",
    grade: "1 MQ",
    subject: "Al-Qur'an",
    chapter: "Bab 1: Huruf Hijaiyah & Makharijul Huruf",
    topic: "Makhraj Huruf Halqiyah & Lisaniyah",
    type: "Learning Material",
    link: "https://drive.google.com/open?id=1mock_quran1_makhraj"
  },
  {
    id: "A1M-0001",
    grade: "1 MQ",
    subject: "Arabic",
    chapter: "Bab 1: Al-Hiwar wal Mufradat",
    topic: "At-Ta'aruf (Perkenalan Diri)",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_arabic1_taaruf"
  },
  {
    id: "M1C-0001",
    grade: "1 Inter - 1 MQ",
    subject: "Math",
    chapter: "Chapter 2: Shapes & Patterns",
    topic: "Basic 2D Shapes & Repeating Patterns",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_grade1_inter_mq_math"
  },
  {
    id: "Q2M-0001",
    grade: "2 MQ",
    subject: "Al-Qur'an",
    chapter: "Bab 2: Hukum Nun Sukun & Tanwin",
    topic: "Idzhar Halqi dan Idgham Bighunnah",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_quran2_tajwid"
  },
  {
    id: "Q3M-0001",
    grade: "3 MQ",
    subject: "Al-Qur'an",
    chapter: "Bab 3: Tahfidz Juz 29 & 30",
    topic: "Mutasyabihat Surat Al-Mulk s.d. Al-Insan",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_quran3_tahfidz"
  },
  {
    id: "A3M-0001",
    grade: "3 MQ",
    subject: "Arabic",
    chapter: "Bab 2: Tarkib Lughawi",
    topic: "Dhamir Munfashil & Muttashil",
    type: "Quizizz",
    link: "https://wayground.com/join?gc=30019281"
  },
  {
    id: "I4M-0001",
    grade: "4 MQ",
    subject: "Islamic Studies",
    chapter: "Bab 1: Fiqih Ibadah",
    topic: "Thaharah: Wudhu, Tayammum, dan Mandi Wajib",
    type: "Learning Material",
    link: "https://drive.google.com/open?id=1mock_fiqih4_thaharah"
  },
  {
    id: "Q5M-0001",
    grade: "5 MQ",
    subject: "Al-Qur'an",
    chapter: "Bab 4: Hukum Mad Far'i",
    topic: "Mad Wajib Muttashil & Mad Jaiz Munfashil",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_quran5_mad"
  },
  {
    id: "Q6M-0001",
    grade: "6 MQ",
    subject: "Al-Qur'an",
    chapter: "Bab 1: Tahfidz & Muroja'ah Juz 28",
    topic: "Surat Al-Jumu'ah s.d. At-Tahrim",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_mq6_quran"
  },
  {
    id: "M6C-0001",
    grade: "6 Inter - 6 MQ",
    subject: "Math",
    chapter: "Chapter 4: Data Handling & Statistics",
    topic: "Mean, Median, Mode & Bar Graphs",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_grade6_inter_mq_math"
  },
  {
    id: "E6C-0001",
    grade: "6 Inter - 6 MQ",
    subject: "English",
    chapter: "Chapter 3: Report Text Writing",
    topic: "Scientific Fact Presentation & Vocabulary",
    type: "Learning Material",
    link: "https://drive.google.com/open?id=1mock_grade6_inter_mq_english"
  },

  // === Secondary AE (7 AE - 12 AE) ===
  {
    id: "M7A-0001",
    grade: "7 AE",
    subject: "Math",
    chapter: "Chapter 1: Integers & Rational Numbers",
    topic: "Operations with Negative Integers",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_ae7_math_integers"
  },
  {
    id: "A7C-0001",
    grade: "7 AE - 7 MQ",
    subject: "Arabic",
    chapter: "Bab 2: Jumlah Ismiyyah wa Fi'liyyah",
    topic: "Mubtada' & Khabar Lanjutan",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_grade7_ae_mq_arabic"
  },
  {
    id: "A7A-0001",
    grade: "7 AE",
    subject: "Arabic",
    chapter: "Bab 1: Nahwu Dasar",
    topic: "Al-Isim, Al-Fi'il, dan Al-Harf",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_ae7_arabic_nahwu"
  },
  {
    id: "S8A-0001",
    grade: "8 AE",
    subject: "Science",
    chapter: "Chapter 3: Human Digestive System",
    topic: "Enzymatic Digestion and Nutrient Absorption",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_ae8_science_digestive"
  },
  {
    id: "E9A-0001",
    grade: "9 AE",
    subject: "English",
    chapter: "Chapter 2: Analytical Exposition",
    topic: "Structure & Language Features of Expository Texts",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_ae9_english_expo"
  },
  {
    id: "P10A-0001",
    grade: "10 AE",
    subject: "Physics",
    chapter: "Chapter 2: Kinematics in One Dimension",
    topic: "Uniformly Accelerated Linear Motion (GLBB)",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_ae10_physics_glbb"
  },
  {
    id: "I10C-0001",
    grade: "10 AE - 10 MQ",
    subject: "Islamic Studies",
    chapter: "Bab 3: Muamalah Maliyyah",
    topic: "Prinsip Akad Jual Beli & Larangan Riba",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_grade10_ae_mq_muamalah"
  },
  {
    id: "C11A-0001",
    grade: "11 AE",
    subject: "Chemistry",
    chapter: "Chapter 3: Thermochemistry & Enthalpy",
    topic: "Hess's Law & Calorimetry Calculations",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_ae11_chem_thermo"
  },
  {
    id: "B12A-0001",
    grade: "12 AE",
    subject: "Biology",
    chapter: "Chapter 1: Genetics & Heredity",
    topic: "Mendelian Inheritance & Dihybrid Cross",
    type: "Quizizz",
    link: "https://wayground.com/join?gc=12009384"
  },

  // === Secondary MQ (7 MQ - 12 MQ) ===
  {
    id: "Q7M-0001",
    grade: "7 MQ",
    subject: "Al-Qur'an",
    chapter: "Bab 1: Kaidah Tajwid Lanjutan",
    topic: "Gharib Musyaddadah & Saktah",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_mq7_quran"
  },
  {
    id: "Q8M-0001",
    grade: "8 MQ",
    subject: "Al-Qur'an",
    chapter: "Bab 2: Tajwidul Qur'an",
    topic: "Hukum Mad Lazim Kilmi & Harfi",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_mq8_madlazim"
  },
  {
    id: "A9M-0001",
    grade: "9 MQ",
    subject: "Arabic",
    chapter: "Bab 3: Sharaf & Tashrif Lughawi",
    topic: "Fi'il Tsulatsi Mujarrad & Mazid",
    type: "Learning Material",
    link: "https://drive.google.com/open?id=1mock_mq9_sharaf"
  },
  {
    id: "I10M-0001",
    grade: "10 MQ",
    subject: "Islamic Studies",
    chapter: "Bab 2: Ushul Fiqih",
    topic: "Al-Ahkam Asy-Syar'iyyah: Wajib, Sunnah, Haram, Makruh, Mubah",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_mq10_ushulfiqih"
  },
  {
    id: "Q11M-0001",
    grade: "11 MQ",
    subject: "Al-Qur'an",
    chapter: "Bab 4: Ulumul Qur'an",
    topic: "Asbabun Nuzul & Makkiyah-Madaniyah",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_mq11_ulumulquran"
  },
  {
    id: "Q12M-0001",
    grade: "12 MQ",
    subject: "Al-Qur'an",
    chapter: "Bab 5: Sanad & Qira'at",
    topic: "Pengenalan Riwayat Hafsh 'an 'Ashim Thariq Asy-Syathibiyyah",
    type: "PDF",
    link: "https://drive.google.com/open?id=1mock_mq12_qiraat"
  }
];
