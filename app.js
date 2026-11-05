const INDOOR_TEMP_ENTITY = "sensor.lg_wp_kamertemperatuur";
const WEATHER_ENTITY = "weather.buienradar";

// 6 Hoofdkaarten in een 3x2 grid (Foutcode zit als klikbare pill in de topbar)
const ALL_KPI_KEYS = ["cop", "water", "dhw", "indoor", "outdoor", "flow"];
const ALL_SUB_KEYS = ["sub_pressure", "sub_thermal", "sub_elec"];

let activeKpiKey = null;
let selectedChartHours = 24;
let selectedScopPeriod = "jaar";
let isDraggingSlider = false;

let currentState = {
  outdoor: 6.5,
  indoor: 20.5,
  pressure: 1.8,
  thermalKw: 0.0,
  elecKw: 0.01,
  cop: 0.0,
  flow: 0.0,
  dhwTemp: 48.0,
  errCode: 0,
  supply: 28.0,
  ret: 26.0,
  shift: 0,
  oatLow: -10,
  lwtHigh: 35,
  oatHigh: 15,
  lwtLow: 25,
  isSwwActive: false
};

let historySeries = {
  hasRealData: false,
  supply: [],
  ret: [],
  pressure: [],
  thermal: [],
  elec: [],
  indoor: [],
  outdoor: [],
  shift: [],
  cop: [],
  flow: [],
  dhw: []
};

// =========================================================================
// HOME ASSISTANT BRIDGE & ENTITY HELPERS
// =========================================================================
function getHass() {
  try {
    if (window.parent && window.parent.document) {
      const haEl = window.parent.document.querySelector("home-assistant");
      if (haEl && haEl.hass) return haEl.hass;
    }
    if (window.top && window.top.document) {
      const haTop = window.top.document.querySelector("home-assistant");
      if (haTop && haTop.hass) return haTop.hass;
    }
  } catch (e) {}
  return null;
}

function resolveEntityId(hass, candidates) {
  if (!hass || !hass.states) return candidates[0];
  for (const id of candidates) {
    if (hass.states[id]) return id;
  }
  return candidates[0];
}

function readNum(hass, entityIdOrArr, fallback) {
  if (!hass || !hass.states) return fallback;
  const ids = Array.isArray(entityIdOrArr) ? entityIdOrArr : [entityIdOrArr];
  for (const id of ids) {
    if (hass.states[id]) {
      const val = parseFloat(hass.states[id].state);
      if (!isNaN(val)) return val;
    }
  }
  return fallback;
}

function readEnergyKwh(hass, entityIdOrArr, fallback, refKwh = 0) {
  if (!hass || !hass.states) return fallback;
  const ids = Array.isArray(entityIdOrArr) ? entityIdOrArr : [entityIdOrArr];
  const thinqBaseSt = hass.states["sensor.lg_therma_v_7kw_energy_today"];
  const thinqBaseUnit = ((thinqBaseSt && thinqBaseSt.attributes && thinqBaseSt.attributes.unit_of_measurement) || "").toLowerCase();

  let firstValid = null;
  for (const id of ids) {
    const st = hass.states[id];
    if (st) {
      let val = parseFloat(st.state);
      if (!isNaN(val)) {
        const unit = ((st.attributes && st.attributes.unit_of_measurement) || "").toLowerCase();
        const isWhUnit = unit === "wh" || (id.includes("thinq") && thinqBaseUnit === "wh");
        const isWhScale = refKwh > 0.05 && (val / refKwh) > 50;
        if (isWhUnit || isWhScale) {
          val = val / 1000.0;
        }
        if (firstValid === null) firstValid = val;
        if (val > 0.005) return val;
      }
    }
  }
  return firstValid !== null ? firstValid : fallback;
}

function calculateHistoryDayEnergy() {
  const thPts = typeof buildThermalSeries === "function" ? buildThermalSeries() : (historySeries.thermal || []);
  const elPts = typeof buildElecSeries === "function" ? buildElecSeries() : (historySeries.elec || []);
  if (!thPts.length || !elPts.length) {
    return { thKwh: 0, elKwh: 0, thCvKwh: 0, thDhwKwh: 0, elCvKwh: 0, elDhwKwh: 0 };
  }
  const now = new Date();
  const hoursSinceMidnight = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const startHr = Math.max(0, 24 - hoursSinceMidnight);

  let thCvKwh = 0;
  let thDhwKwh = 0;
  let elCvKwh = 0;
  let elDhwKwh = 0;

  const stephrs = 0.05; // 3-min integration steps across today's history
  for (let hr = startHr; hr < 24; hr += stephrs) {
    const dtHr = Math.min(stephrs, 24 - hr);
    const thKw = getStepValueAtHr(thPts, hr) || 0;
    const elKw = getStepValueAtHr(elPts, hr) || 0;
    if (thKw > 0.05 || elKw > 0.1) {
      const sup = getStepValueAtHr(historySeries.supply, hr) || currentState.supply || 28;
      const dhw = getStepValueAtHr(historySeries.dhw, hr) || currentState.dhwTemp || 48;
      const isDhw = sup > 36 || sup > (dhw - 4);
      if (isDhw) {
        thDhwKwh += thKw * dtHr;
        elDhwKwh += elKw * dtHr;
      } else {
        thCvKwh += thKw * dtHr;
        elCvKwh += elKw * dtHr;
      }
    }
  }

  return {
    thKwh: thCvKwh + thDhwKwh,
    elKwh: elCvKwh + elDhwKwh,
    thCvKwh,
    thDhwKwh,
    elCvKwh,
    elDhwKwh
  };
}

function readStr(hass, entityIdOrArr, fallback) {
  if (!hass || !hass.states) return fallback;
  const ids = Array.isArray(entityIdOrArr) ? entityIdOrArr : [entityIdOrArr];
  for (const id of ids) {
    if (hass.states[id]) {
      const s = hass.states[id].state;
      if (s && s !== "unavailable" && s !== "unknown") return s;
    }
  }
  return fallback;
}

function resolveIndoorEntityId(hass) {
  if (!hass || !hass.states) return INDOOR_TEMP_ENTITY;
  if (hass.states[INDOOR_TEMP_ENTITY]) {
    const v = parseFloat(hass.states[INDOOR_TEMP_ENTITY].state);
    if (!isNaN(v)) return INDOOR_TEMP_ENTITY;
  }
  const commonIds = [
    "sensor.woonkamer_temperatuur",
    "sensor.huiskamer_temperatuur",
    "sensor.living_room_temperature",
    "sensor.binnentemperatuur"
  ];
  for (const id of commonIds) {
    if (hass.states[id] && !isNaN(parseFloat(hass.states[id].state))) return id;
  }
  for (const k of Object.keys(hass.states)) {
    if (k.startsWith("climate.")) {
      const attrTemp = parseFloat(hass.states[k].attributes && hass.states[k].attributes.current_temperature);
      if (!isNaN(attrTemp)) return k;
    }
  }
  return INDOOR_TEMP_ENTITY;
}

function readIndoorTemp(hass, fallback) {
  if (!hass || !hass.states) return fallback;
  const entityId = resolveIndoorEntityId(hass);
  const st = hass.states[entityId];
  if (!st) return fallback;
  if (entityId.startsWith("climate.")) {
    const attrTemp = parseFloat(st.attributes && st.attributes.current_temperature);
    return !isNaN(attrTemp) ? attrTemp : fallback;
  }
  const v = parseFloat(st.state);
  return !isNaN(v) ? v : fallback;
}

function readStooklijnParams(hass) {
  let oatLow = readNum(hass, "input_number.lg_stooklijn_buiten_laag", -10);
  let lwtHigh = readNum(hass, "input_number.lg_stooklijn_water_hoog", 35);
  let oatHigh = readNum(hass, "input_number.lg_stooklijn_buiten_hoog", 15);
  let lwtLow = readNum(hass, "input_number.lg_stooklijn_water_laag", 25);

  if (oatLow <= -19.5 && lwtHigh <= 25.5 && oatHigh <= 10.5 && lwtLow <= 15.5) {
    oatLow = -10;
    lwtHigh = 35;
    oatHigh = 15;
    lwtLow = 25;
  }
  return { oatLow, lwtHigh, oatHigh, lwtLow };
}

function calculateIndoorDailyAverage(curIndoor) {
  if (!historySeries.indoor || historySeries.indoor.length === 0) {
    return curIndoor;
  }
  const now = new Date();
  const hoursSinceMidnight = now.getHours() + now.getMinutes() / 60;
  const startHr = Math.max(0, 24 - hoursSinceMidnight);
  const todayPts = historySeries.indoor.filter((p) => p.hr >= startHr);
  const ptsToUse = todayPts.length > 0 ? todayPts : historySeries.indoor;
  const sum = ptsToUse.reduce((acc, p) => acc + p.val, 0) + curIndoor;
  return sum / (ptsToUse.length + 1);
}

function readBuienradarWeather(hass) {
  if (!hass || !hass.states || !hass.states[WEATHER_ENTITY]) {
    return "⛅ Bewolkt";
  }
  const stObj = hass.states[WEATHER_ENTITY];
  const raw = (stObj.state || "").toLowerCase();
  const map = {
    "clear-night": "🌙 Helder",
    "cloudy": "☁️ Bewolkt",
    "exceptional": "⚠️ Waarschuwing",
    "fog": "🌫️ Mist",
    "hail": "🌨️ Hagel",
    "lightning": "🌩️ Onweer",
    "lightning-rainy": "⛈️ Onweer & Regen",
    "partlycloudy": "⛅ Halfbewolkt",
    "pouring": "🌧️ Stortregen",
    "rainy": "🌦️ Regen",
    "snowy": "❄️ Sneeuw",
    "snowy-rainy": "🌨️ Natte sneeuw",
    "sunny": "☀️ Zonnig",
    "windy": "💨 Winderig",
    "windy-variant": "💨 Bewolkt & Wind"
  };
  const label = map[raw] || ("🌤️ " + stObj.state);
  const hum = stObj.attributes && stObj.attributes.humidity;
  return hum !== undefined ? `${label} (${hum}%)` : label;
}

function readDhwTargetTemp(hass) {
  const rawModbusTarget = readNum(hass, "sensor.lg_wp_doeltemperatuur_sww", 0);
  if (rawModbusTarget > 25) {
    try { localStorage.setItem("lg_sww_target_cache", String(rawModbusTarget)); } catch (e) {}
    return rawModbusTarget;
  }
  try {
    const cached = parseFloat(localStorage.getItem("lg_sww_target_cache"));
    if (!isNaN(cached) && cached > 25) return cached;
  } catch (e) {}
  const helperTarget = readNum(hass, "input_number.lg_wp_sww_setpoint_input", 50.0);
  if (helperTarget > 25) return helperTarget;
  return 50.0;
}

// =========================================================================
// CONTROLS, SLIDER & DRAWER INTERACTION
// =========================================================================

// BEVESTIGINGSPOPUPS VOOR KRITIEKE SCHAKELAARS
function togglePowerSwitch() {
  if (!confirm("⚠️ WEET JE HET ZEKER?\n\nWil je de warmtepomp daadwerkelijk aan- of uitzetten?")) {
    return;
  }
  const hass = getHass();
  if (!hass) return;
  const eid = resolveEntityId(hass, ["switch.lg_wp_aan_uit"]);
  hass.callService("switch", "toggle", { entity_id: eid });
  setTimeout(syncFromHass, 350);
}

function toggleDhwSwitch() {
  if (!confirm("⚠️ WEET JE HET ZEKER?\n\nWil je de vrijgave voor het maken van warm tapwater wijzigen?")) {
    return;
  }
  const hass = getHass();
  if (!hass) return;
  const eid = resolveEntityId(hass, [
    "switch.lg_wp_sww_boiler_vrijgave",
    "switch.lg_wp_sww_vrijgave"
  ]);
  hass.callService("switch", "toggle", { entity_id: eid });
  setTimeout(syncFromHass, 350);
}

function toggleSilentSwitch() {
  const hass = getHass();
  if (!hass) return;
  const eid = resolveEntityId(hass, ["switch.lg_wp_silent_mode"]);
  hass.callService("switch", "toggle", { entity_id: eid });
  setTimeout(syncFromHass, 350);
}

function calculateStooklijnTarget(tOut, shiftK, oatL, lwtH, oatH, lwtL) {
  let base;
  if (tOut <= oatL) base = lwtH;
  else if (tOut >= oatH) base = lwtL;
  else {
    const fraction = (tOut - oatL) / (oatH - oatL);
    base = lwtH - fraction * (lwtH - lwtL);
  }
  return base + shiftK;
}

const sliderEl = document.getElementById("shiftSlider");
sliderEl.addEventListener("mousedown", () => { isDraggingSlider = true; });
sliderEl.addEventListener("touchstart", () => { isDraggingSlider = true; }, { passive: true });
sliderEl.addEventListener("mouseup", () => { isDraggingSlider = false; });
sliderEl.addEventListener("touchend", () => { isDraggingSlider = false; });

function updateShift(val) {
  const numVal = parseFloat(val);
  const shiftTxt = (numVal > 0 ? "+" : "") + numVal + " K";
  document.getElementById("shiftLabel").textContent = shiftTxt;
  document.getElementById("valIndoorShift").textContent = shiftTxt;
  const hass = getHass();
  if (hass) {
    hass.callService("input_number", "set_value", {
      entity_id: "input_number.lg_wp_stooklijn_shift_input",
      value: numVal
    });
  }
  currentState.shift = numVal;
  drawStooklijn(currentState.outdoor, currentState.shift, currentState.oatLow, currentState.lwtHigh, currentState.oatHigh, currentState.lwtLow);

  const dynamicTargetCv = calculateStooklijnTarget(currentState.outdoor, currentState.shift, currentState.oatLow, currentState.lwtHigh, currentState.oatHigh, currentState.lwtLow);
  document.getElementById("valTargetCv").textContent = dynamicTargetCv.toFixed(1) + " °C";
  if (!currentState.isSwwActive) {
    document.getElementById("badgeTarget").textContent = "Doel CV: " + dynamicTargetCv.toFixed(1) + " °C";
  }
  if (activeKpiKey === "water") {
    drawTopMetricChart();
  }
}

function setScopPeriod(period) {
  selectedScopPeriod = period;
  ["alltime", "jaar", "maand", "week", "dag"].forEach((p) => {
    const btn = document.getElementById("btnScop_" + p);
    if (btn) btn.classList.toggle("active", p === period);
  });
  syncFromHass();
}

function updateRangeButtonsUI() {
  [24, 12, 6, 1].forEach((hr) => {
    const btn = document.getElementById("btnRange_" + hr);
    if (btn) btn.classList.toggle("active", hr === selectedChartHours);
  });
}

function setChartTimeframe(hours) {
  selectedChartHours = hours;
  hoverState.top = null;
  hideTooltip();
  updateRangeButtonsUI();
  drawTopMetricChart();
}

function positionDrawerForActiveCard() {
  if (!activeKpiKey) return;
  const drawer = document.getElementById("detailDrawer");

  // 1. Foutcode-scherm (opent als ALLEREERSTE in het kpiGrid, direct onder de topbar)
  if (activeKpiKey === "error") {
    const kpiGrid = document.getElementById("kpiGrid");
    if (kpiGrid && drawer && kpiGrid.firstElementChild !== drawer) {
      kpiGrid.prepend(drawer);
    }
    return;
  }

  // 2. Sub-kaarten onder hydraulisch schema (verplaatst buiten de grid)
  if (activeKpiKey.startsWith("sub_")) {
    const schematicCard = document.getElementById("schematicCard");
    if (schematicCard && drawer && schematicCard.nextElementSibling !== drawer) {
      schematicCard.after(drawer);
    }
    return;
  }

  // 3. Voor de 6 hoofdkaarten: correcte rij berekening
  const idx = ALL_KPI_KEYS.indexOf(activeKpiKey);
  if (idx === -1) return;

  const w = window.innerWidth;
  const cols = w <= 640 ? 1 : (w <= 1050 ? 2 : 3);
  let rowEndIdx;

  if (cols === 3) {
    // 3 kolommen: Kaarten 0, 1, 2 openen na kaart 2. Kaarten 3, 4, 5 openen na kaart 5.
    rowEndIdx = idx <= 2 ? 2 : 5;
  } else if (cols === 2) {
    // 2 kolommen: Rond altijd af op de oneven index (0,1 -> 1), (2,3 -> 3), (4,5 -> 5)
    rowEndIdx = Math.floor(idx / 2) * 2 + 1;
    if (rowEndIdx >= ALL_KPI_KEYS.length) rowEndIdx = ALL_KPI_KEYS.length - 1;
  } else {
    // Mobiel: Opent altijd direct onder de aangeklikte kaart
    rowEndIdx = idx;
  }

  const targetCard = document.getElementById("card_" + ALL_KPI_KEYS[rowEndIdx]);
  if (targetCard && drawer && targetCard.nextElementSibling !== drawer) {
    targetCard.after(drawer);
  }
}

function selectKpiCard(key) {
  if (activeKpiKey === key) {
    closeDrawer();
    return;
  }
  activeKpiKey = key;
  selectedChartHours = 24;
  updateRangeButtonsUI();
  hoverState.top = null;
  hideTooltip();

  ALL_KPI_KEYS.forEach((k) => {
    const el = document.getElementById("card_" + k);
    if (el) el.classList.remove("active-card");
  });
  ALL_SUB_KEYS.forEach((k) => {
    const el = document.getElementById("card_" + k);
    if (el) el.classList.remove("active-card");
  });
  const errPill = document.getElementById("card_error");
  if (errPill) errPill.classList.remove("active-error-card");

  const activeEl = document.getElementById("card_" + key);
  if (activeEl) {
    activeEl.classList.add(key === "error" ? "active-error-card" : "active-card");
  }

  positionDrawerForActiveCard();

  const drawer = document.getElementById("detailDrawer");
  const chartView = document.getElementById("drawerChartView");
  const errorView = document.getElementById("drawerErrorView");
  const rangeControls = document.getElementById("chartRangeControls");

  drawer.classList.add("open");

  if (key === "error") {
    chartView.style.display = "none";
    rangeControls.style.display = "none";
    errorView.style.display = "block";
    document.getElementById("drawerTitle").textContent = "CH-Foutcodes & Diagnose";
    // Forceer het aantal codes direct bij het openen om styling te behouden
    try { document.getElementById("drawerBadge").textContent = `${LG_ERROR_CODES.length} Codes`; } catch(e){}
    renderErrorDatabase(document.getElementById("errSearchInput").value || "");
  } else {
    errorView.style.display = "none";
    rangeControls.style.display = "flex";
    chartView.style.display = "block";
    drawTopMetricChart();
  }
}

function closeDrawer() {
  activeKpiKey = null;
  hoverState.top = null;
  hideTooltip();
  ALL_KPI_KEYS.forEach((k) => {
    const el = document.getElementById("card_" + k);
    if (el) el.classList.remove("active-card");
  });
  ALL_SUB_KEYS.forEach((k) => {
    const el = document.getElementById("card_" + k);
    if (el) el.classList.remove("active-card");
  });
  const errPill = document.getElementById("card_error");
  if (errPill) errPill.classList.remove("active-error-card");
  document.getElementById("detailDrawer").classList.remove("open");
}

// =========================================================================
// HISTORY API & LIVE TELEMETRY SYNC
// =========================================================================
async function fetchRealHistory() {
  const hass = getHass();
  if (!hass || typeof hass.callApi !== "function") return;
  try {
    const start = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const indoorEntity = resolveIndoorEntityId(hass);
    const flowEntity = hass.states && hass.states["sensor.lg_wp_flow_debiet"]
      ? "sensor.lg_wp_flow_debiet"
      : "sensor.lg_wpflow_debiet";
    const shiftEntity = hass.states && hass.states["sensor.lg_wp_stooklijn_shift"]
      ? "sensor.lg_wp_stooklijn_shift"
      : "input_number.lg_wp_stooklijn_shift_input";

    const entitiesArr = [
      "sensor.lg_wp_aanvoertemperatuur",
      "sensor.lg_wp_retourtemperatuur",
      "sensor.lg_wp_waterdruk",
      "sensor.lg_wp_buitentemperatuur",
      "sensor.lg_wp_actuele_cop",
      "sensor.lg_wp_sww_boilertemperatuur",
      "sensor.lg_wp_thermisch_vermogen",
      "sensor.lg_wp_elektrisch_vermogen",
      shiftEntity,
      flowEntity,
      indoorEntity
    ];

    const minimalFlag = indoorEntity.startsWith("climate.") ? "" : "&minimal_response";
    const data = await hass.callApi("GET", `history/period/${start}?filter_entity_id=${entitiesArr.join(",")}${minimalFlag}`);

    if (Array.isArray(data) && data.length > 0) {
      const now = Date.now();
      const parseHist = (arr, mode = "normal") => {
        if (!arr) return [];
        return arr
          .map((pt) => {
            const raw = mode === "climate"
              ? parseFloat(pt.attributes && pt.attributes.current_temperature)
              : parseFloat(pt.state);
            let val = raw;
            if (mode === "flow" && raw <= 5.1) val = 0;
            if (mode === "cop") val = Math.min(9.0, Math.max(0.0, raw));
            if (mode === "power_w") val = Math.max(0.0, +(raw / 1000.0).toFixed(2));
            return {
              hr: 24 - (now - new Date(pt.last_changed || pt.last_updated).getTime()) / 3600000,
              val
            };
          })
          .filter((pt) => !isNaN(pt.val) && pt.hr >= 0 && pt.hr <= 24);
      };

      for (const series of data) {
        if (!series || !series.length) continue;
        const eid = series[0].entity_id;
        if (eid === "sensor.lg_wp_aanvoertemperatuur") historySeries.supply = parseHist(series);
        if (eid === "sensor.lg_wp_retourtemperatuur") historySeries.ret = parseHist(series);
        if (eid === "sensor.lg_wp_waterdruk") historySeries.pressure = parseHist(series);
        if (eid === "sensor.lg_wp_buitentemperatuur") historySeries.outdoor = parseHist(series);
        if (eid === "sensor.lg_wp_actuele_cop") historySeries.cop = parseHist(series, "cop");
        if (eid === "sensor.lg_wp_sww_boilertemperatuur") historySeries.dhw = parseHist(series);
        if (eid === "sensor.lg_wp_thermisch_vermogen") historySeries.thermal = parseHist(series, "power_w");
        if (eid === "sensor.lg_wp_elektrisch_vermogen") historySeries.elec = parseHist(series, "power_w");
        if (eid === shiftEntity) historySeries.shift = parseHist(series);
        if (eid === flowEntity) historySeries.flow = parseHist(series, "flow");
        if (eid === indoorEntity) historySeries.indoor = parseHist(series, indoorEntity.startsWith("climate.") ? "climate" : "normal");
      }

      if (historySeries.supply.length > 2) {
        historySeries.hasRealData = true;
      }
      syncFromHass();
      if (activeKpiKey && activeKpiKey !== "error") {
        drawTopMetricChart();
      }
    }
  } catch (e) {}
}

const SCOP_PERIOD_CONFIG = {
  alltime: {
    lbl: "Altijd",
    thCv: ["sensor.lg_warmte_alltime_cv", "sensor.lg_warmte_totaal_cv", "sensor.lg_warmte_jaar_cv"],
    thDhw: ["sensor.lg_warmte_alltime_sww", "sensor.lg_warmte_totaal_sww", "sensor.lg_warmte_jaar_sww"],
    elEstCv: ["sensor.lg_stroom_alltime_cv", "sensor.lg_stroom_totaal_cv", "sensor.lg_stroom_jaar_cv"],
    elEstDhw: ["sensor.lg_stroom_alltime_sww", "sensor.lg_stroom_totaal_sww", "sensor.lg_stroom_jaar_sww"],
    elThinq: ["sensor.lg_thinq_stroom_alltime", "sensor.lg_thinq_stroom_jaar", "sensor.lg_therma_v_7kw_energy_today"]
  },
  jaar: {
    lbl: "Jaar",
    thCv: ["sensor.lg_warmte_jaar_cv", "sensor.lg_warmte_totaal_cv"],
    thDhw: ["sensor.lg_warmte_jaar_sww", "sensor.lg_warmte_totaal_sww"],
    elEstCv: ["sensor.lg_stroom_jaar_cv", "sensor.lg_stroom_totaal_cv"],
    elEstDhw: ["sensor.lg_stroom_jaar_sww", "sensor.lg_stroom_totaal_sww"],
    elThinq: ["sensor.lg_thinq_stroom_jaar", "sensor.lg_thinq_stroom_alltime", "sensor.lg_therma_v_7kw_energy_today"]
  },
  maand: {
    lbl: "Maand",
    thCv: ["sensor.lg_warmte_maand_cv", "sensor.lg_warmte_jaar_cv"],
    thDhw: ["sensor.lg_warmte_maand_sww", "sensor.lg_warmte_jaar_sww"],
    elEstCv: ["sensor.lg_stroom_maand_cv", "sensor.lg_stroom_jaar_cv"],
    elEstDhw: ["sensor.lg_stroom_maand_sww", "sensor.lg_stroom_jaar_sww"],
    elThinq: ["sensor.lg_thinq_stroom_maand", "sensor.lg_therma_v_7kw_energy_today"]
  },
  week: {
    lbl: "Week",
    thCv: ["sensor.lg_warmte_week_cv", "sensor.lg_warmte_dag_cv"],
    thDhw: ["sensor.lg_warmte_week_sww", "sensor.lg_warmte_dag_sww"],
    elEstCv: ["sensor.lg_stroom_week_cv", "sensor.lg_stroom_dag_cv"],
    elEstDhw: ["sensor.lg_stroom_week_sww", "sensor.lg_stroom_dag_sww"],
    elThinq: ["sensor.lg_thinq_stroom_week", "sensor.lg_therma_v_7kw_energy_today"]
  },
  dag: {
    lbl: "Dag",
    thCv: ["sensor.lg_warmte_dag_cv"],
    thDhw: ["sensor.lg_warmte_dag_sww"],
    elEstCv: ["sensor.lg_stroom_dag_cv"],
    elEstDhw: ["sensor.lg_stroom_dag_sww"],
    elThinq: ["sensor.lg_thinq_stroom_dag", "sensor.lg_therma_v_7kw_energy_today"]
  }
};

function computePeriodScopData(hass, periodKey, histDayOpt) {
  const cfg = SCOP_PERIOD_CONFIG[periodKey] || SCOP_PERIOD_CONFIG.jaar;
  const histDay = histDayOpt || calculateHistoryDayEnergy();

  let thCv = readEnergyKwh(hass, cfg.thCv, 0);
  let thDhw = readEnergyKwh(hass, cfg.thDhw, 0);
  if (thCv < 0.01 && histDay.thCvKwh > 0.01) thCv = histDay.thCvKwh;
  if (thDhw < 0.01 && histDay.thDhwKwh > 0.01) thDhw = histDay.thDhwKwh;
  const thTot = thCv + thDhw;

  let elEstCv = readEnergyKwh(hass, cfg.elEstCv, 0);
  let elEstDhw = readEnergyKwh(hass, cfg.elEstDhw, 0);
  if (elEstCv < 0.005 && histDay.elCvKwh > 0.005) elEstCv = histDay.elCvKwh;
  if (elEstDhw < 0.005 && histDay.elDhwKwh > 0.005) elEstDhw = histDay.elDhwKwh;
  const elEstTot = elEstCv + elEstDhw;

  const refKwh = Math.max(thTot, elEstTot, 0.1);
  const elThinq = readEnergyKwh(hass, cfg.elThinq, 0, refKwh);

  // Official ThinQ numbers are used as primary electric input for SCOP
  const realElTot = elThinq > 0.005 ? elThinq : elEstTot;

  let cvShare;
  if (thCv <= 0.01 && thDhw > 0.01) {
    cvShare = 0.0;
  } else if (thDhw <= 0.01 && thCv > 0.01) {
    cvShare = 1.0;
  } else if (elEstTot > 0.01 && elEstCv > 0.005 && elEstDhw > 0.005) {
    cvShare = elEstCv / elEstTot;
  } else if (thTot > 0.01) {
    cvShare = thCv / thTot;
  } else {
    cvShare = 0.8;
  }
  const dhwShare = 1.0 - cvShare;

  const realElCv = realElTot * cvShare;
  const realElDhw = realElTot * dhwShare;

  const scopTot = (realElTot > 0.01 && thTot > 0.01) ? Math.min(9.0, Math.max(0.0, thTot / realElTot)) : 0.0;
  const scopCv = (realElCv > 0.01 && thCv > 0.01) ? Math.min(9.0, Math.max(0.0, thCv / realElCv)) : 0.0;
  const scopDhw = (realElDhw > 0.01 && thDhw > 0.01) ? Math.min(9.0, Math.max(0.0, thDhw / realElDhw)) : 0.0;

  return {
    lbl: cfg.lbl,
    thCv,
    thDhw,
    thTot,
    realElCv,
    realElDhw,
    realElTot,
    scopTot,
    scopCv,
    scopDhw
  };
}

function updateScopAndBalanceUI(hass, histDayOpt) {
  const stats = computePeriodScopData(hass, selectedScopPeriod, histDayOpt);
  document.getElementById("lblScopTot").textContent = `SCOP Totaal (${stats.lbl})`;
  document.getElementById("lblScopCv").textContent = `SCOP CV (${stats.lbl})`;
  document.getElementById("lblScopDhw").textContent = `SCOP SWW (${stats.lbl})`;
  document.getElementById("tblHeaderPeriod").textContent = `Energiebalans (${stats.lbl})`;
  document.getElementById("tblFooterPeriod").textContent = `Totaal ${stats.lbl}`;

  document.getElementById("valScopTotal").textContent = stats.scopTot.toFixed(2);
  document.getElementById("valScopCv").textContent = stats.scopCv.toFixed(2);
  document.getElementById("valScopDhw").textContent = stats.scopDhw.toFixed(2);

  document.getElementById("tblThCv").textContent = stats.thCv.toFixed(1) + " kWh";
  document.getElementById("tblElCv").textContent = stats.realElCv.toFixed(1) + " kWh";
  document.getElementById("tblThDhw").textContent = stats.thDhw.toFixed(1) + " kWh";
  document.getElementById("tblElDhw").textContent = stats.realElDhw.toFixed(1) + " kWh";
  document.getElementById("tblThTot").textContent = stats.thTot.toFixed(1) + " kWh";
  document.getElementById("tblElTot").textContent = stats.realElTot.toFixed(1) + " kWh";
}

function syncFromHass() {
  const hass = getHass();
  const badge = document.getElementById("connBadge");

  if (hass) {
    badge.textContent = "LIVE HASS VERBONDEN";
    badge.className = "conn-badge conn-live";
  } else {
    badge.textContent = "DEMO PREVIEW MODUS";
    badge.className = "conn-badge conn-demo";
  }

  const compOn = readStr(hass, "binary_sensor.lg_wp_compressor_status", "off") === "on";
  const pressure = readNum(hass, "sensor.lg_wp_waterdruk", 1.8);

  const flowProblemOn = readStr(hass, [
    "binary_sensor.lg_wp_stroming_te_laag",
    "binary_sensor.lg_wp_flow_switch"
  ], "off") === "on";

  const rawFlowSensor = readNum(hass, ["sensor.lg_wp_flow_debiet", "sensor.lg_wpflow_debiet"], 0);
  const pumpBinaryOn = readStr(hass, "binary_sensor.lg_wp_waterpomp_status", "off") === "on";
  const pumpOn = pumpBinaryOn || compOn || rawFlowSensor > 5.1;
  const flow = pumpOn ? rawFlowSensor : 0.0;

  const defrostOn = readStr(hass, "binary_sensor.lg_wp_defrost_status", "off") === "on";
  const buh1On = readStr(hass, "binary_sensor.lg_wp_backup_heater_1", "off") === "on";
  const buh2On = readStr(hass, "binary_sensor.lg_wp_backup_heater_2", "off") === "on";
  const boostOn = readStr(hass, "binary_sensor.lg_wp_sww_boost_heater_status", "off") === "on";

  const isHeatingActive = compOn || buh1On || buh2On || boostOn;

  const indoor = readIndoorTemp(hass, 20.5);
  const indoorAvg = calculateIndoorDailyAverage(indoor);
  const outdoor = readNum(hass, "sensor.lg_wp_buitentemperatuur", 6.5);
  const errCode = Math.round(readNum(hass, "sensor.lg_wp_foutcode", 0));
  const supply = readNum(hass, "sensor.lg_wp_aanvoertemperatuur", 26.0);
  const ret = readNum(hass, "sensor.lg_wp_retourtemperatuur", 25.0);
  const deltaT = +(supply - ret).toFixed(2);
  const dhwTemp = readNum(hass, "sensor.lg_wp_sww_boilertemperatuur", 48.0);
  const dhwTarget = readDhwTargetTemp(hass);

  const { oatLow, lwtHigh, oatHigh, lwtLow } = readStooklijnParams(hass);

  const haShift = hass && hass.states && hass.states["sensor.lg_wp_stooklijn_shift"]
    ? readNum(hass, "sensor.lg_wp_stooklijn_shift", 0)
    : readNum(hass, "input_number.lg_wp_stooklijn_shift_input", currentState.shift);

  if (!isDraggingSlider) {
    currentState.shift = haShift;
    document.getElementById("shiftSlider").value = haShift;
    const shiftTxt = (haShift > 0 ? "+" : "") + haShift + " K";
    document.getElementById("shiftLabel").textContent = shiftTxt;
    document.getElementById("valIndoorShift").textContent = shiftTxt;
  }

  const dynamicTargetCv = calculateStooklijnTarget(outdoor, currentState.shift, oatLow, lwtHigh, oatHigh, lwtLow);

  const swwStatusOn = readStr(hass, "binary_sensor.lg_wp_sww_verwarmen_status", "off") === "on";
  const haModeSensor = readStr(hass, "sensor.lg_wp_bedrijfsmodus_tekst", "").toLowerCase();
  const isSwwByTemp = swwStatusOn && (supply > 38.0 || supply > (dhwTemp - 2.0));
  const isSwwActive = haModeSensor.includes("sww") || isSwwByTemp;

  let pThW = 0;
  let pElW = pumpOn ? 35 : 12;
  let cop = 0.0;

  if (isHeatingActive) {
    const haTh = readNum(hass, "sensor.lg_wp_thermisch_vermogen", -1);
    const calcTh = flow > 5.0 && deltaT > 0 ? Math.round((flow / 60.0) * 4186.0 * deltaT) : 0;
    pThW = haTh >= 0 ? haTh : calcTh;

    const haEl = readNum(hass, "sensor.lg_wp_elektrisch_vermogen", -1);
    pElW = haEl > 0 ? haEl : 450;

    const haCop = readNum(hass, "sensor.lg_wp_actuele_cop", -1);
    cop = haCop > 0 ? haCop : (pElW > 80 && pThW > 0 ? Math.min(9.0, Math.max(0.0, pThW / pElW)) : 0.0);
  }

  currentState = {
    outdoor,
    indoor,
    pressure,
    thermalKw: +(pThW / 1000).toFixed(2),
    elecKw: +(pElW / 1000).toFixed(2),
    cop,
    flow,
    dhwTemp,
    errCode,
    supply,
    ret,
    shift: currentState.shift,
    oatLow,
    lwtHigh,
    oatHigh,
    lwtLow,
    isSwwActive
  };

  // Day COP in the Actueel Rendement card: identical to Day SCOP in the SCOP overview below
  const histDay = calculateHistoryDayEnergy();
  const dayScopStats = computePeriodScopData(hass, "dag", histDay);
  const copDay = dayScopStats.scopTot;

  document.getElementById("valCopDay").textContent = copDay.toFixed(2);

  let modeText = "Stand-by";
  let dotColor = "#64748b";
  if (defrostOn) {
    modeText = "Defrost Actief";
    dotColor = "#f59e0b";
  } else if (isHeatingActive && isSwwActive) {
    modeText = "SWW Boiler Laden";
    dotColor = "#f59e0b";
  } else if (isHeatingActive && !isSwwActive) {
    modeText = "Vloerverwarming (CV)";
    dotColor = "#14b8a6";
  } else if (pumpOn) {
    modeText = "Nadraaien / Snuffelcyclus";
    dotColor = "#38bdf8";
  }

  const swPowerOn = readStr(hass, ["switch.lg_wp_aan_uit"], "off") === "on";
  const swDhwOn = readStr(hass, [
    "switch.lg_wp_sww_boiler_vrijgave",
    "switch.lg_wp_sww_vrijgave"
  ], "off") === "on";
  const swSilentOn = readStr(hass, [
    "switch.lg_wp_silent_mode",
    "binary_sensor.lg_wp_stiltemodus_status"
  ], "off") === "on";

  document.getElementById("btnPower").classList.toggle("active", swPowerOn);
  document.getElementById("btnDhw").classList.toggle("active", swDhwOn);
  document.getElementById("btnSilent").classList.toggle("active", swSilentOn);

  document.getElementById("valMode").textContent = modeText;
  document.getElementById("modeDot").style.background = dotColor;
  document.getElementById("modeDot").style.boxShadow = (isHeatingActive || pumpOn) ? `0 0 8px ${dotColor}` : "none";

  // TOPBAR: FOUTCODE & DIAGNOSE PILL
  const valErrorEl = document.getElementById("valError");
  const valErrorUnitEl = document.getElementById("valErrorUnit");
  const errDotEl = document.getElementById("errDot");

  if (errCode === 0) {
    valErrorEl.textContent = "CH 00";
    valErrorEl.style.color = "var(--green)";
    valErrorUnitEl.textContent = "OK ▾";
    valErrorUnitEl.style.color = "var(--text-secondary)";
    errDotEl.style.background = "var(--green)";
    errDotEl.style.boxShadow = "none";
  } else {
    const matchedErr = LG_ERROR_CODES.find((e) => e.code === errCode);
    valErrorEl.textContent = "CH " + String(errCode).padStart(2, "0");
    valErrorEl.style.color = "var(--rose)";
    valErrorUnitEl.textContent = (matchedErr ? matchedErr.title : "Storing!") + " ▾";
    valErrorUnitEl.style.color = "#fda4af";
    errDotEl.style.background = "var(--rose)";
    errDotEl.style.boxShadow = "0 0 8px var(--rose)";
  }

  // CARD 1: COP & POWER
  const valCopEl = document.getElementById("valCop");
  valCopEl.textContent = cop.toFixed(2);
  valCopEl.style.color = isHeatingActive ? "var(--green)" : "var(--text-muted)";
  document.getElementById("valCopDay").textContent = copDay.toFixed(2);
  document.getElementById("valThermal").textContent = (pThW / 1000).toFixed(2) + " kW";
  document.getElementById("valElec").textContent = (pElW / 1000).toFixed(2) + " kW";
  document.getElementById("barCop").style.width = Math.min(100, Math.max(0, (cop / 9) * 100)) + "%";

  const badgeCop = document.getElementById("badgeCop");
  if (!isHeatingActive) {
    badgeCop.textContent = "Stand-by";
    badgeCop.style.color = "#94a3b8";
  } else if (cop >= 4.5) {
    badgeCop.textContent = "Top Rendement";
    badgeCop.style.color = "#34d399";
  } else if (cop >= 3.0) {
    badgeCop.textContent = isSwwActive ? "SWW Laden" : "Actief Verwarmen";
    badgeCop.style.color = "#5eead4";
  } else {
    badgeCop.textContent = "Opstart / Laag";
    badgeCop.style.color = "#fbbf24";
  }

  // CARD 2: WATER TEMPS & DELTA T
  document.getElementById("valSupply").textContent = supply.toFixed(1) + "°C";
  document.getElementById("valReturn").textContent = ret.toFixed(1) + "°C";
  document.getElementById("valDeltaT").textContent = deltaT.toFixed(2) + " K";
  document.getElementById("valTargetCv").textContent = dynamicTargetCv.toFixed(1) + " °C";
  document.getElementById("badgeTarget").textContent = (isHeatingActive && isSwwActive)
    ? "Doel SWW: " + dhwTarget.toFixed(1) + " °C"
    : "Doel CV: " + dynamicTargetCv.toFixed(1) + " °C";
  document.getElementById("barDeltaT").style.width = isHeatingActive
    ? Math.min(100, Math.max(0, (Math.abs(deltaT) / 8.0) * 100)) + "%"
    : "0%";

  // CARD 3: 200L BOILER
  document.getElementById("valDhwTemp").textContent = dhwTemp.toFixed(1);
  document.getElementById("valDhwTarget").textContent = dhwTarget.toFixed(1) + " °C";
  const dhwPct = Math.min(100, Math.max(0, ((dhwTemp - 15) / Math.max(10, dhwTarget - 15)) * 100));
  document.getElementById("barDhw").style.width = dhwPct + "%";

  const valDhwState = document.getElementById("valDhwState");
  if (isHeatingActive && isSwwActive) {
    valDhwState.textContent = "Actief Laden 🔥";
    valDhwState.style.color = "var(--amber)";
  } else if (!swDhwOn) {
    valDhwState.textContent = "Vrijgave Uit (Wacht)";
    valDhwState.style.color = "var(--text-muted)";
  } else {
    valDhwState.textContent = "Stand-by (Vrijgave Aan)";
    valDhwState.style.color = "var(--text-primary)";
  }

  // CARD 4: BINNEN (MET DAGGEMIDDELDE)
  document.getElementById("valIndoor").textContent = indoor.toFixed(1);
  const indoorPct = Math.min(100, Math.max(0, ((indoor - 15) / 10) * 100));
  document.getElementById("barIndoor").style.width = indoorPct + "%";
  document.getElementById("valIndoorAvg").textContent = indoorAvg.toFixed(1) + " °C";

  // CARD 5: BUITEN + BUIENRADAR
  document.getElementById("valOutdoor").textContent = outdoor.toFixed(1);
  const outdoorPct = Math.min(100, Math.max(0, ((outdoor + 15) / 40) * 100));
  document.getElementById("barOutdoor").style.width = outdoorPct + "%";
  document.getElementById("valOutdoorBounds").textContent = `${oatLow}°C tot ${oatHigh}°C`;
  document.getElementById("valWeather").textContent = readBuienradarWeather(hass);

  // CARD 6: GECONSOLIDEERDE CIRCULATIE & SYSTEEMDRUK
  document.getElementById("valFlow").textContent = flow.toFixed(1);
  document.getElementById("valPressure").textContent = pressure.toFixed(1) + " bar";
  document.getElementById("valMassFlow").textContent = Math.round(flow * 60) + " L/u";
  document.getElementById("barFlow").style.width = Math.min(100, Math.max(0, (flow / 25.0) * 100)) + "%";

  const badgePump = document.getElementById("badgePump");
  if (pumpOn && flowProblemOn) {
    badgePump.textContent = "Stroming Te Laag!";
    badgePump.style.color = "var(--rose)";
  } else if (isHeatingActive) {
    badgePump.textContent = "Compressor & Pomp AAN";
    badgePump.style.color = "#5eead4";
  } else if (pumpOn) {
    badgePump.textContent = "Pomp Actief (Snuffel)";
    badgePump.style.color = "#38bdf8";
  } else {
    badgePump.textContent = "Pomp Uit";
    badgePump.style.color = "#94a3b8";
  }

  const valValveText = document.getElementById("valValveText");
  if (!isHeatingActive && !pumpOn) {
    valValveText.textContent = "Stand-by";
    valValveText.style.color = "var(--text-muted)";
  } else if (!isHeatingActive && pumpOn) {
    valValveText.textContent = "Snuffelcyclus (CV)";
    valValveText.style.color = "var(--cyan)";
  } else if (isSwwActive) {
    valValveText.textContent = "SWW Boiler";
    valValveText.style.color = "var(--amber)";
  } else {
    valValveText.textContent = "Vloerverwarming";
    valValveText.style.color = "var(--teal)";
  }

  // FULL-WIDTH SVG HYDRONIC SCHEMATIC
  const heatBoiler = isHeatingActive && isSwwActive;
  const heatFloor = isHeatingActive && !isSwwActive;

  document.getElementById("svgCompState").textContent = compOn ? "ACTIEF" : "RUST";
  document.getElementById("svgCompState").setAttribute("fill", compOn ? "#34d399" : "#64748b");
  document.getElementById("svgPressure").textContent = pressure.toFixed(1) + " bar";
  document.getElementById("svgCompRing").setAttribute("stroke", isHeatingActive ? (heatBoiler ? "#f59e0b" : "#10b981") : "#334155");
  document.getElementById("svgPower").textContent =
    "Th: " + (pThW / 1000).toFixed(2) + " kW | El: " + (pElW / 1000).toFixed(2) + " kW";
  document.getElementById("svgPower").setAttribute("fill", isHeatingActive ? "#10b981" : "#64748b");
  document.getElementById("svgOutdoor").textContent = "Buiten: " + outdoor.toFixed(1) + " °C";
  document.getElementById("svgIndoor").textContent = "🏠 Binnentemp: " + indoor.toFixed(1) + " °C";

  document.getElementById("svgSupply").textContent = "LWT: " + supply.toFixed(1) + "°C";
  document.getElementById("svgSupply").setAttribute("fill", isHeatingActive ? "#f97316" : "#94a3b8");
  document.getElementById("pillSupplyBox").setAttribute("stroke", isHeatingActive ? "#f97316" : "#334155");

  document.getElementById("svgReturn").textContent = "EWT: " + ret.toFixed(1) + "°C • " + flow.toFixed(1) + " L/min";
  document.getElementById("svgReturn").setAttribute("fill", (isHeatingActive || pumpOn) ? "#38bdf8" : "#94a3b8");
  document.getElementById("pillReturnBox").setAttribute("stroke", (isHeatingActive || pumpOn) ? "#38bdf8" : "#334155");

  const svgValveDir = document.getElementById("svgValveDir");
  const boxValve = document.getElementById("boxValve");
  if (heatBoiler) {
    svgValveDir.textContent = "→ SWW";
    svgValveDir.setAttribute("fill", "#fbbf24");
    boxValve.setAttribute("stroke", "#f59e0b");
  } else if (heatFloor) {
    svgValveDir.textContent = "→ CV";
    svgValveDir.setAttribute("fill", "#5eead4");
    boxValve.setAttribute("stroke", "#14b8a6");
  } else {
    svgValveDir.textContent = "RUST";
    svgValveDir.setAttribute("fill", "#64748b");
    boxValve.setAttribute("stroke", "#334155");
  }

  document.getElementById("svgBoilerTemp").textContent = dhwTemp.toFixed(1) + " °C";
  const boilerStateSub = heatBoiler ? "NU LADEN 🔥" : (!swDhwOn ? "Vrijgave Uit" : "Stand-by");
  document.getElementById("svgBoilerTarget").textContent =
    "Setpoint: " + dhwTarget.toFixed(1) + " °C • " + boilerStateSub;
  document.getElementById("svgSlabInfo").textContent =
    "ΔT: " + (heatFloor ? deltaT.toFixed(2) : "0.00") + " K • Afgifte: " + (heatFloor ? (pThW / 1000).toFixed(2) : "0.00") + " kW";
  document.getElementById("svgSlabInfo").setAttribute("fill", heatFloor ? "#5eead4" : "#94a3b8");

  const schemBadge = document.getElementById("schemBadge");
  if (heatBoiler) {
    schemBadge.textContent = "Actief: 200L SWW Boiler";
    schemBadge.style.color = "#fbbf24";
    schemBadge.style.borderColor = "rgba(245, 158, 11, 0.45)";
  } else if (heatFloor) {
    schemBadge.textContent = "Actief: Vloerverwarming (CV)";
    schemBadge.style.color = "#5eead4";
    schemBadge.style.borderColor = "rgba(20, 184, 166, 0.45)";
  } else if (pumpOn) {
    schemBadge.textContent = "Stand-by (Snuffelcyclus Actief)";
    schemBadge.style.color = "#38bdf8";
    schemBadge.style.borderColor = "rgba(56, 189, 248, 0.35)";
  } else {
    schemBadge.textContent = "Stand-by (Geen Warmtevraag)";
    schemBadge.style.color = "#94a3b8";
    schemBadge.style.borderColor = "rgba(148, 163, 184, 0.25)";
  }

  const boxMonobloc = document.getElementById("boxMonobloc");
  boxMonobloc.classList.toggle("node-active-amber", heatBoiler);
  boxMonobloc.classList.toggle("node-active-teal", heatFloor);
  if (!isHeatingActive) boxMonobloc.setAttribute("stroke", "#334155");

  document.getElementById("boxBoiler").classList.toggle("node-active-amber", heatBoiler);
  document.getElementById("boxSlab").classList.toggle("node-active-teal", heatFloor);

  document.getElementById("grpBoiler").classList.toggle("node-dimmed", heatFloor);
  document.getElementById("grpSlab").classList.toggle("node-dimmed", heatBoiler);

  document.getElementById("svgBoilerCoil").setAttribute("stroke", heatBoiler ? "#f59e0b" : "#334155");
  document.getElementById("svgUfhCoil").setAttribute("stroke", heatFloor ? "#f97316" : "#334155");

  document.getElementById("flowPrimaryHot").classList.toggle("active", isHeatingActive);
  document.getElementById("flowDhwHot").classList.toggle("active", heatBoiler);
  document.getElementById("flowDhwCold").classList.toggle("active", heatBoiler);
  document.getElementById("flowCvHot").classList.toggle("active", heatFloor);
  document.getElementById("flowCvCold").classList.toggle("active", heatFloor);

  // 3 TEGELS ONDER HET HYDRAULISCH SCHEMA (Waterdruk, Thermisch Vermogen, Elektrisch Verbruik)
  document.getElementById("valStripPressure").textContent = pressure.toFixed(1) + " bar";
  document.getElementById("valStripThermal").textContent = (pThW / 1000).toFixed(2) + " kW";
  document.getElementById("valStripElec").textContent = (pElW / 1000).toFixed(2) + " kW";

  updateScopAndBalanceUI(hass, histDay);

  drawStooklijn(outdoor, currentState.shift, oatLow, lwtHigh, oatHigh, lwtLow);
  if (activeKpiKey === "error") {
    renderErrorDatabase(document.getElementById("errSearchInput").value || "");
  } else if (activeKpiKey) {
    drawTopMetricChart();
  }
}

// =========================================================================
// INITIALIZATION
// =========================================================================
bindCanvasHover("topMetricCanvas", "top", () => drawTopMetricChart());
bindCanvasHover("stooklijnChart", "stooklijn", () =>
  drawStooklijn(currentState.outdoor, currentState.shift, currentState.oatLow, currentState.lwtHigh, currentState.oatHigh, currentState.lwtLow)
);

window.addEventListener("resize", () => {
  positionDrawerForActiveCard();
  drawStooklijn(currentState.outdoor, currentState.shift, currentState.oatLow, currentState.lwtHigh, currentState.oatHigh, currentState.lwtLow);
  if (activeKpiKey && activeKpiKey !== "error") {
    drawTopMetricChart();
  }
});

syncFromHass();
fetchRealHistory();
setInterval(syncFromHass, 2000);
setInterval(fetchRealHistory, 60000);