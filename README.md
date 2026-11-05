# 🔥 LG Therma V R290 — Home Assistant Telemetry Dashboard

Een interactief, realtime **Home Assistant** dashboard voor de **LG Therma V R290 Monobloc** warmtepomp (uitgelezen via een **Elfin EW11** RS485-naar-Modbus TCP gateway en optioneel gekoppeld aan **LG ThinQ** voor officiële energieverbruikscijfers).

---

## ✨ Functionaliteiten

- **6 Interactieve KPI-kaarten** (met uitklapbare 24u / 12u / 6u / 1u stap-grafieken):
  1. **Actueel Rendement (COP)** — Live COP, Dag-COP, thermisch vermogen (kW) en elektrisch vermogen (kW).
  2. **Watertemp & ΔT** — Aanvoertemperatuur (LWT), retourtemperatuur (EWT), Delta T (K) én de **Berekende Setpoint CV** lijn in de grafiek (inclusief live hysterese-verschil op de retourtemperatuur).
  3. **SWW Tapwaterboiler** — Boilertemperatuur, doeltemperatuur en actuele laadstatus.
  4. **Binnentemperatuur** — Kamertemperatuur, daggemiddelde en stooklijn parallel shift.
  5. **Buitentemperatuur** — Buitenvoeler warmtepomp, stooklijnbereik en live weerstatus (bijv. Buienradar).
  6. **Circulatie & Systeemdruk** — Actueel debiet (L/min & L/u), waterdruk (bar) en pomp-/3-wegklepstatus.
- **Live Geanimeerd Hydraulisch Schema** — Toont realtime stroming richting de vloerverwarming (CV) of de tapwaterboiler (SWW), inclusief compressorstatus, vermogens en temperaturen, met daaronder **3 klikbare detailkaarten met grafiek**:
  - **Waterdruk** (`bar`)
  - **Thermisch Vermogen** (`kW`)
  - **Elektrisch Verbruik** (`kW`)
- **SCOP Rendement & Energiebalans** — Overzicht per **Dag, Week, Maand, Jaar en Altijd**, uitgesplitst naar **Vloerverwarming (CV)** en **Tapwaterboiler (SWW)** op basis van de officiële LG ThinQ verbruikscijfers (met automatische fallback naar berekend vermogen).
- **Interactieve Stooklijn + Parallel Shift Slider** — Pas direct vanuit het dashboard de stooklijn-offset (`-5 K` t/m `+5 K`) aan.
- **Ingebouwde LG Therma V CH-Foutcode Database** — Klik op de diagnose-pill bovenin (`CH 00 OK`) om door alle LG CH-foutcodes, oorzaken en oplossingen te zoeken.
- **Directe Bediening** — Knoppen met bevestigingsbeveiliging voor **WP Aan/Uit**, **SWW Vrijgave** en **Silent Mode**.
- **⚙️ Configuratiescherm (Tandwiel rechtsboven)** — Stel direct in het dashboard in:
  - **Taal / Language:** Engels (Standaard), Nederlands, Duits, Frans en Spaans.
  - **Stooklijn Sturing:** Kies tussen **Inlet / Retour (EWT)** of **Outlet / Aanvoer (LWT)** (past ook direct de berekende hysterese-afwijking in de *Watertemp & ΔT* grafiek aan).
  - **SWW Doeltemperatuur Overrulen:** Schakel tussen de automatische Modbus-sensor of een handmatig ingestelde SWW-doeltemperatuur (`35 °C – 65 °C`).

---

## 📁 Bestanden in deze Repository

| Bestand | Beschrijving | Waar plaatsen in Home Assistant? |
| :--- | :--- | :--- |
| `modbus.yaml` | Modbus TCP configuratie (registers voor de LG Therma V via Elfin EW11) | `/config/modbus.yaml` |
| `configuration.yaml` | `input_number` helpers, `template` sensoren (Delta T, vermogen, COP/SCOP), `integration` (Riemann sum) en `utility_meter` tellers | Toevoegen aan `/config/configuration.yaml` |
| `automations.yaml` | Automatisering om de Stooklijn Parallel Shift slider naar het Modbus-register te schrijven | Toevoegen aan `/config/automations.yaml` (of via de HA UI) |
| `index.html` | Hoofdpagina van het dashboard | `/config/www/index.html` |
| `styles.css` | Styling en animaties van het dashboard | `/config/www/styles.css` |
| `app.js` | Home Assistant WebSocket/State bridge en logica | `/config/www/app.js` |
| `charts.js` | Canvas grafiek-engine (24u/12u/6u/1u grafieken & stooklijn) | `/config/www/charts.js` |
| `error-codes.js` | Volledige LG Therma V R290 CH-foutcodedatabase | `/config/www/error-codes.js` |

---

## 🚀 Stapsgewijze Installatie in Home Assistant

### Stap 1: File Editor installeren (of een andere bestandsbeheerder)
Om bestanden in je Home Assistant `/config` map te plaatsen en te bewerken, gebruik je de **File editor** add-on (of Studio Code Server / Samba Share):
1. Ga in Home Assistant naar **Instellingen** → **Add-ons** → **Add-on Store** *(of via HACS / de officiële Add-on Store)*.
2. Zoek naar **File editor** en klik op **Installeren**.
3. Zet **Start on boot** en **Show in sidebar** aan en klik op **Start**.
4. Open **File editor** via de linker zijbalk van Home Assistant.

---

### Stap 2: `modbus.yaml` toevoegen en instellen
1. Klik in **File editor** linksboven op het **map-icoon** (Browse Filesystem) en zorg dat je in de hoofdmap (`/config/`) zit.
2. Upload het bestand `modbus.yaml` naar `/config/modbus.yaml` (of maak een nieuw bestand aan met de naam `modbus.yaml` en plak de inhoud erin).
3. **Belangrijk — Pas het IP-adres aan:** Open `modbus.yaml` en wijzig op regel 3 `host: "192.168.1.XXX"` naar het IP-adres van jouw eigen **Elfin EW11** / Modbus TCP gateway:
   ```yaml
   - name: "lg_therma_v"
     type: tcp
     host: "192.168.1.XXX" # <-- Vul hier het IP-adres van jouw Elfin EW11 in
     port: 502
     delay: 2
     message_wait_milliseconds: 50
     timeout: 5
   ```
   *(Controleer ook of `slave: 33` overeenkomt met het Modbus-adres in je LG wandthermostaat; pas dit indien nodig aan, bijv. naar `1` of `33`).*
4. Sla `modbus.yaml` op.

---

### Stap 3: Items uit `configuration.yaml` toevoegen
1. Open je bestaande `/config/configuration.yaml` in **File editor**.
2. Voeg de inhoud van het meegeleverde bestand `configuration.yaml` toe aan je eigen `configuration.yaml`:
   - De verwijzing `modbus: !include modbus.yaml`
   - De sectie `input_number:` (voor de stooklijn-instellingen en parallel shift)
   - De sectie `template:` (voor `LG WP Delta T`, `LG WP Thermisch Vermogen`, `LG WP Elektrisch Vermogen`, `LG WP Actuele COP`, `LG WP COP Vandaag` en de `SCOP` sensoren)
   - De sectie `sensor:` (Riemann sum integrators die Watt omzetten naar kWh)
   - De sectie `utility_meter:` (Dag-, Week-, Maand-, Jaar- en Alltime-tellers)
   > **Let op:** Heb je al een `input_number:`, `template:`, `sensor:` of `utility_meter:` kopje in je `configuration.yaml` staan? Voeg de items dan samen onder je bestaande kopjes zodat elk hoofdkopje maar één keer voorkomt.
3. **Optioneel — LG ThinQ energie-entiteit:**
   Gebruik je de LG ThinQ integratie voor het uitlezen van het officiële elektriciteitsverbruik? Controleer in `configuration.yaml` of de entiteitsnaam `sensor.lg_therma_v_7kw_energy_today` overeenkomt met de naam van jouw ThinQ energie-sensor (pas deze naam indien nodig aan met *Zoeken & Vervangen*). Heb je geen ThinQ gekoppeld? Geen probleem: het dashboard valt automatisch terug op het berekende elektrische verbruik.
4. Controleer je configuratie via **Ontwikkelhulpmiddelen** → **YAML** → **Configuratie controleren** en **herstart Home Assistant**.

---

### Stap 4: Automatisering voor de Stooklijn Parallel Shift toevoegen
Om ervoor te zorgen dat de **Stooklijn Parallel Shift (Offset)** slider in het dashboard (`input_number.lg_wp_stooklijn_shift_input`) de waarde daadwerkelijk naar het Modbus-register (`40005` / adres `4`) van de warmtepomp schrijft (inclusief two's complement omrekening voor negatieve waarden zoals `-1 K` t/m `-5 K`), voeg je de volgende automatisering toe:

1. Ga in Home Assistant naar **Instellingen** → **Automatiseringen & scènes** → **Automatisering maken** → **Nieuwe automatisering maken**.
2. Klik rechtsboven op de **drie puntjes (⋮)** → **Bewerken in YAML**.
3. Plak onderstaande YAML-code en klik op **Opslaan** *(of voeg deze toe aan je `/config/automations.yaml` bestand)*:

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

---

### Stap 5: De `www` map aanmaken en de dashboard-bestanden uploaden
Home Assistant serveert alle bestanden in de map `/config/www/` automatisch onder het lokale webadres `/local/`.

1. Open **File editor** en ga naar de hoofdmap `/config/`.
2. Kijk of er al een map met de naam **`www`** bestaat:
   - **Zo niet:** Klik bovenin op het icoon **New Folder** (Nieuwe map), noem deze exact `www` en klik op OK.
   - *(Belangrijk: Als je de map `www` voor het eerst hebt aangemaakt, **herstart Home Assistant** dan één keer zodat Home Assistant de `/local/` route activeert).*
3. Open de map `/config/www/` in **File editor** en upload (via het **Upload File** icoon bovenin) de volgende **5 bestanden** naar `/config/www/`:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `charts.js`
   - `error-codes.js`

*(Je kunt de bestanden eventueel ook in een submap plaatsen, bijvoorbeeld `/config/www/thermav/` — gebruik dan in Stap 6 `/local/thermav/index.html` als URL).*

---

### Stap 6: Het dashboard toevoegen aan Home Assistant (Webpagina / `/local/index.html`)
Je kunt het dashboard als een eigen dashboard in de zijbalk zetten of als een kaart op een bestaand dashboard:

#### Optie A: Als volledig scherm / eigen tabblad (Aanbevolen)
1. Ga naar je Home Assistant dashboard en klik rechtsboven op het **potloodje (Dashboard bewerken)**.
2. Klik op de **+** knop bovenin om een nieuwe weergave (tabblad) toe te voegen:
   - **Titel:** `Warmtepomp` (of `LG Therma V`)
   - **Weergavetype:** Kies **Paneel (1 kaart)** *(Panel - 1 card)* zodat het dashboard de volledige breedte en hoogte benut.
   - Klik op **Opslaan**.
3. Klik op **Kaart toevoegen** en kies de kaart **Webpagina** (*Webpage* / `iframe`).
4. Vul bij **URL** in:
   ```text
   /local/index.html
   ```
5. Zet de beeldverhouding (indien zichtbaar) op `100%` en klik op **Opslaan**.

#### Optie B: Via YAML op een dashboard
Voeg een `iframe` kaart toe op een Paneel-weergave:
```yaml
type: iframe
url: /local/index.html
aspect_ratio: 100%
```

---

## ⚙️ Optionele Aanpassingen in `app.js`

Bovenin `app.js` kun je op regel 1 en 2 eenvoudig je binnentemperatuursensor en weer-integratie aanpassen als je een andere kamerthermostaat of weerdienst gebruikt:

```javascript
const INDOOR_TEMP_ENTITY = "sensor.lg_wp_kamertemperatuur"; // Of bijv. "sensor.woonkamer_temperatuur"
const WEATHER_ENTITY = "weather.buienradar";                // Of bijv. "weather.forecast_home"
```
*(Het dashboard zoekt daarnaast automatisch naar veelgebruikte `sensor.*_temperatuur` en `climate.*` entiteiten als `sensor.lg_wp_kamertemperatuur` niet beschikbaar is).*

---

## 📄 Licentie & Disclaimer

Dit project is vrijgegeven onder de **MIT License** (zie [LICENSE](LICENSE)).  
Gebruik van deze configuratie en Modbus-registers gebeurt volledig op eigen risico.

