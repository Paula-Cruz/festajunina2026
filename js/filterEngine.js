(function initFilterEngine(global) {
  const filterState = {
    datas: [],
    bairros: [],
    ingresso: [],
  };

  function matchesDateFilter(event, selectedDates) {
    if (!selectedDates.length) return true;

    const eventDates = event.dates || [];
    if (eventDates.length === 0) return false;

    return eventDates.some((date) => selectedDates.includes(date.iso));
  }

  function matchesBairroFilter(event, selectedBairros) {
    if (!selectedBairros.length) return true;

    const bairro = event.bairro || global.FestaJunina.parseNeighborhood(event.endereco);
    if (!bairro) return false;

    return selectedBairros.includes(bairro);
  }

  function matchesIngressoFilter(event, selectedIngressos) {
    if (!selectedIngressos.length) return true;

    const ingresso = event.ingresso ?? global.FestaJunina.parseIngressFromRow(event);
    if (!ingresso) return false;

    return selectedIngressos.includes(ingresso);
  }

  function applyFilters(events, state = filterState) {
    const selectedDates = state.datas || [];
    const selectedBairros = state.bairros || [];
    const selectedIngressos = state.ingresso || [];
    const hideFullyPast = hasActiveFilters(state);

    return events.filter((event) => {
      if (hideFullyPast && global.FestaJunina.isEventFullyPast(event)) return false;
      if (!matchesDateFilter(event, selectedDates)) return false;
      if (!matchesBairroFilter(event, selectedBairros)) return false;
      if (!matchesIngressoFilter(event, selectedIngressos)) return false;
      return true;
    });
  }

  function setFilterDates(isoDates) {
    filterState.datas = [...isoDates];
  }

  function setFilterBairros(bairros) {
    filterState.bairros = [...bairros];
  }

  function setFilterIngresso(ingressos) {
    filterState.ingresso = [...ingressos];
  }

  function setFilterState({ datas = [], bairros = [], ingresso = [] } = {}) {
    filterState.datas = [...datas];
    filterState.bairros = [...bairros];
    filterState.ingresso = [...ingresso];
  }

  function clearFilters() {
    filterState.datas = [];
    filterState.bairros = [];
    filterState.ingresso = [];
  }

  function hasActiveFilters(state = filterState) {
    return Boolean(state.datas.length || state.bairros.length || state.ingresso.length);
  }

  function pruneFilterState(events) {
    const validDates = new Set(global.FestaJunina.buildDateFilterOptions(events).map((date) => date.iso));
    const validBairros = new Set(global.FestaJunina.buildNeighborhoodFilterOptions(events));

    filterState.datas = filterState.datas.filter((iso) => validDates.has(iso));
    filterState.bairros = filterState.bairros.filter((bairro) => validBairros.has(bairro));
  }

  function getFilterState() {
    return {
      datas: [...filterState.datas],
      bairros: [...filterState.bairros],
      ingresso: [...filterState.ingresso],
    };
  }

  global.FestaJunina = global.FestaJunina || {};
  global.FestaJunina.filterState = filterState;
  global.FestaJunina.applyFilters = applyFilters;
  global.FestaJunina.setFilterDates = setFilterDates;
  global.FestaJunina.setFilterBairros = setFilterBairros;
  global.FestaJunina.setFilterIngresso = setFilterIngresso;
  global.FestaJunina.setFilterState = setFilterState;
  global.FestaJunina.clearFilters = clearFilters;
  global.FestaJunina.hasActiveFilters = hasActiveFilters;
  global.FestaJunina.pruneFilterState = pruneFilterState;
  global.FestaJunina.getFilterState = getFilterState;
})(window);
