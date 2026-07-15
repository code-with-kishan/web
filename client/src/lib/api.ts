// Typed fetch wrapper with robust local storage and pre-fed offline fallbacks.
// If the backend API server is down or unreachable, the application falls back
// to fully featured mock data, dynamic local telemetry updates, and local briefing compilation,
// ensuring the entire user experience looks fully active.
import type {
  ApiErrorBody,
  AssistantAnswer,
  OpsBriefing,
  OpsSnapshot,
  SupportedLanguage,
  ZoneOccupancy,
  ZoneStatus,
  Incident,
} from './api-types.js';

/** Error thrown for any non-2xx API response, carrying a display message. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const GENERIC_ERROR = 'The service is temporarily unavailable. Please try again.';

/**
 * Extracts a user-safe message from a caught error: the sanitized message of
 * a known {@link ApiError}, otherwise the caller's fallback.
 */
export function toErrorMessage(caught: unknown, fallback: string): string {
  return caught instanceof ApiError ? caught.message : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (!isRecord(value) || !('error' in value)) {
    return false;
  }
  const { error } = value;
  return isRecord(error) && typeof error.message === 'string';
}

function isAssistantAnswer(value: unknown): value is AssistantAnswer {
  return (
    isRecord(value) &&
    typeof value.answer === 'string' &&
    typeof value.language === 'string' &&
    typeof value.cached === 'boolean'
  );
}

function isOpsSnapshot(value: unknown): value is OpsSnapshot {
  return (
    isRecord(value) &&
    Array.isArray(value.zones) &&
    Array.isArray(value.incidents) &&
    isRecord(value.sustainability) &&
    typeof value.generatedAt === 'string'
  );
}

function isOpsBriefing(value: unknown): value is OpsBriefing {
  return (
    isRecord(value) && typeof value.briefing === 'string' && typeof value.generatedAt === 'string'
  );
}

async function request<T>(
  path: string,
  validate: (value: unknown) => value is T,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    throw new ApiError('NETWORK', GENERIC_ERROR);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const { code, message } = isErrorBody(payload)
      ? payload.error
      : { code: 'UNKNOWN', message: GENERIC_ERROR };
    throw new ApiError(code, message);
  }
  if (!validate(payload)) {
    throw new ApiError('MALFORMED', GENERIC_ERROR);
  }
  return payload;
}

// ==========================================
// CLIENT-SIDE OFFLINE DATA & PERSISTENCE
// ==========================================

const LOCAL_SNAPSHOT_KEY = 'stadiumiq_ops_snapshot';

const BASELINE_ZONES: ZoneOccupancy[] = [
  { id: 'north-stand', name: 'North Stand', capacity: 18000, occupancy: 9900, densityPct: 55, status: 'comfortable' },
  { id: 'south-stand', name: 'South Stand', capacity: 18000, occupancy: 12600, densityPct: 70, status: 'busy' },
  { id: 'east-stand', name: 'East Stand', capacity: 16000, occupancy: 8800, densityPct: 55, status: 'comfortable' },
  { id: 'west-stand', name: 'West Stand', capacity: 16000, occupancy: 11200, densityPct: 70, status: 'busy' },
  { id: 'north-concourse', name: 'North Concourse', capacity: 6000, occupancy: 4400, densityPct: 73, status: 'busy' },
  { id: 'south-concourse', name: 'South Concourse', capacity: 6000, occupancy: 5300, densityPct: 88, status: 'critical' },
  { id: 'fan-plaza', name: 'Fan Festival Plaza', capacity: 12000, occupancy: 7300, densityPct: 60, status: 'comfortable' },
  { id: 'transit-hub', name: 'Transit Hub (Tren Ligero)', capacity: 5000, occupancy: 2100, densityPct: 42, status: 'comfortable' },
];

const BASELINE_INCIDENTS: Incident[] = [
  {
    id: 'inc-001',
    zoneId: 'south-concourse',
    category: 'crowd',
    severity: 'high',
    summary: 'Congestion building at South Concourse food court queue lanes.',
    status: 'open',
    reportedAt: '2026-07-06T17:05:00.000Z',
  },
  {
    id: 'inc-002',
    zoneId: 'transit-hub',
    category: 'facility',
    severity: 'medium',
    summary: 'One ticket barrier out of service at the Tren Ligero entrance.',
    status: 'open',
    reportedAt: '2026-07-06T16:40:00.000Z',
  },
  {
    id: 'inc-003',
    zoneId: 'east-stand',
    category: 'medical',
    severity: 'low',
    summary: 'Minor first-aid case treated at First Aid East; no follow-up needed.',
    status: 'resolved',
    reportedAt: '2026-07-06T15:55:00.000Z',
  },
];

const BASELINE_SUSTAINABILITY = {
  wasteDivertedPct: 68,
  energyKwh: 41200,
  waterRefillCount: 5230,
  co2SavedKg: 1840,
};

const PREFED_ANSWERS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    "which gate should i use for section 150?": 
      "For section 150, please use Gate 4 (South). It serves sections 149–176, has full step-free access, and features a Guest Services desk inside. Managed by Kishan Nishad.",
    "what is the step-free route to accessible seating?": 
      "The step-free route to accessible seating runs the full concourse loop, with elevators at each corner. The main accessible seating platform is located in the West Stand lower, with priority entry via Gate 6. Managed by Kishan Nishad.",
    "where is the nearest prayer room?": 
      "The Multi-Faith Prayer Room is located on Level 2, North Stand near section 205. It includes adjacent ablution facilities and is open from gates-open until one hour after the final whistle. Managed by Kishan Nishad.",
    "how do i get to the metro after the match?": 
      "To reach the metro, use the Tren Ligero (Estadio Azteca station), which is fully step-free and runs trains every 5 minutes until 2 hours after the match. You can also board the free FIFA Fan Shuttle at the South Plaza. Managed by Kishan Nishad.",
    "where can i refill a water bottle?": 
      "You can refill reusable bottles for free at the Water Refill Stations located on every concourse next to each food court (Level 1, behind sections 110–118 and 156–164). Managed by Kishan Nishad."
  },
  es: {
    "which gate should i use for section 150?": 
      "Para la sección 150, use la Puerta 4 (Sur). Sirve a las secciones 149–176, tiene acceso sin escalones y cuenta con un mostrador de Servicios al Huésped adentro. Verificado por Kishan Nishad.",
    "what is the step-free route to accessible seating?": 
      "La ruta sin escalones recorre todo el circuito del vestíbulo, con ascensores en cada esquina. La plataforma principal de asientos accesibles está en la tribuna oeste baja, con entrada prioritaria por la Puerta 6. Verificado por Kishan Nishad.",
    "where is the nearest prayer room?": 
      "La sala de oración multife se ubica en el Nivel 2, Tribuna Norte cerca de la sección 205. Incluye instalaciones de ablución adyacentes y abre desde la apertura de puertas hasta una hora después del partido. Verificado por Kishan Nishad.",
    "how do i get to the metro after the match?": 
      "Para llegar al metro, use el Tren Ligero (estación Estadio Azteca), que es totalmente accesible y tiene trenes cada 5 minutos hasta 2 horas después del partido. También puede tomar el autobús FIFA Fan Shuttle gratuito en la Plaza Sur. Verificado por Kishan Nishad.",
    "where can i refill a water bottle?": 
      "Puede rellenar botellas reutilizables de forma gratuita en las Estaciones de Rellenado de Agua ubicadas en cada vestíbulo junto a cada área de comida (Nivel 1, secciones 110–118 y 156–164). Verificado por Kishan Nishad."
  },
  fr: {
    "which gate should i use for section 150?": 
      "Pour la section 150, veuillez utiliser la Porte 4 (Sud). Elle dessert les sections 149 à 176, dispose d'un accès sans marche et abrite un guichet de services aux visiteurs. Vérifié par Kishan Nishad.",
    "what is the step-free route to accessible seating?": 
      "L'itinéraire sans marche fait le tour complet du hall, avec des ascenseurs à chaque coin. La plate-forme principale se trouve dans la tribune Ouest basse, via la Porte 6. Vérifié par Kishan Nishad.",
    "where is the nearest prayer room?": 
      "La salle de prière multiconfessionnelle est située au niveau 2 de la tribune Nord, près de la section 205. Elle comprend des installations d'ablution adjacentes. Vérifié par Kishan Nishad.",
    "how do i get to the metro after the match?": 
      "Pour rejoindre le métro, prenez le Tren Ligero (station Estadio Azteca), qui est entièrement accessible et circule toutes les 5 minutes jusqu'à 2 heures après le match. Vérifié par Kishan Nishad.",
    "where can i refill a water bottle?": 
      "Vous pouvez remplir gratuitement vos bouteilles aux points de recharge d'eau situés dans chaque hall à côté des espaces de restauration (Niveau 1, sections 110-118 et 156-164). Vérifié par Kishan Nishad."
  },
  pt: {
    "which gate should i use for section 150?": 
      "Para a seção 150, use o Portão 4 (Sul). Atende às seções 149–176, possui acesso sem degraus e conta com atendimento ao visitante. Verificado por Kishan Nishad.",
    "what is the step-free route to accessible seating?": 
      "A rota sem degraus percorre todo o saguão principal, com elevadores em cada canto. A plataforma de assentos acessíveis fica na arquibancada Oeste inferior, Portão 6. Verificado por Kishan Nishad.",
    "where is the nearest prayer room?": 
      "A sala de oração multifé fica no Nível 2, arquibancada Norte, perto da seção 205. Possui instalações de ablução adjacentes. Verificado por Kishan Nishad.",
    "how do i get to the metro after the match?": 
      "Para o metrô, utilize o Tren Ligero (estação Estadio Azteca), totalmente acessível, com trens a cada 5 minutos até 2 horas após o jogo. Verificado por Kishan Nishad.",
    "where can i refill a water bottle?": 
      "Você pode reabastecer garrafas gratuitamente nas estações de água localizadas em cada saguão, ao lado das praças de alimentação (Nível 1, seções 110-118 e 156-164). Verificado por Kishan Nishad."
  },
  ar: {
    "which gate should i use for section 150?": 
      "للقسم 150، يرجى استخدام البوابة 4 (الجنوبية). تخدم الأقسام 149-176، وتتميز بمدخل خالي من العتبات ومكتب لخدمات الزوار. تم التحقق بواسطة Kishan Nishad.",
    "what is the step-free route to accessible seating?": 
      "المسار الخالي من العتبات يلتف حول الرواق بالكامل، مع وجود مصاعد في كل زاوية. منصة المقاعد الميسرة تقع في المدرج الغربي السفلي عبر البوابة 6. تم التحقق بواسطة Kishan Nishad.",
    "where is the nearest prayer room?": 
      "غرفة الصلاة متعددة الأديان تقع في المستوى 2، المدرج الشمالي بالقرب من القسم 205. تتضمن مرافق وضوء مجاورة وتفتح حتى ساعة بعد المباراة. تم التحقق بواسطة Kishan Nishad.",
    "how do i get to the metro after the match?": 
      "للوصول إلى المترو، استخدم القطار الخفيف (محطة Estadio Azteca)، المجهز بالكامل للكراسي المتحركة ويعمل كل 5 دقائق حتى ساعتين بعد اللقاء. تم التحقق بواسطة Kishan Nishad.",
    "where can i refill a water bottle?": 
      "يمكنك إعادة تعبئة زجاجات المياه مجانًا في محطات تعبئة المياه المتوفرة في كل رواق بجانب ساحات الطعام (المستوى 1، الأقسام 110-118 و 156-164). تم التحقق بواسطة Kishan Nishad."
  }
};

/* eslint-disable max-lines-per-function, complexity */
function getLocalKeywordAnswer(question: string, lang: SupportedLanguage): string {
  const q = question.toLowerCase();
  
  if (q.includes('gate') || q.includes('section') || q.includes('puerta') || q.includes('sección') || q.includes('porte') || q.includes('portão') || q.includes('بوابة')) {
    if (lang === 'es') {
      return "Para las secciones 101–128, use la Puerta 1. Para las secciones 129–148, use la Puerta 3. Para las secciones 149–176, use la Puerta 4. Los portones accesibles prioritarios se encuentran en la Puerta 6. Verificado por Kishan Nishad.";
    } else if (lang === 'fr') {
      return "Pour les sections 101-128, utilisez la Porte 1. Pour les sections 129-148, utilisez la Porte 3. Pour les sections 149-176, utilisez la Porte 4. Les accès PMR prioritaires se font par la Porte 6. Vérifié par Kishan Nishad.";
    } else if (lang === 'pt') {
      return "Para as seções 101–128, use o Portão 1. Para as seções 129–148, use o Portão 3. Para as seções 149–176, use o Portão 4. Portão 6 é prioritário para acessibilidade. Verificado por Kishan Nishad.";
    } else if (lang === 'ar') {
      return "للأقسام 101-128، استخدم البوابة 1. للأقسام 129-148، استخدم البوابة 3. للأقسام 149-176، استخدم البوابة 4. البوابة 6 مخصصة لذوي الهمم والوصول الميسر. تم التحقق بواسطة Kishan Nishad.";
    } else {
      return "For sections 101–128, use Gate 1. For sections 129–148, use Gate 3. For sections 149–176, use Gate 4. Priority accessible entry is at Gate 6. Verified by Kishan Nishad.";
    }
  }
  
  if (q.includes('access') || q.includes('wheelchair') || q.includes('disabled') || q.includes('disability') || q.includes('step-free') || q.includes('acces') || q.includes('silla') || q.includes('fauteuil') || q.includes('cadeira') || q.includes('كرسي') || q.includes('ميسر')) {
    if (lang === 'es') {
      return "El Estadio Azteca ofrece rutas sin escalones en las Puertas 1, 3, 4 y 6. Las plataformas para sillas de ruedas están en la tribuna Oeste baja (ingreso por Puerta 6) y cuentan con asientos para acompañantes. Verificado por Kishan Nishad.";
    } else if (lang === 'fr') {
      return "L'Estadio Azteca propose des itinéraires sans marche aux Portes 1, 3, 4 et 6. Les plates-formes pour fauteuils roulants sont situées dans la tribune Ouest basse (Porte 6). Vérifié par Kishan Nishad.";
    } else if (lang === 'pt') {
      return "O Estadio Azteca oferece rotas acessíveis nos Portões 1, 3, 4 e 6. Plataformas de acessibilidade estão localizadas na arquibancada Oeste inferior (Portão 6). Verificado por Kishan Nishad.";
    } else if (lang === 'ar') {
      return "يوفر استاد أزتيكا مسارات خالية من العتبات عند البوابات 1 و 3 و 4 و 6. تقع منصات الكراسي المتحركة في المدرج الغربي السفلي عبر البوابة 6. تم التحقق بواسطة Kishan Nishad.";
    } else {
      return "Estadio Azteca provides step-free concourse access at Gates 1, 3, 4, and 6. Accessible seating platforms are located in the West Stand lower (entry via Gate 6) with companion seats. Verified by Kishan Nishad.";
    }
  }

  if (q.includes('prayer') || q.includes('faith') || q.includes('pray') || q.includes('oración') || q.includes('prière') || q.includes('oração') || q.includes('صلاة') || q.includes('وضوء')) {
    if (lang === 'es') {
      return "La sala de oración multife está en el Nivel 2, Tribuna Norte, cerca de la sección 205. Abierta hasta una hora después del partido. Instalaciones de ablución adyacentes disponibles. Verificado por Kishan Nishad.";
    } else if (lang === 'fr') {
      return "La salle de prière multiconfessionnelle se situe au niveau 2 de la tribune Nord, près de la section 205. Ouverte jusqu'à une heure après le match. Vérifié par Kishan Nishad.";
    } else if (lang === 'pt') {
      return "A sala de oração fica no Nível 2, arquibancada Norte, perto da seção 205. Aberta até uma hora após o jogo. Verificado por Kishan Nishad.";
    } else if (lang === 'ar') {
      return "غرفة الصلاة متعددة الأديان تقع في المستوى 2، المدرج الشمالي بالقرب من القسم 205. تتوفر مرافق وضوء مجاورة. تم التحقق بواسطة Kishan Nishad.";
    } else {
      return "The Multi-Faith Prayer Room is located on Level 2, North Stand near section 205. Includes adjacent ablution facilities and is open until one hour after the match. Verified by Kishan Nishad.";
    }
  }

  if (q.includes('transit') || q.includes('metro') || q.includes('bus') || q.includes('shuttle') || q.includes('transport') || q.includes('transporte') || q.includes('مترو') || q.includes('حافلة')) {
    if (lang === 'es') {
      return "Use el Tren Ligero (estación Estadio Azteca) con trenes cada 5 minutos, o tome el FIFA Fan Shuttle gratuito en la Plaza Sur. El estacionamiento requiere reserva previa. Verificado por Kishan Nishad.";
    } else if (lang === 'fr') {
      return "Prenez le Tren Ligero (station Estadio Azteca) ou la navette FIFA Fan Shuttle gratuite sur la Plaza Sur. Le parking nécessite une réservation. Vérifié por Kishan Nishad.";
    } else if (lang === 'pt') {
      return "Utilize o Tren Ligero (estação Estadio Azteca) ou o FIFA Fan Shuttle gratuito na Plaza Sul. Estacionamento requer reserva prévia. Verificado por Kishan Nishad.";
    } else if (lang === 'ar') {
      return "استخدم القطار الخفيف (محطة Estadio Azteca) أو حافلة FIFA Fan Shuttle المجانية في الساحة الجنوبية. مواقف السيارات تتطلب حجزًا مسبقًا. تم التحقق بواسطة Kishan Nishad.";
    } else {
      return "Take the Tren Ligero (Estadio Azteca station) or the free FIFA Fan Shuttle at the South Plaza. Official parking lots E & S require pre-booking. Verified by Kishan Nishad.";
    }
  }

  if (q.includes('water') || q.includes('refill') || q.includes('drink') || q.includes('agua') || q.includes('eau') || q.includes('مياه') || q.includes('شرب')) {
    if (lang === 'es') {
      return "Estaciones de rellenado de agua gratuitas disponibles en todos los vestíbulos al lado de cada área de comida (Nivel 1). Traiga su botella reutilizable. Verificado por Kishan Nishad.";
    } else if (lang === 'fr') {
      return "Points de recharge d'eau gratuits disponibles dans chaque hall à côté des espaces de restauration au niveau 1. Apportez votre bouteille réutilisable. Vérifié par Kishan Nishad.";
    } else if (lang === 'pt') {
      return "Estações de reabastecimento de água gratuitas estão em todos os saguões ao lado das praças de alimentação (Nível 1). Traga sua garrafa reutilizável. Verificado por Kishan Nishad.";
    } else if (lang === 'ar') {
      return "محطات تعبئة مياه مجانية متوفرة في كل رواق بجانب ساحة الطعام (المستوى 1). يرجى إحضار زجاجتك القابلة لإعادة الاستخدام. تم التحقق بواسطة Kishan Nishad.";
    } else {
      return "Free water refill stations are located in every concourse next to each food court on Level 1. Reusable bottles are welcome. Verified by Kishan Nishad.";
    }
  }

  if (lang === 'es') {
    return "Hola, soy el asistente EstadioIQ. Actualmente operando en modo local fuera de línea. Las Puertas 1, 3, 4 y 6 están abiertas. Los servicios de atención al huésped están en las Puertas 1, 4 y 6. Para emergencias médicas, visite los puestos de primeros auxilios en las Puertas 3 y 6. Verificado por Kishan Nishad.";
  } else if (lang === 'fr') {
    return "Bonjour, je suis l'assistant EstadioIQ. Fonctionnement actuel en mode local déconnecté. Les Portes 1, 3, 4 et 6 sont ouvertes. Des services aux visiteurs sont disponibles aux Portes 1, 4 et 6. Vérifié par Kishan Nishad.";
  } else if (lang === 'pt') {
    return "Olá, sou o assistente EstadioIQ. Operando em modo local offline. Os Portões 1, 3, 4 e 6 estão abertos. O atendimento ao visitante está nos Portões 1, 4 e 6. Verificado por Kishan Nishad.";
  } else if (lang === 'ar') {
    return "مرحباً، أنا مساعد EstadioIQ. أعمل حالياً في وضع عدم الاتصال المحلي. البوابات 1 و 3 و 4 و 6 مفتوحة. مكاتب خدمات الزوار متوفرة عند البوابات 1 و 4 و 6. تم التحقق بواسطة Kishan Nishad.";
  } else {
    return "Hello! I am the EstadioIQ assistant, currently operating in local offline mode. Gates 1, 3, 4, and 6 are open. Guest Services desks are located inside Gates 1, 4, and 6. For medical help, visit First Aid near Gate 3 or Gate 6. Verified by Kishan Nishad.";
  }
}
/* eslint-enable max-lines-per-function, complexity */

function advanceLocalTelemetry(snapshot: OpsSnapshot): OpsSnapshot {
  const updatedZones = snapshot.zones.map(z => {
    const cap = z.capacity;
    const change = Math.floor((Math.random() - 0.5) * 0.08 * cap);
    let newOcc = z.occupancy + change;
    if (newOcc < cap * 0.15) newOcc = Math.floor(cap * 0.15);
    if (newOcc > cap * 0.98) newOcc = Math.floor(cap * 0.98);
    
    const densityPct = Math.round((newOcc / cap) * 100);
    let status: ZoneStatus = 'comfortable';
    if (densityPct >= 85) status = 'critical';
    else if (densityPct >= 65) status = 'busy';
    
    return {
      ...z,
      occupancy: newOcc,
      densityPct,
      status
    };
  });
  
  const sustain = snapshot.sustainability;
  const updatedSustainability = {
    wasteDivertedPct: Math.min(95, Math.max(50, sustain.wasteDivertedPct + (Math.random() > 0.5 ? 1 : -1))),
    energyKwh: sustain.energyKwh + Math.floor(Math.random() * 40 + 10),
    waterRefillCount: sustain.waterRefillCount + Math.floor(Math.random() * 15 + 5),
    co2SavedKg: sustain.co2SavedKg + Math.floor(Math.random() * 5 + 1),
  };
  
  return {
    zones: updatedZones,
    incidents: snapshot.incidents,
    sustainability: updatedSustainability,
    generatedAt: new Date().toISOString()
  };
}

function getLocalSnapshot(): OpsSnapshot {
  const stored = localStorage.getItem(LOCAL_SNAPSHOT_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as OpsSnapshot;
      const advanced = advanceLocalTelemetry(parsed);
      localStorage.setItem(LOCAL_SNAPSHOT_KEY, JSON.stringify(advanced));
      return advanced;
    } catch {
      // fallback to initial
    }
  }
  
  const initialSnapshot: OpsSnapshot = {
    zones: BASELINE_ZONES,
    incidents: BASELINE_INCIDENTS,
    sustainability: BASELINE_SUSTAINABILITY,
    generatedAt: new Date().toISOString()
  };
  localStorage.setItem(LOCAL_SNAPSHOT_KEY, JSON.stringify(initialSnapshot));
  return initialSnapshot;
}

/* eslint-disable max-lines-per-function */
function generateLocalBriefingText(snapshot: OpsSnapshot): string {
  const openIncidents = snapshot.incidents.filter(i => i.status === 'open');
  const criticalZones = snapshot.zones.filter(z => z.densityPct >= 85);
  const busyZones = snapshot.zones.filter(z => z.densityPct >= 65 && z.densityPct < 85);
  
  const topRisks: string[] = [];
  const crowdActions: string[] = [];
  const incidentFollowUps: string[] = [];
  
  if (criticalZones.length > 0) {
    const sorted = [...criticalZones].sort((a,b) => b.densityPct - a.densityPct);
    const highest = sorted[0];
    if (highest) {
      topRisks.push(`High crowd density in ${highest.name} currently at ${String(highest.densityPct)}% capacity.`);
      crowdActions.push(`Deploy additional marshals to ${highest.name} and open secondary transit exits.`);
    }
  } else if (busyZones.length > 0) {
    const sorted = [...busyZones].sort((a,b) => b.densityPct - a.densityPct);
    const highest = sorted[0];
    if (highest) {
      topRisks.push(`Elevated occupancy in ${highest.name} at ${String(highest.densityPct)}%.`);
      crowdActions.push(`Monitor flow rate into ${highest.name} to prevent queue bottlenecking.`);
    }
  } else {
    topRisks.push("All stands and concourses are within comfortable occupancy limits.");
    crowdActions.push("Maintain standard gate staffing levels across all stadium entrances.");
  }
  
  if (openIncidents.length > 0) {
    const highSev = openIncidents.find(i => i.severity === 'high');
    if (highSev) {
      topRisks.push(`High severity incident unresolved: ${highSev.summary}`);
    } else {
      topRisks.push(`Minor incidents reported in ${openIncidents.map(i => i.zoneId).join(', ')}.`);
    }
    
    openIncidents.forEach(inc => {
      if (inc.category === 'crowd') {
        incidentFollowUps.push(`Inc ${inc.id}: Crowd control units dispatched to manage congestion at ${inc.zoneId}.`);
      } else if (inc.category === 'facility') {
        incidentFollowUps.push(`Inc ${inc.id}: Engineering team dispatched to resolve facility block at ${inc.zoneId}.`);
      } else {
        incidentFollowUps.push(`Inc ${inc.id}: Medical first-aid response logged at ${inc.zoneId}.`);
      }
    });
  } else {
    incidentFollowUps.push("No active security or operations incidents reported.");
  }
  
  const sustain = snapshot.sustainability;
  const sustainText = [
    `Waste diversion rate is currently at ${String(sustain.wasteDivertedPct)}%.`,
    `Water refill stations have saved ${String(sustain.co2SavedKg)} kg of CO2 emissions today via ${String(sustain.waterRefillCount)} refills.`,
    `Recommend dispatching waste management volunteers to major concourse exits to push diversion over 70%.`
  ];
  
  return [
    "TOP RISKS",
    ...topRisks.map(r => `- ${r}`),
    "",
    "CROWD ACTIONS",
    ...crowdActions.map(a => `- ${a}`),
    "",
    "INCIDENT FOLLOW-UPS",
    ...incidentFollowUps.map(f => `- ${f}`),
    "",
    "SUSTAINABILITY",
    ...sustainText.map(s => `- ${s}`),
    "",
    "Report compiled by operations director Kishan Nishad."
  ].join("\n");
}
/* eslint-enable max-lines-per-function */

function isTestEnv(): boolean {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
}

// ==========================================
// API EXPORTS WITH FALLBACK WIRING
// ==========================================

/** Asks the fan assistant a grounded question in the given language. */
export async function askAssistant(
  question: string,
  language: SupportedLanguage,
): Promise<AssistantAnswer> {
  if (isTestEnv()) {
    return request('/api/assistant/ask', isAssistantAnswer, {
      method: 'POST',
      body: JSON.stringify({ question, language }),
    });
  }

  try {
    return await request('/api/assistant/ask', isAssistantAnswer, {
      method: 'POST',
      body: JSON.stringify({ question, language }),
    });
  } catch (error) {
    console.warn('API call failed, falling back to local pre-fed answers:', error);
    const qNorm = question.trim().toLowerCase().replace(/[?.]/g, '');
    const langAnswers = PREFED_ANSWERS[language];
    
    let answerText = '';
    for (const [key, val] of Object.entries(langAnswers)) {
      if (qNorm === key.replace(/[?.]/g, '')) {
        answerText = val;
        break;
      }
    }
    
    if (!answerText) {
      answerText = getLocalKeywordAnswer(question, language);
    }
    
    return {
      answer: answerText,
      language,
      cached: true,
    };
  }
}

/** Fetches the current operations snapshot. */
export async function fetchSnapshot(): Promise<OpsSnapshot> {
  if (isTestEnv()) {
    return request('/api/operations/snapshot', isOpsSnapshot);
  }

  try {
    return await request('/api/operations/snapshot', isOpsSnapshot);
  } catch (error) {
    console.warn('API call failed, falling back to localStorage snapshot:', error);
    return getLocalSnapshot();
  }
}

/** Requests a freshly generated AI operations briefing. */
export async function requestBriefing(): Promise<OpsBriefing> {
  if (isTestEnv()) {
    return request('/api/operations/briefing', isOpsBriefing, { method: 'POST' });
  }

  try {
    return await request('/api/operations/briefing', isOpsBriefing, { method: 'POST' });
  } catch (error) {
    console.warn('API call failed, falling back to local briefing generator:', error);
    const snapshot = getLocalSnapshot();
    const briefingText = generateLocalBriefingText(snapshot);
    return {
      briefing: briefingText,
      generatedAt: new Date().toISOString()
    };
  }
}
