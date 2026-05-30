(function initIngressParser(global) {
  const INGRESS_OPTIONS = [
    { id: "gratuito", label: "Gratuito" },
    { id: "pago", label: "Pago" },
  ];

  function stripAccents(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function getEntradaGratuitaValue(row) {
    if (!row || typeof row !== "object") return "";

    return (
      row["entrada gratuita"] ||
      row["entrada_gratuita"] ||
      row.entrada_gratuita ||
      ""
    );
  }

  function parseEntradaGratuitaFlag(value) {
    const normalized = stripAccents(String(value || "").trim().toLowerCase());

    if (!normalized) return null;

    if (["sim", "s", "yes", "y", "true", "1", "x"].includes(normalized)) {
      return "gratuito";
    }

    if (["nao", "não", "n", "no", "false", "0"].includes(normalized)) {
      return "pago";
    }

    return null;
  }

  function parseIngressFromRow(row) {
    const flag = getEntradaGratuitaValue(row);
    return parseEntradaGratuitaFlag(flag);
  }

  function getIngressOptions() {
    return INGRESS_OPTIONS.map((option) => ({ ...option }));
  }

  global.FestaJunina = global.FestaJunina || {};
  global.FestaJunina.INGRESS_OPTIONS = INGRESS_OPTIONS;
  global.FestaJunina.getEntradaGratuitaValue = getEntradaGratuitaValue;
  global.FestaJunina.parseEntradaGratuitaFlag = parseEntradaGratuitaFlag;
  global.FestaJunina.parseIngressFromRow = parseIngressFromRow;
  global.FestaJunina.getIngressOptions = getIngressOptions;
})(window);
