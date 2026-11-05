# 🔥 LG Therma V R290 — Home Assistant Telemetry Dashboard

An interactive, real-time **Home Assistant** telemetry and control dashboard for the **LG Therma V R290 Monobloc** heat pump (connected via any **RS485-to-Modbus TCP gateway** such as **Elfin EW11** or **Waveshare**, with optional **LG ThinQ** or external smart kWh meter integration and a built-in thermodynamic power fallback).

> **🖥️ Live Interactive Demo (100% Browser-Side / GitHub Pages):**
> When opened outside Home Assistant (for example via **GitHub Pages** at `https://<your-username>.github.io/<repo-name>/`), the dashboard automatically runs in **`DEMO PREVIEW MODE`** with simulated live telemetry, 24-hour expandable step-charts, seasonal SCOP data, clickable topbar switches (`⚡ HP On/Off`, `🚿 DHW Enable`, `🌙 Silent Mode`), and the full `⚙️` Configuration modal — with zero connection to any private server.

---

## 🌐 Language Menu & Table of Contents

Select your language below to jump directly to the full documentation and installation guide:

| Language | Chapters |
| :--- | :--- |
| **🇬🇧 [English (Default)](#english-documentation)** | [Features](#en-features) • [Files](#en-files) • [Step 1: File Editor](#en-step-1) • [Step 2: Modbus TCP (EW11 / Waveshare)](#en-step-2) • [Step 3: configuration.yaml](#en-step-3) • [Step 4: Power Meter, ThinQ & Fallback](#en-step-4) • [Step 5: Automation](#en-step-5) • [Step 6: www Folder](#en-step-6) • [Step 7: Add to Dashboard](#en-step-7) |
| **🇳🇱 [Nederlands](#nederlandse-handleiding)** | [Functies](#nl-features) • [Bestanden](#nl-files) • [Stap 1: File Editor](#nl-step-1) • [Stap 2: Modbus TCP (EW11 / Waveshare)](#nl-step-2) • [Stap 3: configuration.yaml](#nl-step-3) • [Stap 4: Energiemeter, ThinQ & Fallback](#nl-step-4) • [Stap 5: Automatisering](#nl-step-5) • [Stap 6: www Map](#nl-step-6) • [Stap 7: Dashboard Toevoegen](#nl-step-7) |
| **🇩🇪 [Deutsch](#deutsche-dokumentation)** | [Funktionen](#de-features) • [Dateien](#de-files) • [Schritt 1: File Editor](#de-step-1) • [Schritt 2: Modbus TCP (EW11 / Waveshare)](#de-step-2) • [Schritt 3: configuration.yaml](#de-step-3) • [Schritt 4: Stromzähler, ThinQ & Fallback](#de-step-4) • [Schritt 5: Automatisierung](#de-step-5) • [Schritt 6: www Ordner](#de-step-6) • [Schritt 7: Dashboard Hinzufügen](#de-step-7) |
| **🇫🇷 [Français](#documentation-francaise)** | [Fonctionnalités](#fr-features) • [Fichiers](#fr-files) • [Étape 1: File Editor](#fr-step-1) • [Étape 2: Modbus TCP (EW11 / Waveshare)](#fr-step-2) • [Étape 3: configuration.yaml](#fr-step-3) • [Étape 4: Compteur, ThinQ & Fallback](#fr-step-4) • [Étape 5: Automatisation](#fr-step-5) • [Étape 6: Dossier www](#fr-step-6) • [Étape 7: Ajouter au Tableau de Bord](#fr-step-7) |
| **🇪🇸 [Español](#documentacion-en-espanol)** | [Características](#es-features) • [Archivos](#es-files) • [Paso 1: File Editor](#es-step-1) • [Paso 2: Modbus TCP (EW11 / Waveshare)](#es-step-2) • [Paso 3: configuration.yaml](#es-step-3) • [Paso 4: Medidor, ThinQ y Fallback](#es-step-4) • [Paso 5: Automatización](#es-step-5) • [Paso 6: Carpeta www](#es-step-6) • [Paso 7: Añadir al Panel](#es-step-7) |

---

<a id="english-documentation"></a>
# 🇬🇧 English Documentation (Default)

<a id="en-features"></a>
## ✨ Features

- **6 Interactive KPI Cards** (with expandable 24h / 12h / 6h / 1h step-charts):
  1. **Current Efficiency (COP)** — Live COP, Day COP (synced with Day SCOP), Thermal Output (`kW`), and Electrical Power (`kW`).
  2. **Water Temp & ΔT** — Supply temperature (`LWT`), Return temperature (`EWT`), Delta T (`K`), plus the **Calculated Setpoint CH** line in the chart (showing live hysteresis difference against Return or Supply water).
  3. **200L DHW Tank** — Hot water tank temperature, target temperature, and charging status.
  4. **Indoor Temperature** — Living room temperature, daily average, and heating curve offset.
  5. **Outdoor Temperature** — Heat pump outdoor sensor, curve temperature bounds, and live weather.
  6. **Circulation & System Pressure** — Flow rate (`L/min` & `L/h`), water pressure (`bar`), and pump/3-way valve status.
- **Live Animated Hydronic Schematic (Desktop & Mobile Optimized)** — Visualizes real-time water flow to Underfloor Heating (CH) or the DHW Tank, with selectable **Direct Heating**, **Serial Buffer**, or **Parallel Buffer** topology, plus **3 clickable sub-cards with 24h charts** below:
  - **Water Pressure** (`bar`)
  - **Thermal Output** (`kW`)
  - **Electrical Power** (`kW`)
- **SCOP Efficiency & Energy Balance** — Breakdown by **Day, Week, Month, Year, and All-Time** for **Underfloor Heating (CH)** and **DHW Tank (DHW)**.
- **Interactive Heating Curve + Parallel Shift Slider** — Adjust the heating curve offset (`-5 K` to `+5 K`) directly from the dashboard.
- **Built-in LG Therma V CH Error Code Book** — Click the top diagnostic pill (`CH 00 OK`) to search all LG CH error codes, causes, and solutions in 5 languages.
- **⚙️ Configuration Modal (Synced Across Devices via Home Assistant Entities)**:
  - **Language (`input_select.lg_wp_dashboard_taal`):** English (Default), Dutch, German, French, Spanish.
  - **Heat Pump Model Capacity (`input_select.lg_wp_vermogen_model`):** Select **7 kW**, **9 kW**, or **12 kW** (calibrates the thermodynamic electrical power model, flow scaling, and dashboard labels).
  - **Heating Curve Control (`input_select.lg_wp_stooklijn_sturing`):** Choose **Inlet / Return (EWT)** or **Outlet / Supply (LWT)**.
  - **Hydronic System Setup (`input_select.lg_wp_hydraulisch_schema`):** Switch between **Direct Heating**, **Serial Buffer**, or **Parallel Buffer** (updates the live animated SVG schematic).
  - **DHW Target Overrule (`input_boolean.lg_wp_sww_setpoint_overrule` & `input_number.lg_wp_sww_setpoint_input`):** Auto (Modbus sensor) or manual override (`35–65 °C`).
  - **Heating Curve Parameters (`input_number.lg_stooklijn_*`):** Configure Cold Design Temp & Mild Footpoint sliders directly in the modal.

<a id="en-files"></a>
## 📁 Repository Files

| File | Description | Target Location in Home Assistant |
| :--- | :--- | :--- |
| `modbus.yaml` | Modbus TCP register configuration for LG Therma V | `/config/modbus.yaml` |
| `configuration.yaml` | Helper entities (`input_number`, `input_select`, `input_boolean`), `template` sensors, Riemann sum `integration` sensors, and `utility_meter` counters | Merge into `/config/configuration.yaml` |
| `automations.yaml` | Automation to write the Heating Curve Parallel Shift slider to Modbus register `4` | Add to `/config/automations.yaml` (or via HA UI) |
| `index.html`, `styles.css`, `app.js`, `charts.js`, `error-codes.js` | Frontend dashboard files | `/config/www/` |

<a id="en-step-1"></a>
## 🚀 Step-by-Step Setup in Home Assistant

### Step 1: Install File Editor
1. In Home Assistant, go to **Settings** → **Add-ons** → **Add-on Store**.
2. Install **File editor**, enable **Show in sidebar**, and click **Start**.

<a id="en-step-2"></a>
### Step 2: Configure `modbus.yaml` (Elfin EW11, Waveshare, or Any Modbus TCP Gateway)
You can use **any RS485-to-Modbus-TCP gateway** connected to the LG Therma V RS485 bus, such as:
- **Elfin EW11 / EW11A** (Wi-Fi)
- **Waveshare RS485 to Ethernet (Rail-Mount / PoE)** (Wired Ethernet)
- **Protoss PE11 / PW11** or **USR-TCP232-410s / USR-DR302**

1. Upload `modbus.yaml` to `/config/modbus.yaml`.
2. Edit line 3 (`host: "192.168.1.XXX"`) and enter the IP address of your **Elfin EW11**, **Waveshare**, or other Modbus TCP gateway:
   ```yaml
   - name: "lg_therma_v"
     type: tcp
     host: "192.168.1.XXX" # <-- IP address of your Elfin EW11 / Waveshare gateway
     port: 502
     delay: 2
     message_wait_milliseconds: 50
     timeout: 5
   ```
   *(Make sure your gateway is set to **Modbus TCP to RTU** protocol mode, `9600 baud, 8N1`, and check that `slave: 33` matches the Modbus slave address set in your LG remote controller).*

<a id="en-step-3"></a>
### Step 3: Add `configuration.yaml` Items
1. Open `/config/configuration.yaml` and merge the sections from this repository's `configuration.yaml`:
   - `modbus: !include modbus.yaml`
   - `input_number:`, `input_select:`, and `input_boolean:` (stores all dashboard settings & heating curve parameters in Home Assistant so you don't have to reconfigure them on other devices)
   - `template:` (calculates Delta T, Thermal Output, Electrical Power fallback, Live COP, Day COP, and SCOP)
   - `sensor:` (Riemann sum integrators converting Watts to kWh)
   - `utility_meter:` (Daily, Weekly, Monthly, Yearly, and All-Time energy counters)

<a id="en-step-4"></a>
### Step 4: Power & Energy Meter Setup (LG ThinQ, External Meter, or Built-in Fallback)

The dashboard supports **three ways** to measure electrical power and energy (`kWh`). You can use any of them:

#### Option A: Using the Official LG ThinQ Integration
By default, `configuration.yaml` and `app.js` look for the LG ThinQ daily energy entity:
- **`sensor.lg_therma_v_7kw_energy_today`**
- If your LG ThinQ entity has a different name (for example `sensor.lg_therma_v_9kw_energy_today` or `sensor.warmtepomp_energy_today`), simply use **Find & Replace** in `configuration.yaml` and `app.js` to replace `sensor.lg_therma_v_7kw_energy_today` with your entity ID.
- *(Note: The dashboard automatically detects whether ThinQ reports in `Wh` or `kWh` and converts `Wh` to `kWh` automatically).*

#### Option B: Using a Different Power/Energy Meter (HomeWizard, Shelly EM/Pro, Eastron SDM, etc.)
If you measure your heat pump with a dedicated smart meter instead of LG ThinQ:
1. **Total Energy (`kWh`) for SCOP:** In `configuration.yaml` under `utility_meter:` (lines 483–530), change `source: sensor.lg_therma_v_7kw_energy_today` on `lg_thinq_stroom_dag`, `lg_thinq_stroom_week`, `lg_thinq_stroom_maand`, `lg_thinq_stroom_jaar`, and `lg_thinq_stroom_alltime` to your own kWh sensor (e.g. `source: sensor.homewizard_heatpump_kwh` or `source: sensor.shelly_em_energy`).
2. **Real-Time Power (`W`):** If your meter also provides live Watts (`W`), you can replace the `state:` template of `LG WP Elektrisch Vermogen` (`unique_id: lg_wp_elektrisch_vermogen` in `configuration.yaml`) with `{{ states('sensor.your_live_watt_sensor') | float(0) }}`.

#### Option C: Built-in Automatic Calculation Fallback (No Power Meter or ThinQ Required!)
**Yes — there is a full built-in fallback!** If you do not have LG ThinQ or a dedicated kWh meter (or if ThinQ goes offline), the system **automatically calculates electrical power and energy**:
1. **Thermodynamic Power Model (`sensor.lg_wp_elektrisch_vermogen`):** In `configuration.yaml`, a Carnot-based physical model calculates live electrical power (`W`) from:
   - Live Thermal Output (`sensor.lg_wp_thermisch_vermogen` from flow rate & $\Delta T$),
   - Temperature lift between Supply Water (`LWT`) and Outdoor Temperature (`OAT`),
   - Compressor & electronics overhead (`85 W` CH / `110 W` DHW),
   - Defrost cycles (`950 W`), Backup Heater Stage 1 & 2 (`+3000 W` each), DHW Boost Heater (`+3000 W`), Water Pump (`35 W`), and Standby (`12 W`).
2. **Automatic kWh Integration & SCOP Fallback:** Riemann sum integrators (`sensor.lg_stroom_totaal_cv` and `sensor.lg_stroom_totaal_sww`) continuously integrate this estimated electrical power into `kWh` counters (`sensor.lg_stroom_dag_cv`, `week`, `maand`, `jaar`, `alltime`). Whenever `lg_thinq_stroom_*` is `0` or unavailable, both `configuration.yaml` and `app.js` seamlessly fall back to these calculated `kWh` values.

<a id="en-step-5"></a>
### Step 5: Add the Heating Curve Parallel Shift Automation
Add the following automation (from `automations.yaml`) via **Settings** → **Automations & scenes** → **Create automation** → **Edit in YAML** so moving the dashboard's Parallel Shift slider writes to Modbus register `4` (including two's complement for negative offsets):
```yaml
alias: 'Warmtepomp: Modbus Schrijf Stooklijn Offset'
triggers:
  - trigger: state
    entity_id: input_number.lg_wp_stooklijn_shift_input
actions:
  - action: modbus.write_register
    data:
      hub: lg_therma_v
      unit: 33
      address: 4
      value: >-
        {% set val = states('input_number.lg_wp_stooklijn_shift_input') | int %}
        {% if val < 0 %}
          {{ val + 65536 }}
        {% else %}
          {{ val }}
        {% endif %}
mode: single
```

<a id="en-step-6"></a>
### Step 6: Upload Dashboard Files to `/config/www/`
1. In **File editor**, create a folder named `www` inside `/config/` if it does not exist yet *(restart Home Assistant once if you just created `/config/www/`)*.
2. Upload `index.html`, `styles.css`, `app.js`, `charts.js`, and `error-codes.js` into `/config/www/`.

<a id="en-step-7"></a>
### Step 7: Add to a Home Assistant Dashboard (`/local/index.html`)
1. Open your Home Assistant dashboard → click **Edit Dashboard (pencil)** → **Add View (+)**.
2. Set **View type** to **Panel (1 card)** and click **Save**.
3. Click **Add Card** → choose **Webpage (`iframe`)** and set the **URL** to:
   ```text
   /local/index.html
   ```

---

<a id="nederlandse-handleiding"></a>
# 🇳🇱 Nederlandse Handleiding

<a id="nl-features"></a>
## ✨ Functionaliteiten

- **6 Interactieve KPI-kaarten** (met uitklapbare 24u / 12u / 6u / 1u stap-grafieken):
  1. **Actueel Rendement (COP)** — Live COP, Dag-COP (exact gelijk aan Dag-SCOP), thermisch vermogen (`kW`) en elektrisch vermogen (`kW`).
  2. **Watertemp & ΔT** — Aanvoertemperatuur (`LWT`), retourtemperatuur (`EWT`), Delta T (`K`) én de **Berekend Setpoint CV** lijn in de grafiek (inclusief live hysterese-verschil).
  3. **200L Tapwaterboiler** — Boilertemperatuur, doeltemperatuur en actuele laadstatus.
  4. **Binnentemperatuur** — Woonkamertemperatuur, daggemiddelde en stooklijn offset.
  5. **Buitentemperatuur** — Buitenvoeler warmtepomp, stooklijnbereik en actueel weer.
  6. **Circulatie & Systeemdruk** — Debiet (`L/min` & `L/u`), waterdruk (`bar`) en pomp-/3-wegklepstatus.
- **Live Geanimeerd Hydraulisch Schema (Geoptimaliseerd voor PC & Mobiel)** — Toont realtime stroming met keuze uit **Directe Afgifte**, **Serie Buffervat** of **Parallel Buffervat**, met daaronder **3 klikbare detailkaarten met 24u grafiek**:
  - **Waterdruk** (`bar`) • **Thermisch Vermogen** (`kW`) • **Elektrisch Verbruik** (`kW`)
- **SCOP Rendement & Energiebalans** — Overzicht per **Dag, Week, Maand, Jaar en Altijd**, uitgesplitst naar **Vloerverwarming (CV)** en **Tapwaterboiler (SWW)**.
- **⚙️ Configuratiescherm (Tandwiel rechtsboven — Gesynchroniseerd via Home Assistant entiteiten)**:
  - **Taal (`input_select.lg_wp_dashboard_taal`):** Engels (Standaard), Nederlands, Duits, Frans, Spaans.
  - **Warmtepomp Model (`input_select.lg_wp_vermogen_model`):** Kies tussen **7 kW**, **9 kW** of **12 kW** (kalibreert de elektrische vermogensberekening, debietschaal en labels).
  - **Stooklijn Sturing (`input_select.lg_wp_stooklijn_sturing`):** **Inlaat / Retour (EWT)** of **Uitlaat / Aanvoer (LWT)**.
  - **Hydraulische Opstelling (`input_select.lg_wp_hydraulisch_schema`):** Kies tussen **Directe Afgifte**, **Serie Buffervat** of **Parallel Buffervat** (wordt direct getoond in het geanimeerde schema).
  - **SWW Doeltemperatuur Overrulen (`input_boolean.lg_wp_sww_setpoint_overrule` & `input_number.lg_wp_sww_setpoint_input`):** Auto (Modbus-sensor) of handmatig (`35–65 °C`).
  - **Stooklijn Parameters (`input_number.lg_stooklijn_*`):** Ontwerptemperatuur (Koud) en Voetpunt (Mild) direct in het instellingenmenu aanpassen.

<a id="nl-files"></a>
## 📁 Bestanden in deze Repository

| Bestand | Beschrijving | Waar plaatsen in Home Assistant? |
| :--- | :--- | :--- |
| `modbus.yaml` | Modbus TCP configuratie voor de LG Therma V | `/config/modbus.yaml` |
| `configuration.yaml` | `input_number`, `input_select` & `input_boolean` helpers, `template` sensoren, `integration` (Riemann sum) en `utility_meter` tellers | Samenvoegen in `/config/configuration.yaml` |
| `automations.yaml` | Automatisering om de Stooklijn Parallel Shift slider naar Modbus-register `4` te schrijven | Toevoegen aan `/config/automations.yaml` |
| `index.html`, `styles.css`, `app.js`, `charts.js`, `error-codes.js` | Dashboard bestanden | `/config/www/` |

<a id="nl-step-1"></a>
## 🚀 Stapsgewijze Installatie in Home Assistant

### Stap 1: File Editor installeren
1. Ga in Home Assistant naar **Instellingen** → **Add-ons** → **Add-on Store**.
2. Installeer **File editor**, zet **Show in sidebar** aan en klik op **Start**.

<a id="nl-step-2"></a>
### Stap 2: `modbus.yaml` instellen (Elfin EW11, Waveshare of andere Modbus TCP Gateway)
Je kunt **elke RS485-naar-Modbus-TCP gateway** gebruiken, zoals een **Elfin EW11** (Wi-Fi), een **Waveshare RS485 to Ethernet** (bekabeld op DIN-rail), **Protoss PE11** of **USR-TCP232-410s**.
1. Plaats `modbus.yaml` in `/config/modbus.yaml`.
2. Pas op regel 3 `host: "192.168.1.XXX"` aan naar het IP-adres van jouw **Elfin EW11**, **Waveshare** of andere gateway.

<a id="nl-step-3"></a>
### Stap 3: Items uit `configuration.yaml` toevoegen
Voeg de secties `modbus:`, `input_number:`, `input_select:`, `input_boolean:`, `template:`, `sensor:` en `utility_meter:` uit `configuration.yaml` toe aan je eigen `/config/configuration.yaml` en herstart Home Assistant.

<a id="nl-step-4"></a>
### Stap 4: Energiemeter instellen (LG ThinQ, Eigen kWh-meter of Ingebouwde Fallback)

Het dashboard ondersteunt **drie manieren** voor het elektrische verbruik:

1. **Optie A — Officiële LG ThinQ integratie:**
   Standaard wordt `sensor.lg_therma_v_7kw_energy_today` gebruikt. Heet jouw ThinQ sensor anders (bijv. `sensor.lg_therma_v_9kw_energy_today`)? Vervang deze naam dan eenvoudig met *Zoeken & Vervangen* in `configuration.yaml` en `app.js`.
2. **Optie B — Eigen slimme kWh-/energiemeter (HomeWizard, Shelly EM/Pro, Eastron SDM, etc.):**
   - **Voor SCOP (`kWh`):** Vervang in `configuration.yaml` onder `utility_meter:` (regel 483–530) bij `lg_thinq_stroom_dag`, `week`, `maand`, `jaar` en `alltime` de regel `source: sensor.lg_therma_v_7kw_energy_today` door jouw eigen kWh-sensor (bijv. `source: sensor.homewizard_warmtepomp_kwh`).
   - **Voor Live Vermogen (`W`):** Heb je ook een live Watt-sensor? Dan kun je bij `LG WP Elektrisch Vermogen` (`unique_id: lg_wp_elektrisch_vermogen` in `configuration.yaml`) de `state:` vervangen door `{{ states('sensor.jouw_watt_sensor') | float(0) }}`.
3. **Optie C — Ingebouwde Automatische Fallback (Geen ThinQ of kWh-meter nodig!):**
   **Ja, er zit standaard een volledige rekenkundige fallback in!** Als je geen ThinQ en geen kWh-meter hebt, berekent `sensor.lg_wp_elektrisch_vermogen` in `configuration.yaml` continu het elektrische vermogen (`W`) op basis van een thermodynamisch Carnot-model (actueel thermisch vermogen, aanvoertemperatuur `LWT`, buitentemperatuur `OAT`, defrost `950 W`, backup-heaters `3000 W`, pomp `35 W` en stand-by `12 W`). De Riemann-integrators (`sensor.lg_stroom_totaal_cv` en `sww`) zetten dit om naar `kWh`, en het dashboard valt hier automatisch op terug zodra ThinQ niet aanwezig is.

<a id="nl-step-5"></a>
### Stap 5: Automatisering voor Stooklijn Parallel Shift
Voeg de automatisering uit `automations.yaml` toe aan Home Assistant zodat de Parallel Shift slider naar Modbus-register `4` schrijft.

<a id="nl-step-6"></a>
### Stap 6: De `www` map aanmaken en bestanden uploaden
Maak `/config/www/` aan in **File editor** en upload `index.html`, `styles.css`, `app.js`, `charts.js` en `error-codes.js`.

<a id="nl-step-7"></a>
### Stap 7: Toevoegen aan je Dashboard (`/local/index.html`)
Maak een nieuwe dashboard-weergave aan van het type **Paneel (1 kaart)**, voeg een **Webpagina (`iframe`)** kaart toe en vul als URL `/local/index.html` in.

---

<a id="deutsche-dokumentation"></a>
# 🇩🇪 Deutsche Dokumentation

<a id="de-features"></a>
## ✨ Funktionen

- **6 Interaktive KPI-Karten** (mit ausklappbaren 24h / 12h / 6h / 1h Diagrammen):
  1. **Aktuelle Effizienz (COP)** — Live-COP, Tages-COP (identisch mit Tages-SCOP), thermische Leistung (`kW`) und elektrische Leistung (`kW`).
  2. **Wassertemp & ΔT** — Vorlauf (`LWT`), Rücklauf (`EWT`), Delta T (`K`) sowie die Linie **Berechneter Sollwert HZ** im Diagramm.
  3. **200L Warmwasserspeicher** — Speichertemperatur, Solltemperatur und Ladestatus.
  4. **Innentemperatur** — Raumtemperatur, Tagesmittel und Heizkurven-Offset.
  5. **Außentemperatur** — Außensensor, Heizkurvenbereich und aktuelles Wetter.
  6. **Zirkulation & Systemdruck** — Durchfluss (`L/min` & `L/h`), Wasserdruck (`bar`) und Pumpen-/3-Wege-Ventilstatus.
- **Animiertes Live-Hydronikschema (für Desktop & Mobilgeräte optimiert)** — Unterstützt **Direktheizkreis**, **Reihenpuffer** und **Parallelpuffer**, inklusive **3 klickbarer Detailkarten** darunter (**Wasserdruck**, **Thermische Leistung**, **Elektrische Leistung**).
- **SCOP Effizienz & Energiebilanz** — Auswertung nach **Tag, Woche, Monat, Jahr und Gesamt** für **Fußbodenheizung (HZ)** und **Warmwasser (WW)**.
- **⚙️ Konfigurationsmenü (Geräteübergreifend in Home Assistant Entitäten gespeichert)**:
  - **Sprache (`input_select.lg_wp_dashboard_taal`):** Englisch (Standard), Niederländisch, Deutsch, Französisch, Spanisch.
  - **Wärmepumpen-Modell (`input_select.lg_wp_vermogen_model`):** **7 kW**, **9 kW** oder **12 kW** (kalibriert die elektrische Leistungsberechnung und Durchflussskalierung).
  - **Heizkurven-Regelung (`input_select.lg_wp_stooklijn_sturing`):** **Einlass / Rücklauf (EWT)** oder **Auslass / Vorlauf (LWT)**.
  - **Hydraulik-Aufbau (`input_select.lg_wp_hydraulisch_schema`):** **Direktheizkreis**, **Reihenpuffer** oder **Parallelpuffer**.
  - **WW-Solltemperatur & Heizkurven-Parameter (`input_number.lg_stooklijn_*`)** direkt im Menü einstellbar.

<a id="de-files"></a>
## 📁 Dateien in diesem Repository
- `modbus.yaml` → `/config/modbus.yaml`
- `configuration.yaml` → In `/config/configuration.yaml` einfügen
- `automations.yaml` → In `/config/automations.yaml` einfügen
- `index.html`, `styles.css`, `app.js`, `charts.js`, `error-codes.js` → `/config/www/`

<a id="de-step-1"></a>
### Schritt 1: File Editor installieren
Installieren Sie das Add-on **File editor** über **Einstellungen** → **Add-ons**.

<a id="de-step-2"></a>
### Schritt 2: `modbus.yaml` einrichten (Elfin EW11, Waveshare oder anderes Modbus TCP Gateway)
Sie können **jedes RS485-zu-Modbus-TCP-Gateway** verwenden, z. B. **Elfin EW11** (WLAN) oder **Waveshare RS485 to Ethernet** (LAN/Hutschiene). Passen Sie in `/config/modbus.yaml` in Zeile 3 `host: "192.168.1.XXX"` an die IP-Adresse Ihres Gateways an.

<a id="de-step-3"></a>
### Schritt 3: `configuration.yaml` ergänzen
Fügen Sie die Abschnitte `modbus:`, `input_number:`, `input_select:`, `input_boolean:`, `template:`, `sensor:` und `utility_meter:` in Ihre `/config/configuration.yaml` ein.

<a id="de-step-4"></a>
### Schritt 4: Stromzähler, LG ThinQ & Automatischer Berechnungs-Fallback
1. **Option A — Offizielle LG ThinQ Integration:** Standardmäßig wird `sensor.lg_therma_v_7kw_energy_today` verwendet (bei abweichendem Namen einfach per *Suchen & Ersetzen* in `configuration.yaml` und `app.js` anpassen).
2. **Option B — Eigener Stromzähler (Shelly EM/Pro, HomeWizard, Eastron SDM usw.):** Ersetzen Sie unter `utility_meter:` in `configuration.yaml` `source: sensor.lg_therma_v_7kw_energy_today` durch Ihren eigenen `kWh`-Sensor (und optional die `state:`-Formel von `lg_wp_elektrisch_vermogen` durch Ihren Live-Watt-Sensor).
3. **Option C — Integrierter Automatischer Fallback (Kein Zähler oder ThinQ erforderlich!):** Wenn weder ThinQ noch ein externer Zähler vorhanden ist, berechnet `sensor.lg_wp_elektrisch_vermogen` die elektrische Leistung (`W`) automatisch über ein thermodynamisches Carnot-Modell (aus thermischer Leistung, Vorlauftemperatur `LWT`, Außentemperatur `OAT`, Abtauung, Heizstäben und Pumpe). Über Riemann-Summen-Integratoren (`sensor.lg_stroom_*`) werden daraus automatisch `kWh`-Zähler für das Dashboard erzeugt.

<a id="de-step-5"></a>
### Schritt 5: Automatisierung für Heizkurven-Offset (`automations.yaml`)
Fügen Sie die Automatisierung aus `automations.yaml` hinzu, damit der Offset-Schieberegler in das Modbus-Register `4` schreibt.

<a id="de-step-6"></a>
### Schritt 6 & 7: Dateien nach `/config/www/` hochladen & Dashboard einbinden (`/local/index.html`)
Laden Sie `index.html`, `styles.css`, `app.js`, `charts.js` und `error-codes.js` nach `/config/www/` hoch und fügen Sie in Home Assistant eine **Webseite (`iframe`)**-Karte mit der URL `/local/index.html` hinzu.

---

<a id="documentation-francaise"></a>
# 🇫🇷 Documentation Française

<a id="fr-features"></a>
## ✨ Fonctionnalités

- **6 Cartes KPI Interactives** (avec graphiques 24h / 12h / 6h / 1h) : **Rendement (COP)**, **Temp. Eau & ΔT** (avec ligne **Consigne CH Calculée**), **Ballon ECS 200L**, **Intérieur**, **Extérieur**, **Circulation & Pression**.
- **Schéma Hydronique Animé en Direct (Optimisé PC & Mobile)** — Prise en charge des configurations **Chauffage Direct**, **Tampon en Série** et **Tampon Parallèle**, avec **3 sous-cartes graphiques** (**Pression d'Eau**, **Puissance Thermique**, **Puissance Électrique**).
- **Rendement SCOP & Bilan Énergétique** — Par **Jour, Semaine, Mois, Année et Toujours** (Plancher Chauffant CH vs Ballon ECS).
- **⚙️ Fenêtre de Configuration (Synchronisée sur tous les appareils via les entités Home Assistant)** :
  - **Langue (`input_select.lg_wp_dashboard_taal`) :** Anglais (Par défaut), Néerlandais, Allemand, Français, Espagnol.
  - **Modèle de PAC (`input_select.lg_wp_vermogen_model`) :** **7 kW**, **9 kW** ou **12 kW** (calibre le calcul électrique et l'échelle de débit).
  - **Régulation Loi d'Eau (`input_select.lg_wp_stooklijn_sturing`) :** **Entrée / Retour (EWT)** ou **Sortie / Départ (LWT)**.
  - **Configuration Hydraulique (`input_select.lg_wp_hydraulisch_schema`) :** **Chauffage Direct**, **Tampon en Série** ou **Tampon Parallèle**.
  - **Forçage Température ECS & Paramètres de la Loi d'Eau (`input_number.lg_stooklijn_*`)**.

<a id="fr-files"></a>
## 📁 Fichiers du Dépôt
- `modbus.yaml` → `/config/modbus.yaml`
- `configuration.yaml` → Ajouter à `/config/configuration.yaml`
- `automations.yaml` → Ajouter à `/config/automations.yaml`
- `index.html`, `styles.css`, `app.js`, `charts.js`, `error-codes.js` → `/config/www/`

<a id="fr-step-1"></a>
### Étape 1 & 2 : File Editor & `modbus.yaml` (Elfin EW11, Waveshare ou autre passerelle Modbus TCP)
Vous pouvez utiliser **n'importe quelle passerelle RS485 vers Modbus TCP** (**Elfin EW11**, **Waveshare RS485 to Ethernet**, **Protoss PE11**, **USR-TCP232-410s**). Copiez `modbus.yaml` dans `/config/modbus.yaml` et remplacez `host: "192.168.1.XXX"` par l'adresse IP de votre passerelle.

<a id="fr-step-3"></a>
### Étape 3 : Ajouter `configuration.yaml`
Ajoutez les sections `modbus:`, `input_number:`, `input_select:`, `input_boolean:`, `template:`, `sensor:` et `utility_meter:` à votre fichier `/config/configuration.yaml`.

<a id="fr-step-4"></a>
### Étape 4 : Compteur d'Énergie, LG ThinQ & Calcul Automatique de Secours (Fallback)
1. **Option A — Intégration officielle LG ThinQ :** Utilise `sensor.lg_therma_v_7kw_energy_today` par défaut (remplacez ce nom dans `configuration.yaml` et `app.js` si votre entité porte un autre nom).
2. **Option B — Compteur externe (Shelly EM, HomeWizard, Eastron SDM, etc.) :** Dans `configuration.yaml` sous `utility_meter:`, remplacez `source: sensor.lg_therma_v_7kw_energy_today` par votre capteur `kWh` (et optionnellement la formule de `lg_wp_elektrisch_vermogen` par votre capteur de puissance en `W`).
3. **Option C — Calcul thermodynamique intégré (Aucun compteur ni ThinQ requis !) :** En l'absence de ThinQ ou de compteur dédié, `sensor.lg_wp_elektrisch_vermogen` calcule automatiquement la puissance électrique (`W`) via un modèle thermodynamique de Carnot (puissance thermique, température de départ `LWT`, température extérieure `OAT`, dégivrage, appoints électriques et pompe), convertie en `kWh` par intégration de Riemann (`sensor.lg_stroom_*`).

<a id="fr-step-5"></a>
### Étape 5, 6 & 7 : Automatisation (`automations.yaml`), Dossier `/config/www/` & Carte `/local/index.html`
Ajoutez l'automatisation de `automations.yaml`, placez les 5 fichiers web dans `/config/www/` et ajoutez une carte **Page Web (`iframe`)** pointant vers `/local/index.html`.

---

<a id="documentacion-en-espanol"></a>
# 🇪🇸 Documentación en Español

<a id="es-features"></a>
## ✨ Características

- **6 Tarjetas KPI Interactivas** (con gráficas de 24h / 12h / 6h / 1h): **Rendimiento (COP)**, **Temp. Agua y ΔT** (con línea **Consigna CC Calculada**), **Depósito ACS 200L**, **Interior**, **Exterior**, **Circulación y Presión**.
- **Esquema Hidrónico Animado en Vivo (Optimizado para PC y Móvil)** — Soporta **Calefacción Directa**, **Inercia en Serie** e **Inercia en Paralelo**, con **3 subtarjetas gráficas** (**Presión de Agua**, **Potencia Térmica**, **Potencia Eléctrica**).
- **Rendimiento SCOP y Balance Energético** — Por **Día, Semana, Mes, Año y Siempre** (Suelo Radiante CC vs Depósito ACS).
- **⚙️ Ventana de Configuración (Sincronizada en todos los dispositivos mediante entidades de Home Assistant)**:
  - **Idioma (`input_select.lg_wp_dashboard_taal`):** Inglés (Predeterminado), Neerlandés, Alemán, Francés, Español.
  - **Modelo de Bomba de Calor (`input_select.lg_wp_vermogen_model`):** **7 kW**, **9 kW** o **12 kW** (calibra el cálculo eléctrico y la escala de caudal).
  - **Control de Curva (`input_select.lg_wp_stooklijn_sturing`):** **Entrada / Retorno (EWT)** o **Salida / Impulsión (LWT)**.
  - **Esquema Hidrónico (`input_select.lg_wp_hydraulisch_schema`):** **Calefacción Directa**, **Inercia en Serie** o **Inercia en Paralelo**.
  - **Anulación de Temp. Objetivo ACS y Parámetros de la Curva (`input_number.lg_stooklijn_*`)**.

<a id="es-files"></a>
## 📁 Archivos del Repositorio
- `modbus.yaml` → `/config/modbus.yaml`
- `configuration.yaml` → Añadir a `/config/configuration.yaml`
- `automations.yaml` → Añadir a `/config/automations.yaml`
- `index.html`, `styles.css`, `app.js`, `charts.js`, `error-codes.js` → `/config/www/`

<a id="es-step-1"></a>
### Paso 1 y 2: File Editor y `modbus.yaml` (Elfin EW11, Waveshare o cualquier pasarela Modbus TCP)
Puede utilizar **cualquier pasarela RS485 a Modbus TCP**, como **Elfin EW11** (Wi-Fi), **Waveshare RS485 to Ethernet** (LAN en carril DIN), **Protoss PE11** o **USR-TCP232-410s**. Copie `modbus.yaml` en `/config/modbus.yaml` y cambie `host: "192.168.1.XXX"` por la dirección IP de su pasarela.

<a id="es-step-3"></a>
### Paso 3: Añadir `configuration.yaml`
Añada las secciones `modbus:`, `input_number:`, `input_select:`, `input_boolean:`, `template:`, `sensor:` y `utility_meter:` a su archivo `/config/configuration.yaml`.

<a id="es-step-4"></a>
### Paso 4: Medidor de Energía, LG ThinQ y Cálculo Automático de Respaldo (Fallback)
1. **Opción A — Integración oficial LG ThinQ:** Usa `sensor.lg_therma_v_7kw_energy_today` por defecto (si su entidad tiene otro nombre, reemplácelo en `configuration.yaml` y `app.js`).
2. **Opción B — Medidor externo (Shelly EM, HomeWizard, Eastron SDM, etc.):** En `configuration.yaml` bajo `utility_meter:`, cambie `source: sensor.lg_therma_v_7kw_energy_today` por su sensor `kWh` (y opcionalmente la plantilla de `lg_wp_elektrisch_vermogen` por su sensor de potencia en `W`).
3. **Opción C — Cálculo termodinámico integrado (¡Sin necesidad de medidor ni ThinQ!):** Si no dispone de ThinQ ni de un medidor externo, `sensor.lg_wp_elektrisch_vermogen` calcula automáticamente el consumo eléctrico (`W`) mediante un modelo termodinámico de Carnot (a partir de la potencia térmica, temperatura de impulsión `LWT`, temperatura exterior `OAT`, desescarche, resistencias de apoyo y bomba), integrándolo en contadores `kWh` (`sensor.lg_stroom_*`) de forma automática.

<a id="es-step-5"></a>
### Paso 5, 6 y 7: Automatización (`automations.yaml`), Carpeta `/config/www/` y Panel `/local/index.html`
Añada la automatización de `automations.yaml`, suba los 5 archivos del panel a `/config/www/` y agregue una tarjeta **Página Web (`iframe`)** con la URL `/local/index.html`.

---

## 📄 License & Disclaimer

Released under the **MIT License** (see [LICENSE](LICENSE)). Use of these Modbus registers and configurations is at your own risk.
