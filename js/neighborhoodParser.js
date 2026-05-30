(function initNeighborhoodParser(global) {
  const BAIRRO_ALIASES = {
    "cidade universitaria": "Barão Geraldo",
  };

  function stripAccents(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeBairroName(bairro) {
    if (!bairro) return null;

    const key = stripAccents(String(bairro).trim().toLowerCase());
    return BAIRRO_ALIASES[key] || String(bairro).trim();
  }

  function parseNeighborhood(endereco) {
    const text = String(endereco || "").trim();
    if (!text) return null;

    const lastHyphen = text.lastIndexOf("-");
    if (lastHyphen === -1) return null;

    const rawBairro = text.slice(lastHyphen + 1).trim();
    return normalizeBairroName(rawBairro);
  }

  function buildNeighborhoodFilterOptions(events) {
    const unique = new Set();

    events.forEach((event) => {
      const bairro = event.bairro || parseNeighborhood(event.endereco);
      if (bairro) unique.add(bairro);
    });

    return [...unique].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  }

  global.FestaJunina = global.FestaJunina || {};
  global.FestaJunina.parseNeighborhood = parseNeighborhood;
  global.FestaJunina.normalizeBairroName = normalizeBairroName;
  global.FestaJunina.buildNeighborhoodFilterOptions = buildNeighborhoodFilterOptions;
})(window);
