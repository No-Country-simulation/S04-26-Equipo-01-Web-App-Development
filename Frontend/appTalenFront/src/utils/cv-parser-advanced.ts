export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  details?: string;
  status?: 'completed' | 'in-progress';
}

export interface ParsedCvDataAdvanced {
  profile: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    title?: string;
    professionalSummary: string;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    [key: string]: string | undefined;
  };
  experience: Experience[];
  education: Education[];
  skills: {
    technical: string[];
    personal: string[];
  };
}

const TECH_SKILLS = [
  '.net core',
  '.net',
  'c#',
  'csharp',
  'web api',
  'sql server',
  'entity framework',
  'react',
  'react js',
  'mui',
  'solid',
  'clean code',
  'visual basic',
  'sap',
  'erp',
  'mvc',
  'api',
  'javascript',
  'typescript',
  'node.js',
  'express',
  'html',
  'css',
  'scrum',
  'git',
  'github',
  'docker',
  'sql',
  'postgresql',
  'mysql',
];

const PERSONAL_SKILLS = [
  'liderazgo',
  'comunicación',
  'precisión técnica',
  'transformación de procesos',
  'consultoría',
  'adaptabilidad',
  'trabajo en equipo',
  'resolución de problemas',
  'gestión de proyectos',
  'pensamiento analítico',
];

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const compactText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const cleanField = (value: string): string =>
  value
    .replace(/\s+/g, ' ')
    .replace(/[•●]+/g, '')
    .trim();

const sanitizeCompany = (value: string): string => {
  let cleaned = cleanField(value)
    .replace(/^(EXPERIENCIA\s+PROFESIONAL\s+|EXPERIENCIA\s+)/i, '')
    .replace(/^Deivison\s+Jimenez\s*/i, '')
    .replace(/^(?:[A-Z]{2,8}\s+){1,3}(?=[A-ZÁÉÍÓÚÑ][a-záéíóúñ])/u, '')
    .replace(/\s+R&D$/i, '')
    .trim();

  if (/\b(conexion|react|aws|core|clean|stack)\b/i.test(cleaned) || cleaned.split(/\s+/).length > 5) {
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    const suffix: string[] = [];

    for (let i = tokens.length - 1; i >= 0; i--) {
      const token = tokens[i].replace(/[,.;]+$/, '');
      if (/^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.'()\-]*$/u.test(token)) {
        suffix.unshift(tokens[i]);
        if (suffix.length >= 3) {
          break;
        }
      } else if (suffix.length > 0) {
        break;
      }
    }

    if (suffix.length > 0) {
      cleaned = suffix.join(' ').replace(/^[A-Z]{2,6}\s+(?=[A-ZÁÉÍÓÚÑ][a-záéíóúñ])/u, '').trim();
    }
  }

  return cleaned;
};

const SPANISH_MONTHS =
  'Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre';

const EXPERIENCE_ROLE_PATTERN =
  '(?:R&D\\s+Senior\\s+Engineer|Senior\\s+Full\\s+Stack\\s+Engineer|Programador\\s+full\\s+stack|Desarrollador\\s+Mid\\s+Junior|Desarrollador\\s+Backend|Analista\\s+Funcional\\s+II|Consultor\\s+IT|Engineer|Developer|Desarrollador|Programador|Analista|Consultor)';

const extractName = (text: string): string => {
  const compact = compactText(text);
  const head = compact.slice(0, 240);
  const blockedTerms = ['venezuela', 'caracas', 'gmt', 'telefono', 'email', 'developer', 'engineer', 'programador', 'desarrollador'];

  // Formato: "Apellido, Nombre"
  const commaName = head.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,})(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,})?,\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,})?)\b/u);
  if (commaName) {
    const candidate = cleanField(`${commaName[2]} ${commaName[1]}`);
    const normalizedCandidate = normalize(candidate);
    if (!blockedTerms.some((term) => normalizedCandidate.includes(term))) {
      return candidate;
    }
  }

  // Formato: "Nombre Apellido" al inicio del CV
  const directName = head.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,})\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,})\b/u);
  if (directName) {
    const candidate = cleanField(directName[0]);
    const normalizedCandidate = normalize(candidate);
    if (!blockedTerms.some((term) => normalizedCandidate.includes(term))) {
      return candidate;
    }
  }

  return '';
};

const extractTitle = (text: string): string => {
  const compact = compactText(text);
  const titleMatch = compact.match(
    /(Senior[^|@]{0,120}(Engineer|Developer|Architect|Manager|Analyst|Specialist)|[A-Za-z\s/&.-]{3,100}(Engineer|Developer|Architect|Manager|Analyst|Specialist))/i,
  );
  if (titleMatch) {
    return cleanField(titleMatch[0]);
  }
  return '';
};

const extractEmail = (text: string): string => {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
};

const extractPhone = (text: string): string => {
  const match = text.match(/\(\+\d{1,3}\)\s*\d{8,12}|\+\d{1,3}\s*\d{8,12}|\b0\d{10}\b/);
  return match ? match[0] : '';
};

const extractLocation = (text: string): string => {
  const locationMatch = text.match(/([A-Z][a-zá]+),\s*([A-Z][a-zá]+)\s*\(/);
  if (locationMatch) {
    return `${locationMatch[1]}, ${locationMatch[2]}`;
  }
  return '';
};

const extractSocialLinks = (
  text: string,
): { linkedin?: string; github?: string; twitter?: string; [key: string]: string | undefined } | undefined => {
  const links: { linkedin?: string; github?: string; twitter?: string; [key: string]: string | undefined } = {};

  // Une casos como "deivison- jimenez" para recuperar URLs completas.
  const urlReadyText = text.replace(/-\s+/g, '-');

  const linkedinMatch = urlReadyText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_/]+/i);
  if (linkedinMatch) {
    links.linkedin = linkedinMatch[0];
  }

  const githubMatch = urlReadyText.match(/https?:\/\/github\.com\/[A-Za-z0-9\-_/]+/i);
  if (githubMatch) {
    links.github = githubMatch[0];
  }

  const twitterMatch = urlReadyText.match(/https?:\/\/twitter\.com\/[A-Za-z0-9_]+/i);
  if (twitterMatch) {
    links.twitter = twitterMatch[0];
  }

  return Object.keys(links).length > 0 ? links : undefined;
};

const extractProfessionalSummary = (text: string): string => {
  const compact = compactText(text);
  const summaryMatch = compact.match(/(Ingeniero\s+de\s+Software[\s\S]*?)(?=EXPERIENCIA\s+PROFESIONAL|EDUCACIÓN|EDUCATION|$)/i);
  if (!summaryMatch) {
    return '';
  }
  return cleanField(summaryMatch[1]);
};

const extractExperiences = (text: string): Experience[] => {
  const sectionMatch = text.match(/EXPERIENCIA(?:\s+PROFESIONAL)?([\s\S]*?)(?:EDUCACIÓN|EDUCATION|HABILIDADES|$)/i);
  const source = sectionMatch?.[1] ?? text;
  const compact = compactText(source);
  const lines = source
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const roleKeywords = new RegExp(EXPERIENCE_ROLE_PATTERN, 'i');

  const lineDateRegex = new RegExp(
    `^(.+?)\\s+(${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})\\s*[–-]\\s*(Actualidad|Present|${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})?$`,
    'i',
  );

  const lineBasedExperiences: Experience[] = [];

  for (let i = 0; i < lines.length; i++) {
    const normalizedLine = lines[i].replace(/^EXPERIENCIA\s+PROFESIONAL\s*/i, '').replace(/^EXPERIENCIA\s*/i, '').trim();
    const match = normalizedLine.match(lineDateRegex);
    if (!match) {
      continue;
    }

    const prefix = cleanField(match[1]);
    const roleMatch = prefix.match(roleKeywords);
    if (!roleMatch || roleMatch.index === undefined) {
      continue;
    }

    const company = cleanField(prefix.slice(0, roleMatch.index).replace(/[—-]$/, ''));
    const position = cleanField(prefix.slice(roleMatch.index));
    if (!company || !position) {
      continue;
    }

    const startDate = `${match[2]} ${match[3]}`;
    const endDate = match[5] ? `${match[4]} ${match[5]}` : match[4];

    const highlights: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const candidate = lines[j].trim();
      if (lineDateRegex.test(candidate)) {
        break;
      }
      if (/^[•●\-]/.test(candidate)) {
        const cleaned = cleanField(candidate.replace(/^[•●\-\s]+/, ''));
        if (cleaned.length > 8) {
          highlights.push(cleaned);
        }
      }
    }

    lineBasedExperiences.push({
      company,
      position,
      startDate,
      endDate: cleanField(endDate || startDate),
      description: highlights.join(' '),
      highlights: highlights.length > 0 ? highlights : undefined,
    });
  }

  const headerWithPipeRegex = new RegExp(
    `([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.,'()\\-\\s]{2,80}?)\\s*\\|\\s*([A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.,'()\\-/\\s]{2,90}?)\\s+(${SPANISH_MONTHS})\\s+(\\d{4})\\s*[–-]\\s*(Actualidad|Present|${SPANISH_MONTHS})\\s*(\\d{4})?`,
    'gi',
  );

  const headerWithoutPipeRegex = new RegExp(
    `([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.,'()\\-]{1,}(?:\\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.,'()\\-]{1,}){0,4})\\s*,?\\s+(${EXPERIENCE_ROLE_PATTERN}(?:\\s+[A-Za-zÁÉÍÓÚÑáéíóúñ0-9/&.\\-]+){0,4})\\s*[—-]?\\s*(${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})\\s*[–-]\\s*(Actualidad|Present|${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})?`,
    'gi',
  );

  const matches = Array.from(compact.matchAll(headerWithPipeRegex));
  const fallbackMatches = matches.length === 0 ? Array.from(compact.matchAll(headerWithoutPipeRegex)) : [];
  const allMatches = matches.length > 0 ? matches : fallbackMatches;

  const compactExperiences = allMatches.map((match, index) => {
    const currentStart = match.index ?? 0;
    const currentEnd = currentStart + match[0].length;
    const nextStart = index + 1 < allMatches.length ? (allMatches[index + 1].index ?? compact.length) : compact.length;
    const detailBlock = compact.slice(currentEnd, nextStart);

    const bulletMatches = Array.from(detailBlock.matchAll(/[•●\-]\s*([^•●]+)/g));
    const highlights = bulletMatches
      .map((b) => cleanField(b[1]))
      .filter((item) => item.length > 8);

    const startDate = `${match[3]} ${match[4]}`;
    const endDate = match[6] ? `${match[5]} ${match[6]}` : match[5];

    let cleanedCompany = sanitizeCompany(match[1]);

    if (allMatches === fallbackMatches) {
      cleanedCompany = sanitizeCompany(cleanedCompany);
    }

    return {
      company: cleanedCompany,
      position: cleanField(match[2]),
      startDate,
      endDate: cleanField(endDate || startDate),
      description: highlights.join(' '),
      highlights: highlights.length > 0 ? highlights : undefined,
    };
  });

  // Fallback robusto: anclaje por "cargo + rango de fechas" y búsqueda de empresa en el contexto anterior.
  const roleDateRegex = new RegExp(
    `(${EXPERIENCE_ROLE_PATTERN})\\s*[—-]?\\s*(${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})\\s*[–-]\\s*(Actualidad|Present|${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})?`,
    'gi',
  );

  const anchoredRoleExperiences: Experience[] = [];
  const roleDateMatches = Array.from(compact.matchAll(roleDateRegex));

  roleDateMatches.forEach((match, index) => {
    const matchStart = match.index ?? 0;
    const currentEnd = matchStart + match[0].length;
    const nextStart =
      index + 1 < roleDateMatches.length ? (roleDateMatches[index + 1].index ?? compact.length) : compact.length;

    const contextBefore = compact.slice(Math.max(0, matchStart - 120), matchStart);
    const companyTailMatch = contextBefore.match(
      /([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.'()\-]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.'()\-]+){0,4})\s*(?:\||,)?\s*$/u,
    );

    const rawCompany = companyTailMatch?.[1] ?? '';
    const company = sanitizeCompany(rawCompany);
    const position = cleanField(match[1]);
    const startDate = `${match[2]} ${match[3]}`;
    const endDate = match[5] ? `${match[4]} ${match[5]}` : match[4];

    const detailBlock = compact.slice(currentEnd, nextStart);
    const bulletMatches = Array.from(detailBlock.matchAll(/[•●\-]\s*([^•●]+)/g));
    const highlights = bulletMatches
      .map((b) => cleanField(b[1]))
      .filter((item) => item.length > 8);

    if (!company || !position) {
      return;
    }

    anchoredRoleExperiences.push({
      company,
      position,
      startDate,
      endDate: cleanField(endDate || startDate),
      description: highlights.join(' '),
      highlights: highlights.length > 0 ? highlights : undefined,
    });
  });

  const merged = [...lineBasedExperiences, ...compactExperiences, ...anchoredRoleExperiences].filter(
    (item) => item.company && item.position && item.startDate,
  );

  if (merged.length === 0) {
    return [];
  }

  const bestByKey = new Map<string, Experience>();

  merged.forEach((item) => {
    const key = `${normalize(item.startDate)}|${normalize(item.position)}`;
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, item);
      return;
    }

    const score = (item.highlights?.length ?? 0) * 10 - item.company.length;
    const existingScore = (existing.highlights?.length ?? 0) * 10 - existing.company.length;
    if (score > existingScore) {
      bestByKey.set(key, item);
    }
  });

  return Array.from(bestByKey.values());
};

const extractEducation = (text: string): Education[] => {
  const education: Education[] = [];

  const compact = compactText(text);
  const educationSection =
    compact.match(/(EDUCACIÓN(?:\s+Y\s+HABILIDADES)?|EDUCATION)([\s\S]*?)(?:STACK|EXPERIENCIA|$)/i)?.[2] ?? compact;

  if (/TSU\s+en\s+Inform[aá]tica/i.test(educationSection)) {
    const institution = educationSection.match(/IUT\s+Tomas\s+Lander/i)?.[0] ?? 'IUT Tomas Lander';
    const details = educationSection.match(/Menci[oó]n\s+Honor[ií]fica[^.]*\./i)?.[0];
    education.push({
      institution,
      degree: 'TSU en Informática',
      details: details ? cleanField(details) : undefined,
      status: 'completed',
    });
  }

  const engineeringMatch = educationSection.match(
    /Ingenier[ií]a\s+de\s+([A-Za-zÁÉÍÓÚÑáéíóúñ\s]+):?\s*([^().]+)?\s*(\(En\s+curso\))?/i,
  );
  if (engineeringMatch) {
    education.push({
      institution: cleanField(engineeringMatch[2] || 'No especificada'),
      degree: `Ingeniería de ${cleanField(engineeringMatch[1])}`,
      status: engineeringMatch[3] ? 'in-progress' : 'completed',
    });
  }

  if (/Instituto\s+Universitario\s+de\s+Tecnolog[ií]a\s+Tomas\s+Lander/i.test(educationSection)) {
    education.push({
      institution: 'Instituto Universitario de Tecnologia Tomas Lander',
      degree: 'TSU en Informatica',
      status: 'completed',
    });
  }

  const ubaMatch = educationSection.match(/Universidad\s+Bicentenaria\s+de\s+Aragua[\s\S]*?Ingenier[ií]a\s+de\s+sistemas[\s\S]*?(?:no\s+concluida|en\s+curso|\.)/i);
  if (ubaMatch) {
    education.push({
      institution: 'Universidad Bicentenaria de Aragua',
      degree: 'Ingenieria de sistemas',
      status: /no\s+concluida|en\s+curso/i.test(ubaMatch[0]) ? 'in-progress' : 'completed',
    });
  }

  const uniqueEducation = education.filter(
    (item, index, array) =>
      index ===
      array.findIndex(
        (other) =>
          normalize(other.institution) === normalize(item.institution) &&
          normalize(other.degree) === normalize(item.degree),
      ),
  );

  return uniqueEducation;
};

const extractSkills = (text: string): { technical: string[]; personal: string[] } => {
  const normalizedText = normalize(text);

  const technicalSkills = TECH_SKILLS.filter((skill) => normalizedText.includes(normalize(skill)));
  const personalSkills = PERSONAL_SKILLS.filter((skill) => normalizedText.includes(normalize(skill)));

  const uniqueTechnical = [...new Set(technicalSkills)];
  const uniquePersonal = [...new Set(personalSkills)];

  return {
    technical: uniqueTechnical,
    personal: uniquePersonal,
  };
};

export const parseAdvancedCv = (text: string): ParsedCvDataAdvanced => {
  const fullName = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const location = extractLocation(text);
  const titleCandidate = extractTitle(text);
  const title = fullName && titleCandidate.toLowerCase().startsWith(fullName.toLowerCase())
    ? titleCandidate.slice(fullName.length).trim().replace(/^[|\-:,\s]+/, '')
    : titleCandidate;
  const professionalSummary = extractProfessionalSummary(text);
  const socialLinks = extractSocialLinks(text);
  const experience = extractExperiences(text);
  const education = extractEducation(text);
  const skills = extractSkills(text);

  return {
    profile: {
      fullName,
      email,
      phone,
      location,
      title,
      professionalSummary,
    },
    socialLinks,
    experience,
    education,
    skills,
  };
};
