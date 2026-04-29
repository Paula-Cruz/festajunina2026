const CAMPINAS_CENTER = [-22.90556, -47.06083];
const CAMPINAS_ZOOM = 12;

// Replace this value with your Google Sheets JSON endpoint.
const SHEET_JSON_URL =
  "https://opensheet.elk.sh/1Dk67z3mrgjC8S8Rm9aiIib5MX03qc89uyiA6CwkTCQI/festas-juninas-cps";

const map = L.map("map").setView(CAMPINAS_CENTER, CAMPINAS_ZOOM);

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

const modernPinIcon = L.divIcon({
  className: "",
  html: '<span class="pin-modern" aria-hidden="true"></span>',
  iconSize: [22, 30],
  iconAnchor: [11, 30],
  popupAnchor: [0, -28],
});

function toNumber(value) {
  if (typeof value === "number") return value;
  if (!value) return Number.NaN;
  const normalized = String(value).trim().replace(",", ".");
  return Number(normalized);
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

async function loadEvents() {
  try {
    const response = await fetch(SHEET_JSON_URL);
    if (!response.ok) {
      throw new Error(`Falha ao carregar planilha: ${response.status}`);
    }

    const rows = await response.json();
    if (!Array.isArray(rows)) {
      throw new Error("Formato da planilha inválido.");
    }

    const events = parseValidEvents(rows);
    if (events.length === 0) {
      console.warn("Nenhuma festa válida encontrada na planilha.");
      return;
    }

    const bounds = [];
    events.forEach((event) => {
      const marker = L.marker([event.lat, event.lng], { icon: modernPinIcon }).addTo(map);
      marker.bindPopup(createPopupHtml(event));
      bounds.push([event.lat, event.lng]);
    });

    map.fitBounds(bounds, { padding: [30, 30] });
  } catch (error) {
    console.error(error);
  }
}

loadEvents();
