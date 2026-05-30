(function initFiltersUI(global) {
  const MOBILE_BREAKPOINT = 640;
  let onFiltersChange = null;
  let filtersBtn = null;
  let filtersPanel = null;
  let dateListEl = null;
  let bairroListEl = null;
  let ingressoListEl = null;
  let clearBtn = null;

  function isMobileViewport() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
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

  function updateClearButton() {
    if (!clearBtn || !filtersBtn) return;

    const hasFilters = global.FestaJunina.hasActiveFilters();
    clearBtn.hidden = !hasFilters;
    filtersBtn.classList.toggle("filters-btn--active", hasFilters);
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

  function syncAllCheckboxes() {
    const state = global.FestaJunina.getFilterState();

    if (dateListEl) {
      const selectedDates = new Set(state.datas);
      dateListEl.querySelectorAll('input[type="checkbox"][data-date-iso]').forEach((input) => {
        input.checked = selectedDates.has(input.dataset.dateIso);
      });
    }

    if (bairroListEl) {
      const selectedBairros = new Set(state.bairros);
      bairroListEl.querySelectorAll('input[type="checkbox"][data-bairro]').forEach((input) => {
        input.checked = selectedBairros.has(input.dataset.bairro);
      });
    }

    if (ingressoListEl) {
      const selectedIngresso = new Set(state.ingresso);
      ingressoListEl.querySelectorAll('input[type="checkbox"][data-ingresso]').forEach((input) => {
        input.checked = selectedIngresso.has(input.dataset.ingresso);
      });
    }
  }

  function notifyChange() {
    updateClearButton();
    if (typeof onFiltersChange === "function") {
      onFiltersChange(global.FestaJunina.getFilterState());
    }
  }

  function handleListChange(event, dataAttr, setter) {
    const input = event.target;
    if (input.type !== "checkbox" || !input.dataset[dataAttr]) return;

    const listEl = input.closest("ul");
    if (!listEl) return;

    const selected = [];
    listEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      if (checkbox.checked && checkbox.dataset[dataAttr]) {
        selected.push(checkbox.dataset[dataAttr]);
      }
    });

    setter(selected);
    notifyChange();
  }

  function handleClearFilters() {
    global.FestaJunina.clearFilters();
    syncAllCheckboxes();
    notifyChange();
  }

  function openPanel() {
    if (!filtersPanel || !filtersBtn) return;

    closeInfoModalIfOpen();
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

    if (dateListEl) {
      dateListEl.addEventListener("change", (event) => {
        handleListChange(event, "dateIso", global.FestaJunina.setFilterDates);
      });
    }

    if (bairroListEl) {
      bairroListEl.addEventListener("change", (event) => {
        handleListChange(event, "bairro", global.FestaJunina.setFilterBairros);
      });
    }

    if (ingressoListEl) {
      ingressoListEl.addEventListener("change", (event) => {
        handleListChange(event, "ingresso", global.FestaJunina.setFilterIngresso);
      });
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

    const state = global.FestaJunina.getFilterState();
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

    updateClearButton();
    bindEvents();
  }

  global.FestaJunina = global.FestaJunina || {};
  global.FestaJunina.filtersUI = {
    init,
    closePanel,
    updateClearButton,
    syncAllCheckboxes,
  };
})(window);
