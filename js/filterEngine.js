(function initFilterEngine(global) {
  const filterState = {
    datas: [],
    tipo: [],
    regiao: [],
  };

  function matchesDateFilter(event, selectedDates) {
    if (!selectedDates.length) return true;

    const eventDates = event.dates || [];
    if (eventDates.length === 0) return false;

    return eventDates.some((date) => selectedDates.includes(date.iso));
  }

  function matchesTipoFilter(_event, selectedTipos) {
    if (!selectedTipos.length) return true;
    // Reservado para próxima sprint.
    return true;
  }

  function matchesRegiaoFilter(_event, selectedRegioes) {
    if (!selectedRegioes.length) return true;
    // Reservado para próxima sprint.
    return true;
  }

  function applyFilters(events, state = filterState) {
    const selectedDates = state.datas || [];
    const selectedTipos = state.tipo || [];
    const selectedRegioes = state.regiao || [];

    return events.filter((event) => {
      if (!matchesDateFilter(event, selectedDates)) return false;
      if (!matchesTipoFilter(event, selectedTipos)) return false;
      if (!matchesRegiaoFilter(event, selectedRegioes)) return false;
      return true;
    });
  }

  function setFilterDates(isoDates) {
    filterState.datas = [...isoDates];
  }

  function clearFilters() {
    filterState.datas = [];
    filterState.tipo = [];
    filterState.regiao = [];
  }

  function getFilterState() {
    return {
      datas: [...filterState.datas],
      tipo: [...filterState.tipo],
      regiao: [...filterState.regiao],
    };
  }

  global.FestaJunina = global.FestaJunina || {};
  global.FestaJunina.filterState = filterState;
  global.FestaJunina.applyFilters = applyFilters;
  global.FestaJunina.setFilterDates = setFilterDates;
  global.FestaJunina.clearFilters = clearFilters;
  global.FestaJunina.getFilterState = getFilterState;
})(window);
