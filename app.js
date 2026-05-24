const CAMPINAS_CENTER = [-22.90556, -47.06083];
const CAMPINAS_ZOOM = 12;

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1Dk67z3mrgjC8S8Rm9aiIib5MX03qc89uyiA6CwkTCQI/export?format=csv&gid=732510702";
const SHEET_JSON_FALLBACK_URL =
  "https://opensheet.elk.sh/1Dk67z3mrgjC8S8Rm9aiIib5MX03qc89uyiA6CwkTCQI/festas-juninas-cps";
const CACHE_KEY = "festajunina_events_v2";
const CACHE_TTL_MS = 5 * 60 * 1000;

const map = L.map("map").setView(CAMPINAS_CENTER, CAMPINAS_ZOOM);
const loadingEl = document.getElementById("map-loading");
const markerLayer = L.layerGroup().addTo(map);
let markersRendered = false;

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  subdomains: "abcd",
  attribution: '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/">CARTO</a>',
}).addTo(map);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  subdomains: "abcd",
  attribution:
    '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/">CARTO</a>',
}).addTo(map);

const PIN_HTML = `
  <svg class="pin-svg" width="36" height="46" viewBox="0 0 36 46" aria-hidden="true">
    <ellipse cx="18" cy="42" rx="11" ry="4" fill="#37b8a8"/>
    <path d="M18 3c7.2 0 13 5.8 13 13 0 9.5-13 23-13 23S5 25.5 5 16C5 8.8 10.8 3 18 3z" fill="#f14e4e"/>
    <circle cx="18" cy="16" r="5.5" fill="#fff"/>
  </svg>`;

const modernPinIcon = L.divIcon({
  className: "pin-icon-wrap",
  html: PIN_HTML,
  iconSize: [36, 46],
  iconAnchor: [18, 42],
  popupAnchor: [0, -40],
});

function toNumber(value) {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return Number.NaN;

  let s = String(value).trim();
  const dotCount = (s.match(/\./g) || []).length;
  const commaCount = (s.match(/,/g) || []).length;

  if (dotCount > 1) {
    const firstDot = s.indexOf(".");
    const intPart = s.slice(0, firstDot);
    const decPart = s.slice(firstDot + 1).replace(/\./g, "");
    s = `${intPart}.${decPart}`;
  } else if (commaCount > 1) {
    const firstComma = s.indexOf(",");
    const intPart = s.slice(0, firstComma);
    const decPart = s.slice(firstComma + 1).replace(/,/g, "");
    s = `${intPart}.${decPart}`;
  } else if (commaCount === 1 && dotCount === 0) {
    s = s.replace(",", ".");
  } else if (commaCount === 1 && dotCount === 1) {
    s =
      s.indexOf(".") < s.indexOf(",")
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "");
  }

  return Number(s);
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsvToRows(csvText) {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    if (values.every((value) => !value)) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

function createPopupHtml(event) {
  const nome = event.nome || "Festa sem nome";
  const endereco = event.endereco || "Endereço não informado";
  const data = event.data || "Data não informada";
  const horario = event.horario ? ` - ${event.horario}` : "";
  const descricao = event.descricao || "";
  const link = event.link || "";

  return `
    <h3 class="popup-title">${nome}</h3>
    <ul class="popup-list">
      <li><strong>Data:</strong> ${data}${horario}</li>
      <li><strong>Endereço:</strong> ${endereco}</li>
      ${descricao ? `<li><strong>Descrição:</strong> ${descricao}</li>` : ""}
      ${
        link
          ? `<li><a href="${link}" target="_blank" rel="noopener noreferrer">Mais informações</a></li>`
          : ""
      }
    </ul>
  `;
}

function parseValidEvents(rows) {
  return rows
    .map((row) => {
      const lat = toNumber(row.lat);
      const lng = toNumber(row.lng);
      return { ...row, lat, lng };
    })
    .filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng));
}

function setLoading(isLoading) {
  if (!loadingEl) return;
  loadingEl.classList.toggle("is-visible", isLoading);
  loadingEl.setAttribute("aria-hidden", isLoading ? "false" : "true");
}

function readCachedRows() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed.rows)) return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;

    return parsed.rows;
  } catch {
    return null;
  }
}

function writeCachedRows(rows) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        rows,
      }),
    );
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

function renderEvents(events, { fitMap = true } = {}) {
  markerLayer.clearLayers();
  if (events.length === 0) return;

  const bounds = [];
  events.forEach((event) => {
    const marker = L.marker([event.lat, event.lng], { icon: modernPinIcon }).addTo(markerLayer);
    marker.bindPopup(createPopupHtml(event));
    bounds.push([event.lat, event.lng]);
  });

  if (fitMap || !markersRendered) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }

  markersRendered = true;
}

async function fetchSheetRowsFromCsv() {
  const response = await fetch(SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Falha ao carregar CSV: ${response.status}`);
  }

  const csvText = await response.text();
  const rows = parseCsvToRows(csvText);
  if (rows.length === 0) {
    throw new Error("CSV da planilha vazio ou inválido.");
  }

  return rows;
}

async function fetchSheetRowsFromJson() {
  const response = await fetch(SHEET_JSON_FALLBACK_URL);
  if (!response.ok) {
    throw new Error(`Falha ao carregar JSON: ${response.status}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    throw new Error("Formato JSON da planilha inválido.");
  }

  return rows;
}

async function fetchSheetRows() {
  try {
    return await fetchSheetRowsFromCsv();
  } catch (csvError) {
    console.warn("CSV indisponível, usando fallback OpenSheet.", csvError);
    return fetchSheetRowsFromJson();
  }
}

async function loadEvents() {
  const cachedRows = readCachedRows();
  if (cachedRows) {
    renderEvents(parseValidEvents(cachedRows), { fitMap: true });
  } else {
    setLoading(true);
  }

  try {
    const rows = await fetchSheetRows();
    writeCachedRows(rows);

    const events = parseValidEvents(rows);
    if (events.length === 0) {
      const skipped = rows.length;
      console.warn(
        `Nenhuma festa válida encontrada (${skipped} linha(s) ignorada(s)). Confira lat/lng como números, ex.: -22.9084 e -47.0945.`,
      );
      return;
    }

    if (events.length < rows.length) {
      console.warn(
        `${rows.length - events.length} linha(s) ignorada(s) por lat/lng inválidos.`,
      );
    }

    renderEvents(events, { fitMap: !cachedRows });
  } catch (error) {
    if (!cachedRows) {
      console.error(error);
    }
  } finally {
    setLoading(false);
  }
}

loadEvents();
