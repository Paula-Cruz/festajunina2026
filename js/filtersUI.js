(function initFiltersUI(global) {
  const MOBILE_BREAKPOINT = 640;
  let onFiltersChange = null;
  let dateOptions = [];
  let filtersBtn = null;
  let filtersPanel = null;
  let dateListEl = null;
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

    const hasFilters = global.FestaJunina.getFilterState().datas.length > 0;
    clearBtn.hidden = !hasFilters;
    filtersBtn.classList.toggle("filters-btn--active", hasFilters);
  }

  function syncCheckboxesFromState() {
    if (!dateListEl) return;

    const selected = new Set(global.FestaJunina.getFilterState().datas);
    dateListEl.querySelectorAll('input[type="checkbox"][data-date-iso]').forEach((input) => {
      input.checked = selected.has(input.dataset.dateIso);
    });
  }

  function renderDateOptions() {
    if (!dateListEl) return;

    dateListEl.innerHTML = "";

    if (dateOptions.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "filter-date-list__empty";
      emptyItem.textContent = "Nenhuma data disponível.";
      dateListEl.appendChild(emptyItem);
      return;
    }

    dateOptions.forEach((option) => {
      const item = document.createElement("li");
      const label = document.createElement("label");
      label.className = "filter-date-list__label";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.dateIso = option.iso;
      input.value = option.iso;
      input.checked = global.FestaJunina.getFilterState().datas.includes(option.iso);

      const text = document.createElement("span");
      text.textContent = option.label;
      if (option.isPast) {
        text.classList.add("filter-date-list__label--past");
      }

      label.appendChild(input);
      label.appendChild(text);
      item.appendChild(label);
      dateListEl.appendChild(item);
    });
  }

  function notifyChange() {
    updateClearButton();
    if (typeof onFiltersChange === "function") {
      onFiltersChange(global.FestaJunina.getFilterState());
    }
  }

  function handleDateToggle(event) {
    const input = event.target;
    if (input.type !== "checkbox" || !input.dataset.dateIso) return;

    const current = new Set(global.FestaJunina.getFilterState().datas);
    if (input.checked) {
      current.add(input.dataset.dateIso);
    } else {
      current.delete(input.dataset.dateIso);
    }

    global.FestaJunina.setFilterDates([...current]);
    notifyChange();
  }

  function handleClearFilters() {
    global.FestaJunina.clearFilters();
    syncCheckboxesFromState();
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
      dateListEl.addEventListener("change", handleDateToggle);
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
    clearBtn = document.getElementById("filters-clear-btn");

    dateOptions = global.FestaJunina.buildDateFilterOptions(events);
    renderDateOptions();
    updateClearButton();
    bindEvents();
  }

  global.FestaJunina = global.FestaJunina || {};
  global.FestaJunina.filtersUI = {
    init,
    closePanel,
    updateClearButton,
    syncCheckboxesFromState,
  };
})(window);
