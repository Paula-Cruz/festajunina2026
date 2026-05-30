const CAMPINAS_CENTER = [-22.90556, -47.06083];
const CAMPINAS_ZOOM = 12;

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1Dk67z3mrgjC8S8Rm9aiIib5MX03qc89uyiA6CwkTCQI/export?format=csv&gid=732510702";
const SHEET_JSON_FALLBACK_URL =
  "https://opensheet.elk.sh/1Dk67z3mrgjC8S8Rm9aiIib5MX03qc89uyiA6CwkTCQI/festas-juninas-cps";
const CACHE_KEY = "festajunina_events_v3";
const CACHE_TTL_MS = 5 * 60 * 1000;

const map = L.map("map").setView(CAMPINAS_CENTER, CAMPINAS_ZOOM);
const loadingEl = document.getElementById("map-loading");
const markerLayer = L.layerGroup().addTo(map);
let markersRendered = false;
let allEvents = [];
let filtersInitialized = false;

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

const PIN_WIDTH = 20;
const PIN_HEIGHT = Math.round((PIN_WIDTH * 95) / 62);

const PIN_HTML = `
  <svg class="pin-svg" width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 62 95" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M0.445312 47.5H6.44531L24.4453 2L23.4453 1.5L0.445312 47.5Z" fill="#FFB162"/>
    <path d="M22.4453 47H7.44531L25.4453 1H27.9453L22.4453 47Z" fill="#4897FF"/>
    <path d="M40.9453 47H23.4453L28.9453 1H30.9453L40.9453 47Z" fill="#FF4D9A"/>
    <path d="M53.9453 47H41.9453L31.9453 1H33.4453L53.9453 47Z" fill="#FFB162"/>
    <path d="M60.9453 47H54.9453L34.4453 0.5H34.9453L60.9453 47Z" fill="#FF3337"/>
    <path d="M6.94531 48H1.44531L25.9453 94.5H27.4453L6.94531 48Z" fill="#F2782C"/>
    <path d="M29.4453 94.5H27.9453L7.94531 48H22.4453L29.4453 94.5Z" fill="#1C7EFE"/>
    <path d="M31.9453 94.5H29.9453L23.4453 47.5H40.9453L31.9453 94.5Z" fill="#FF1F80"/>
    <path d="M33.4453 95H31.9453L41.4453 47.5H54.4453L33.4453 95Z" fill="#F2782C"/>
    <path d="M34.9453 94.5H33.9453L54.9453 47.5H61.9453L34.9453 94.5Z" fill="#DF1216"/>
    <path d="M0.445312 47.5L24.4453 0.5" stroke="#FFB162"/>
    <path d="M24.4453 0.5H34.9453" stroke="#FB169F"/>
    <path d="M34.9453 0.5L61.4453 47.5" stroke="#FF3337"/>
    <path d="M0.445312 47.5L26.4453 94.5" stroke="#F9942F"/>
    <path d="M26.4453 94.5H34.9453" stroke="#FB169F"/>
    <path d="M34.4453 94.5L61.4453 47.5" stroke="#DF1216"/>
    <path d="M0.945312 47.5H61.4453" stroke="#FB169F"/>
    <path d="M6.94531 47.5L27.4453 94.5" stroke="#1C7EFE"/>
    <path d="M6.94531 47.5L25.4453 1" stroke="#4897FF"/>
    <path d="M28.4453 0.5L22.9453 47.5" stroke="#FF4D9A"/>
    <path d="M22.9453 47.5L29.4453 94.5" stroke="#FF1F80"/>
    <path d="M32.4453 94.5L41.4453 47" stroke="#F2782C"/>
    <path d="M31.4453 0.5L41.4453 47.5" stroke="#F9942F"/>
    <path d="M33.4453 0.5L54.9453 47.5" stroke="#FF3337"/>
    <path d="M54.4453 47.5L32.9453 94.5" stroke="#DF1216"/>
    <path d="M0.945312 47.5H6.94531" stroke="#F2782C"/>
    <path d="M7.44531 47.5H22.9453" stroke="#1C7EFE"/>
    <path d="M22.9453 47.5H41.4453" stroke="#FF1F80"/>
    <path d="M41.4453 47.5H54.9453" stroke="#F2782C"/>
    <path d="M54.9453 47.5H61.4453" stroke="#DF1216"/>
  </svg>`;

const modernPinIcon = L.divIcon({
  className: "pin-icon-wrap",
  html: PIN_HTML,
  iconSize: [PIN_WIDTH, PIN_HEIGHT],
  iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT],
  popupAnchor: [0, -PIN_HEIGHT + 8],
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

function enrichEvents(rows) {
  return parseValidEvents(rows).map((row) => {
    const dates = FestaJunina.parseEventDates(row.data);
    const bairro = FestaJunina.parseNeighborhood(row.endereco);
    const ingresso = FestaJunina.parseIngressFromRow(row);
    const entradaGratuita = FestaJunina.getEntradaGratuitaValue(row);

    if (!dates.length && row.data) {
      console.warn(`Não foi possível interpretar a data da festa "${row.nome || "sem nome"}": "${row.data}"`);
    }

    if (row.endereco && !bairro) {
      console.warn(
        `Não foi possível extrair bairro da festa "${row.nome || "sem nome"}": "${row.endereco}"`,
      );
    }

    if (entradaGratuita && !ingresso) {
      console.warn(
        `Valor inválido em "entrada gratuita" da festa "${row.nome || "sem nome"}": "${entradaGratuita}" (use sim ou não)`,
      );
    }

    return { ...row, dates, bairro, ingresso };
  });
}

function renderFilteredEvents({ fitMap = false } = {}) {
  const filtered = FestaJunina.applyFilters(allEvents, FestaJunina.getFilterState());
  renderEvents(filtered, { fitMap });
}

function onFiltersChange() {
  renderFilteredEvents({ fitMap: false });
}

function initializeFilters() {
  if (filtersInitialized || allEvents.length === 0) return;

  FestaJunina.filtersUI.init(allEvents, onFiltersChange);
  filtersInitialized = true;
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
    allEvents = enrichEvents(cachedRows);
    initializeFilters();
    renderFilteredEvents({ fitMap: true });
  } else {
    setLoading(true);
  }

  try {
    const rows = await fetchSheetRows();
    writeCachedRows(rows);

    allEvents = enrichEvents(rows);
    if (allEvents.length === 0) {
      const skipped = rows.length;
      console.warn(
        `Nenhuma festa válida encontrada (${skipped} linha(s) ignorada(s)). Confira lat/lng como números, ex.: -22.9084 e -47.0945.`,
      );
      return;
    }

    if (allEvents.length < rows.length) {
      console.warn(
        `${rows.length - allEvents.length} linha(s) ignorada(s) por lat/lng inválidos.`,
      );
    }

    initializeFilters();
    renderFilteredEvents({ fitMap: !cachedRows });
  } catch (error) {
    if (!cachedRows) {
      console.error(error);
    }
  } finally {
    setLoading(false);
  }
}

loadEvents();

function initInfoModal() {
  const infoBtn = document.getElementById("map-info-btn");
  const modal = document.getElementById("info-modal");
  if (!infoBtn || !modal) return;

  const closeTargets = modal.querySelectorAll("[data-info-close]");

  function openModal() {
    if (FestaJunina.filtersUI?.closePanel) {
      FestaJunina.filtersUI.closePanel();
    }
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    infoBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    infoBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    infoBtn.focus();
  }

  infoBtn.addEventListener("click", openModal);

  closeTargets.forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal.querySelector(".info-modal__backdrop")) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}

initInfoModal();
