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

    return events.filter((event) => {
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

  function clearFilters() {
    filterState.datas = [];
    filterState.bairros = [];
    filterState.ingresso = [];
  }

  function hasActiveFilters(state = filterState) {
    return Boolean(state.datas.length || state.bairros.length || state.ingresso.length);
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
  global.FestaJunina.clearFilters = clearFilters;
  global.FestaJunina.hasActiveFilters = hasActiveFilters;
  global.FestaJunina.getFilterState = getFilterState;
})(window);
