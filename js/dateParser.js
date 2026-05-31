(function initDateParser(global) {
  const EVENT_YEAR = 2026;

  const MONTH_NAMES = {
    janeiro: 1,
    fevereiro: 2,
    marco: 3,
    maio: 5,
    junho: 6,
    julho: 7,
    agosto: 8,
    setembro: 9,
    outubro: 10,
    novembro: 11,
    dezembro: 12,
  };

  const MONTH_LABELS = {
    1: "Janeiro",
    2: "Fevereiro",
    3: "Março",
    4: "Abril",
    5: "Maio",
    6: "Junho",
    7: "Julho",
    8: "Agosto",
    9: "Setembro",
    10: "Outubro",
    11: "Novembro",
    12: "Dezembro",
  };

  function normalizeText(text) {
    return String(text || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/;/g, ",");
  }

  function stripAccents(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function parseMonthName(rawMonth) {
    const key = stripAccents(String(rawMonth || "").trim().toLowerCase());
    return MONTH_NAMES[key] || null;
  }

  function padDay(day) {
    return String(day).padStart(2, "0");
  }

  function toIso(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${padDay(day)}`;
  }

  function formatLabel(day, month) {
    return `${padDay(day)} de ${MONTH_LABELS[month] || "Mês"}`;
  }

  function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function isDatePast(iso, refDate = new Date()) {
    const [year, month, day] = iso.split("-").map(Number);
    const target = new Date(year, month - 1, day);
    return target < startOfLocalDay(refDate);
  }

  function createEventDate(day, month, year = EVENT_YEAR, refDate = new Date()) {
    const iso = toIso(year, month, day);
    return {
      iso,
      day,
      month,
      year,
      label: formatLabel(day, month),
      isPast: isDatePast(iso, refDate),
    };
  }

  function expandRange(startDay, endDay, month, year, refDate) {
    const from = Math.min(startDay, endDay);
    const to = Math.max(startDay, endDay);
    const dates = [];

    for (let day = from; day <= to; day += 1) {
      dates.push(createEventDate(day, month, year, refDate));
    }

    return dates;
  }

  function parseDayToken(token) {
    const cleaned = String(token || "")
      .trim()
      .replace(/^[,.\s]+|[,.\s]+$/g, "");
    const match = cleaned.match(/^(\d{1,2})$/);
    return match ? Number(match[1]) : null;
  }

  function parseIsoLike(text) {
    const match = String(text || "").trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = match[3] ? Number(match[3]) : EVENT_YEAR;

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return createEventDate(day, month, year);
  }

  function parseExplicitDate(text, refDate) {
    const match = String(text || "")
      .trim()
      .match(/^(\d{1,2})\s+de\s+([A-Za-zÀ-ÿ]+)$/i);
    if (!match) return null;

    const day = Number(match[1]);
    const month = parseMonthName(match[2]);
    if (!month) return null;

    return [createEventDate(day, month, EVENT_YEAR, refDate)];
  }

  function splitMonthSegments(text) {
    const segments = [];
    const monthPattern =
      /\bde\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/gi;
    const matches = [...text.matchAll(monthPattern)];

    if (matches.length === 0) return [text];

    matches.forEach((match, index) => {
      const monthName = match[1];
      const monthStart = match.index;
      const prevEnd = index === 0 ? 0 : matches[index - 1].index + matches[index - 1][0].length;
      const prefix = text.slice(prevEnd, monthStart).replace(/^[\s,]+|[\s,]+$/g, "");
      segments.push(`${prefix} de ${monthName}`.replace(/^\s*de\s+/i, ` de ${monthName}`));
    });

    const lastMatch = matches[matches.length - 1];
    const tail = text.slice(lastMatch.index + lastMatch[0].length).trim();
    if (tail) {
      segments.push(tail);
    }

    return segments.filter(Boolean);
  }

  function parseMonthSegment(segment, refDate) {
    const normalized = normalizeText(segment);
    if (!normalized) return [];

    const monthMatch = normalized.match(
      /\bde\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i,
    );
    if (!monthMatch) return [];

    const month = parseMonthName(monthMatch[1]);
    if (!month) return [];

    let daysPart = normalized.slice(0, monthMatch.index).replace(/[\s,]+$/g, "");
    daysPart = daysPart.replace(/^[\s,]+/, "").replace(/^(\s*e\s+)+/i, "").trim();
    if (!daysPart) return [];

    const rangeMatch = daysPart.match(/^(\d{1,2})\s+a\s+(\d{1,2})$/i);
    if (rangeMatch) {
      return expandRange(Number(rangeMatch[1]), Number(rangeMatch[2]), month, EVENT_YEAR, refDate);
    }

    const tokens = daysPart
      .split(/\s*,\s*|\s+e\s+/i)
      .map((token) => token.trim())
      .filter(Boolean);

    const dates = [];
    tokens.forEach((token) => {
      const day = parseDayToken(token);
      if (day !== null) {
        dates.push(createEventDate(day, month, EVENT_YEAR, refDate));
      }
    });

    return dates;
  }

  function dedupeAndSortDates(dates) {
    const byIso = new Map();
    dates.forEach((date) => {
      if (!byIso.has(date.iso)) {
        byIso.set(date.iso, date);
      }
    });

    return [...byIso.values()].sort((a, b) => a.iso.localeCompare(b.iso));
  }

  function parseEventDates(dataText, year = EVENT_YEAR, refDate = new Date()) {
    const normalized = normalizeText(dataText);
    if (!normalized) return [];

    const isoLike = parseIsoLike(normalized);
    if (isoLike) {
      isoLike.isPast = isDatePast(isoLike.iso, refDate);
      return [isoLike];
    }

    const explicitOnly = parseExplicitDate(normalized, refDate);
    if (explicitOnly) return explicitOnly;

    const segments = splitMonthSegments(normalized);
    const parsed = segments.flatMap((segment) => parseMonthSegment(segment, refDate));

    return dedupeAndSortDates(parsed);
  }

  function buildDateFilterOptions(events, refDate = new Date()) {
    const byIso = new Map();

    events.forEach((event) => {
      (event.dates || []).forEach((date) => {
        if (isDatePast(date.iso, refDate)) return;

        if (!byIso.has(date.iso)) {
          byIso.set(date.iso, {
            iso: date.iso,
            label: date.label,
            isPast: false,
          });
        }
      });
    });

    return [...byIso.values()].sort((a, b) => a.iso.localeCompare(b.iso));
  }

  function isEventFullyPast(event, refDate = new Date()) {
    const dates = event.dates || [];
    if (dates.length === 0) return false;
    return dates.every((date) => isDatePast(date.iso, refDate));
  }

  function getEventPastStatus(event, refDate = new Date()) {
    const dates = event.dates || [];
    if (dates.length === 0) {
      return { fullyPast: false, hasPastDates: false, hasUpcomingDates: true };
    }

    const hasPastDates = dates.some((date) => isDatePast(date.iso, refDate));
    const hasUpcomingDates = dates.some((date) => !isDatePast(date.iso, refDate));

    return {
      fullyPast: hasPastDates && !hasUpcomingDates,
      hasPastDates,
      hasUpcomingDates,
    };
  }

  global.FestaJunina = global.FestaJunina || {};
  global.FestaJunina.EVENT_YEAR = EVENT_YEAR;
  global.FestaJunina.parseEventDates = parseEventDates;
  global.FestaJunina.buildDateFilterOptions = buildDateFilterOptions;
  global.FestaJunina.isEventFullyPast = isEventFullyPast;
  global.FestaJunina.getEventPastStatus = getEventPastStatus;
  global.FestaJunina.isDatePast = isDatePast;
})(window);
