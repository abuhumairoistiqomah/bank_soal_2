/**
 * Types for NEO ILMA Learning Resource Bank
 */

export * from "./utils/classConfig";

export interface Worksheet {
  id: string;
  grade: string; // Kelas: e.g. "1 INTER" - "6 INTER", "1 MQ" - "6 MQ", "7 AE" - "12 AE", "7 MQ" - "12 MQ", "6 Inter - 6 MQ", etc.
  subject: string; // Mata Pelajaran (Dynamic from data)
  chapter: string; // Bab (Dynamic from data)
  topic: string; // Sub-Bab / Topik (Dynamic from data)
  type: string; // Jenis File (PDF, Quizizz, Learning Material, etc. Dynamic from data)
  link: string; // Resource URL
  uploader?: string;
  targetClasses?: string[];
}

export interface GASConfig {
  sheetUrl: string;
  isConfigured: boolean;
}

