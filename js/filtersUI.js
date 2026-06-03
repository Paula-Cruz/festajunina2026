(function initFiltersUI(global) {
  const MOBILE_BREAKPOINT = 640;
  let onFiltersChange = null;
  let filtersBtn = null;
  let filtersPanel = null;
  let dateListEl = null;
  let bairroListEl = null;
  let ingressoListEl = null;
  let clearBtn = null;
  let applyBtn = null;
  let tabButtons = [];
  let tabPanels = [];
  let draftFilterState = { datas: [], bairros: [], ingresso: [] };

  function isMobileViewport() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
  }

  function copyFilterState(state) {
    return {
      datas: [...(state.datas || [])],
      bairros: [...(state.bairros || [])],
      ingresso: [...(state.ingresso || [])],
    };
  }

  function closeInfoModalIfOpen() {
    const infoModal = document.getElementById("info-modal");
    const infoBtn = document.getElementById("map-info-btn");
    if (!infoModal || !infoModal.classList.contains("is-open")) return;

    infoModal.classList.remove("is-open");
    infoModal.setAttribute("aria-hidden", "true");
    if (infoBtn) infoBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function updateFooterButtons() {
    if (!filtersBtn) return;

    const hasAppliedFilters = global.FestaJunina.hasActiveFilters();
    filtersBtn.classList.toggle("filters-btn--active", hasAppliedFilters);

    if (clearBtn) {
      clearBtn.hidden = !global.FestaJunina.hasActiveFilters(draftFilterState);
    }
  }

  function renderCheckboxList(listEl, options, selectedValues, dataAttr, emptyMessage) {
    if (!listEl) return;

    listEl.innerHTML = "";

    if (options.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "filter-option-list__empty";
      emptyItem.textContent = emptyMessage;
      listEl.appendChild(emptyItem);
      return;
    }

    const selected = new Set(selectedValues);

    options.forEach((option) => {
      const value = typeof option === "string" ? option : option.id || option.iso;
      const labelText = typeof option === "string" ? option : option.label;
      const isPast = typeof option === "object" && option.isPast;

      const item = document.createElement("li");
      const label = document.createElement("label");
      label.className = "filter-option-list__label";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset[dataAttr] = value;
      input.value = value;
      input.checked = selected.has(value);

      const text = document.createElement("span");
      text.textContent = labelText;
      if (isPast) {
        text.classList.add("filter-option-list__label--past");
      }

      label.appendChild(input);
      label.appendChild(text);
      item.appendChild(label);
      listEl.appendChild(item);
    });
  }

  function readSelectedFromList(listEl, dataAttr) {
    if (!listEl) return [];

    const selected = [];
    listEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      if (checkbox.checked && checkbox.dataset[dataAttr]) {
        selected.push(checkbox.dataset[dataAttr]);
      }
    });
    return selected;
  }

  function syncDraftFromCheckboxes() {
    draftFilterState = {
      datas: readSelectedFromList(dateListEl, "dateIso"),
      bairros: readSelectedFromList(bairroListEl, "bairro"),
      ingresso: readSelectedFromList(ingressoListEl, "ingresso"),
    };
  }

  function syncAllCheckboxes() {
    if (dateListEl) {
      const selectedDates = new Set(draftFilterState.datas);
      dateListEl.querySelectorAll('input[type="checkbox"][data-date-iso]').forEach((input) => {
        input.checked = selectedDates.has(input.dataset.dateIso);
      });
    }

    if (bairroListEl) {
      const selectedBairros = new Set(draftFilterState.bairros);
      bairroListEl.querySelectorAll('input[type="checkbox"][data-bairro]').forEach((input) => {
        input.checked = selectedBairros.has(input.dataset.bairro);
      });
    }

    if (ingressoListEl) {
      const selectedIngresso = new Set(draftFilterState.ingresso);
      ingressoListEl.querySelectorAll('input[type="checkbox"][data-ingresso]').forEach((input) => {
        input.checked = selectedIngresso.has(input.dataset.ingresso);
      });
    }
  }

  function notifyAppliedChange() {
    updateFooterButtons();
    if (typeof onFiltersChange === "function") {
      onFiltersChange(global.FestaJunina.getFilterState());
    }
  }

  function handleListChange(event, dataAttr) {
    const input = event.target;
    if (input.type !== "checkbox" || !input.dataset[dataAttr]) return;

    syncDraftFromCheckboxes();
    updateFooterButtons();
  }

  function handleApplyFilters() {
    global.FestaJunina.setFilterState(draftFilterState);
    notifyAppliedChange();
    closePanel();
  }

  function handleClearFilters() {
    draftFilterState = { datas: [], bairros: [], ingresso: [] };
    global.FestaJunina.clearFilters();
    syncAllCheckboxes();
    notifyAppliedChange();
  }

  function switchTab(tabId) {
    tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
      button.tabIndex = isActive ? 0 : -1;
    });

    tabPanels.forEach((panel) => {
      const isActive = panel.id === `tab-${tabId}`;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
  }

  function openPanel() {
    if (!filtersPanel || !filtersBtn) return;

    closeInfoModalIfOpen();
    draftFilterState = copyFilterState(global.FestaJunina.getFilterState());
    syncAllCheckboxes();
    updateFooterButtons();

    filtersPanel.classList.add("is-open");
    filtersPanel.setAttribute("aria-hidden", "false");
    filtersBtn.setAttribute("aria-expanded", "true");

    if (isMobileViewport()) {
      document.body.style.overflow = "hidden";
    }
  }

  function closePanel() {
    if (!filtersPanel || !filtersBtn) return;

    filtersPanel.classList.remove("is-open");
    filtersPanel.setAttribute("aria-hidden", "true");
    filtersBtn.setAttribute("aria-expanded", "false");

    if (isMobileViewport()) {
      document.body.style.overflow = "";
    }

    filtersBtn.focus();
  }

  function togglePanel() {
    if (filtersPanel?.classList.contains("is-open")) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function bindEvents() {
    if (!filtersBtn || !filtersPanel) return;

    filtersBtn.addEventListener("click", togglePanel);

    filtersPanel.querySelectorAll("[data-filters-close]").forEach((el) => {
      el.addEventListener("click", closePanel);
    });

    filtersPanel.addEventListener("click", (event) => {
      if (event.target === filtersPanel.querySelector(".filters-panel__backdrop")) {
        closePanel();
      }
    });

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        switchTab(button.dataset.tab);
      });

      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

        event.preventDefault();
        const currentIndex = tabButtons.indexOf(button);
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + direction + tabButtons.length) % tabButtons.length;
        tabButtons[nextIndex].focus();
        switchTab(tabButtons[nextIndex].dataset.tab);
      });
    });

    if (dateListEl) {
      dateListEl.addEventListener("change", (event) => {
        handleListChange(event, "dateIso");
      });
    }

    if (bairroListEl) {
      bairroListEl.addEventListener("change", (event) => {
        handleListChange(event, "bairro");
      });
    }

    if (ingressoListEl) {
      ingressoListEl.addEventListener("change", (event) => {
        handleListChange(event, "ingresso");
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", handleApplyFilters);
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", handleClearFilters);
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && filtersPanel.classList.contains("is-open")) {
        closePanel();
      }
    });
  }

  function init(events, changeCallback) {
    onFiltersChange = changeCallback;
    filtersBtn = document.getElementById("filters-btn");
    filtersPanel = document.getElementById("filters-panel");
    dateListEl = document.getElementById("filter-date-list");
    bairroListEl = document.getElementById("filter-bairro-list");
    ingressoListEl = document.getElementById("filter-ingresso-list");
    clearBtn = document.getElementById("filters-clear-btn");
    applyBtn = document.getElementById("filters-apply-btn");
    tabButtons = Array.from(filtersPanel?.querySelectorAll(".filters-tabs__tab") || []);
    tabPanels = Array.from(filtersPanel?.querySelectorAll(".filters-tab-panel") || []);

    global.FestaJunina.pruneFilterState(events);

    const state = global.FestaJunina.getFilterState();
    draftFilterState = copyFilterState(state);

    const dateOptions = global.FestaJunina.buildDateFilterOptions(events);
    const bairroOptions = global.FestaJunina.buildNeighborhoodFilterOptions(events);
    const ingressoOptions = global.FestaJunina.getIngressOptions();

    renderCheckboxList(dateListEl, dateOptions, state.datas, "dateIso", "Nenhuma data disponível.");
    renderCheckboxList(bairroListEl, bairroOptions, state.bairros, "bairro", "Nenhum bairro disponível.");
    renderCheckboxList(
      ingressoListEl,
      ingressoOptions,
      state.ingresso,
      "ingresso",
      "Nenhuma opção disponível.",
    );

    updateFooterButtons();
    bindEvents();
  }

  global.FestaJunina = global.FestaJunina || {};
  global.FestaJunina.filtersUI = {
    init,
    closePanel,
    updateClearButton: updateFooterButtons,
    syncAllCheckboxes,
  };
})(window);
