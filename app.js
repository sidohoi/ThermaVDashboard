const INDOOR_TEMP_ENTITY = "sensor.lg_wp_kamertemperatuur";
const WEATHER_ENTITY = "weather.buienradar";

// 6 Hoofdkaarten in een 3x2 grid (Foutcode zit als klikbare pill in de topbar)
const ALL_KPI_KEYS = ["cop", "water", "dhw", "indoor", "outdoor", "flow"];
const ALL_SUB_KEYS = ["sub_pressure", "sub_thermal", "sub_elec"];

let activeKpiKey = null;
let selectedChartHours = 24;
let selectedScopPeriod = "jaar";
let isDraggingSlider = false;

// =========================================================================
// USER SETTINGS & HA ENTITY PERSISTENCE (DEFAULT LANGUAGE: ENGLISH)
// =========================================================================
const SETTINGS_STORAGE_KEY = "lg_thermav_settings";
let lastLocalSettingWriteTs = 0;

const CURVE_PARAM_META = {
  oatLow:  { entity: "input_number.lg_stooklijn_buiten_laag", min: -20, max: 5,  def: -10 },
  lwtHigh: { entity: "input_number.lg_stooklijn_water_hoog",  min: 25,  max: 60, def: 35  },
  oatHigh: { entity: "input_number.lg_stooklijn_buiten_hoog", min: 10,  max: 25, def: 15  },
  lwtLow:  { entity: "input_number.lg_stooklijn_water_laag",  min: 15,  max: 40, def: 25  }
};

let userSettings = {
  lang: "en",                // "en" (default), "nl", "de", "fr", "es"
  modelCapacity: "7",        // "7", "9", or "12" (kW)
  curveControl: "inlet",     // "inlet" (Return EWT) or "outlet" (Supply LWT)
  hydronicTopology: "direct",// "direct", "serial", or "parallel"
  dhwTankVolume: 200,        // Domestic hot water tank size in Liters (60-500 L)
  dhwOverrideEnabled: false, // false = Auto (Sensor), true = Overrule (Manual)
  dhwOverrideTemp: 50.0,     // Manual DHW goal temperature (°C)
  oatLow: -10,
  lwtHigh: 35,
  oatHigh: 15,
  lwtLow: 25
};

function loadUserSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.lang && I18N[parsed.lang]) userSettings.lang = parsed.lang;
      if (parsed.modelCapacity === "7" || parsed.modelCapacity === "9" || parsed.modelCapacity === "12") {
        userSettings.modelCapacity = parsed.modelCapacity;
      }
      if (parsed.curveControl === "inlet" || parsed.curveControl === "outlet") {
        userSettings.curveControl = parsed.curveControl;
      }
      if (parsed.hydronicTopology === "direct" || parsed.hydronicTopology === "serial" || parsed.hydronicTopology === "parallel") {
        userSettings.hydronicTopology = parsed.hydronicTopology;
      }
      if (!isNaN(parseInt(parsed.dhwTankVolume, 10))) {
        userSettings.dhwTankVolume = Math.min(500, Math.max(60, Math.round(parseInt(parsed.dhwTankVolume, 10) / 10) * 10));
      }
      if (typeof parsed.dhwOverrideEnabled === "boolean") {
        userSettings.dhwOverrideEnabled = parsed.dhwOverrideEnabled;
      }
      if (!isNaN(parseFloat(parsed.dhwOverrideTemp))) {
        userSettings.dhwOverrideTemp = Math.min(65, Math.max(35, parseFloat(parsed.dhwOverrideTemp)));
      }
      Object.keys(CURVE_PARAM_META).forEach((k) => {
        const meta = CURVE_PARAM_META[k];
        const v = parseInt(parsed[k], 10);
        if (!isNaN(v)) {
          userSettings[k] = Math.min(meta.max, Math.max(meta.min, v));
        }
      });
    }
  } catch (e) {}
}

function saveUserSettings() {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(userSettings));
  } catch (e) {}
}

// =========================================================================
// MULTI-LANGUAGE DICTIONARY (EN DEFAULT, NL, DE, FR, ES)
// =========================================================================
const I18N = {
  en: {
    brandSub_direct: "Direct Injection Hydronic Topology • Modbus TCP Gateway",
    brandSub_serial: "Serial Buffer Hydronic Topology • Modbus TCP Gateway",
    brandSub_parallel: "Parallel Buffer Hydronic Topology • Modbus TCP Gateway",
    connLive: "LIVE HASS CONNECTED",
    connDemo: "DEMO PREVIEW MODE",
    sysStatus: "System Status:",
    diagLabel: "Diagnostics:",
    diagTitle: "Click for CH error code book & diagnostics",
    btnPower: "⚡ HP On/Off",
    btnDhw: "🚿 DHW Enable",
    btnSilent: "🌙 Silent Mode",
    btnSettingsTitle: "Configuration",
    closeBtn: "✕ Close",
    hrShort: "h",
    now: "Now",
    avgShort: "Avg",
    ttTime: "Time",
    ttCursorY: "Cursor Y-axis",

    // Modes & States
    standby: "Standby",
    defrostActive: "Defrost Active",
    dhwCharging: "DHW Tank Charging",
    ufhCh: "Underfloor Heating (CH)",
    postRunSniff: "Post-run / Sniffing Cycle",
    faultAlert: "Fault!",

    // Card 1: COP
    titleCardCop: "Current Efficiency",
    copDayPrefix: "COP • Day:",
    lblSubThermal: "Thermal Output",
    lblSubElec: "Electrical Power",
    copTop: "Peak Efficiency",
    copDhw: "DHW Charging",
    copActive: "Active Heating",
    copLow: "Startup / Low",

    // Card 2: Water Temp & Delta T
    titleCardWater: "Water Temp & ΔT",
    lblSubDeltaT: "Current Delta T (ΔT)",
    lblTargetCvInlet: "Calculated Setpoint CH (EWT)",
    lblTargetCvOutlet: "Calculated Setpoint CH (LWT)",
    badgeTargetCh: "Target CH:",
    badgeTargetDhw: "Target DHW:",
    supplyLwt: "Supply (LWT)",
    returnEwt: "Return (EWT)",
    setpointCvShort: "Setpoint CH",

    // Card 3: DHW
    titleCardDhw: "200L DHW Tank",
    badgeDhwTop: "200 Liters",
    lblSubDhwTarget: "DHW Target Temp",
    lblSubDhwState: "DHW Status",
    dhwStateActive: "Actively Charging 🔥",
    dhwStateDisabled: "Disabled (Hold)",
    dhwStateStandby: "Standby (Enabled)",

    // Card 4: Indoor
    titleCardIndoor: "Indoor",
    badgeIndoor: "Living Room",
    lblSubIndoorShift: "Curve Offset",
    lblSubIndoorAvg: "Daily Average",

    // Card 5: Outdoor
    titleCardOutdoor: "Outdoor",
    badgeOutdoor: "Weather Compensated",
    lblSubOutdoorBounds: "Curve Range",
    lblSubWeather: "Current Weather",
    toWord: "to",

    // Card 6: Flow & Pressure
    titleCardFlow: "Circulation & System Pressure",
    lblSubPressure: "System Pressure",
    lblSubMassFlow: "Mass Flow",
    massFlowUnit: "L/h",
    pumpLowFlow: "Flow Rate Too Low!",
    pumpCompOn: "Compressor & Pump ON",
    pumpSniff: "Pump Active (Sniff)",
    pumpOff: "Pump Off",
    valveSniff: "Sniffing Cycle (CH)",
    valveDhw: "DHW Tank",
    valveUfh: "Underfloor Heating",

    // Schematic
    titleSchematic: "Live Hydronic Schematic",
    schemDhw: "Active: 200L DHW Tank",
    schemCh: "Active: Underfloor Heating (CH)",
    schemSniff: "Standby (Sniffing Cycle Active)",
    schemIdle: "Standby (No Heat Demand)",
    svgActive: "ACTIVE",
    svgIdle: "IDLE",
    svgOutdoorPrefix: "Outdoor:",
    svgIndoorPrefix: "🏠 Indoor:",
    svgValveTitle: "3-WAY",
    svgValveDhw: "→ DHW",
    svgValveCh: "→ CH",
    svgBoilerTitle: "200L DHW Hot Water Tank",
    svgBoilerCharging: "CHARGING NOW 🔥",
    svgBoilerDisabled: "Disabled",
    svgSlabTitle_direct: "Underfloor Heating (Direct CH)",
    svgSlabTitle_serial: "Underfloor Heating (Serial Buffer)",
    svgSlabTitle_parallel: "Underfloor Heating (Parallel Buffer)",
    svgBufSerial: "SERIAL",
    svgBufParallel: "PARALLEL",
    svgBufSub: "BUFFER",
    svgSlabOutput: "Output:",
    stripPressure: "Water Pressure (24h chart)",
    stripThermal: "Thermal Output (24h chart)",
    stripElec: "Electrical Power (24h chart)",

    // Charts & Drawer
    drawerErrorTitle: "CH Error Codes & Diagnostics",
    codesWord: "Codes",
    errSearchPlaceholder: "Search error code (e.g. CH14, CH32) or keyword (flow, sensor, pressure, defrost)...",
    chartWaterTitle: "Water Temp & ΔT",
    chartPressureTitle: "Water Pressure",
    chartPressureShort: "Pressure",
    chartIndoorTitle: "Indoor Temp",
    chartIndoorShort: "Indoor",
    chartOutdoorTitle: "Outdoor Temp",
    chartOutdoorShort: "Outdoor",
    chartCopTitle: "Efficiency COP",
    chartCopShort: "Efficiency",
    chartFlowTitle: "Circulation Flow",
    chartFlowShort: "Flow",
    chartDhwTitle: "DHW Tank Temp",
    chartDhwShort: "DHW Tank",
    chartThermalTitle: "Thermal Output",
    chartThermalShort: "Thermal",
    chartElecTitle: "Electrical Power",
    chartElecShort: "Electrical",

    // SCOP & Energy Balance
    titleScopCard: "SCOP Efficiency & Energy Balance",
    period_alltime: "All-Time",
    period_jaar: "Year",
    period_maand: "Month",
    period_week: "Week",
    period_dag: "Day",
    scopTotPrefix: "SCOP Total",
    scopCvPrefix: "SCOP CH",
    scopDhwPrefix: "SCOP DHW",
    tblHeaderPrefix: "Energy Balance",
    tblColThermal: "Thermal",
    tblColElec: "Electrical",
    tblRowCv: "🔥 Underfloor Heating (CH)",
    tblRowDhw: "🚿 DHW Tank (DHW)",
    tblFooterPrefix: "Total",

    // Heating Curve
    titleCurveCard: "Heating Curve (Weather Compensated)",
    operatingPoint: "Operating Point",
    curveTarget: "Curve Target",
    lblSliderOffset: "Heating Curve Parallel Shift (Offset):",

    // Settings Modal
    cfgTitle: "⚙️ Dashboard Configuration",
    cfgLangTitle: "🌐 Language",
    cfgLangDesc: "Select the display language for the dashboard (Default: English).",
    cfgCapTitle: "⚡ Heat Pump Model (Capacity)",
    cfgCapDesc: "Select your LG Therma V R290 model capacity. Calibrates compressor electrical power estimation, flow scaling, and dashboard labels.",
    cfgCurveTitle: "📈 Heating Curve Control (Stooklijn Sturing)",
    cfgCurveDesc: "Choose whether the heating curve controls Return/Inlet water (EWT) or Supply/Outlet water (LWT). Also updates the hysteresis difference in the Water Temp & ΔT chart.",
    cfgCurveInlet: "Inlet / Return (EWT)",
    cfgCurveOutlet: "Outlet / Supply (LWT)",
    cfgTopoTitle: "🛢️ Hydronic System Setup (Buffer Configuration)",
    cfgTopoDesc: "Select your physical CH installation topology. Updates the live animated hydronic schematic and header.",
    cfgTopoDirect: "Direct Heating",
    cfgTopoSerial: "Serial Buffer",
    cfgTopoParallel: "Parallel Buffer",
    cfgDhwVolTitle: "🛢️ DHW Tank Size (Volume)",
    cfgDhwVolDesc: "Set the volume of your domestic hot water (DHW) tank in liters (Default: 200 L).",
    cfgDhwTitle: "🚿 DHW Target Temperature Overrule",
    cfgDhwDesc: "Use the automatic Modbus sensor value or manually overrule the DHW (SWW) target temperature.",
    cfgDhwAuto: "Auto (Sensor)",
    cfgDhwManual: "Overrule (Manual)",
    cfgCurveParamsTitle: "🎛️ Heating Curve Parameters (Stooklijn)",
    cfgCurveParamsDesc: "Set the axis values to match the installer menu of the LG thermostat. Stored in Home Assistant entities across all devices.",
    cfgColdTitle: "❄️ Design Temperature (Cold)",
    cfgColdSub: "Outdoor temperature vs. required water temp (e.g. -10°C outdoor = 35°C water)",
    cfgMildTitle: "🌤️ Footpoint (Mild)",
    cfgMildSub: "Outdoor temperature vs. required water temp (e.g. 15°C outdoor = 25°C water)",
    cfgOatLow: "Outdoor (Low)",
    cfgLwtHigh: "Water (Max)",
    cfgOatHigh: "Outdoor (High)",
    cfgLwtLow: "Water (Min)",

    // Confirm Prompts
    confirmPower: "⚠️ ARE YOU SURE?\n\nDo you really want to turn the heat pump ON or OFF?",
    confirmDhw: "⚠️ ARE YOU SURE?\n\nDo you want to toggle DHW hot water tank heating permission?",

    // Weather
    w_clear_night: "🌙 Clear Night",
    w_cloudy: "☁️ Cloudy",
    w_exceptional: "⚠️ Warning",
    w_fog: "🌫️ Fog",
    w_hail: "🌨️ Hail",
    w_lightning: "🌩️ Thunderstorm",
    w_lightning_rainy: "⛈️ Storm & Rain",
    w_partlycloudy: "⛅ Partly Cloudy",
    w_pouring: "🌧️ Heavy Rain",
    w_rainy: "🌦️ Rain",
    w_snowy: "❄️ Snow",
    w_snowy_rainy: "🌨️ Sleet",
    w_sunny: "☀️ Sunny",
    w_windy: "💨 Windy",
    w_windy_variant: "💨 Cloudy & Windy"
  },

  nl: {
    brandSub_direct: "Directe Afgifte Hydraulisch Schema • Modbus TCP Gateway",
    brandSub_serial: "Buffervat in Serie Hydraulisch Schema • Modbus TCP Gateway",
    brandSub_parallel: "Parallel Buffervat Hydraulisch Schema • Modbus TCP Gateway",
    connLive: "LIVE HASS VERBONDEN",
    connDemo: "DEMO PREVIEW MODUS",
    sysStatus: "Systeemstatus:",
    diagLabel: "Diagnose:",
    diagTitle: "Klik voor CH-foutcodeboek & diagnose",
    btnPower: "⚡ WP Aan/Uit",
    btnDhw: "🚿 SWW Vrijgave",
    btnSilent: "🌙 Silent Mode",
    btnSettingsTitle: "Instellingen",
    closeBtn: "✕ Sluiten",
    hrShort: "u",
    now: "Nu",
    avgShort: "Gem",
    ttTime: "Tijd",
    ttCursorY: "Cursor Y-as",

    standby: "Stand-by",
    defrostActive: "Defrost Actief",
    dhwCharging: "SWW Boiler Laden",
    ufhCh: "Vloerverwarming (CV)",
    postRunSniff: "Nadraaien / Snuffelcyclus",
    faultAlert: "Storing!",

    titleCardCop: "Actueel Rendement",
    copDayPrefix: "COP • Dag:",
    lblSubThermal: "Thermisch Vermogen",
    lblSubElec: "Elektrisch Vermogen",
    copTop: "Top Rendement",
    copDhw: "SWW Laden",
    copActive: "Actief Verwarmen",
    copLow: "Opstart / Laag",

    titleCardWater: "Watertemp & ΔT",
    lblSubDeltaT: "Actuele Delta T (ΔT)",
    lblTargetCvInlet: "Berekend Setpoint CV (EWT)",
    lblTargetCvOutlet: "Berekend Setpoint CV (LWT)",
    badgeTargetCh: "Doel CV:",
    badgeTargetDhw: "Doel SWW:",
    supplyLwt: "Aanvoer (LWT)",
    returnEwt: "Retour (EWT)",
    setpointCvShort: "Setpoint CV",

    titleCardDhw: "200L Tapwaterboiler",
    badgeDhwTop: "200 Liter",
    lblSubDhwTarget: "SWW Doeltemperatuur",
    lblSubDhwState: "SWW Status",
    dhwStateActive: "Actief Laden 🔥",
    dhwStateDisabled: "Vrijgave Uit (Wacht)",
    dhwStateStandby: "Stand-by (Vrijgave Aan)",

    titleCardIndoor: "Binnen",
    badgeIndoor: "Woonkamer",
    lblSubIndoorShift: "Stooklijn Offset",
    lblSubIndoorAvg: "Daggemiddelde",

    titleCardOutdoor: "Buiten",
    badgeOutdoor: "Weersafhankelijk",
    lblSubOutdoorBounds: "Stooklijn Bereik",
    lblSubWeather: "Actueel Weer",
    toWord: "tot",

    titleCardFlow: "Circulatie & Systeemdruk",
    lblSubPressure: "Systeemdruk",
    lblSubMassFlow: "Massastroom",
    massFlowUnit: "L/u",
    pumpLowFlow: "Stroming Te Laag!",
    pumpCompOn: "Compressor & Pomp AAN",
    pumpSniff: "Pomp Actief (Snuffel)",
    pumpOff: "Pomp Uit",
    valveSniff: "Snuffelcyclus (CV)",
    valveDhw: "SWW Boiler",
    valveUfh: "Vloerverwarming",

    titleSchematic: "Live Hydraulisch Schema",
    schemDhw: "Actief: 200L SWW Boiler",
    schemCh: "Actief: Vloerverwarming (CV)",
    schemSniff: "Stand-by (Snuffelcyclus Actief)",
    schemIdle: "Stand-by (Geen Warmtevraag)",
    svgActive: "ACTIEF",
    svgIdle: "RUST",
    svgOutdoorPrefix: "Buiten:",
    svgIndoorPrefix: "🏠 Binnentemp:",
    svgValveTitle: "3-WEG",
    svgValveDhw: "→ SWW",
    svgValveCh: "→ CV",
    svgBoilerTitle: "200L SWW Tapwaterboiler",
    svgBoilerCharging: "NU LADEN 🔥",
    svgBoilerDisabled: "Vrijgave Uit",
    svgSlabTitle_direct: "Vloerverwarming (Direct CV)",
    svgSlabTitle_serial: "Vloerverwarming (Serie Buffer)",
    svgSlabTitle_parallel: "Vloerverwarming (Parallel Buffer)",
    svgBufSerial: "SERIE",
    svgBufParallel: "PARALLEL",
    svgBufSub: "BUFFER",
    svgSlabOutput: "Afgifte:",
    stripPressure: "Waterdruk (24u grafiek)",
    stripThermal: "Thermisch Vermogen (24u grafiek)",
    stripElec: "Elektrisch Verbruik (24u grafiek)",

    drawerErrorTitle: "CH-Foutcodes & Diagnose",
    codesWord: "Codes",
    errSearchPlaceholder: "Zoek op foutcode (bijv. CH14, CH32) of trefwoord (debiet, sensor, druk, defrost)...",
    chartWaterTitle: "Watertemp & ΔT",
    chartPressureTitle: "Waterdruk",
    chartPressureShort: "Waterdruk",
    chartIndoorTitle: "Binnentemp",
    chartIndoorShort: "Binnen",
    chartOutdoorTitle: "Buitentemp",
    chartOutdoorShort: "Buiten",
    chartCopTitle: "Rendement COP",
    chartCopShort: "Rendement",
    chartFlowTitle: "Circulatiedebiet",
    chartFlowShort: "Debiet",
    chartDhwTitle: "Boilertemp",
    chartDhwShort: "Boiler",
    chartThermalTitle: "Thermisch Vermogen",
    chartThermalShort: "Thermisch",
    chartElecTitle: "Elektrisch Verbruik",
    chartElecShort: "Elektrisch",

    titleScopCard: "SCOP Rendement & Energiebalans",
    period_alltime: "Altijd",
    period_jaar: "Jaar",
    period_maand: "Maand",
    period_week: "Week",
    period_dag: "Dag",
    scopTotPrefix: "SCOP Totaal",
    scopCvPrefix: "SCOP CV",
    scopDhwPrefix: "SCOP SWW",
    tblHeaderPrefix: "Energiebalans",
    tblColThermal: "Thermisch",
    tblColElec: "Elektrisch",
    tblRowCv: "🔥 Vloerverwarming (CV)",
    tblRowDhw: "🚿 Tapwaterboiler (SWW)",
    tblFooterPrefix: "Totaal",

    titleCurveCard: "Stooklijn (Weersafhankelijk)",
    operatingPoint: "Werkpunt",
    curveTarget: "Stooklijn Doel",
    lblSliderOffset: "Stooklijn Parallel Shift (Offset):",

    cfgTitle: "⚙️ Dashboard Instellingen",
    cfgLangTitle: "🌐 Taal / Language",
    cfgLangDesc: "Kies de weergavetaal voor het dashboard (Standaard: Engels).",
    cfgCapTitle: "⚡ Warmtepomp Model (Vermogen)",
    cfgCapDesc: "Kies het vermogen van jouw LG Therma V R290 (7 kW, 9 kW of 12 kW). Kalibreert de elektrische vermogensberekening, debietschaal en labels.",
    cfgCurveTitle: "📈 Stooklijn Sturing (Inlaat of Uitlaat)",
    cfgCurveDesc: "Kies of de stooklijn stuurt op Retour/Inlaatwater (EWT) of Aanvoer/Uitlaatwater (LWT). Dit past ook het berekende hysterese-verschil in de Watertemp & ΔT grafiek aan.",
    cfgCurveInlet: "Inlaat / Retour (EWT)",
    cfgCurveOutlet: "Uitlaat / Aanvoer (LWT)",
    cfgTopoTitle: "🛢️ Hydraulische Opstelling (Buffervat Configuratie)",
    cfgTopoDesc: "Kies de fysieke opstelling van je CV-installatie. Past direct het live geanimeerde hydraulische schema aan.",
    cfgTopoDirect: "Directe Afgifte",
    cfgTopoSerial: "Serie Buffervat",
    cfgTopoParallel: "Parallel Buffervat",
    cfgDhwVolTitle: "🛢️ SWW Boiler Inhoud (Volume)",
    cfgDhwVolDesc: "Stel de inhoud van je tapwaterboiler (SWW) in liters in (Standaard: 200 L).",
    cfgDhwTitle: "🚿 SWW Doeltemperatuur Overrulen",
    cfgDhwDesc: "Gebruik de automatische Modbus-sensorwaarde of overschrijf handmatig de ingestelde SWW-doeltemperatuur.",
    cfgDhwAuto: "Auto (Sensor)",
    cfgDhwManual: "Overrulen (Handmatig)",
    cfgCurveParamsTitle: "🎛️ LG Therma V Stooklijn Configuratie",
    cfgCurveParamsDesc: "Stel de as-waarden in zodat ze exact overeenkomen met het installateursmenu van de LG thermostaat. Wordt opgeslagen in Home Assistant entiteiten voor alle apparaten.",
    cfgColdTitle: "❄️ Ontwerptemperatuur (Koud)",
    cfgColdSub: "Buitentemperatuur vs. benodigde aanvoer (bijv. -10°C buiten = 35°C aanvoer)",
    cfgMildTitle: "🌤️ Voetpunt (Mild)",
    cfgMildSub: "Buitentemperatuur vs. benodigde aanvoer (bijv. 15°C buiten = 25°C aanvoer)",
    cfgOatLow: "Buiten (Laag)",
    cfgLwtHigh: "Aanvoer (Max)",
    cfgOatHigh: "Buiten (Hoog)",
    cfgLwtLow: "Aanvoer (Min)",

    confirmPower: "⚠️ WEET JE HET ZEKER?\n\nWil je de warmtepomp daadwerkelijk aan- of uitzetten?",
    confirmDhw: "⚠️ WEET JE HET ZEKER?\n\nWil je de vrijgave voor het maken van warm tapwater wijzigen?",

    w_clear_night: "🌙 Helder",
    w_cloudy: "☁️ Bewolkt",
    w_exceptional: "⚠️ Waarschuwing",
    w_fog: "🌫️ Mist",
    w_hail: "🌨️ Hagel",
    w_lightning: "🌩️ Onweer",
    w_lightning_rainy: "⛈️ Onweer & Regen",
    w_partlycloudy: "⛅ Halfbewolkt",
    w_pouring: "🌧️ Stortregen",
    w_rainy: "🌦️ Regen",
    w_snowy: "❄️ Sneeuw",
    w_snowy_rainy: "🌨️ Natte sneeuw",
    w_sunny: "☀️ Zonnig",
    w_windy: "💨 Winderig",
    w_windy_variant: "💨 Bewolkt & Wind"
  },

  de: {
    brandSub_direct: "Direktheizkreis-Hydronik • Modbus TCP Gateway",
    brandSub_serial: "Reihenpufferspeicher-Hydronik • Modbus TCP Gateway",
    brandSub_parallel: "Parallelpufferspeicher-Hydronik • Modbus TCP Gateway",
    connLive: "LIVE HASS VERBUNDEN",
    connDemo: "DEMO-VORSCHAUMODUS",
    sysStatus: "Systemstatus:",
    diagLabel: "Diagnose:",
    diagTitle: "Klicken für CH-Fehlercodebuch & Diagnose",
    btnPower: "⚡ WP Ein/Aus",
    btnDhw: "🚿 WW Freigabe",
    btnSilent: "🌙 Flüstermodus",
    btnSettingsTitle: "Einstellungen",
    closeBtn: "✕ Schließen",
    hrShort: "h",
    now: "Jetzt",
    avgShort: "Ø",
    ttTime: "Zeit",
    ttCursorY: "Cursor Y-Achse",

    standby: "Standby",
    defrostActive: "Abtauung Aktiv",
    dhwCharging: "WW-Speicher Laden",
    ufhCh: "Fußbodenheizung (HZ)",
    postRunSniff: "Nachlauf / Schnüffelzyklus",
    faultAlert: "Störung!",

    titleCardCop: "Aktuelle Effizienz",
    copDayPrefix: "COP • Tag:",
    lblSubThermal: "Thermische Leistung",
    lblSubElec: "Elektrische Leistung",
    copTop: "Top Effizienz",
    copDhw: "WW Laden",
    copActive: "Aktiv Heizen",
    copLow: "Start / Niedrig",

    titleCardWater: "Wassertemp & ΔT",
    lblSubDeltaT: "Aktuelles Delta T (ΔT)",
    lblTargetCvInlet: "Berechneter Sollwert HZ (EWT)",
    lblTargetCvOutlet: "Berechneter Sollwert HZ (LWT)",
    badgeTargetCh: "Soll HZ:",
    badgeTargetDhw: "Soll WW:",
    supplyLwt: "Vorlauf (LWT)",
    returnEwt: "Rücklauf (EWT)",
    setpointCvShort: "Sollwert HZ",

    titleCardDhw: "200L Warmwasserspeicher",
    badgeDhwTop: "200 Liter",
    lblSubDhwTarget: "WW-Solltemperatur",
    lblSubDhwState: "WW-Status",
    dhwStateActive: "Aktiv Laden 🔥",
    dhwStateDisabled: "Freigabe Aus",
    dhwStateStandby: "Standby (Freigabe Ein)",

    titleCardIndoor: "Innen",
    badgeIndoor: "Wohnzimmer",
    lblSubIndoorShift: "Heizkurven-Offset",
    lblSubIndoorAvg: "Tagesmittel",

    titleCardOutdoor: "Außen",
    badgeOutdoor: "Witterungsgeführt",
    lblSubOutdoorBounds: "Heizkurvenbereich",
    lblSubWeather: "Aktuelles Wetter",
    toWord: "bis",

    titleCardFlow: "Zirkulation & Systemdruck",
    lblSubPressure: "Systemdruck",
    lblSubMassFlow: "Massenstrom",
    massFlowUnit: "L/h",
    pumpLowFlow: "Durchfluss zu niedrig!",
    pumpCompOn: "Verdichter & Pumpe EIN",
    pumpSniff: "Pumpe Aktiv (Schnüffel)",
    pumpOff: "Pumpe Aus",
    valveSniff: "Schnüffelzyklus (HZ)",
    valveDhw: "WW-Speicher",
    valveUfh: "Fußbodenheizung",

    titleSchematic: "Live Hydronik-Schema",
    schemDhw: "Aktiv: 200L WW-Speicher",
    schemCh: "Aktiv: Fußbodenheizung (HZ)",
    schemSniff: "Standby (Schnüffelzyklus Aktiv)",
    schemIdle: "Standby (Kein Wärmebedarf)",
    svgActive: "AKTIV",
    svgIdle: "RUHE",
    svgOutdoorPrefix: "Außen:",
    svgIndoorPrefix: "🏠 Innentemp:",
    svgValveTitle: "3-WEGE",
    svgValveDhw: "→ WW",
    svgValveCh: "→ HZ",
    svgBoilerTitle: "200L Warmwasserspeicher",
    svgBoilerCharging: "LÄDT JETZT 🔥",
    svgBoilerDisabled: "Freigabe Aus",
    svgSlabTitle_direct: "Fußbodenheizung (Direkt HZ)",
    svgSlabTitle_serial: "Fußbodenheizung (Reihenpuffer)",
    svgSlabTitle_parallel: "Fußbodenheizung (Parallelpuffer)",
    svgBufSerial: "REIHEN",
    svgBufParallel: "PARALLEL",
    svgBufSub: "PUFFER",
    svgSlabOutput: "Abgabe:",
    stripPressure: "Wasserdruck (24h Diagramm)",
    stripThermal: "Thermische Leistung (24h)",
    stripElec: "Elektrischer Verbrauch (24h)",

    drawerErrorTitle: "CH-Fehlercodes & Diagnose",
    codesWord: "Codes",
    errSearchPlaceholder: "Fehlercode suchen (z.B. CH14, CH32) oder Stichwort (Durchfluss, Sensor, Druck)...",
    chartWaterTitle: "Wassertemp & ΔT",
    chartPressureTitle: "Wasserdruck",
    chartPressureShort: "Wasserdruck",
    chartIndoorTitle: "Innentemp",
    chartIndoorShort: "Innen",
    chartOutdoorTitle: "Außentemp",
    chartOutdoorShort: "Außen",
    chartCopTitle: "Effizienz COP",
    chartCopShort: "Effizienz",
    chartFlowTitle: "Volumenstrom",
    chartFlowShort: "Durchfluss",
    chartDhwTitle: "Speichertemp",
    chartDhwShort: "Speicher",
    chartThermalTitle: "Thermische Leistung",
    chartThermalShort: "Thermisch",
    chartElecTitle: "Elektrische Leistung",
    chartElecShort: "Elektrisch",

    titleScopCard: "SCOP Effizienz & Energiebilanz",
    period_alltime: "Gesamt",
    period_jaar: "Jahr",
    period_maand: "Monat",
    period_week: "Woche",
    period_dag: "Tag",
    scopTotPrefix: "SCOP Gesamt",
    scopCvPrefix: "SCOP HZ",
    scopDhwPrefix: "SCOP WW",
    tblHeaderPrefix: "Energiebilanz",
    tblColThermal: "Thermisch",
    tblColElec: "Elektrisch",
    tblRowCv: "🔥 Fußbodenheizung (HZ)",
    tblRowDhw: "🚿 Warmwasserspeicher (WW)",
    tblFooterPrefix: "Gesamt",

    titleCurveCard: "Heizkurve (Witterungsgeführt)",
    operatingPoint: "Arbeitspunkt",
    curveTarget: "Heizkurven-Soll",
    lblSliderOffset: "Heizkurven-Parallelverschiebung (Offset):",

    cfgTitle: "⚙️ Dashboard-Konfiguration",
    cfgLangTitle: "🌐 Sprache / Language",
    cfgLangDesc: "Wählen Sie die Anzeigesprache für das Dashboard (Standard: Englisch).",
    cfgCapTitle: "⚡ Wärmepumpen-Modell (Leistung)",
    cfgCapDesc: "Wählen Sie die Leistung Ihrer LG Therma V R290 (7 kW, 9 kW oder 12 kW). Kalibriert die elektrische Leistungsberechnung und Durchflussskalierung.",
    cfgCurveTitle: "📈 Heizkurven-Regelung (Rücklauf oder Vorlauf)",
    cfgCurveDesc: "Wählen Sie, ob die Heizkurve nach Rücklaufwasser (EWT) oder Vorlaufwasser (LWT) regelt. Passt auch die Hysterese-Differenz im Wassertemp & ΔT Diagramm an.",
    cfgCurveInlet: "Einlass / Rücklauf (EWT)",
    cfgCurveOutlet: "Auslass / Vorlauf (LWT)",
    cfgTopoTitle: "🛢️ Hydraulik-Aufbau (Pufferspeicher)",
    cfgTopoDesc: "Wählen Sie das physische Hydraulikschema Ihrer Heizungsanlage. Aktualisiert das animierte Live-Schema.",
    cfgTopoDirect: "Direktheizkreis",
    cfgTopoSerial: "Reihenpuffer",
    cfgTopoParallel: "Parallelpuffer",
    cfgDhwVolTitle: "🛢️ Warmwasserspeicher-Größe (Volumen)",
    cfgDhwVolDesc: "Stellen Sie das Volumen Ihres Warmwasserspeichers (WW) in Litern ein (Standard: 200 L).",
    cfgDhwTitle: "🚿 WW-Solltemperatur Überschreiben",
    cfgDhwDesc: "Automatischen Modbus-Sensorwert verwenden oder die WW-Solltemperatur manuell überschreiben.",
    cfgDhwAuto: "Auto (Sensor)",
    cfgDhwManual: "Überschreiben (Manuell)",
    cfgCurveParamsTitle: "🎛️ LG Therma V Heizkurven-Parameter",
    cfgCurveParamsDesc: "Stellen Sie die Achsenwerte passend zum Installateurmenü des LG-Thermostats ein. Wird geräteübergreifend in Home Assistant Entitäten gespeichert.",
    cfgColdTitle: "❄️ Auslegungstemperatur (Kalt)",
    cfgColdSub: "Außentemperatur vs. erforderliche Wassertemp. (z.B. -10°C außen = 35°C Wasser)",
    cfgMildTitle: "🌤️ Fußpunkt (Mild)",
    cfgMildSub: "Außentemperatur vs. erforderliche Wassertemp. (z.B. 15°C außen = 25°C Wasser)",
    cfgOatLow: "Außen (Tief)",
    cfgLwtHigh: "Vorlauf (Max)",
    cfgOatHigh: "Außen (Hoch)",
    cfgLwtLow: "Vorlauf (Min)",

    confirmPower: "⚠️ SIND SIE SICHER?\n\nMöchten Sie die Wärmepumpe wirklich EIN- oder AUSSCHALTEN?",
    confirmDhw: "⚠️ SIND SIE SICHER?\n\nMöchten Sie die Warmwasser-Freigabe wirklich umschalten?",

    w_clear_night: "🌙 Klar",
    w_cloudy: "☁️ Bewölkt",
    w_exceptional: "⚠️ Warnung",
    w_fog: "🌫️ Nebel",
    w_hail: "🌨️ Hagel",
    w_lightning: "🌩️ Gewitter",
    w_lightning_rainy: "⛈️ Gewitter & Regen",
    w_partlycloudy: "⛅ Teilweise bewölkt",
    w_pouring: "🌧️ Starkregen",
    w_rainy: "🌦️ Regen",
    w_snowy: "❄️ Schnee",
    w_snowy_rainy: "🌨️ Schneeregen",
    w_sunny: "☀️ Sonnig",
    w_windy: "💨 Windig",
    w_windy_variant: "💨 Bewölkt & Wind"
  },

  fr: {
    brandSub_direct: "Topologie Hydronique Directe • Passerelle Modbus TCP",
    brandSub_serial: "Topologie Ballon Tampon Série • Passerelle Modbus TCP",
    brandSub_parallel: "Topologie Ballon Tampon Parallèle • Passerelle Modbus TCP",
    connLive: "HASS CONNECTÉ EN DIRECT",
    connDemo: "MODE APERÇU DÉMO",
    sysStatus: "État du système :",
    diagLabel: "Diagnostic :",
    diagTitle: "Cliquez pour le manuel des codes d'erreur CH & diagnostic",
    btnPower: "⚡ PAC Marche/Arrêt",
    btnDhw: "🚿 Autorisation ECS",
    btnSilent: "🌙 Mode Silence",
    btnSettingsTitle: "Paramètres",
    closeBtn: "✕ Fermer",
    hrShort: "h",
    now: "Maint.",
    avgShort: "Moy",
    ttTime: "Heure",
    ttCursorY: "Curseur axe Y",

    standby: "Veille",
    defrostActive: "Dégivrage Actif",
    dhwCharging: "Charge Ballon ECS",
    ufhCh: "Plancher Chauffant (CH)",
    postRunSniff: "Post-circulation / Cycle de détection",
    faultAlert: "Défaut !",

    titleCardCop: "Rendement Actuel",
    copDayPrefix: "COP • Jour :",
    lblSubThermal: "Puissance Thermique",
    lblSubElec: "Puissance Électrique",
    copTop: "Rendement Optimal",
    copDhw: "Charge ECS",
    copActive: "Chauffage Actif",
    copLow: "Démarrage / Bas",

    titleCardWater: "Temp. Eau & ΔT",
    lblSubDeltaT: "Delta T Actuel (ΔT)",
    lblTargetCvInlet: "Consigne CH Calculée (EWT)",
    lblTargetCvOutlet: "Consigne CH Calculée (LWT)",
    badgeTargetCh: "Cible CH :",
    badgeTargetDhw: "Cible ECS :",
    supplyLwt: "Départ (LWT)",
    returnEwt: "Retour (EWT)",
    setpointCvShort: "Consigne CH",

    titleCardDhw: "Ballon ECS 200L",
    badgeDhwTop: "200 Litres",
    lblSubDhwTarget: "Temp. Cible ECS",
    lblSubDhwState: "État ECS",
    dhwStateActive: "Charge en cours 🔥",
    dhwStateDisabled: "Désactivé (Attente)",
    dhwStateStandby: "Veille (Autorisé)",

    titleCardIndoor: "Intérieur",
    badgeIndoor: "Salon",
    lblSubIndoorShift: "Décalage Loi d'Eau",
    lblSubIndoorAvg: "Moyenne du Jour",

    titleCardOutdoor: "Extérieur",
    badgeOutdoor: "Loi d'eau climatique",
    lblSubOutdoorBounds: "Plage Loi d'Eau",
    lblSubWeather: "Météo Actuelle",
    toWord: "à",

    titleCardFlow: "Circulation & Pression Système",
    lblSubPressure: "Pression Système",
    lblSubMassFlow: "Débit Massique",
    massFlowUnit: "L/h",
    pumpLowFlow: "Débit Trop Faible !",
    pumpCompOn: "Compresseur & Pompe ON",
    pumpSniff: "Pompe Active (Détection)",
    pumpOff: "Pompe Arrêtée",
    valveSniff: "Cycle détection (CH)",
    valveDhw: "Ballon ECS",
    valveUfh: "Plancher Chauffant",

    titleSchematic: "Schéma Hydronique en Direct",
    schemDhw: "Actif : Ballon ECS 200L",
    schemCh: "Actif : Plancher Chauffant (CH)",
    schemSniff: "Veille (Cycle de détection actif)",
    schemIdle: "Veille (Aucune demande)",
    svgActive: "ACTIF",
    svgIdle: "VEILLE",
    svgOutdoorPrefix: "Extérieur :",
    svgIndoorPrefix: "🏠 Intérieur :",
    svgValveTitle: "3-VOIES",
    svgValveDhw: "→ ECS",
    svgValveCh: "→ CH",
    svgBoilerTitle: "Ballon d'Eau Chaude ECS 200L",
    svgBoilerCharging: "EN CHARGE 🔥",
    svgBoilerDisabled: "Désactivé",
    svgSlabTitle_direct: "Plancher Chauffant (CH Direct)",
    svgSlabTitle_serial: "Plancher Chauffant (Tampon Série)",
    svgSlabTitle_parallel: "Plancher Chauffant (Tampon Parallèle)",
    svgBufSerial: "SÉRIE",
    svgBufParallel: "PARALLÈLE",
    svgBufSub: "TAMPON",
    svgSlabOutput: "Émission :",
    stripPressure: "Pression d'Eau (graph. 24h)",
    stripThermal: "Puissance Thermique (24h)",
    stripElec: "Conso. Électrique (24h)",

    drawerErrorTitle: "Codes d'Erreur CH & Diagnostic",
    codesWord: "Codes",
    errSearchPlaceholder: "Rechercher un code (ex. CH14, CH32) ou mot-clé (débit, sonde, pression)...",
    chartWaterTitle: "Temp. Eau & ΔT",
    chartPressureTitle: "Pression d'Eau",
    chartPressureShort: "Pression",
    chartIndoorTitle: "Temp. Intérieure",
    chartIndoorShort: "Intérieur",
    chartOutdoorTitle: "Temp. Extérieure",
    chartOutdoorShort: "Extérieur",
    chartCopTitle: "Rendement COP",
    chartCopShort: "Rendement",
    chartFlowTitle: "Débit de Circulation",
    chartFlowShort: "Débit",
    chartDhwTitle: "Temp. Ballon ECS",
    chartDhwShort: "Ballon ECS",
    chartThermalTitle: "Puissance Thermique",
    chartThermalShort: "Thermique",
    chartElecTitle: "Puissance Électrique",
    chartElecShort: "Électrique",

    titleScopCard: "Rendement SCOP & Bilan Énergétique",
    period_alltime: "Toujours",
    period_jaar: "Année",
    period_maand: "Mois",
    period_week: "Semaine",
    period_dag: "Jour",
    scopTotPrefix: "SCOP Total",
    scopCvPrefix: "SCOP CH",
    scopDhwPrefix: "SCOP ECS",
    tblHeaderPrefix: "Bilan Énergétique",
    tblColThermal: "Thermique",
    tblColElec: "Électrique",
    tblRowCv: "🔥 Plancher Chauffant (CH)",
    tblRowDhw: "🚿 Ballon d'Eau Chaude (ECS)",
    tblFooterPrefix: "Total",

    titleCurveCard: "Loi d'Eau (Compensation Climatique)",
    operatingPoint: "Point de fonct.",
    curveTarget: "Cible Loi d'Eau",
    lblSliderOffset: "Décalage Parallèle Loi d'Eau (Offset) :",

    cfgTitle: "⚙️ Configuration du Tableau de Bord",
    cfgLangTitle: "🌐 Langue / Language",
    cfgLangDesc: "Sélectionnez la langue d'affichage du tableau de bord (Par défaut : Anglais).",
    cfgCapTitle: "⚡ Modèle de Pompe à Chaleur (Puissance)",
    cfgCapDesc: "Sélectionnez la puissance de votre LG Therma V R290 (7 kW, 9 kW ou 12 kW). Calibre le calcul électrique et l'échelle de débit.",
    cfgCurveTitle: "📈 Régulation Loi d'Eau (Entrée ou Sortie)",
    cfgCurveDesc: "Choisissez si la loi d'eau régule sur l'eau de Retour/Entrée (EWT) ou de Départ/Sortie (LWT). Met également à jour l'écart d'hystérésis dans le graphique Temp. Eau & ΔT.",
    cfgCurveInlet: "Entrée / Retour (EWT)",
    cfgCurveOutlet: "Sortie / Départ (LWT)",
    cfgTopoTitle: "🛢️ Configuration Hydraulique (Ballon Tampon)",
    cfgTopoDesc: "Sélectionnez le schéma hydraulique de votre installation. Met à jour le schéma animé en direct.",
    cfgTopoDirect: "Chauffage Direct",
    cfgTopoSerial: "Tampon en Série",
    cfgTopoParallel: "Tampon Parallèle",
    cfgDhwVolTitle: "🛢️ Capacité du Ballon ECS (Volume)",
    cfgDhwVolDesc: "Réglez le volume de votre ballon d'eau chaude sanitaire (ECS) en litres (Par défaut : 200 L).",
    cfgDhwTitle: "🚿 Forçage Température Cible ECS",
    cfgDhwDesc: "Utiliser la sonde Modbus automatique ou définir manuellement la température cible ECS.",
    cfgDhwAuto: "Auto (Sonde)",
    cfgDhwManual: "Forcer (Manuel)",
    cfgCurveParamsTitle: "🎛️ Paramètres de la Loi d'Eau LG Therma V",
    cfgCurveParamsDesc: "Réglez les valeurs des axes pour correspondre au menu installateur du thermostat LG. Enregistré dans les entités Home Assistant sur tous vos appareils.",
    cfgColdTitle: "❄️ Température de Base (Froid)",
    cfgColdSub: "Température extérieure vs. eau requise (ex. -10°C ext. = 35°C eau)",
    cfgMildTitle: "🌤️ Point de Pied (Doux)",
    cfgMildSub: "Température extérieure vs. eau requise (ex. 15°C ext. = 25°C eau)",
    cfgOatLow: "Extérieur (Bas)",
    cfgLwtHigh: "Départ (Max)",
    cfgOatHigh: "Extérieur (Haut)",
    cfgLwtLow: "Départ (Min)",

    confirmPower: "⚠️ ÊTES-VOUS SÛR ?\n\nVoulez-vous vraiment allumer ou éteindre la pompe à chaleur ?",
    confirmDhw: "⚠️ ÊTES-VOUS SÛR ?\n\nVoulez-vous vraiment modifier l'autorisation de chauffe du ballon ECS ?",

    w_clear_night: "🌙 Nuit claire",
    w_cloudy: "☁️ Nuageux",
    w_exceptional: "⚠️ Alerte",
    w_fog: "🌫️ Brouillard",
    w_hail: "🌨️ Grêle",
    w_lightning: "🌩️ Orage",
    w_lightning_rainy: "⛈️ Orage & Pluie",
    w_partlycloudy: "⛅ Éclaircies",
    w_pouring: "🌧️ Forte pluie",
    w_rainy: "🌦️ Pluie",
    w_snowy: "❄️ Neige",
    w_snowy_rainy: "🌨️ Neige fondue",
    w_sunny: "☀️ Ensoleillé",
    w_windy: "💨 Venteux",
    w_windy_variant: "💨 Nuageux & Vent"
  },

  es: {
    brandSub_direct: "Topología Hidrónica Directa • Pasarela Modbus TCP",
    brandSub_serial: "Topología Depósito de Inercia en Serie • Pasarela Modbus TCP",
    brandSub_parallel: "Topología Depósito de Inercia en Paralelo • Pasarela Modbus TCP",
    connLive: "HASS CONECTADO EN VIVO",
    connDemo: "MODO VISTA PREVIA DEMO",
    sysStatus: "Estado del sistema:",
    diagLabel: "Diagnóstico:",
    diagTitle: "Haga clic para ver el manual de códigos CH y diagnóstico",
    btnPower: "⚡ BC Encender/Apagar",
    btnDhw: "🚿 Habilitar ACS",
    btnSilent: "🌙 Modo Silencioso",
    btnSettingsTitle: "Ajustes",
    closeBtn: "✕ Cerrar",
    hrShort: "h",
    now: "Ahora",
    avgShort: "Prom",
    ttTime: "Hora",
    ttCursorY: "Cursor eje Y",

    standby: "En espera",
    defrostActive: "Desescarche Activo",
    dhwCharging: "Cargando Depósito ACS",
    ufhCh: "Suelo Radiante (CC)",
    postRunSniff: "Post-circulación / Ciclo de sondeo",
    faultAlert: "¡Avería!",

    titleCardCop: "Rendimiento Actual",
    copDayPrefix: "COP • Día:",
    lblSubThermal: "Potencia Térmica",
    lblSubElec: "Potencia Eléctrica",
    copTop: "Máximo Rendimiento",
    copDhw: "Cargando ACS",
    copActive: "Calefacción Activa",
    copLow: "Arranque / Bajo",

    titleCardWater: "Temp. Agua y ΔT",
    lblSubDeltaT: "Delta T Actual (ΔT)",
    lblTargetCvInlet: "Consigna CC Calculada (EWT)",
    lblTargetCvOutlet: "Consigna CC Calculada (LWT)",
    badgeTargetCh: "Objetivo CC:",
    badgeTargetDhw: "Objetivo ACS:",
    supplyLwt: "Impulsión (LWT)",
    returnEwt: "Retorno (EWT)",
    setpointCvShort: "Consigna CC",

    titleCardDhw: "Depósito ACS 200L",
    badgeDhwTop: "200 Litros",
    lblSubDhwTarget: "Temp. Objetivo ACS",
    lblSubDhwState: "Estado ACS",
    dhwStateActive: "Cargando Activamente 🔥",
    dhwStateDisabled: "Deshabilitado (Espera)",
    dhwStateStandby: "En espera (Habilitado)",

    titleCardIndoor: "Interior",
    badgeIndoor: "Salón",
    lblSubIndoorShift: "Desplazamiento Curva",
    lblSubIndoorAvg: "Promedio Diario",

    titleCardOutdoor: "Exterior",
    badgeOutdoor: "Compensación Climática",
    lblSubOutdoorBounds: "Rango de Curva",
    lblSubWeather: "Clima Actual",
    toWord: "a",

    titleCardFlow: "Circulación y Presión",
    lblSubPressure: "Presión del Sistema",
    lblSubMassFlow: "Caudal Másico",
    massFlowUnit: "L/h",
    pumpLowFlow: "¡Caudal Muy Bajo!",
    pumpCompOn: "Compresor y Bomba ON",
    pumpSniff: "Bomba Activa (Sondeo)",
    pumpOff: "Bomba Apagada",
    valveSniff: "Ciclo de sondeo (CC)",
    valveDhw: "Depósito ACS",
    valveUfh: "Suelo Radiante",

    titleSchematic: "Esquema Hidrónico en Vivo",
    schemDhw: "Activo: Depósito ACS 200L",
    schemCh: "Activo: Suelo Radiante (CC)",
    schemSniff: "En espera (Ciclo de sondeo activo)",
    schemIdle: "En espera (Sin demanda térmica)",
    svgActive: "ACTIVO",
    svgIdle: "REPOSO",
    svgOutdoorPrefix: "Exterior:",
    svgIndoorPrefix: "🏠 Interior:",
    svgValveTitle: "3-VÍAS",
    svgValveDhw: "→ ACS",
    svgValveCh: "→ CC",
    svgBoilerTitle: "Depósito Agua Caliente ACS 200L",
    svgBoilerCharging: "CARGANDO AHORA 🔥",
    svgBoilerDisabled: "Deshabilitado",
    svgSlabTitle_direct: "Suelo Radiante (CC Directo)",
    svgSlabTitle_serial: "Suelo Radiante (Inercia Serie)",
    svgSlabTitle_parallel: "Suelo Radiante (Inercia Paralelo)",
    svgBufSerial: "SERIE",
    svgBufParallel: "PARALELO",
    svgBufSub: "INERCIA",
    svgSlabOutput: "Entrega:",
    stripPressure: "Presión de Agua (gráf. 24h)",
    stripThermal: "Potencia Térmica (gráf. 24h)",
    stripElec: "Consumo Eléctrico (gráf. 24h)",

    drawerErrorTitle: "Códigos de Error CH y Diagnóstico",
    codesWord: "Códigos",
    errSearchPlaceholder: "Buscar código (ej. CH14, CH32) o palabra clave (caudal, sensor, presión)...",
    chartWaterTitle: "Temp. Agua y ΔT",
    chartPressureTitle: "Presión de Agua",
    chartPressureShort: "Presión",
    chartIndoorTitle: "Temp. Interior",
    chartIndoorShort: "Interior",
    chartOutdoorTitle: "Temp. Exterior",
    chartOutdoorShort: "Exterior",
    chartCopTitle: "Rendimiento COP",
    chartCopShort: "Rendimiento",
    chartFlowTitle: "Caudal de Circulación",
    chartFlowShort: "Caudal",
    chartDhwTitle: "Temp. Depósito ACS",
    chartDhwShort: "Depósito ACS",
    chartThermalTitle: "Potencia Térmica",
    chartThermalShort: "Térmica",
    chartElecTitle: "Potencia Eléctrica",
    chartElecShort: "Eléctrica",

    titleScopCard: "Rendimiento SCOP y Balance Energético",
    period_alltime: "Siempre",
    period_jaar: "Año",
    period_maand: "Mes",
    period_week: "Semana",
    period_dag: "Día",
    scopTotPrefix: "SCOP Total",
    scopCvPrefix: "SCOP CC",
    scopDhwPrefix: "SCOP ACS",
    tblHeaderPrefix: "Balance Energético",
    tblColThermal: "Térmico",
    tblColElec: "Eléctrico",
    tblRowCv: "🔥 Suelo Radiante (CC)",
    tblRowDhw: "🚿 Depósito ACS (ACS)",
    tblFooterPrefix: "Total",

    titleCurveCard: "Curva de Calefacción (Climática)",
    operatingPoint: "Punto de trab.",
    curveTarget: "Objetivo Curva",
    lblSliderOffset: "Desplazamiento Paralelo de Curva (Offset):",

    cfgTitle: "⚙️ Configuración del Panel",
    cfgLangTitle: "🌐 Idioma / Language",
    cfgLangDesc: "Seleccione el idioma de visualización del panel (Predeterminado: Inglés).",
    cfgCapTitle: "⚡ Modelo de Bomba de Calor (Potencia)",
    cfgCapDesc: "Seleccione la potencia de su LG Therma V R290 (7 kW, 9 kW o 12 kW). Calibra el cálculo eléctrico y la escala de caudal.",
    cfgCurveTitle: "📈 Control de Curva (Entrada o Salida)",
    cfgCurveDesc: "Elija si la curva de calefacción controla el agua de Retorno/Entrada (EWT) o Impulsión/Salida (LWT). También actualiza la diferencia de histéresis en la gráfica de Temp. Agua y ΔT.",
    cfgCurveInlet: "Entrada / Retorno (EWT)",
    cfgCurveOutlet: "Salida / Impulsión (LWT)",
    cfgTopoTitle: "🛢️ Esquema Hidrónico (Depósito de Inercia)",
    cfgTopoDesc: "Seleccione el esquema físico de su instalación. Actualiza el esquema hidrónico animado en vivo.",
    cfgTopoDirect: "Calefacción Directa",
    cfgTopoSerial: "Inercia en Serie",
    cfgTopoParallel: "Inercia en Paralelo",
    cfgDhwVolTitle: "🛢️ Tamaño del Depósito ACS (Volumen)",
    cfgDhwVolDesc: "Ajuste el volumen de su depósito de agua caliente sanitaria (ACS) en litros (Predeterminado: 200 L).",
    cfgDhwTitle: "🚿 Anular Temperatura Objetivo ACS",
    cfgDhwDesc: "Usar el valor automático del sensor Modbus o fijar manualmente la temperatura objetivo de ACS.",
    cfgDhwAuto: "Auto (Sensor)",
    cfgDhwManual: "Anular (Manual)",
    cfgCurveParamsTitle: "🎛️ Parámetros de la Curva LG Therma V",
    cfgCurveParamsDesc: "Ajuste los valores de los ejes para que coincidan con el menú de instalador del termostato LG. Guardado en entidades de Home Assistant para todos los dispositivos.",
    cfgColdTitle: "❄️ Temperatura de Diseño (Frío)",
    cfgColdSub: "Temperatura exterior vs. agua requerida (ej. -10°C ext. = 35°C agua)",
    cfgMildTitle: "🌤️ Punto Base (Templado)",
    cfgMildSub: "Temperatura exterior vs. agua requerida (ej. 15°C ext. = 25°C agua)",
    cfgOatLow: "Exterior (Bajo)",
    cfgLwtHigh: "Impulsión (Máx)",
    cfgOatHigh: "Exterior (Alto)",
    cfgLwtLow: "Impulsión (Mín)",

    confirmPower: "⚠️ ¿ESTÁ SEGURO?\n\n¿Realmente desea ENCENDER o APAGAR la bomba de calor?",
    confirmDhw: "⚠️ ¿ESTÁ SEGURO?\n\n¿Desea cambiar la habilitación de calentamiento del depósito ACS?",

    w_clear_night: "🌙 Despejado",
    w_cloudy: "☁️ Nublado",
    w_exceptional: "⚠️ Alerta",
    w_fog: "🌫️ Niebla",
    w_hail: "🌨️ Granizo",
    w_lightning: "🌩️ Tormenta",
    w_lightning_rainy: "⛈️ Tormenta y Lluvia",
    w_partlycloudy: "⛅ Parcialmente nublado",
    w_pouring: "🌧️ Lluvia intensa",
    w_rainy: "🌦️ Lluvia",
    w_snowy: "❄️ Nieve",
    w_snowy_rainy: "🌨️ Aguanieve",
    w_sunny: "☀️ Soleado",
    w_windy: "💨 Ventoso",
    w_windy_variant: "💨 Nublado y Viento"
  }
};

function t(key) {
  const dict = I18N[userSettings.lang] || I18N.en;
  const raw = dict[key] !== undefined ? dict[key] : (I18N.en[key] || key);
  if (key === "titleCardDhw" || key === "badgeDhwTop" || key === "schemDhw" || key === "svgBoilerTitle") {
    const vol = userSettings.dhwTankVolume || 200;
    return String(raw).replace(/200/g, String(vol));
  }
  return raw;
}

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
  demoSig: "",
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

// Interactive state used only when running outside Home Assistant (DEMO PREVIEW MODE)
const demoState = {
  swPowerOn: true,
  swDhwOn: true,
  swSilentOn: false,
  dhwMode: 0, // 0 = DHW Enabled (Standby, CH Heating), 1 = DHW Charging Active, 2 = DHW Disabled
  isSwwActive: false
};

function ensureDemoHistory() {
  if (historySeries.hasRealData) return;
  const oatLow = userSettings.oatLow !== undefined ? userSettings.oatLow : -10;
  const lwtHigh = userSettings.lwtHigh !== undefined ? userSettings.lwtHigh : 35;
  const oatHigh = userSettings.oatHigh !== undefined ? userSettings.oatHigh : 15;
  const lwtLow = userSettings.lwtLow !== undefined ? userSettings.lwtLow : 25;
  const capNum = parseInt(userSettings.modelCapacity || "7", 10);
  const capScale = capNum >= 12 ? 1.62 : (capNum >= 9 ? 1.26 : 1.0);
  const curveMode = userSettings.curveControl || "inlet";
  const shiftVal = currentState.shift || 0;

  const sig = `${capNum}|${curveMode}|${oatLow}|${lwtHigh}|${oatHigh}|${lwtLow}|${shiftVal}`;
  if (historySeries.demoSig === sig && historySeries.supply.length > 10) return;
  historySeries.demoSig = sig;

  const supply = [];
  const ret = [];
  const pressure = [];
  const thermal = [];
  const elec = [];
  const indoor = [];
  const outdoor = [];
  const shift = [];
  const cop = [];
  const flow = [];
  const dhw = [];

  for (let i = 0; i <= 96; i++) {
    const hr = +(i * 0.25).toFixed(2);
    // Realistic 24h outdoor curve (dips to ~3.6°C early morning, peaks ~8.6°C afternoon, ends at 6.5°C)
    const oat = +(6.1 - 2.4 * Math.cos(((hr - 3.5) / 24) * Math.PI * 2) + 0.35 * Math.sin(hr * 0.8)).toFixed(1);
    const ind = +(20.5 + 0.2 * Math.sin(((hr - 8) / 24) * Math.PI * 2)).toFixed(1);

    let baseTarget;
    if (oat <= oatLow) baseTarget = lwtHigh;
    else if (oat >= oatHigh) baseTarget = lwtLow;
    else baseTarget = lwtHigh - ((oat - oatLow) / (oatHigh - oatLow)) * (lwtHigh - lwtLow);
    const targetCv = baseTarget + shiftVal;

    // 200L DHW tank profile with morning draw (hr=7.5) and afternoon reheat cycle (hr=14.0..14.75)
    let dhwVal;
    if (hr < 7.0) {
      dhwVal = 49.4 - hr * 0.22;
    } else if (hr < 8.0) {
      dhwVal = 47.8 - (hr - 7.0) * 3.2;
    } else if (hr < 14.0) {
      dhwVal = 44.6 - (hr - 8.0) * 0.25;
    } else if (hr <= 14.75) {
      dhwVal = 43.1 + ((hr - 14.0) / 0.75) * 7.5;
    } else {
      dhwVal = 50.6 - ((hr - 14.75) / 9.25) * 2.4;
    }
    dhwVal = +dhwVal.toFixed(1);

    const isStandbyWindow = hr >= 11.75 && hr <= 12.75;
    const isDhwWindow = hr >= 14.0 && hr <= 14.75;

    let fVal, supVal, retVal, thVal, elVal, copVal, pVal;
    if (isStandbyWindow) {
      fVal = 0.0;
      supVal = +(targetCv - 1.1).toFixed(1);
      retVal = +(targetCv - 1.4).toFixed(1);
      thVal = 0.0;
      elVal = 0.01;
      copVal = 0.0;
      pVal = 1.7;
    } else if (isDhwWindow) {
      fVal = +(18.4 * capScale).toFixed(1);
      const dT = 3.55;
      supVal = +(dhwVal + 4.2).toFixed(1);
      retVal = +(supVal - dT).toFixed(1);
      thVal = +(((fVal / 60.0) * 4.186 * dT)).toFixed(2);
      copVal = +(3.42 - (dhwVal - 43.0) * 0.035).toFixed(2);
      elVal = +(thVal / copVal).toFixed(2);
      pVal = 1.9;
    } else {
      fVal = +((16.2 + 0.7 * Math.cos(hr * 0.55)) * capScale).toFixed(1);
      const dT = +(3.12 + 0.28 * Math.cos(((hr - 4) / 24) * Math.PI * 2)).toFixed(2);
      const wave = 0.2 * Math.sin(hr * 0.9);
      if (curveMode === "outlet") {
        supVal = +(targetCv + 0.15 + wave).toFixed(1);
        retVal = +(supVal - dT).toFixed(1);
      } else {
        retVal = +(targetCv + 0.15 + wave).toFixed(1);
        supVal = +(retVal + dT).toFixed(1);
      }
      const actualDt = +(supVal - retVal).toFixed(2);
      thVal = +(((fVal / 60.0) * 4.186 * actualDt)).toFixed(2);
      copVal = +(4.86 + (oat - 6.0) * 0.08 - (supVal - 29.0) * 0.04 - (capNum - 7) * 0.03).toFixed(2);
      elVal = +(thVal / copVal).toFixed(2);
      pVal = 1.8;
    }

    outdoor.push({ hr, val: oat });
    indoor.push({ hr, val: ind });
    shift.push({ hr, val: shiftVal });
    dhw.push({ hr, val: dhwVal });
    flow.push({ hr, val: fVal });
    supply.push({ hr, val: supVal });
    ret.push({ hr, val: retVal });
    thermal.push({ hr, val: thVal });
    elec.push({ hr, val: elVal });
    cop.push({ hr, val: copVal });
    pressure.push({ hr, val: pVal });
  }

  historySeries.outdoor = outdoor;
  historySeries.indoor = indoor;
  historySeries.shift = shift;
  historySeries.dhw = dhw;
  historySeries.flow = flow;
  historySeries.supply = supply;
  historySeries.ret = ret;
  historySeries.thermal = thermal;
  historySeries.elec = elec;
  historySeries.cop = cop;
  historySeries.pressure = pressure;
}

// =========================================================================
// SETTINGS MODAL & LANGUAGE APPLICATION
// =========================================================================
function openSettingsModal() {
  syncSettingsModalUI();
  document.getElementById("settingsModalBackdrop").classList.add("open");
}

function closeSettingsModal() {
  document.getElementById("settingsModalBackdrop").classList.remove("open");
}

function handleModalBackdropClick(e) {
  if (e.target && e.target.id === "settingsModalBackdrop") {
    closeSettingsModal();
  }
}

function syncSettingsModalUI() {
  ["en", "nl", "de", "fr", "es"].forEach((l) => {
    const btn = document.getElementById("btnLang_" + l);
    if (btn) btn.classList.toggle("active", userSettings.lang === l);
  });

  ["7", "9", "12"].forEach((cap) => {
    const b = document.getElementById("btnCap_" + cap);
    if (b) b.classList.toggle("active", (userSettings.modelCapacity || "7") === cap);
  });

  const btnInlet = document.getElementById("btnCurve_inlet");
  const btnOutlet = document.getElementById("btnCurve_outlet");
  if (btnInlet) btnInlet.classList.toggle("active", userSettings.curveControl === "inlet");
  if (btnOutlet) btnOutlet.classList.toggle("active", userSettings.curveControl === "outlet");

  ["direct", "serial", "parallel"].forEach((topo) => {
    const b = document.getElementById("btnTopo_" + topo);
    if (b) b.classList.toggle("active", (userSettings.hydronicTopology || "direct") === topo);
  });

  const volVal = userSettings.dhwTankVolume || 200;
  const volSlider = document.getElementById("dhwVolSlider");
  if (volSlider) volSlider.value = volVal;
  const volLbl = document.getElementById("dhwVolLabel");
  if (volLbl) volLbl.textContent = volVal + " L";

  const btnAuto = document.getElementById("btnDhwMode_auto");
  const btnManual = document.getElementById("btnDhwMode_manual");
  if (btnAuto) btnAuto.classList.toggle("active", !userSettings.dhwOverrideEnabled);
  if (btnManual) btnManual.classList.toggle("active", userSettings.dhwOverrideEnabled);

  const row = document.getElementById("dhwOverrideRow");
  if (row) row.classList.toggle("disabled", !userSettings.dhwOverrideEnabled);

  const slider = document.getElementById("dhwOverrideSlider");
  if (slider) slider.value = userSettings.dhwOverrideTemp;

  const lbl = document.getElementById("dhwOverrideLabel");
  if (lbl) lbl.textContent = userSettings.dhwOverrideTemp.toFixed(1) + " °C";

  Object.keys(CURVE_PARAM_META).forEach((k) => {
    const val = userSettings[k] !== undefined ? userSettings[k] : CURVE_PARAM_META[k].def;
    const sEl = document.getElementById("sliderParam_" + k);
    if (sEl) sEl.value = val;
    const lEl = document.getElementById("lblParam_" + k);
    if (lEl) lEl.textContent = val + " °C";
  });
}

function applyStaticTranslations() {
  document.documentElement.lang = userSettings.lang;
  const setTxt = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };

  const topo = userSettings.hydronicTopology || "direct";
  const cap = userSettings.modelCapacity || "7";
  const brandModelEl = document.getElementById("brandTitleModel");
  if (brandModelEl) brandModelEl.textContent = `LG Therma V R290 ${cap}kW`;
  const svgMonoSubEl = document.getElementById("svgMonoblocSub");
  if (svgMonoSubEl) svgMonoSubEl.textContent = `${cap}kW Monobloc`;

  setTxt("brandSub", "brandSub_" + topo);
  setTxt("lblSysStatus", "sysStatus");
  setTxt("lblDiag", "diagLabel");
  const errCard = document.getElementById("card_error");
  if (errCard) errCard.title = t("diagTitle");

  setTxt("btnPower", "btnPower");
  setTxt("btnDhw", "btnDhw");
  setTxt("btnSilent", "btnSilent");
  const btnSet = document.getElementById("btnSettings");
  if (btnSet) btnSet.title = t("btnSettingsTitle");

  setTxt("titleCardCop", "titleCardCop");
  setTxt("lblCopDayPrefix", "copDayPrefix");
  setTxt("lblSubThermal", "lblSubThermal");
  setTxt("lblSubElec", "lblSubElec");

  setTxt("titleCardWater", "titleCardWater");
  setTxt("lblSubDeltaT", "lblSubDeltaT");
  setTxt("lblTargetType", userSettings.curveControl === "outlet" ? "lblTargetCvOutlet" : "lblTargetCvInlet");

  setTxt("titleCardDhw", "titleCardDhw");
  setTxt("badgeDhwTop", "badgeDhwTop");
  setTxt("lblSubDhwTarget", "lblSubDhwTarget");
  setTxt("lblSubDhwState", "lblSubDhwState");

  setTxt("titleCardIndoor", "titleCardIndoor");
  setTxt("badgeIndoor", "badgeIndoor");
  setTxt("lblSubIndoorShift", "lblSubIndoorShift");
  setTxt("lblSubIndoorAvg", "lblSubIndoorAvg");

  setTxt("titleCardOutdoor", "titleCardOutdoor");
  setTxt("badgeOutdoor", "badgeOutdoor");
  setTxt("lblSubOutdoorBounds", "lblSubOutdoorBounds");
  setTxt("lblSubWeather", "lblSubWeather");

  setTxt("titleCardFlow", "titleCardFlow");
  setTxt("lblSubPressure", "lblSubPressure");
  setTxt("lblSubMassFlow", "lblSubMassFlow");

  const hrUnit = t("hrShort");
  [24, 12, 6, 1].forEach((hr) => {
    const b = document.getElementById("btnRange_" + hr);
    if (b) b.textContent = hr + hrUnit;
  });
  setTxt("btnCloseDrawer", "closeBtn");
  const searchEl = document.getElementById("errSearchInput");
  if (searchEl) searchEl.placeholder = t("errSearchPlaceholder");

  setTxt("titleSchematic", "titleSchematic");
  setTxt("svgValveTitle", "svgValveTitle");
  setTxt("svgBoilerTitle", "svgBoilerTitle");
  setTxt("svgSlabTitle", "svgSlabTitle_" + topo);
  setTxt("lblStripPressure", "stripPressure");
  setTxt("lblStripThermal", "stripThermal");
  setTxt("lblStripElec", "stripElec");

  setTxt("titleScopCard", "titleScopCard");
  setTxt("btnScop_alltime", "period_alltime");
  setTxt("btnScop_jaar", "period_jaar");
  setTxt("btnScop_maand", "period_maand");
  setTxt("btnScop_week", "period_week");
  setTxt("btnScop_dag", "period_dag");
  setTxt("tblColThermal", "tblColThermal");
  setTxt("tblColElec", "tblColElec");
  setTxt("tblRowCv", "tblRowCv");
  setTxt("tblRowDhw", "tblRowDhw");

  setTxt("titleCurveCard", "titleCurveCard");
  setTxt("lblSliderOffset", "lblSliderOffset");

  // Settings Modal Texts
  setTxt("cfgTitle", "cfgTitle");
  setTxt("btnCloseSettings", "closeBtn");
  setTxt("cfgLangTitle", "cfgLangTitle");
  setTxt("cfgLangDesc", "cfgLangDesc");
  setTxt("cfgCapTitle", "cfgCapTitle");
  setTxt("cfgCapDesc", "cfgCapDesc");
  setTxt("cfgCurveTitle", "cfgCurveTitle");
  setTxt("cfgCurveDesc", "cfgCurveDesc");
  setTxt("btnCurve_inlet", "cfgCurveInlet");
  setTxt("btnCurve_outlet", "cfgCurveOutlet");
  setTxt("cfgTopoTitle", "cfgTopoTitle");
  setTxt("cfgTopoDesc", "cfgTopoDesc");
  setTxt("btnTopo_direct", "cfgTopoDirect");
  setTxt("btnTopo_serial", "cfgTopoSerial");
  setTxt("btnTopo_parallel", "cfgTopoParallel");
  setTxt("cfgDhwVolTitle", "cfgDhwVolTitle");
  setTxt("cfgDhwVolDesc", "cfgDhwVolDesc");
  setTxt("cfgDhwTitle", "cfgDhwTitle");
  setTxt("cfgDhwDesc", "cfgDhwDesc");
  setTxt("btnDhwMode_auto", "cfgDhwAuto");
  setTxt("btnDhwMode_manual", "cfgDhwManual");
  setTxt("cfgCurveParamsTitle", "cfgCurveParamsTitle");
  setTxt("cfgCurveParamsDesc", "cfgCurveParamsDesc");
  setTxt("cfgColdTitle", "cfgColdTitle");
  setTxt("cfgColdSub", "cfgColdSub");
  setTxt("cfgMildTitle", "cfgMildTitle");
  setTxt("cfgMildSub", "cfgMildSub");
  setTxt("cfgOatLow", "cfgOatLow");
  setTxt("cfgLwtHigh", "cfgLwtHigh");
  setTxt("cfgOatHigh", "cfgOatHigh");
  setTxt("cfgLwtLow", "cfgLwtLow");
}

function setLanguage(lang) {
  if (!I18N[lang]) return;
  lastLocalSettingWriteTs = Date.now();
  userSettings.lang = lang;
  saveUserSettings();
  syncSettingsModalUI();
  applyStaticTranslations();
  const hass = getHass();
  if (hass) {
    try {
      hass.callService("input_select", "select_option", {
        entity_id: "input_select.lg_wp_dashboard_taal",
        option: lang
      });
    } catch (e) {}
  }
  syncFromHass();
}

function setModelCapacity(cap) {
  const c = String(cap);
  if (c !== "7" && c !== "9" && c !== "12") return;
  lastLocalSettingWriteTs = Date.now();
  userSettings.modelCapacity = c;
  saveUserSettings();
  syncSettingsModalUI();
  applyStaticTranslations();
  const hass = getHass();
  if (hass) {
    try {
      hass.callService("input_select", "select_option", {
        entity_id: "input_select.lg_wp_vermogen_model",
        option: c
      });
    } catch (e) {}
  }
  syncFromHass();
}

function setCurveControlMode(mode) {
  if (mode !== "inlet" && mode !== "outlet") return;
  lastLocalSettingWriteTs = Date.now();
  userSettings.curveControl = mode;
  saveUserSettings();
  syncSettingsModalUI();
  applyStaticTranslations();
  const hass = getHass();
  if (hass) {
    try {
      hass.callService("input_select", "select_option", {
        entity_id: "input_select.lg_wp_stooklijn_sturing",
        option: mode
      });
    } catch (e) {}
  }
  syncFromHass();
}

function setHydronicTopology(topo) {
  if (topo !== "direct" && topo !== "serial" && topo !== "parallel") return;
  lastLocalSettingWriteTs = Date.now();
  userSettings.hydronicTopology = topo;
  saveUserSettings();
  syncSettingsModalUI();
  applyStaticTranslations();
  const hass = getHass();
  if (hass) {
    try {
      hass.callService("input_select", "select_option", {
        entity_id: "input_select.lg_wp_hydraulisch_schema",
        option: topo
      });
    } catch (e) {}
  }
  syncFromHass();
}

function updateDhwTankVolume(val) {
  const num = parseInt(val, 10);
  if (isNaN(num)) return;
  lastLocalSettingWriteTs = Date.now();
  userSettings.dhwTankVolume = Math.min(500, Math.max(60, Math.round(num / 10) * 10));
  saveUserSettings();
  syncSettingsModalUI();
  applyStaticTranslations();
  const hass = getHass();
  if (hass) {
    try {
      hass.callService("input_number", "set_value", {
        entity_id: "input_number.lg_wp_sww_boiler_volume",
        value: userSettings.dhwTankVolume
      });
    } catch (e) {}
  }
  syncFromHass();
}

function stepDhwTankVolume(delta) {
  updateDhwTankVolume((userSettings.dhwTankVolume || 200) + delta);
}

function setDhwOverrideMode(enabled) {
  lastLocalSettingWriteTs = Date.now();
  userSettings.dhwOverrideEnabled = Boolean(enabled);
  saveUserSettings();
  syncSettingsModalUI();
  const hass = getHass();
  if (hass) {
    try {
      hass.callService("input_boolean", userSettings.dhwOverrideEnabled ? "turn_on" : "turn_off", {
        entity_id: "input_boolean.lg_wp_sww_setpoint_overrule"
      });
    } catch (e) {}
  }
  syncFromHass();
}

function updateDhwOverrideTemp(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return;
  lastLocalSettingWriteTs = Date.now();
  userSettings.dhwOverrideTemp = Math.min(65, Math.max(35, Math.round(num * 2) / 2));
  userSettings.dhwOverrideEnabled = true;
  saveUserSettings();
  syncSettingsModalUI();
  const hass = getHass();
  if (hass) {
    try {
      hass.callService("input_number", "set_value", {
        entity_id: "input_number.lg_wp_sww_setpoint_input",
        value: userSettings.dhwOverrideTemp
      });
      hass.callService("input_boolean", "turn_on", {
        entity_id: "input_boolean.lg_wp_sww_setpoint_overrule"
      });
    } catch (e) {}
  }
  syncFromHass();
}

function stepDhwOverrideTemp(delta) {
  updateDhwOverrideTemp(userSettings.dhwOverrideTemp + delta);
}

function updateCurveParam(paramKey, val) {
  const meta = CURVE_PARAM_META[paramKey];
  if (!meta) return;
  const num = parseInt(val, 10);
  if (isNaN(num)) return;
  lastLocalSettingWriteTs = Date.now();
  const clamped = Math.min(meta.max, Math.max(meta.min, num));
  userSettings[paramKey] = clamped;
  currentState[paramKey] = clamped;
  saveUserSettings();
  syncSettingsModalUI();
  const hass = getHass();
  if (hass) {
    try {
      hass.callService("input_number", "set_value", {
        entity_id: meta.entity,
        value: clamped
      });
    } catch (e) {}
  }
  syncFromHass();
}

function stepCurveParam(paramKey, delta) {
  const meta = CURVE_PARAM_META[paramKey];
  if (!meta) return;
  const cur = userSettings[paramKey] !== undefined ? userSettings[paramKey] : meta.def;
  updateCurveParam(paramKey, cur + delta);
}

function syncSettingsFromHassEntities(hass) {
  if (!hass || !hass.states) return;
  if (Date.now() - lastLocalSettingWriteTs < 2500) return;

  let changed = false;
  let needStaticRefresh = false;

  const haLang = readStr(hass, "input_select.lg_wp_dashboard_taal", "");
  if (haLang && I18N[haLang] && haLang !== userSettings.lang) {
    userSettings.lang = haLang;
    changed = true;
    needStaticRefresh = true;
  }

  const haCap = readStr(hass, "input_select.lg_wp_vermogen_model", "");
  if ((haCap === "7" || haCap === "9" || haCap === "12") && haCap !== userSettings.modelCapacity) {
    userSettings.modelCapacity = haCap;
    changed = true;
    needStaticRefresh = true;
  }

  const haCurveMode = readStr(hass, "input_select.lg_wp_stooklijn_sturing", "");
  if ((haCurveMode === "inlet" || haCurveMode === "outlet") && haCurveMode !== userSettings.curveControl) {
    userSettings.curveControl = haCurveMode;
    changed = true;
    needStaticRefresh = true;
  }

  const haTopo = readStr(hass, "input_select.lg_wp_hydraulisch_schema", "");
  if ((haTopo === "direct" || haTopo === "serial" || haTopo === "parallel") && haTopo !== userSettings.hydronicTopology) {
    userSettings.hydronicTopology = haTopo;
    changed = true;
    needStaticRefresh = true;
  }

  if (hass.states["input_number.lg_wp_sww_boiler_volume"]) {
    const haVol = readNum(hass, "input_number.lg_wp_sww_boiler_volume", 0);
    if (haVol >= 60 && haVol <= 500) {
      const clampedVol = Math.round(haVol / 10) * 10;
      if (clampedVol !== userSettings.dhwTankVolume) {
        userSettings.dhwTankVolume = clampedVol;
        changed = true;
        needStaticRefresh = true;
      }
    }
  }

  if (hass.states["input_boolean.lg_wp_sww_setpoint_overrule"]) {
    const haOverrule = readStr(hass, "input_boolean.lg_wp_sww_setpoint_overrule", "off") === "on";
    if (haOverrule !== userSettings.dhwOverrideEnabled) {
      userSettings.dhwOverrideEnabled = haOverrule;
      changed = true;
    }
  }

  if (hass.states["input_number.lg_wp_sww_setpoint_input"]) {
    const haDhwTemp = readNum(hass, "input_number.lg_wp_sww_setpoint_input", userSettings.dhwOverrideTemp);
    const clampedDhw = Math.min(65, Math.max(35, Math.round(haDhwTemp * 2) / 2));
    if (Math.abs(clampedDhw - userSettings.dhwOverrideTemp) > 0.05) {
      userSettings.dhwOverrideTemp = clampedDhw;
      changed = true;
    }
  }

  const haParams = readStooklijnParams(hass);
  Object.keys(CURVE_PARAM_META).forEach((k) => {
    const v = Math.round(haParams[k]);
    if (!isNaN(v) && v !== userSettings[k]) {
      userSettings[k] = v;
      changed = true;
    }
  });

  if (changed) {
    saveUserSettings();
    if (needStaticRefresh) applyStaticTranslations();
    syncSettingsModalUI();
  }
}

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
  if (!hass || !hass.states || Date.now() - lastLocalSettingWriteTs < 2500) {
    return {
      oatLow: userSettings.oatLow !== undefined ? userSettings.oatLow : -10,
      lwtHigh: userSettings.lwtHigh !== undefined ? userSettings.lwtHigh : 35,
      oatHigh: userSettings.oatHigh !== undefined ? userSettings.oatHigh : 15,
      lwtLow: userSettings.lwtLow !== undefined ? userSettings.lwtLow : 25
    };
  }
  let oatLow = readNum(hass, "input_number.lg_stooklijn_buiten_laag", userSettings.oatLow);
  let lwtHigh = readNum(hass, "input_number.lg_stooklijn_water_hoog", userSettings.lwtHigh);
  let oatHigh = readNum(hass, "input_number.lg_stooklijn_buiten_hoog", userSettings.oatHigh);
  let lwtLow = readNum(hass, "input_number.lg_stooklijn_water_laag", userSettings.lwtLow);

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
    return t("w_partlycloudy");
  }
  const stObj = hass.states[WEATHER_ENTITY];
  const raw = (stObj.state || "").toLowerCase().replace(/-/g, "_");
  const key = "w_" + raw;
  const dict = I18N[userSettings.lang] || I18N.en;
  const label = dict[key] || ("🌤️ " + stObj.state);
  const hum = stObj.attributes && stObj.attributes.humidity;
  return hum !== undefined ? `${label} (${hum}%)` : label;
}

function readDhwTargetTemp(hass) {
  if (userSettings.dhwOverrideEnabled) {
    return userSettings.dhwOverrideTemp;
  }
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
function togglePowerSwitch() {
  const hass = getHass();
  if (!hass) {
    demoState.swPowerOn = !demoState.swPowerOn;
    syncFromHass();
    return;
  }
  if (!confirm(t("confirmPower"))) {
    return;
  }
  const eid = resolveEntityId(hass, ["switch.lg_wp_aan_uit"]);
  hass.callService("switch", "toggle", { entity_id: eid });
  setTimeout(syncFromHass, 350);
}

function toggleDhwSwitch() {
  const hass = getHass();
  if (!hass) {
    // In Demo Mode: cycle 0 (DHW Enabled, CH Heating) -> 1 (DHW Charging Active) -> 2 (DHW Disabled)
    demoState.dhwMode = ((demoState.dhwMode || 0) + 1) % 3;
    demoState.swDhwOn = demoState.dhwMode !== 2;
    demoState.isSwwActive = demoState.dhwMode === 1;
    syncFromHass();
    return;
  }
  if (!confirm(t("confirmDhw"))) {
    return;
  }
  const eid = resolveEntityId(hass, [
    "switch.lg_wp_sww_boiler_vrijgave",
    "switch.lg_wp_sww_vrijgave"
  ]);
  hass.callService("switch", "toggle", { entity_id: eid });
  setTimeout(syncFromHass, 350);
}

function toggleSilentSwitch() {
  const hass = getHass();
  if (!hass) {
    demoState.swSilentOn = !demoState.swSilentOn;
    syncFromHass();
    return;
  }
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
  if (!hass) {
    syncFromHass();
    return;
  }
  drawStooklijn(currentState.outdoor, currentState.shift, currentState.oatLow, currentState.lwtHigh, currentState.oatHigh, currentState.lwtLow);

  const dynamicTargetCv = calculateStooklijnTarget(currentState.outdoor, currentState.shift, currentState.oatLow, currentState.lwtHigh, currentState.oatHigh, currentState.lwtLow);
  document.getElementById("valTargetCv").textContent = dynamicTargetCv.toFixed(1) + " °C";
  if (!currentState.isSwwActive) {
    document.getElementById("badgeTarget").textContent = `${t("badgeTargetCh")} ${dynamicTargetCv.toFixed(1)} °C`;
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

  if (activeKpiKey === "error") {
    const kpiGrid = document.getElementById("kpiGrid");
    if (kpiGrid && drawer && kpiGrid.firstElementChild !== drawer) {
      kpiGrid.prepend(drawer);
    }
    return;
  }

  if (activeKpiKey.startsWith("sub_")) {
    const schematicCard = document.getElementById("schematicCard");
    if (schematicCard && drawer && schematicCard.nextElementSibling !== drawer) {
      schematicCard.after(drawer);
    }
    return;
  }

  const idx = ALL_KPI_KEYS.indexOf(activeKpiKey);
  if (idx === -1) return;

  const w = window.innerWidth;
  const cols = w <= 640 ? 1 : (w <= 1050 ? 2 : 3);
  let rowEndIdx;

  if (cols === 3) {
    rowEndIdx = idx <= 2 ? 2 : 5;
  } else if (cols === 2) {
    rowEndIdx = Math.floor(idx / 2) * 2 + 1;
    if (rowEndIdx >= ALL_KPI_KEYS.length) rowEndIdx = ALL_KPI_KEYS.length - 1;
  } else {
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
    document.getElementById("drawerTitle").textContent = t("drawerErrorTitle");
    try { document.getElementById("drawerBadge").textContent = `${LG_ERROR_CODES.length} ${t("codesWord")}`; } catch (e) {}
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
    lblKey: "period_alltime",
    thCv: ["sensor.lg_warmte_alltime_cv", "sensor.lg_warmte_totaal_cv", "sensor.lg_warmte_jaar_cv"],
    thDhw: ["sensor.lg_warmte_alltime_sww", "sensor.lg_warmte_totaal_sww", "sensor.lg_warmte_jaar_sww"],
    elEstCv: ["sensor.lg_stroom_alltime_cv", "sensor.lg_stroom_totaal_cv", "sensor.lg_stroom_jaar_cv"],
    elEstDhw: ["sensor.lg_stroom_alltime_sww", "sensor.lg_stroom_totaal_sww", "sensor.lg_stroom_jaar_sww"],
    elThinq: ["sensor.lg_thinq_stroom_alltime", "sensor.lg_thinq_stroom_jaar", "sensor.lg_therma_v_7kw_energy_today", "sensor.lg_therma_v_9kw_energy_today", "sensor.lg_therma_v_12kw_energy_today"]
  },
  jaar: {
    lblKey: "period_jaar",
    thCv: ["sensor.lg_warmte_jaar_cv", "sensor.lg_warmte_totaal_cv"],
    thDhw: ["sensor.lg_warmte_jaar_sww", "sensor.lg_warmte_totaal_sww"],
    elEstCv: ["sensor.lg_stroom_jaar_cv", "sensor.lg_stroom_totaal_cv"],
    elEstDhw: ["sensor.lg_stroom_jaar_sww", "sensor.lg_stroom_totaal_sww"],
    elThinq: ["sensor.lg_thinq_stroom_jaar", "sensor.lg_thinq_stroom_alltime", "sensor.lg_therma_v_7kw_energy_today", "sensor.lg_therma_v_9kw_energy_today", "sensor.lg_therma_v_12kw_energy_today"]
  },
  maand: {
    lblKey: "period_maand",
    thCv: ["sensor.lg_warmte_maand_cv", "sensor.lg_warmte_jaar_cv"],
    thDhw: ["sensor.lg_warmte_maand_sww", "sensor.lg_warmte_jaar_sww"],
    elEstCv: ["sensor.lg_stroom_maand_cv", "sensor.lg_stroom_jaar_cv"],
    elEstDhw: ["sensor.lg_stroom_maand_sww", "sensor.lg_stroom_jaar_sww"],
    elThinq: ["sensor.lg_thinq_stroom_maand", "sensor.lg_therma_v_7kw_energy_today", "sensor.lg_therma_v_9kw_energy_today", "sensor.lg_therma_v_12kw_energy_today"]
  },
  week: {
    lblKey: "period_week",
    thCv: ["sensor.lg_warmte_week_cv", "sensor.lg_warmte_dag_cv"],
    thDhw: ["sensor.lg_warmte_week_sww", "sensor.lg_warmte_dag_sww"],
    elEstCv: ["sensor.lg_stroom_week_cv", "sensor.lg_stroom_dag_cv"],
    elEstDhw: ["sensor.lg_stroom_week_sww", "sensor.lg_stroom_dag_sww"],
    elThinq: ["sensor.lg_thinq_stroom_week", "sensor.lg_therma_v_7kw_energy_today", "sensor.lg_therma_v_9kw_energy_today", "sensor.lg_therma_v_12kw_energy_today"]
  },
  dag: {
    lblKey: "period_dag",
    thCv: ["sensor.lg_warmte_dag_cv"],
    thDhw: ["sensor.lg_warmte_dag_sww"],
    elEstCv: ["sensor.lg_stroom_dag_cv"],
    elEstDhw: ["sensor.lg_stroom_dag_sww"],
    elThinq: ["sensor.lg_thinq_stroom_dag", "sensor.lg_therma_v_7kw_energy_today", "sensor.lg_therma_v_9kw_energy_today", "sensor.lg_therma_v_12kw_energy_today"]
  }
};

function computePeriodScopData(hass, periodKey, histDayOpt) {
  const cfg = SCOP_PERIOD_CONFIG[periodKey] || SCOP_PERIOD_CONFIG.jaar;
  const histDay = histDayOpt || calculateHistoryDayEnergy();

  if (!hass && periodKey !== "dag") {
    const capNum = parseInt(userSettings.modelCapacity || "7", 10);
    const capScale = capNum >= 12 ? 1.62 : (capNum >= 9 ? 1.26 : 1.0);
    const demoPeriods = {
      week:    { thCv: 318.4,   thDhw: 49.2,   scopCv: 4.92, scopDhw: 3.38 },
      maand:   { thCv: 1295.0,  thDhw: 208.0,  scopCv: 4.84, scopDhw: 3.34 },
      jaar:    { thCv: 8420.0,  thDhw: 1890.0, scopCv: 4.76, scopDhw: 3.31 },
      alltime: { thCv: 14650.0, thDhw: 3240.0, scopCv: 4.79, scopDhw: 3.33 }
    };
    const dp = demoPeriods[periodKey] || demoPeriods.jaar;
    const thCv = +(dp.thCv * capScale).toFixed(1);
    const thDhw = +(dp.thDhw * capScale).toFixed(1);
    const thTot = thCv + thDhw;
    const scopCv = +(dp.scopCv - (capNum - 7) * 0.02).toFixed(2);
    const scopDhw = dp.scopDhw;
    const realElCv = +(thCv / scopCv).toFixed(1);
    const realElDhw = +(thDhw / scopDhw).toFixed(1);
    const realElTot = realElCv + realElDhw;
    const scopTot = +(thTot / realElTot).toFixed(2);
    return {
      lbl: t(cfg.lblKey),
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
    lbl: t(cfg.lblKey),
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
  document.getElementById("lblScopTot").textContent = `${t("scopTotPrefix")} (${stats.lbl})`;
  document.getElementById("lblScopCv").textContent = `${t("scopCvPrefix")} (${stats.lbl})`;
  document.getElementById("lblScopDhw").textContent = `${t("scopDhwPrefix")} (${stats.lbl})`;
  document.getElementById("tblHeaderPeriod").textContent = `${t("tblHeaderPrefix")} (${stats.lbl})`;
  document.getElementById("tblFooterPeriod").textContent = `${t("tblFooterPrefix")} ${stats.lbl}`;

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
  syncSettingsFromHassEntities(hass);
  const badge = document.getElementById("connBadge");

  if (hass) {
    badge.textContent = t("connLive");
    badge.className = "conn-badge conn-live";
  } else {
    badge.textContent = t("connDemo");
    badge.className = "conn-badge conn-demo";
    ensureDemoHistory();
  }

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

  let compOn, pressure, flowProblemOn, pumpOn, flow, defrostOn, isHeatingActive;
  let indoor, indoorAvg, outdoor, errCode, supply, ret, deltaT, dhwTemp, dhwTarget;
  let dynamicTargetCv, isSwwActive, pThW, pElW, cop, swPowerOn, swDhwOn, swSilentOn;

  if (!hass) {
    // LIVE INTERACTIVE DEMO SIMULATION (when opened outside Home Assistant, e.g., GitHub Pages)
    const wave = Math.sin(Date.now() / 6000);
    const capNum = parseInt(userSettings.modelCapacity || "7", 10);
    const capScale = capNum >= 12 ? 1.62 : (capNum >= 9 ? 1.26 : 1.0);

    swPowerOn = demoState.swPowerOn;
    swDhwOn = demoState.swDhwOn;
    swSilentOn = demoState.swSilentOn;

    compOn = swPowerOn;
    pumpOn = swPowerOn;
    flowProblemOn = false;
    defrostOn = false;
    isHeatingActive = compOn;
    isSwwActive = compOn && swDhwOn && demoState.isSwwActive;

    const silentScale = swSilentOn ? 0.84 : 1.0;
    outdoor = +(6.5 + wave * 0.1).toFixed(1);
    indoor = 20.6;
    indoorAvg = calculateIndoorDailyAverage(indoor);
    errCode = 0;
    dhwTarget = readDhwTargetTemp(null);
    dhwTemp = isSwwActive ? +(Math.min(dhwTarget, 46.8 + (wave + 1) * 0.25)).toFixed(1) : 48.2;
    pressure = isSwwActive ? 1.9 : (compOn ? 1.8 : 1.7);

    dynamicTargetCv = calculateStooklijnTarget(outdoor, currentState.shift, oatLow, lwtHigh, oatHigh, lwtLow);
    flow = compOn ? +((isSwwActive ? 18.4 : 16.4) * capScale * silentScale + wave * 0.15).toFixed(1) : 0.0;
    const simDt = compOn ? +((isSwwActive ? 3.55 : 3.15) * silentScale + wave * 0.04).toFixed(2) : 0.3;

    if (!compOn) {
      ret = 24.2;
      supply = 24.5;
    } else if (isSwwActive) {
      supply = +(dhwTemp + 4.2).toFixed(1);
      ret = +(supply - simDt).toFixed(1);
    } else if (userSettings.curveControl === "outlet") {
      supply = +(dynamicTargetCv + 0.2 + wave * 0.08).toFixed(1);
      ret = +(supply - simDt).toFixed(1);
    } else {
      ret = +(dynamicTargetCv + 0.2 + wave * 0.08).toFixed(1);
      supply = +(ret + simDt).toFixed(1);
    }
    deltaT = +(supply - ret).toFixed(2);
    pThW = compOn ? Math.round((flow / 60.0) * 4186.0 * deltaT) : 0;
    cop = compOn
      ? +(isSwwActive
          ? (3.34 + (swSilentOn ? 0.12 : 0) + wave * 0.02)
          : (4.86 + (swSilentOn ? 0.18 : 0) - (capNum - 7) * 0.03 + wave * 0.03)).toFixed(2)
      : 0.0;
    pElW = compOn && cop > 0 ? Math.round(pThW / cop) : 12;
  } else {
    compOn = readStr(hass, "binary_sensor.lg_wp_compressor_status", "off") === "on";
    pressure = readNum(hass, "sensor.lg_wp_waterdruk", 1.8);

    flowProblemOn = readStr(hass, [
      "binary_sensor.lg_wp_stroming_te_laag",
      "binary_sensor.lg_wp_flow_switch"
    ], "off") === "on";

    const rawFlowSensor = readNum(hass, ["sensor.lg_wp_flow_debiet", "sensor.lg_wpflow_debiet"], 0);
    const pumpBinaryOn = readStr(hass, "binary_sensor.lg_wp_waterpomp_status", "off") === "on";
    pumpOn = pumpBinaryOn || compOn || rawFlowSensor > 5.1;
    flow = pumpOn ? rawFlowSensor : 0.0;

    defrostOn = readStr(hass, "binary_sensor.lg_wp_defrost_status", "off") === "on";
    const buh1On = readStr(hass, "binary_sensor.lg_wp_backup_heater_1", "off") === "on";
    const buh2On = readStr(hass, "binary_sensor.lg_wp_backup_heater_2", "off") === "on";
    const boostOn = readStr(hass, "binary_sensor.lg_wp_sww_boost_heater_status", "off") === "on";

    isHeatingActive = compOn || buh1On || buh2On || boostOn;

    indoor = readIndoorTemp(hass, 20.5);
    indoorAvg = calculateIndoorDailyAverage(indoor);
    outdoor = readNum(hass, "sensor.lg_wp_buitentemperatuur", 6.5);
    errCode = Math.round(readNum(hass, "sensor.lg_wp_foutcode", 0));
    supply = readNum(hass, "sensor.lg_wp_aanvoertemperatuur", 26.0);
    ret = readNum(hass, "sensor.lg_wp_retourtemperatuur", 25.0);
    deltaT = +(supply - ret).toFixed(2);
    dhwTemp = readNum(hass, "sensor.lg_wp_sww_boilertemperatuur", 48.0);
    dhwTarget = readDhwTargetTemp(hass);

    dynamicTargetCv = calculateStooklijnTarget(outdoor, currentState.shift, oatLow, lwtHigh, oatHigh, lwtLow);

    const swwStatusOn = readStr(hass, "binary_sensor.lg_wp_sww_verwarmen_status", "off") === "on";
    const haModeSensor = readStr(hass, "sensor.lg_wp_bedrijfsmodus_tekst", "").toLowerCase();
    const isSwwByTemp = swwStatusOn && (supply > 38.0 || supply > (dhwTemp - 2.0));
    isSwwActive = haModeSensor.includes("sww") || isSwwByTemp;

    pThW = 0;
    pElW = pumpOn ? 35 : 12;
    cop = 0.0;

    if (isHeatingActive) {
      const haTh = readNum(hass, "sensor.lg_wp_thermisch_vermogen", -1);
      const calcTh = flow > 5.0 && deltaT > 0 ? Math.round((flow / 60.0) * 4186.0 * deltaT) : 0;
      pThW = haTh >= 0 ? haTh : calcTh;

      const haEl = readNum(hass, "sensor.lg_wp_elektrisch_vermogen", -1);
      pElW = haEl > 0 ? haEl : 450;

      const haCop = readNum(hass, "sensor.lg_wp_actuele_cop", -1);
      cop = haCop > 0 ? haCop : (pElW > 80 && pThW > 0 ? Math.min(9.0, Math.max(0.0, pThW / pElW)) : 0.0);
    }

    swPowerOn = readStr(hass, ["switch.lg_wp_aan_uit"], "off") === "on";
    swDhwOn = readStr(hass, [
      "switch.lg_wp_sww_boiler_vrijgave",
      "switch.lg_wp_sww_vrijgave"
    ], "off") === "on";
    swSilentOn = readStr(hass, [
      "switch.lg_wp_silent_mode",
      "binary_sensor.lg_wp_stiltemodus_status"
    ], "off") === "on";
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

  // Day COP in the top card: identical to Day SCOP in the SCOP overview below
  const histDay = calculateHistoryDayEnergy();
  const dayScopStats = computePeriodScopData(hass, "dag", histDay);
  const copDay = dayScopStats.scopTot;

  document.getElementById("valCopDay").textContent = copDay.toFixed(2);

  let modeText = t("standby");
  let dotColor = "#64748b";
  if (defrostOn) {
    modeText = t("defrostActive");
    dotColor = "#f59e0b";
  } else if (isHeatingActive && isSwwActive) {
    modeText = t("dhwCharging");
    dotColor = "#f59e0b";
  } else if (isHeatingActive && !isSwwActive) {
    modeText = t("ufhCh");
    dotColor = "#14b8a6";
  } else if (pumpOn) {
    modeText = t("postRunSniff");
    dotColor = "#38bdf8";
  }

  document.getElementById("btnPower").classList.toggle("active", swPowerOn);
  document.getElementById("btnDhw").classList.toggle("active", swDhwOn);
  document.getElementById("btnSilent").classList.toggle("active", swSilentOn);

  document.getElementById("valMode").textContent = modeText;
  document.getElementById("modeDot").style.background = dotColor;
  document.getElementById("modeDot").style.boxShadow = (isHeatingActive || pumpOn) ? `0 0 8px ${dotColor}` : "none";

  // TOPBAR: ERROR CODE & DIAGNOSTIC PILL
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
    const errLoc = matchedErr && typeof getErrItemText === "function"
      ? getErrItemText(matchedErr, userSettings.lang)
      : matchedErr;
    valErrorEl.textContent = "CH " + String(errCode).padStart(2, "0");
    valErrorEl.style.color = "var(--rose)";
    valErrorUnitEl.textContent = (errLoc ? errLoc.title : t("faultAlert")) + " ▾";
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
    badgeCop.textContent = t("standby");
    badgeCop.style.color = "#94a3b8";
  } else if (cop >= 4.5) {
    badgeCop.textContent = t("copTop");
    badgeCop.style.color = "#34d399";
  } else if (cop >= 3.0) {
    badgeCop.textContent = isSwwActive ? t("copDhw") : t("copActive");
    badgeCop.style.color = "#5eead4";
  } else {
    badgeCop.textContent = t("copLow");
    badgeCop.style.color = "#fbbf24";
  }

  // CARD 2: WATER TEMPS & DELTA T
  document.getElementById("valSupply").textContent = supply.toFixed(1) + "°C";
  document.getElementById("valReturn").textContent = ret.toFixed(1) + "°C";
  document.getElementById("valDeltaT").textContent = deltaT.toFixed(2) + " K";
  document.getElementById("valTargetCv").textContent = dynamicTargetCv.toFixed(1) + " °C";
  document.getElementById("badgeTarget").textContent = (isHeatingActive && isSwwActive)
    ? `${t("badgeTargetDhw")} ${dhwTarget.toFixed(1)} °C`
    : `${t("badgeTargetCh")} ${dynamicTargetCv.toFixed(1)} °C`;
  document.getElementById("barDeltaT").style.width = isHeatingActive
    ? Math.min(100, Math.max(0, (Math.abs(deltaT) / 8.0) * 100)) + "%"
    : "0%";

  // CARD 3: 200L BOILER
  document.getElementById("valDhwTemp").textContent = dhwTemp.toFixed(1);
  document.getElementById("valDhwTarget").textContent = dhwTarget.toFixed(1) + " °C" + (userSettings.dhwOverrideEnabled ? " ⚙️" : "");
  const dhwPct = Math.min(100, Math.max(0, ((dhwTemp - 15) / Math.max(10, dhwTarget - 15)) * 100));
  document.getElementById("barDhw").style.width = dhwPct + "%";

  const valDhwState = document.getElementById("valDhwState");
  if (isHeatingActive && isSwwActive) {
    valDhwState.textContent = t("dhwStateActive");
    valDhwState.style.color = "var(--amber)";
  } else if (!swDhwOn) {
    valDhwState.textContent = t("dhwStateDisabled");
    valDhwState.style.color = "var(--text-muted)";
  } else {
    valDhwState.textContent = t("dhwStateStandby");
    valDhwState.style.color = "var(--text-primary)";
  }

  // CARD 4: INDOOR
  document.getElementById("valIndoor").textContent = indoor.toFixed(1);
  const indoorPct = Math.min(100, Math.max(0, ((indoor - 15) / 10) * 100));
  document.getElementById("barIndoor").style.width = indoorPct + "%";
  document.getElementById("valIndoorAvg").textContent = indoorAvg.toFixed(1) + " °C";

  // CARD 5: OUTDOOR + WEATHER
  document.getElementById("valOutdoor").textContent = outdoor.toFixed(1);
  const outdoorPct = Math.min(100, Math.max(0, ((outdoor + 15) / 40) * 100));
  document.getElementById("barOutdoor").style.width = outdoorPct + "%";
  document.getElementById("valOutdoorBounds").textContent = `${oatLow}°C ${t("toWord")} ${oatHigh}°C`;
  document.getElementById("valWeather").textContent = readBuienradarWeather(hass);

  // CARD 6: CIRCULATION & SYSTEM PRESSURE
  const capNum = parseInt(userSettings.modelCapacity || "7", 10);
  const maxFlowRef = capNum >= 12 ? 38.0 : (capNum >= 9 ? 30.0 : 25.0);
  document.getElementById("valFlow").textContent = flow.toFixed(1);
  document.getElementById("valPressure").textContent = pressure.toFixed(1) + " bar";
  document.getElementById("valMassFlow").textContent = `${Math.round(flow * 60)} ${t("massFlowUnit")}`;
  document.getElementById("barFlow").style.width = Math.min(100, Math.max(0, (flow / maxFlowRef) * 100)) + "%";

  const badgePump = document.getElementById("badgePump");
  if (pumpOn && flowProblemOn) {
    badgePump.textContent = t("pumpLowFlow");
    badgePump.style.color = "var(--rose)";
  } else if (isHeatingActive) {
    badgePump.textContent = t("pumpCompOn");
    badgePump.style.color = "#5eead4";
  } else if (pumpOn) {
    badgePump.textContent = t("pumpSniff");
    badgePump.style.color = "#38bdf8";
  } else {
    badgePump.textContent = t("pumpOff");
    badgePump.style.color = "#94a3b8";
  }

  const valValveText = document.getElementById("valValveText");
  if (!isHeatingActive && !pumpOn) {
    valValveText.textContent = t("standby");
    valValveText.style.color = "var(--text-muted)";
  } else if (!isHeatingActive && pumpOn) {
    valValveText.textContent = t("valveSniff");
    valValveText.style.color = "var(--cyan)";
  } else if (isSwwActive) {
    valValveText.textContent = t("valveDhw");
    valValveText.style.color = "var(--amber)";
  } else {
    valValveText.textContent = t("valveUfh");
    valValveText.style.color = "var(--teal)";
  }

  // FULL-WIDTH SVG HYDRONIC SCHEMATIC
  const heatBoiler = isHeatingActive && isSwwActive;
  const heatFloor = isHeatingActive && !isSwwActive;

  document.getElementById("svgCompState").textContent = compOn ? t("svgActive") : t("svgIdle");
  document.getElementById("svgCompState").setAttribute("fill", compOn ? "#34d399" : "#64748b");
  document.getElementById("svgPressure").textContent = pressure.toFixed(1) + " bar";
  document.getElementById("svgCompRing").setAttribute("stroke", isHeatingActive ? (heatBoiler ? "#f59e0b" : "#10b981") : "#334155");
  document.getElementById("svgPower").textContent =
    "Th: " + (pThW / 1000).toFixed(2) + " kW | El: " + (pElW / 1000).toFixed(2) + " kW";
  document.getElementById("svgPower").setAttribute("fill", isHeatingActive ? "#10b981" : "#64748b");
  document.getElementById("svgOutdoor").textContent = `${t("svgOutdoorPrefix")} ${outdoor.toFixed(1)} °C`;
  document.getElementById("svgIndoor").textContent = `${t("svgIndoorPrefix")} ${indoor.toFixed(1)} °C`;

  document.getElementById("svgSupply").textContent = "LWT: " + supply.toFixed(1) + "°C";
  document.getElementById("svgSupply").setAttribute("fill", isHeatingActive ? "#f97316" : "#94a3b8");
  document.getElementById("pillSupplyBox").setAttribute("stroke", isHeatingActive ? "#f97316" : "#334155");

  document.getElementById("svgReturn").textContent = "EWT: " + ret.toFixed(1) + "°C • " + flow.toFixed(1) + " L/min";
  document.getElementById("svgReturn").setAttribute("fill", (isHeatingActive || pumpOn) ? "#38bdf8" : "#94a3b8");
  document.getElementById("pillReturnBox").setAttribute("stroke", (isHeatingActive || pumpOn) ? "#38bdf8" : "#334155");

  const svgValveDir = document.getElementById("svgValveDir");
  const boxValve = document.getElementById("boxValve");
  if (heatBoiler) {
    svgValveDir.textContent = t("svgValveDhw");
    svgValveDir.setAttribute("fill", "#fbbf24");
    boxValve.setAttribute("stroke", "#f59e0b");
  } else if (heatFloor) {
    svgValveDir.textContent = t("svgValveCh");
    svgValveDir.setAttribute("fill", "#5eead4");
    boxValve.setAttribute("stroke", "#14b8a6");
  } else {
    svgValveDir.textContent = t("svgIdle");
    svgValveDir.setAttribute("fill", "#64748b");
    boxValve.setAttribute("stroke", "#334155");
  }

  document.getElementById("svgBoilerTemp").textContent = dhwTemp.toFixed(1) + " °C";
  const boilerStateSub = heatBoiler ? t("svgBoilerCharging") : (!swDhwOn ? t("svgBoilerDisabled") : t("standby"));
  document.getElementById("svgBoilerTarget").textContent =
    "Setpoint: " + dhwTarget.toFixed(1) + " °C • " + boilerStateSub;
  document.getElementById("svgSlabInfo").textContent =
    `ΔT: ${heatFloor ? deltaT.toFixed(2) : "0.00"} K • ${t("svgSlabOutput")} ${heatFloor ? (pThW / 1000).toFixed(2) : "0.00"} kW`;
  document.getElementById("svgSlabInfo").setAttribute("fill", heatFloor ? "#5eead4" : "#94a3b8");

  const schemBadge = document.getElementById("schemBadge");
  if (heatBoiler) {
    schemBadge.textContent = t("schemDhw");
    schemBadge.style.color = "#fbbf24";
    schemBadge.style.borderColor = "rgba(245, 158, 11, 0.45)";
  } else if (heatFloor) {
    schemBadge.textContent = t("schemCh");
    schemBadge.style.color = "#5eead4";
    schemBadge.style.borderColor = "rgba(20, 184, 166, 0.45)";
  } else if (pumpOn) {
    schemBadge.textContent = t("schemSniff");
    schemBadge.style.color = "#38bdf8";
    schemBadge.style.borderColor = "rgba(56, 189, 248, 0.35)";
  } else {
    schemBadge.textContent = t("schemIdle");
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

  // HYDRONIC BUFFER TOPOLOGY IN SVG (DIRECT / SERIAL BUFFER ON COLD LINE / PARALLEL BUFFER)
  const topo = userSettings.hydronicTopology || "direct";
  const grpBuffer = document.getElementById("grpBuffer");
  const grpSecPump = document.getElementById("grpSecPump");
  if (grpBuffer && grpSecPump) {
    if (topo === "direct") {
      grpBuffer.style.display = "none";
      grpSecPump.style.display = "none";
    } else if (topo === "serial") {
      grpBuffer.style.display = "block";
      grpBuffer.setAttribute("transform", "translate(422, 191)");
      grpBuffer.classList.toggle("node-dimmed", heatBoiler);
      const boxBuffer = document.getElementById("boxBuffer");
      boxBuffer.setAttribute("height", "58");
      boxBuffer.classList.toggle("node-active-teal", heatFloor);
      if (!heatFloor) boxBuffer.setAttribute("stroke", "#334155");
      document.getElementById("svgBufParTop").style.display = "none";
      document.getElementById("svgBufParBot").style.display = "none";
      const serCoil = document.getElementById("svgBufSerialCoil");
      serCoil.style.display = "block";
      serCoil.setAttribute("stroke", (heatFloor || pumpOn) ? "#38bdf8" : "#334155");
      const titleEl = document.getElementById("svgBufferTitle");
      const subEl = document.getElementById("svgBufferSub");
      titleEl.setAttribute("y", "17");
      subEl.setAttribute("y", "29");
      titleEl.textContent = t("svgBufSerial");
      subEl.textContent = t("svgBufSub");
      grpSecPump.style.display = "none";
    } else if (topo === "parallel") {
      grpBuffer.style.display = "block";
      grpBuffer.setAttribute("transform", "translate(422, 134)");
      grpBuffer.classList.toggle("node-dimmed", heatBoiler);
      const boxBuffer = document.getElementById("boxBuffer");
      boxBuffer.setAttribute("height", "112");
      boxBuffer.classList.toggle("node-active-teal", heatFloor);
      if (!heatFloor) boxBuffer.setAttribute("stroke", "#334155");
      document.getElementById("svgBufSerialCoil").style.display = "none";
      const parTop = document.getElementById("svgBufParTop");
      const parBot = document.getElementById("svgBufParBot");
      parTop.style.display = "block";
      parBot.style.display = "block";
      parTop.setAttribute("stroke", heatFloor ? "#f97316" : "#334155");
      parBot.setAttribute("stroke", (heatFloor || pumpOn) ? "#38bdf8" : "#334155");
      const titleEl = document.getElementById("svgBufferTitle");
      const subEl = document.getElementById("svgBufferSub");
      titleEl.setAttribute("y", "53");
      subEl.setAttribute("y", "66");
      titleEl.textContent = t("svgBufParallel");
      subEl.textContent = t("svgBufSub");
      grpSecPump.style.display = "block";
      grpSecPump.classList.toggle("node-dimmed", heatBoiler);
      document.getElementById("boxSecPump").setAttribute("stroke", heatFloor ? "#14b8a6" : "#334155");
      document.getElementById("txtSecPump").setAttribute("fill", heatFloor ? "#5eead4" : "#94a3b8");
    }
  }

  document.getElementById("flowPrimaryHot").classList.toggle("active", isHeatingActive);
  document.getElementById("flowDhwHot").classList.toggle("active", heatBoiler);
  document.getElementById("flowDhwCold").classList.toggle("active", heatBoiler);
  document.getElementById("flowCvHot").classList.toggle("active", heatFloor);
  document.getElementById("flowCvCold").classList.toggle("active", heatFloor);

  // 3 SUB-TILES BELOW SCHEMATIC
  document.getElementById("valStripPressure").textContent = pressure.toFixed(1) + " bar";
  document.getElementById("valStripThermal").textContent = (pThW / 1000).toFixed(2) + " kW";
  document.getElementById("valStripElec").textContent = (pElW / 1000).toFixed(2) + " kW";

  updateScopAndBalanceUI(hass, histDay);

  drawStooklijn(outdoor, currentState.shift, oatLow, lwtHigh, oatHigh, lwtLow);
  if (activeKpiKey === "error") {
    document.getElementById("drawerTitle").textContent = t("drawerErrorTitle");
    try { document.getElementById("drawerBadge").textContent = `${LG_ERROR_CODES.length} ${t("codesWord")}`; } catch (e) {}
    renderErrorDatabase(document.getElementById("errSearchInput").value || "");
  } else if (activeKpiKey) {
    drawTopMetricChart();
  }
}

// =========================================================================
// INITIALIZATION
// =========================================================================
loadUserSettings();
applyStaticTranslations();
syncSettingsModalUI();

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
