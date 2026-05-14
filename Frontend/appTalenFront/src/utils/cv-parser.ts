export interface ParsedCvData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  professionalSummary: string;
  experience: string;
  education: string;
  certifications: string[];
  languages: string[];
  technicalSkills: string[];
  personalSkills: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    [key: string]: string | undefined;
  };
}

const TECH_SKILL_DICTIONARY = [
  'javascript',
  'typescript',
  'react',
  'node.js',
  'node',
  'express',
  'nestjs',
  'angular',
  'vue',
  'html',
  'css',
  'sass',
  'tailwind',
  'mui',
  'material ui',
  'mysql',
  'postgresql',
  'mongodb',
  'sql',
  'firebase',
  'aws',
  'azure',
  'docker',
  'kubernetes',
  'git',
  'github',
  'gitlab',
  'rest',
  'graphql',
  'python',
  'java',
  'c#',
  'csharp',
  '.net',
  '.net core',
  'php',
  'figma',
  'linux',
  'jest',
  'cypress',
  'playwright',
];

const PERSONAL_SKILL_DICTIONARY = [
  'liderazgo',
  'comunicacion',
  'trabajo en equipo',
  'resolucion de problemas',
  'adaptabilidad',
  'proactividad',
  'creatividad',
  'pensamiento critico',
  'gestion del tiempo',
  'orientacion a resultados',
  'empatia',
  'negociacion',
  'autonomia',
  'colaboracion',
  'responsabilidad',
  'aprendizaje continuo',
];

const SECTION_KEYS = {
  summary: ['perfil', 'resumen', 'sobre mi', 'objetivo profesional', 'acerca de mi', 'profesional'],
  experience: ['experiencia', 'experiencia laboral', 'trayectoria', 'trabajos', 'posiciones', 'cargos', 'empleos', 'historial laboral'],
  education: ['educacion', 'educación', 'formacion academica', 'estudios', 'formacion', 'carrera', 'educación'],
  certifications: ['certificaciones', 'certificacion', 'cursos', 'licencias', 'certificados', 'habilidades', 'skills'],
  languages: ['idiomas', 'lenguas', 'idioma'],
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const toLines = (text: string): string[] =>
  text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const isLikelyPersonName = (line: string): boolean => {
  if (!line || line.length < 5 || line.length > 60 || /[@\d]/.test(line)) {
    return false;
  }

  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) {
    return false;
  }

  return words.every((word) => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]+$/u.test(word));
};

const extractNameFromEmail = (email: string): string => {
  if (!email.includes('@')) {
    return '';
  }

  const local = email.split('@')[0];
  const words = local
    .split(/[._-]/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  return words.length >= 2 ? words.join(' ') : '';
};

const extractInlineSection = (text: string, keys: string[]): string => {
  const allStopKeys = Object.values(SECTION_KEYS).flat();
  const keyPattern = keys.map((key) => escapeRegex(normalize(key))).join('|');
  const stopPattern = allStopKeys.map((key) => escapeRegex(normalize(key))).join('|');
  const normalizedText = normalize(text).replace(/\s+/g, ' ');

  const regex = new RegExp(
    `(?:${keyPattern})\\s*[:\\-]?\\s*(.{30,900}?)(?=(?:${stopPattern})\\s*[:\\-]?|$)`,
    'i',
  );

  const match = normalizedText.match(regex);
  return match?.[1]?.trim() || '';
};

const extractFirstLargeBlock = (text: string, minLength = 100): string => {
  const lines = toLines(text);
  const sections = [];
  let currentBlock = [];

  for (const line of lines) {
    const normalizedLine = normalize(line);
    const isSectionHeader = Object.values(SECTION_KEYS)
      .flat()
      .some((key) => normalizedLine.includes(normalize(key)));

    if (isSectionHeader) {
      if (currentBlock.length > 0) {
        const blockText = currentBlock.join(' ').trim();
        if (blockText.length >= minLength) {
          sections.push(blockText);
        }
        currentBlock = [];
      }
    } else if (line && !line.includes('@') && line.length > 10) {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    const blockText = currentBlock.join(' ').trim();
    if (blockText.length >= minLength) {
      sections.push(blockText);
    }
  }

  return sections[0] || '';
};

const getBestLineMatch = (lines: string[], regex: RegExp): string => {
  for (const line of lines) {
    if (regex.test(line)) {
      return line;
    }
  }

  return '';
};

const extractBySection = (lines: string[], keys: string[], fullText: string, maxLines = 6): string => {
  const normalizedLines = lines.map((line) => normalize(line));
  let startIndex = -1;

  for (let i = 0; i < normalizedLines.length; i += 1) {
    if (keys.some((key) => normalizedLines[i].includes(normalize(key)))) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    return extractInlineSection(fullText, keys);
  }

  const sectionLines: string[] = [];

  const keyPattern = keys.map((key) => escapeRegex(normalize(key))).join('|');
  const inlineStartRegex = new RegExp(`(?:${keyPattern})\\s*[:\\-]\\s*`, 'i');
  const inlineStartContent = lines[startIndex].replace(inlineStartRegex, '').trim();
  if (inlineStartContent && normalize(inlineStartContent) !== normalizedLines[startIndex]) {
    sectionLines.push(inlineStartContent);
  }

  for (let i = startIndex + 1; i < lines.length && sectionLines.length < maxLines; i += 1) {
    const normalizedCurrentLine = normalizedLines[i];
    const looksLikeAnotherSection = Object.values(SECTION_KEYS)
      .flat()
      .some((key) => normalizedCurrentLine.includes(normalize(key)));

    if (looksLikeAnotherSection) {
      break;
    }

    sectionLines.push(lines[i]);
  }

  const block = sectionLines.join(' ').trim();
  if (block) {
    return block;
  }

  return extractInlineSection(fullText, keys);
};

const extractListBySection = (lines: string[], keys: string[], maxLines = 8): string[] => {
  const block = extractBySection(lines, keys, lines.join('\n'), maxLines);
  if (!block) {
    return [];
  }

  return block
    .split(/,|\||;|\u2022|-/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
    .slice(0, 12);
};

const uniq = (values: string[]): string[] => {
  const map = new Map<string, string>();
  values.forEach((value) => {
    const key = normalize(value);
    if (!map.has(key)) {
      map.set(key, value);
    }
  });

  return [...map.values()];
};

export const extractSkillsFromCvText = (text: string): { technicalSkills: string[]; personalSkills: string[] } => {
  const normalizedText = normalize(text);

  const technicalSkills = uniq(
    TECH_SKILL_DICTIONARY.filter((skill) => normalizedText.includes(normalize(skill))),
  );

  const personalSkills = uniq(
    PERSONAL_SKILL_DICTIONARY.filter((skill) => normalizedText.includes(normalize(skill))),
  );

  return {
    technicalSkills,
    personalSkills,
  };
};

const extractSocialLinks = (text: string): { linkedin?: string; github?: string; [key: string]: string | undefined } | undefined => {
  const links: { linkedin?: string; github?: string; [key: string]: string | undefined } = {};

  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) {
    links.linkedin = `https://${linkedinMatch[0]}`;
  }

  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  if (githubMatch) {
    links.github = `https://${githubMatch[0]}`;
  }

  const twitterMatch = text.match(/twitter\.com\/[\w]+|@[\w]+/i);
  if (twitterMatch) {
    links.twitter = twitterMatch[0];
  }

  return Object.keys(links).length > 0 ? links : undefined;
};

export const parseCvText = (text: string): ParsedCvData => {
  const lines = toLines(text);

  const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])[0] || '';

  const phoneMatches = text.match(/\+?\d{1,3}[\s.-]?\(?[\d\s.-]{6,15}\)?/g) || [];
  let phone = phoneMatches[0] || '';
  if (!phone) {
     const phoneMatch = text.match(/[(]?\d{2,4}[)]?[\s.-]?\d{3,4}[\s.-]?\d{4,5}/);
    phone = phoneMatch?.[0] || '';
  }

  let fullName =
    getBestLineMatch(lines.slice(0, 15), /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'\s-]{6,}$/) ||
    lines.slice(0, 15).find((line) => isLikelyPersonName(line)) ||
    '';

  if (!fullName && email) {
    const extracted = extractNameFromEmail(email);
    if (extracted.length > 5) {
      fullName = extracted;
    }
  }

  const location =
    getBestLineMatch(lines, /(colombia|bogota|medellin|cali|barranquilla|remoto|peru|mexico|chile|argentina|ecuador|españa|venezuela|caracas|valencia|maracaibo)/i) ||
    '';

  const titleLine = lines.find(
    (line) =>
      (normalize(line).includes('architect') ||
        normalize(line).includes('developer') ||
        normalize(line).includes('engineer') ||
        normalize(line).includes('manager') ||
        normalize(line).includes('analyst')) &&
      line.length < 80 &&
      !line.includes('@'),
  );

  const cleanedLocation = location
    .replace(/\b(architect|developer|engineer|manager|analyst|lead|senior|junior|sr|jr)\b/gi, '')
    .trim();

  let professionalSummary = extractBySection(lines, SECTION_KEYS.summary, text, 7);

  if (!professionalSummary) {
    professionalSummary = extractFirstLargeBlock(text, 80);
  }

  let experience = extractBySection(lines, SECTION_KEYS.experience, text, 10);
  const education = extractBySection(lines, SECTION_KEYS.education, text, 8);

  if (!professionalSummary && titleLine && experience.includes(titleLine)) {
    experience = experience.replace(titleLine, '').trim();
  }
  const certifications = extractListBySection(lines, SECTION_KEYS.certifications, 7);
  const languages = extractListBySection(lines, SECTION_KEYS.languages, 4);

  const { technicalSkills, personalSkills } = extractSkillsFromCvText(text);
  const socialLinks = extractSocialLinks(text);

  return {
    fullName,
    email,
    phone,
    location: cleanedLocation || location,
    professionalSummary,
    experience,
    education,
    certifications,
    languages,
    technicalSkills,
    personalSkills,
    socialLinks,
  };
};
