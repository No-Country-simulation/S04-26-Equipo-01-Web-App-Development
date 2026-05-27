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
  'desarrollador',
  'developer',
  'programador',
  'full stack',
  'backend',
  'frontend',
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
  'excel avanzado',
  'contabilidad general',
  'contabilidad financiera',
  'contabilidad',
  'auditoria',
  'auditoría',
  'cuentas por pagar',
  'cuentas por cobrar',
  'impuestos',
  'declaraciones tributarias',
  'nomina',
  'nómina',
  'gestion de nomina',
  'gestión de nómina',
  'liquidacion de nomina',
  'liquidación de nómina',
  'seguridad social',
  'prestaciones sociales',
  'sistema red',
  'facturacion',
  'facturación',
  'tesoreria',
  'tesorería',
  'conciliacion bancaria',
  'conciliación bancaria',
  'retenciones',
  'niif',
  'erp profit plus',
  'profit plus',
  'quickbooks',
  'administracion',
  'administración',
  'gestion administrativa',
  'gestión administrativa',
  'auxiliar administrativo',
  'asistencia administrativa',
  'gestion documental',
  'gestión documental',
  'archivo',
  'radicacion',
  'radicación',
  'inventarios',
  'compras',
  'recursos humanos',
  'atencion al cliente',
  'atención al cliente',
  'paquete office',
  'word',
  'powerpoint',
  'agenda',
  'medico',
  'médico',
  'medicina',
  'medicina general',
  'historia clinica',
  'historia clínica',
  'diagnostico medico',
  'diagnóstico médico',
  'urgencias',
  'triaje',
  'triage',
  'consulta externa',
  'consulta médica',
  'signos vitales',
  'procedimientos clinicos',
  'procedimientos clínicos',
  'farmacologia',
  'farmacología',
  'primeros auxilios',
  'enfermeria',
  'enfermería',
  'diagnostico clinico',
  'diagnóstico clínico',
  'mantenimiento preventivo',
  'mantenimiento correctivo',
  'electromecanica',
  'electromecánica',
  'electricidad',
  'instrumentacion',
  'instrumentación',
  'autocad',
  'mecanica',
  'mecánica',
  'mecanica automotriz',
  'mecánica automotriz',
  'diagnostico de fallas',
  'diagnóstico de fallas',
  'mantenimiento mecanico',
  'mantenimiento mecánico',
  'soldadura',
  'metrologia',
  'metrología',
  'logistica militar',
  'logística militar',
  'operaciones militares',
  'seguridad y defensa',
  'cadena de mando',
  'tacticas de patrullaje',
  'tácticas de patrullaje',
  'normativa castrense',
  'community manager',
  'social media manager',
  'content manager',
  'facebook ads',
  'instagram ads',
  'meta business suite',
  'business suite',
  'manychat',
  'canva',
  'inshot',
  'google drive',
  'copywriting',
  'redaccion de contenido',
  'redacción de contenido',
  'planificacion de contenido',
  'planificación de contenido',
  'gestion de redes sociales',
  'gestión de redes sociales',
  'analitica digital',
  'analítica digital',
  'kpis',
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
  'orientacion al detalle',
  'orientación al detalle',
  'responsabilidad',
  'organizacion',
  'organización',
  'empatia',
  'empatía',
  'trabajo bajo presion',
  'trabajo bajo presión',
  'servicio al cliente',
];

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const matchesSkillTerm = (source: string, term: string): boolean => {
  const normalizedSource = normalize(source);
  const normalizedTerm = normalize(term);

  if (!normalizedSource || !normalizedTerm) {
    return false;
  }

  const pattern = escapeRegExp(normalizedTerm).replace(/\s+/g, '\\s+');
  const regex = new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${pattern}(?:$|[^\\p{L}\\p{N}])`,
    'iu',
  );

  return regex.test(normalizedSource);
};

const compactText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const uniqueByNormalized = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = normalize(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(value);
  });

  return result;
};

const cleanField = (value: string): string =>
  value
    .replace(/\s+/g, ' ')
    .replace(/[•●]+/g, '')
    .trim();

const EDUCATION_TEXT_HINTS =
  /\b(diplomatura|tecnicatura|licenciatura|maestria|maestría|posgrado|universidad|universitario|academy|coderhouse|instituto|facultad|curso|certificacion|certificación|bootcamp|seminario)\b/i;

const looksLikeEducationBlock = (company: string, position: string): boolean =>
  EDUCATION_TEXT_HINTS.test(company) || EDUCATION_TEXT_HINTS.test(position);

const collapseSpacedLetters = (value: string): string =>
  value.replace(
    /\b(?:[A-Za-zÁÉÍÓÚÑáéíóúñ]\s+){2,}[A-Za-zÁÉÍÓÚÑáéíóúñ]\b/g,
    (match) => match.replace(/\s+/g, ''),
  );

const splitMeaningfulLines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((line) => cleanField(line))
    .filter((line) => line.length > 0);

const NAME_BLOCKED_TERMS = [
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'business',
  'suite',
  'community',
  'social media',
  'manager',
  'sobre mi',
  'experiencia',
  'curriculum',
  'cv',
];

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
      if (/^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.'()-]*$/u.test(token)) {
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

type CvFormatId = 'STANDARD' | 'TIMELINE_MARKETING';

type CvFormatProfile = {
  id: CvFormatId;
  name: string;
  indicators: string[];
  sectionHeaders: {
    summary: string[];
    experience: string[];
    education: string[];
  };
};

const CV_FORMAT_PROFILES: CvFormatProfile[] = [
  {
    id: 'STANDARD',
    name: 'Formato estandar',
    indicators: [
      'perfil profesional',
      'professional summary',
      'educacion',
      'experiencia profesional',
    ],
    sectionHeaders: {
      summary: ['perfil profesional', 'resumen', 'sobre mi', 'acerca de', 'professional summary'],
      experience: ['experiencia', 'experiencia profesional', 'experience', 'employment'],
      education: ['educacion', 'educación', 'education', 'formacion academica'],
    },
  },
  {
    id: 'TIMELINE_MARKETING',
    name: 'Timeline marketing (dos columnas)',
    indicators: [
      'agencia atipica',
      'community manager',
      'content manager',
      'diplomatura universitaria',
      'rucula digital academy',
      'coderhouse',
      'contacto',
    ],
    sectionHeaders: {
      summary: ['perfil profesional', 'resumen', 'sobre mi', 'acerca de'],
      experience: ['experiencia laboral', 'experiencia', 'experiencia profesional'],
      education: ['educacion', 'educación'],
    },
  },
];

const detectCvFormatProfile = (text: string): CvFormatProfile => {
  const normalizedSource = normalize(text);
  let bestMatch = CV_FORMAT_PROFILES[0];
  let bestScore = 0;

  CV_FORMAT_PROFILES.forEach((profile) => {
    const score = profile.indicators.reduce((acc, indicator) => {
      const normalizedIndicator = normalize(indicator);
      return normalizedSource.includes(normalizedIndicator) ? acc + 1 : acc;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = profile;
    }
  });

  return bestMatch;
};

const extractName = (text: string): string => {
  const compact = compactText(text);
  const head = compact.slice(0, 240);
  const blockedTerms = ['venezuela', 'caracas', 'gmt', 'telefono', 'email', 'developer', 'engineer', 'programador', 'desarrollador'];

  const lines = splitMeaningfulLines(text).slice(0, 12);
  const lineNamePattern = /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ' -]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ' -]{1,}){1,4}$/u;

  const lineCandidate = lines.find((line) => {
    if (line.length < 6 || line.length > 80) {
      return false;
    }
    if (!lineNamePattern.test(line)) {
      return false;
    }
    const normalizedLine = normalize(line);
    if (normalizedLine.includes('@') || /\d/.test(normalizedLine)) {
      return false;
    }

    if (NAME_BLOCKED_TERMS.some((term) => normalizedLine.includes(term))) {
      return false;
    }

    return !blockedTerms.some((term) => normalizedLine.includes(term));
  });

  if (lineCandidate) {
    return lineCandidate;
  }

  const emailMatch = extractEmail(text);
  if (emailMatch) {
    const localPart = emailMatch.split('@')[0] ?? '';
    const derivedParts = localPart
      .split(/[._-]+/)
      .map((part) => part.replace(/\d+/g, '').trim())
      .filter((part) => part.length >= 2)
      .slice(0, 3)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

    if (derivedParts.length >= 2) {
      return cleanField(derivedParts.join(' '));
    }
  }

  // Formato: "Apellido, Nombre"
  const commaName = head.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,})(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,})?,\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,})?)\b/u);
  if (commaName) {
    const candidate = cleanField(`${commaName[2]} ${commaName[1]}`);
    const normalizedCandidate = normalize(candidate);
    if (
      !blockedTerms.some((term) => normalizedCandidate.includes(term)) &&
      !NAME_BLOCKED_TERMS.some((term) => normalizedCandidate.includes(term))
    ) {
      return candidate;
    }
  }

  // Formato: "Nombre Apellido" al inicio del CV
  const directName = head.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,})\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ'-]{1,})\b/u);
  if (directName) {
    const candidate = cleanField(directName[0]);
    const normalizedCandidate = normalize(candidate);
    if (
      !blockedTerms.some((term) => normalizedCandidate.includes(term)) &&
      !NAME_BLOCKED_TERMS.some((term) => normalizedCandidate.includes(term))
    ) {
      return candidate;
    }
  }

  return '';
};

const extractTitle = (text: string): string => {
  const titleLines = splitMeaningfulLines(text).slice(0, 30);
  const lineTitleCandidate = titleLines.find((line) => {
    const normalizedLine = collapseSpacedLetters(line);
    return /\b(Project\s+Manager|Content\s+Manager|Community\s+Manager|Manager|Developer|Engineer|Analyst|Specialist|Consultor|Coordinador)\b/i.test(
      normalizedLine,
    );
  });

  if (lineTitleCandidate) {
    return cleanField(collapseSpacedLetters(lineTitleCandidate));
  }

  const compact = collapseSpacedLetters(compactText(text));
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
  const locationKeywords =
    'bogota|medellin|cali|barranquilla|caracas|quito|lima|santiago|cdmx|mexico|colombia|venezuela|ecuador|peru|chile|argentina|espana|spain|madrid|barcelona|cordoba|córdoba|capital';

  const lines = splitMeaningfulLines(text).slice(0, 20);
  const lineCandidate = lines.find((line) => {
    const normalizedLine = normalize(line);
    if (normalizedLine.includes('@') || /\d{4,}/.test(normalizedLine)) {
      return false;
    }

    return new RegExp(`\\b(${locationKeywords})\\b`, 'i').test(
      normalizedLine,
    );
  });

  if (lineCandidate) {
    return lineCandidate;
  }

  const locationMatch = text.match(/([A-Z][a-zá]+),\s*([A-Z][a-zá]+)\s*\(/);
  if (locationMatch) {
    return `${locationMatch[1]}, ${locationMatch[2]}`;
  }

  const fallbackMatch = compactText(text).match(
    /\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\s*,\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\b/u,
  );

  if (fallbackMatch) {
    const candidate = cleanField(`${fallbackMatch[1]}, ${fallbackMatch[2]}`);
    if (new RegExp(`\\b(${locationKeywords})\\b`, 'i').test(normalize(candidate))) {
      return candidate;
    }
  }

  const singleLocation = normalize(text).match(
    new RegExp(`\\b(${locationKeywords})\\b`, 'i'),
  );
  if (singleLocation?.[1]) {
    return singleLocation[1].charAt(0).toUpperCase() + singleLocation[1].slice(1);
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
  } else {
    const linkedinHandleMatch = urlReadyText.match(/(?:^|\s)(?:linkedin\.com\/)?(in\/[A-Za-z0-9\-_%]+)/i);
    if (linkedinHandleMatch?.[1]) {
      links.linkedin = `https://www.linkedin.com/${linkedinHandleMatch[1]}`;
    }
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

  const dateFirstLineRegex = new RegExp(
    `^[•●oO\\-\\s]*(${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})\\s*[–-]\\s*(Actualidad|Present|${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})?$`,
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

    if (looksLikeEducationBlock(company, position)) {
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
      if (/^[•●-]/.test(candidate)) {
        const cleaned = cleanField(candidate.replace(/^[•●-\s]+/, ''));
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

  const dateFirstExperiences: Experience[] = [];

  for (let i = 0; i < lines.length; i++) {
    const normalizedLine = cleanField(lines[i]).replace(/^[•●oO\-\s]+/, '').trim();
    const dateMatch = normalizedLine.match(dateFirstLineRegex);
    if (!dateMatch) {
      continue;
    }

    const companyLine = cleanField(lines[i + 1] ?? '');
    const positionLine = cleanField(lines[i + 2] ?? '');

    if (!companyLine || !positionLine) {
      continue;
    }

    if (dateFirstLineRegex.test(companyLine) || dateFirstLineRegex.test(positionLine)) {
      continue;
    }

    if (/^(experiencia|experiencia laboral|experiencia profesional)$/i.test(companyLine)) {
      continue;
    }

    const detailLines: string[] = [];
    const highlights: string[] = [];
    let j = i + 3;

    while (j < lines.length) {
      const candidate = cleanField(lines[j]);
      if (!candidate) {
        j += 1;
        continue;
      }

      const candidateNormalized = candidate.replace(/^[•●oO\s-]+/, '').trim();
      if (dateFirstLineRegex.test(candidateNormalized)) {
        break;
      }

      if (/^[•●-]/.test(candidate) || /^o\s+/i.test(candidate)) {
        const cleanedHighlight = cleanField(
          candidate.replace(/^[•●oO\s-]+/, ''),
        );
        if (cleanedHighlight.length > 8) {
          highlights.push(cleanedHighlight);
          detailLines.push(cleanedHighlight);
        }
      } else if (candidate.length > 10) {
        detailLines.push(candidate);
      }

      j += 1;
    }

    const startDate = `${dateMatch[1]} ${dateMatch[2]}`;
    const endDate = dateMatch[4]
      ? `${dateMatch[3]} ${dateMatch[4]}`
      : dateMatch[3];

    dateFirstExperiences.push({
      company: sanitizeCompany(companyLine),
      position: cleanField(positionLine),
      startDate: cleanField(startDate),
      endDate: cleanField(endDate || startDate),
      description: detailLines.join(' ').trim(),
      highlights: highlights.length > 0 ? highlights : undefined,
    });

    const justAdded = dateFirstExperiences[dateFirstExperiences.length - 1];
    if (looksLikeEducationBlock(justAdded.company, justAdded.position)) {
      dateFirstExperiences.pop();
    }

    i = Math.max(i, j - 1);
  }

  const headerWithPipeRegex = new RegExp(
    `([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.,'()\\s-]{2,80}?)\\s*\\|\\s*([A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.,'()/\\s-]{2,90}?)\\s+(${SPANISH_MONTHS})\\s+(\\d{4})\\s*[–-]\\s*(Actualidad|Present|${SPANISH_MONTHS})\\s*(\\d{4})?`,
    'gi',
  );

  const headerWithoutPipeRegex = new RegExp(
    `([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.,'()-]{1,}(?:\\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.,'()-]{1,}){0,4})\\s*,?\\s+(${EXPERIENCE_ROLE_PATTERN}(?:\\s+[A-Za-zÁÉÍÓÚÑáéíóúñ0-9/&.-]+){0,4})\\s*[—-]?\\s*(${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})\\s*[–-]\\s*(Actualidad|Present|${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})?`,
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

    const bulletMatches = Array.from(detailBlock.matchAll(/[•●-]\s*([^•●]+)/g));
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
      /([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.'()-]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ0-9&.'()-]+){0,4})\s*(?:\||,)?\s*$/u,
    );

    const rawCompany = companyTailMatch?.[1] ?? '';
    const company = sanitizeCompany(rawCompany);
    const position = cleanField(match[1]);
    const startDate = `${match[2]} ${match[3]}`;
    const endDate = match[5] ? `${match[4]} ${match[5]}` : match[4];

    const detailBlock = compact.slice(currentEnd, nextStart);
    const bulletMatches = Array.from(detailBlock.matchAll(/[•●-]\s*([^•●]+)/g));
    const highlights = bulletMatches
      .map((b) => cleanField(b[1]))
      .filter((item) => item.length > 8);

    if (!company || !position) {
      return;
    }

    if (looksLikeEducationBlock(company, position)) {
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

  const merged = [
    ...dateFirstExperiences,
    ...lineBasedExperiences,
    ...compactExperiences,
    ...anchoredRoleExperiences,
  ].filter(
    (item) => item.company && item.position && item.startDate,
  );

  return merged;
};

const extractEducation = (text: string): Education[] => {
  const education: Education[] = [];

  const sectionMatch = text.match(
    /EDUCACI[ÓO]N([\s\S]*?)(?:EXPERIENCIA|HABILIDADES|CONTACTO|$)/i,
  );
  const sectionSource = sectionMatch?.[1] ?? text;
  const sectionLines = splitMeaningfulLines(sectionSource);
  const dateRangeRegex = new RegExp(
    `^(${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})\\s*[–-]\\s*(Actualidad|${SPANISH_MONTHS})\\s*,?\\s*(\\d{4})?$`,
    'i',
  );

  for (let i = 0; i < sectionLines.length; i++) {
    const dateLine = cleanField(sectionLines[i]);
    const dateMatch = dateLine.match(dateRangeRegex);
    if (!dateMatch) {
      continue;
    }

    const degree = cleanField(sectionLines[i + 1] ?? '');
    const institution = cleanField(sectionLines[i + 2] ?? '');

    if (!degree || !institution) {
      continue;
    }

    if (dateRangeRegex.test(degree) || dateRangeRegex.test(institution)) {
      continue;
    }

    if (/^(educacion|educación)$/i.test(degree)) {
      continue;
    }

    const endRaw = dateMatch[4]
      ? `${dateMatch[3]} ${dateMatch[4]}`
      : dateMatch[3];
    const status: 'completed' | 'in-progress' = /actualidad/i.test(endRaw)
      ? 'in-progress'
      : 'completed';

    education.push({
      institution,
      degree,
      details: dateLine,
      status,
    });

    i += 2;
  }

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

  return education;
};

const extractSkills = (text: string): { technical: string[]; personal: string[] } => {
  const technicalSkills = TECH_SKILLS.filter((skill) =>
    matchesSkillTerm(text, skill),
  );
  const personalSkills = PERSONAL_SKILLS.filter((skill) =>
    matchesSkillTerm(text, skill),
  );

  const uniqueTechnical = uniqueByNormalized(technicalSkills);
  const uniquePersonal = uniqueByNormalized(personalSkills);

  return {
    technical: uniqueTechnical,
    personal: uniquePersonal,
  };
};

const extractSection = (text: string, headers: string[]): string => {
  const escapedHeaders = headers.map((header) =>
    header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  );
  const sectionRegex = new RegExp(
    `(?:^|\\n)\\s*(?:${escapedHeaders.join('|')})\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\\s/&()-]{2,}:?|$)`,
    'i',
  );

  const match = text.match(sectionRegex);
  return match?.[1]?.trim() ?? '';
};

const fallbackExtractSummary = (
  text: string,
  profile: CvFormatProfile = CV_FORMAT_PROFILES[0],
): string => {
  const summarySection = extractSection(text, profile.sectionHeaders.summary);

  if (summarySection) {
    return cleanField(summarySection.split('\n').slice(0, 5).join(' '));
  }

  const firstParagraph = text
    .split(/\n\s*\n/)
    .map((block) => cleanField(block))
    .find((block) => block.length >= 60 && block.length <= 600);

  return firstParagraph ?? '';
};

const dedupeExperiences = (items: Experience[]): Experience[] => {
  const bestByKey = new Map<string, Experience>();

  items.forEach((item) => {
    const key = `${normalize(item.startDate)}|${normalize(item.endDate)}|${normalize(item.company)}|${normalize(item.position)}`;
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, item);
      return;
    }

    const currentScore = (item.highlights?.length ?? 0) * 10 + (item.description?.length ?? 0);
    const existingScore = (existing.highlights?.length ?? 0) * 10 + (existing.description?.length ?? 0);
    if (currentScore > existingScore) {
      bestByKey.set(key, item);
    }
  });

  return Array.from(bestByKey.values());
};

const dedupeEducation = (items: Education[]): Education[] => {
  const unique = new Map<string, Education>();

  items.forEach((item) => {
    const key = `${normalize(item.degree)}|${normalize(item.institution)}|${normalize(item.details ?? '')}`;
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  });

  return Array.from(unique.values());
};

const extractEducationDateBlocks = (text: string): Education[] => {
  const lines = splitMeaningfulLines(text);
  const dateLineRegex = /^(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*,?\s*\d{4}\s*[-–]\s*(?:actualidad|(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*,?\s*\d{4})$/i;
  const blockedInstitution = /^(contacto|celular|email|ubicaci[oó]n|linkedin|experiencia|habilidades)$/i;
  const results: Education[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const dateLine = lines[index];
    if (!dateLineRegex.test(dateLine)) {
      continue;
    }

    const degree = cleanField(lines[index + 1] ?? '');
    const institution = cleanField(lines[index + 2] ?? '');
    if (!degree || !institution) {
      continue;
    }

    if (dateLineRegex.test(degree) || dateLineRegex.test(institution)) {
      continue;
    }

    if (blockedInstitution.test(institution)) {
      continue;
    }

    results.push({
      degree,
      institution,
      details: cleanField(dateLine),
      status: /actualidad/i.test(dateLine) ? 'in-progress' : 'completed',
    });

    index += 2;
  }

  return results;
};

const fallbackExtractSkills = (text: string): { technical: string[]; personal: string[] } => {
  const section = extractSection(text, [
    'habilidades',
    'skills',
    'competencias',
    'tech stack',
    'tecnologias',
    'tecnologías',
  ]);

  const source = section || text;
  const tokens = source
    .split(/[\n,;|]/)
    .map((item) => cleanField(item))
    .filter((item) => item.length >= 2 && item.length <= 70)
    .flatMap((item) =>
      item
        .split(/\s{2,}|\s+-\s+|\s+\/\s+/)
        .map((piece) => cleanField(piece))
        .filter(Boolean),
    );

  const technicalFromTokens = tokens.filter((item) =>
    TECH_SKILLS.some((skill) => matchesSkillTerm(item, skill)),
  );
  const personalFromTokens = tokens.filter((item) =>
    PERSONAL_SKILLS.some((skill) => matchesSkillTerm(item, skill)),
  );

  const baseSkills = extractSkills(text);

  const normalizedSource = normalize(source);
  const professionPatterns: Array<{ pattern: RegExp; skill: string }> = [
    { pattern: /\b(contador|contabilidad|auditoria|auditoria interna|declaraciones tributarias|niif)\b/i, skill: 'contabilidad' },
    { pattern: /\b(nomina|gestion de nomina|liquidacion de nomina|seguridad social|prestaciones sociales)\b/i, skill: 'nomina' },
    { pattern: /\b(administracion|gestion administrativa|gestion documental|inventarios|compras)\b/i, skill: 'administracion' },
    { pattern: /\b(medico|medicina|consulta externa|triaje|triage|signos vitales|diagnostico medico)\b/i, skill: 'medicina general' },
    { pattern: /\b(mecanica|mecanica automotriz|mantenimiento preventivo|mantenimiento correctivo|diagnostico de fallas|soldadura)\b/i, skill: 'mecanica' },
    { pattern: /\b(operaciones militares|logistica militar|cadena de mando|seguridad y defensa|tacticas de patrullaje)\b/i, skill: 'operaciones militares' },
  ];

  const professionSkills = professionPatterns
    .filter((entry) => entry.pattern.test(normalizedSource))
    .map((entry) => entry.skill);

  return {
    technical: uniqueByNormalized([
      ...baseSkills.technical,
      ...technicalFromTokens,
      ...professionSkills,
    ]),
    personal: uniqueByNormalized([...baseSkills.personal, ...personalFromTokens]),
  };
};

const fallbackExtractExperiences = (
  text: string,
  profile: CvFormatProfile = CV_FORMAT_PROFILES[0],
): Experience[] => {
  const base = extractExperiences(text);

  const experienceSection =
    extractSection(text, profile.sectionHeaders.experience) || text;
  const lines = experienceSection
    .split('\n')
    .map((line) => cleanField(line))
    .filter(Boolean);

  const dateRangeRegex = /((?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)[a-záéíóú]*)\s*\d{4}\s*[-–]\s*(?:actualidad|present|((?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)[a-záéíóú]*)\s*\d{4})/i;

  const results: Experience[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!dateRangeRegex.test(lines[index])) {
      continue;
    }

    const dateLine = lines[index];
    const companyForward = lines[index + 1] ?? '';
    const positionForward = lines[index + 2] ?? '';
    const companyBackward = index > 1 ? lines[index - 2] : '';
    const positionBackward = index > 0 ? lines[index - 1] : '';

    const hasForward = Boolean(companyForward && positionForward);
    const company = hasForward ? companyForward : companyBackward;
    const position = hasForward ? positionForward : positionBackward;

    if (!position || !company) {
      continue;
    }

    if (looksLikeEducationBlock(company, position)) {
      continue;
    }

    const descriptionLines: string[] = [];
    const startDetailIndex = hasForward ? index + 3 : index + 1;
    for (let detailIndex = startDetailIndex; detailIndex < lines.length; detailIndex += 1) {
      const candidate = lines[detailIndex] ?? '';
      if (!candidate) {
        continue;
      }

      if (dateRangeRegex.test(candidate)) {
        break;
      }

      const cleanedCandidate = cleanField(candidate.replace(/^[•●\-\s]+/, ''));
      if (cleanedCandidate.length > 8) {
        descriptionLines.push(cleanedCandidate);
      }
    }

    results.push({
      company: sanitizeCompany(company),
      position: cleanField(position),
      startDate: cleanField(dateLine.split(/[-–]/)[0]),
      endDate: cleanField(dateLine.split(/[-–]/)[1] ?? 'Actualidad'),
      description: descriptionLines.join(' '),
      highlights: descriptionLines.length > 0 ? descriptionLines : undefined,
    });
  }

  return dedupeExperiences([...base, ...results]);
};

const fallbackExtractEducation = (
  text: string,
  profile: CvFormatProfile = CV_FORMAT_PROFILES[0],
): Education[] => {
  const base = extractEducation(text);
  const blockBased = extractEducationDateBlocks(text);

  const educationSection =
    extractSection(text, profile.sectionHeaders.education) || text;
  const lines = educationSection
    .split('\n')
    .map((line) => cleanField(line))
    .filter(Boolean);

  const degreeKeywords = /ingenier|licenc|tecnic|tecnolog|master|maestr|diplom|bachiller|tsu|bootcamp|curso/i;
  const results: Education[] = [];

  const dateLineRegex = /^(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*,?\s*\d{4}\s*[-–]\s*(?:actualidad|(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*,?\s*\d{4})$/i;

  for (let index = 0; index < lines.length; index += 1) {
    const dateLine = lines[index];
    if (!dateLineRegex.test(dateLine)) {
      continue;
    }

    const degree = cleanField(lines[index + 1] ?? '');
    const institution = cleanField(lines[index + 2] ?? '');

    if (!degree || !institution) {
      continue;
    }

    if (dateLineRegex.test(degree) || dateLineRegex.test(institution)) {
      continue;
    }

    results.push({
      degree,
      institution,
      details: cleanField(dateLine),
      status: /actualidad/i.test(dateLine) ? 'in-progress' : 'completed',
    });

    index += 2;
  }

  lines.forEach((line, index) => {
    if (!degreeKeywords.test(line)) {
      return;
    }

    const institution = lines[index + 1] && !degreeKeywords.test(lines[index + 1]) ? lines[index + 1] : 'No especificada';
    results.push({
      degree: line,
      institution,
      status: /en curso|in progress|cursando/i.test(line) ? 'in-progress' : 'completed',
    });
  });

  if (blockBased.length > 0) {
    return dedupeEducation([...blockBased, ...results, ...base]);
  }

  return dedupeEducation([...base, ...results]);
};

export const parseAdvancedCv = (text: string): ParsedCvDataAdvanced => {
  const cvFormatProfile = detectCvFormatProfile(text);
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
  const experience = fallbackExtractExperiences(text, cvFormatProfile);
  const education = fallbackExtractEducation(text, cvFormatProfile);
  const skills = fallbackExtractSkills(text);

  const safeName = fullName || extractName(text.toUpperCase()) || '';
  const safeSummary = professionalSummary || fallbackExtractSummary(text, cvFormatProfile);

  return {
    profile: {
      fullName: safeName,
      email,
      phone,
      location,
      title,
      professionalSummary: safeSummary,
    },
    socialLinks,
    experience,
    education,
    skills,
  };
};

export const getSupportedCvFormats = (): Array<{ id: CvFormatId; name: string }> =>
  CV_FORMAT_PROFILES.map((profile) => ({ id: profile.id, name: profile.name }));
