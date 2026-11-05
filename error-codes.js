// =========================================================================
// COMPLETE LG THERMA V R290 ERROR CODE & TROUBLESHOOTING DATABASE
// =========================================================================
const LG_ERROR_CODES = [
  {
    code: 1,
    ch: "CH 01",
    title: "Binnenruimte temperatuursensor fout",
    cause: "De interne ruimtetemperatuursensor (in de bedrade LG-afstandsbediening) is onderbroken of kortgesloten.",
    fix: "Controleer de 3-aderige communicatiekabel tussen de LG-controller en de monobloc en controleer de stekkerverbinding op de printplaat."
  },
  {
    code: 2,
    ch: "CH 02",
    title: "Koudemiddel-inlaatsensor fout",
    cause: "Kortsluiting of onderbreking in de koudemiddel-inlaatthermistor van de platenwisselaar.",
    fix: "Meet de weerstand van de leidingthermistor op de printplaat na en controleer de stekker op oxidatie."
  },
  {
    code: 3,
    ch: "CH 03",
    title: "Communicatiefout bedrade thermostaat ↔ warmtepomp",
    cause: "Geen dataverbinding tussen de LG wandcontroller (RMC) en de hoofdprintplaat van de monobloc.",
    fix: "Controleer de verbindingskabel naar de wandthermostaat. Controleer of de Elfin EW11 Modbus-adapter niet op dezelfde bus-lijn stoort."
  },
  {
    code: 5,
    ch: "CH 05",
    title: "Interne communicatiefout hoofdprint ↔ inverterprint",
    cause: "Signaalverlies tussen de hydronische stuurprint en de buitenunit/inverter-printplaat.",
    fix: "Schakel de werkschakelaar/automaat van de warmtepomp 3 minuten volledig stroomloos en schakel weer in."
  },
  {
    code: 6,
    ch: "CH 06",
    title: "Koudemiddel-uitlaatsensor fout",
    cause: "De koudemiddel-uitlaatthermistor bij de platenwisselaar geeft een ongeldige weerstandswaarde.",
    fix: "Controleer de connector van de koudemiddel-uitlaatsensor op de hoofdprintplaat."
  },
  {
    code: 8,
    ch: "CH 08",
    title: "SWW Tapwaterboiler temperatuursensor fout",
    cause: "De dompelvoeler (NTC) in de 200L SWW-boiler is losgekoppeld, onderbroken of kortgesloten.",
    fix: "Controleer de boilervoeler in de dompelbuis van de 200L boiler en de aansluitstekker op de LG-printplaat (CN_TH4)."
  },
  {
    code: 9,
    ch: "CH 09",
    title: "EEPROM geheugenfout hoofdprintplaat",
    cause: "Corrupte configuratiedata of leesfout op de EEPROM-chip van de hoofdprintplaat.",
    fix: "Reset de warmtepomp spanningsloos (3 min). Blijft CH09 terugkomen, dan moet de EEPROM/hoofdprint vervangen worden."
  },
  {
    code: 10,
    ch: "CH 10",
    title: "BLDC Motor terugkoppelingsfout (Pomp / Ventilator)",
    cause: "Geen tacho/toerentalsignaal ontvangen van de interne circulatiepomp of ventilator.",
    fix: "Controleer of de interne circulatiepomp niet vastzit door vuil/magnetiet en controleer de PWM/voedingsstekker."
  },
  {
    code: 14,
    ch: "CH 14",
    title: "Debietfout / Sika Flowsensor te laag",
    cause: "Het waterdebiet zakt tijdens bedrijf onder de minimale veiligheidsgrens of valt weg bij het schakelen van de 3-wegklep.",
    fix: "1) Reinig de vuilafscheider/magneetfilter. 2) Controleer of de vloerverwarmingsgroepen open staan. 3) Ontlucht het systeem. 4) Controleer of de 3-wegklep niet halverwege blokkeert."
  },
  {
    code: 15,
    ch: "CH 15",
    title: "Oververhitting waterzijdig (Aanvoertemperatuur te hoog)",
    cause: "De wateruittredetemperatuur (LWT) is boven de maximale veiligheidslimiet gestegen.",
    fix: "Controleer of het waterdebiet voldoende is (min. 10-12 L/min) en of de 3-wegklep bij SWW-laden vrij doorstroomt door de boilerspiraal."
  },
  {
    code: 16,
    ch: "CH 16",
    title: "Gecombineerde fout watertemperatuursensoren",
    cause: "Meerdere waterzijdige NTC-sensoren geven tegelijkertijd onwaarschijnlijke waarden.",
    fix: "Controleer de gezamenlijke sensor-kabelboom naar de waterinlaat- en wateruitlaatsensoren in de monobloc."
  },
  {
    code: 17,
    ch: "CH 17",
    title: "Retourwater temperatuursensor (EWT) fout",
    cause: "De retourwater-thermistor (inlaat monobloc) is open of kortgesloten.",
    fix: "Controleer de retourwatersensor op de leiding in de buitenunit en de stekker op de printplaat."
  },
  {
    code: 18,
    ch: "CH 18",
    title: "Aanvoerwater temperatuursensor (LWT) fout",
    cause: "De aanvoerwater-thermistor (uitlaat monobloc) is open of kortgesloten.",
    fix: "Controleer de aanvoerwatersensor op de leiding na de platenwisselaar en de stekker op de printplaat."
  },
  {
    code: 19,
    ch: "CH 19",
    title: "Backup Heater uittredesensor fout",
    cause: "De temperatuursensor bij het elektrische verwarmingselement is onderbroken of kortgesloten.",
    fix: "Controleer de sensorbekabeling op de behuizing van de elektrische backup heater."
  },
  {
    code: 20,
    ch: "CH 20",
    title: "Externe / Zonneboiler temperatuursensor fout",
    cause: "Fout op de ingang voor een optionele zonneboiler- of externe buffervoeler.",
    fix: "Controleer in het installateursmenu of externe thermische bronnen per ongeluk zijn ingeschakeld."
  },
  {
    code: 21,
    ch: "CH 21",
    title: "Inverter DC Peak / IPM Overstroomfout",
    cause: "De Intelligent Power Module (IPM) van de compressor heeft een plotselinge piekstroom gedetecteerd.",
    fix: "Schakel de stroom 5 minuten uit. Controleer bij herhaling of de compressor niet tegen extreem hoge druk opstart of een fase-sluiting heeft."
  },
  {
    code: 22,
    ch: "CH 22",
    title: "Max. ingangsstroom (CT2) overschreden",
    cause: "Het totale opgenomen vermogen/stroomsterkte van de buitenunit overschrijdt de ingestelde limiet.",
    fix: "Controleer de netspanning (geen zware spanningsval onder belasting) en controleer of de condensor/waterafgifte niet geblokkeerd is."
  },
  {
    code: 23,
    ch: "CH 23",
    title: "DC-Link spanning te laag of te hoog",
    cause: "De gelijkspanning op de inverter-tussenkring wijkt af (< 140V of > 420V).",
    fix: "Controleer de netspanning in de meterkast. Een korte netspanningsdip kan deze fout veroorzaken; reset de unit spanningsloos."
  },
  {
    code: 24,
    ch: "CH 24",
    title: "Hogedruk- of lagedruk-pressostaat aangesproken",
    cause: "De mechanische drukbeveiliging in het R290-koudemiddelcircuit is geactiveerd.",
    fix: "Bij verwarmen meestal veroorzaakt door te weinig waterafgifte (pomp/klep dicht -> hogedruk). Controleer debiet en laat het systeem afkoelen."
  },
  {
    code: 26,
    ch: "CH 26",
    title: "DC Compressor start- / positiedetectiefout",
    cause: "De R290 scroll-compressor komt niet op toeren tijdens de startpuls.",
    fix: "Kan optreden bij zeer lage buitentemperaturen of na een stroomonderbreking terwijl er nog drukverschil staat. Reset na 5 minuten rust."
  },
  {
    code: 27,
    ch: "CH 27",
    title: "PSC / PFC Overstroomfout op inverterprint",
    cause: "Fout in het Power Factor Correction (PFC) circuit op de buitenunit-printplaat.",
    fix: "Controleer de netspanningskwaliteit en reset de voeding gedurende 5 minuten."
  },
  {
    code: 29,
    ch: "CH 29",
    title: "Compressor fasestroom te hoog (Overcurrent)",
    cause: "De compressor trekt meer stroom dan toegestaan bij het huidige toerental.",
    fix: "Controleer of de aanvoertemperatuur/condensatiedruk niet extreem oploopt door gebrek aan waterflow."
  },
  {
    code: 32,
    ch: "CH 32",
    title: "Persgastemperatuur compressor te hoog",
    cause: "De heetgastemperatuur van de compressor is boven de ~105 °C gestegen.",
    fix: "Controleer tijdens SWW-laden op hoge temperatuur (55-60°C) of het debiet hoog genoeg is. Kan ook wijzen op een haperend expansieventiel (EEV)."
  },
  {
    code: 34,
    ch: "CH 34",
    title: "Hogedruksensor fout of condensatiedruk te hoog",
    cause: "De koudemiddeldruk aan de warme zijde loopt te hoog op omdat de platenwisselaar zijn warmte niet kwijt kan.",
    fix: "Controleer het waterdebiet (L/min) en controleer of de 200L boilerspiraal of vloerverdeler voldoende warmte afneemt."
  },
  {
    code: 35,
    ch: "CH 35",
    title: "Lagedruksensor fout of verdampingsdruk te laag",
    cause: "De zuigdruk in de verdamper zakt onder de ondergrens.",
    fix: "Controleer of de buitenverdamper niet volledig dichtgevroren is (luchtstroom geblokkeerd) en of het expansieventiel goed regelt."
  },
  {
    code: 40,
    ch: "CH 40",
    title: "CT (Current Transformer) stroomsensor fout",
    cause: "De interne stroommeting op de inverterprint geeft een onjuist nul- of meetsignaal.",
    fix: "Schakel de spanning 3 minuten uit en weer in. Bij blijvende fout is het CT-circuit op de inverterprint defect."
  },
  {
    code: 41,
    ch: "CH 41",
    title: "Persgastemperatuursensor defect",
    cause: "De discharge-thermistor op de compressorpersleiding is onderbroken of kortgesloten.",
    fix: "Controleer de stekker en weerstandswaarde van de persgassensor bovenop de compressor."
  },
  {
    code: 42,
    ch: "CH 42",
    title: "Lagedruksensor elektrisch defect",
    cause: "Geen 0-5V signaal van de lagedruktransducer.",
    fix: "Controleer de 3-polige stekker van de lagedruksensor op de inverterprintplaat."
  },
  {
    code: 43,
    ch: "CH 43",
    title: "Hogedruksensor elektrisch defect",
    cause: "Geen 0-5V signaal van de hogedruktransducer.",
    fix: "Controleer de 3-polige stekker van de hogedruktransducer op de inverterprintplaat."
  },
  {
    code: 44,
    ch: "CH 44",
    title: "Buitenlucht temperatuursensor fout",
    cause: "De buitentemperatuurvoeler achterop de verdamper is onderbroken of kortgesloten.",
    fix: "Controleer de zwarte NTC-sensor aan de achterzijde van de buitenunit en de connector op de print."
  },
  {
    code: 45,
    ch: "CH 45",
    title: "Condensor / Wisselaar midden-temperatuursensor fout",
    cause: "De leidingvoeler op de buitenwisselaar geeft een ongeldige waarde.",
    fix: "Controleer de sensorbekabeling op de verdamper/condensor-bochten in de buitenunit."
  },
  {
    code: 46,
    ch: "CH 46",
    title: "Zuiggastemperatuursensor fout",
    cause: "De thermistor op de zuigleiding naar de compressor is open of kortgesloten.",
    fix: "Controleer de zuiggassensor en de aansluiting op de printplaat."
  },
  {
    code: 52,
    ch: "CH 52",
    title: "Communicatiefout Main PCB ↔ Inverter PCB",
    cause: "Interne UART-communicatie tussen de twee printplaten in de monobloc is weggevallen.",
    fix: "Controleer de interne verbindingskabel tussen beide printplaten en voer een spanningsloze reset uit."
  },
  {
    code: 53,
    ch: "CH 53",
    title: "Communicatiefout Buitenunit ↔ Regelaar / Modbus Timeout",
    cause: "De verbinding met de binnenregelaar of externe Modbus-master (indien bewaakt) is verbroken.",
    fix: "Controleer de signaalkabel naar binnen en controleer of de Elfin EW11 op 9600 baud (8N1) niet botst met de wandthermostaat."
  },
  {
    code: 60,
    ch: "CH 60",
    title: "EEPROM checksum-fout op Inverter PCB",
    cause: "Geheugenfout op de inverter-printplaat van de buitenunit.",
    fix: "Schakel de hoofdschakelaar 5 minuten uit om de inverter-processor volledig te herstarten."
  },
  {
    code: 61,
    ch: "CH 61",
    title: "Condensatietemperatuur te hoog",
    cause: "De koudemiddel-condensatietemperatuur stijgt boven de veilige grens (~65-68°C).",
    fix: "Ontstaat meestal aan het einde van een SWW-run op hoge temperatuur wanneer het debiet of de warmteoverdracht in de boiler te laag wordt. Verlaag het SWW-setpoint met 2°C of verhoog het pompdebiet."
  },
  {
    code: 62,
    ch: "CH 62",
    title: "Inverter Heatsink (Koellichaam) te heet",
    cause: "Het aluminium koelblok van de inverter-vermogensmodule wordt niet voldoende gekoeld.",
    fix: "Controleer of de buitenventilator vrij draait en of de koelribben van de printplaat stof- en bladvrij zijn."
  },
  {
    code: 65,
    ch: "CH 65",
    title: "Heatsink temperatuursensor defect",
    cause: "De temperatuursensor op het koellichaam van de inverterprint is open of kortgesloten.",
    fix: "Controleer de connector op de inverterprint of herstart de unit spanningsloos."
  },
  {
    code: 67,
    ch: "CH 67",
    title: "Buitenventilator BLDC-motor geblokkeerd",
    cause: "De ventilator van de monobloc kan niet draaien of ondervindt te veel weerstand.",
    fix: "Controleer of er bladeren, takken of ijsvorming tegen het ventilatorblad zitten."
  },
  {
    code: 82,
    ch: "CH 82",
    title: "R290 Koudemiddel-lekkagedetectie / Beveiliging",
    cause: "De interne R290-veiligheidssensor of drukbeveiliging in de monobloc is geactiveerd.",
    fix: "Ventileer de omgeving rond de buitenunit, gebruik geen open vuur, en controleer de koudemiddeldrukken en automatische ontluchter."
  },
  {
    code: 86,
    ch: "CH 86",
    title: "Thermische beveiliging Backup Heater aangesproken",
    cause: "De klixon / maximaalthermostaat op het elektrische element is uitgeslagen door oververhitting.",
    fix: "Controleer de waterdoorstroming en druk op de handmatige resetknop op het verwarmingselement (na spanningsloos maken)."
  },
  {
    code: 93,
    ch: "CH 93",
    title: "Onvoldoende circulatie tijdens Defrost / Vorstbeveiliging",
    cause: "Tijdens een ontdooicyclus (defrost) is het debiet of de watertemperatuur te laag om de wisselaar veilig te ontdooien.",
    fix: "Zorg dat tijdens defrost voldoende vloerverwarmingsgroepen volledig open staan (direct injection zonder buffer vereist vrije doorstroming door de vloerverwarming)."
  },
  {
    code: 94,
    ch: "CH 94",
    title: "Vorstbeveiliging platenwisselaar geactiveerd",
    cause: "De watertemperatuur in de platenwisselaar dreigt tijdens een defrost onder de 2-4 °C te zakken.",
    fix: "Controleer het debiet tijdens defrost en controleer of de retourwatertemperatuur uit de vloer niet te laag is."
  }
];

function renderErrorDatabase(query = "") {
  const q = query.trim().toLowerCase();
  const bannerEl = document.getElementById("errActiveBanner");
  const gridEl = document.getElementById("errGridContainer");
  const curErr = currentState.errCode || 0;

  if (curErr === 0) {
    bannerEl.className = "err-active-banner err-banner-ok";
    bannerEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <strong style="color:#34d399; font-size:13.5px;">✅ Actuele Status: CH 00 — Geen actieve foutcodes</strong>
        <span style="font-size:11.5px; color:var(--text-secondary);">Geen storing actief</span>
      </div>
      <div style="font-size:12px; color:var(--text-secondary);">
        De warmtepomp functioneert normaal zonder storingen. Zoek hieronder in de LG Therma V R290 CH-foutcodelijst.
      </div>`;
  } else {
    const match = LG_ERROR_CODES.find((e) => e.code === curErr);
    const title = match ? match.title : "Onbekende LG Foutcode";
    const cause = match ? match.cause : "De warmtepomp rapporteert een actieve foutcode.";
    const fix = match ? match.fix : "Controleer het display van de bedrade LG-thermostaat en reset de voeding.";
    bannerEl.className = "err-active-banner err-banner-fault";
    bannerEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <strong style="color:var(--rose); font-size:14px;">⚠️ ACTIEVE STORING: CH ${String(curErr).padStart(2, "0")} — ${title}</strong>
        <span style="font-size:11.5px; color:#fda4af;">Foutcode ${curErr}</span>
      </div>
      <div style="font-size:12.5px; color:var(--text-primary);"><b>Oorzaak:</b> ${cause}</div>
      <div style="font-size:12.5px; color:#5eead4; margin-top:2px;"><b>Oplossing / Stappenplan:</b> ${fix}</div>`;
  }

  const filtered = LG_ERROR_CODES.filter((item) => {
    if (!q) return true;
    return (
      item.ch.toLowerCase().includes(q) ||
      item.ch.replace(/\s+/g, "").toLowerCase().includes(q) ||
      String(item.code) === q ||
      item.title.toLowerCase().includes(q) ||
      item.cause.toLowerCase().includes(q) ||
      item.fix.toLowerCase().includes(q)
    );
  });

  gridEl.innerHTML = filtered
    .map((item) => {
      const isCurrent = item.code === curErr && curErr > 0;
      return `
        <div class="err-item ${isCurrent ? "is-current-fault" : ""}">
          <div class="err-item-head">
            <span class="err-code-pill">${item.ch}</span>
            <span class="err-item-title">${item.title}</span>
          </div>
          <div class="err-item-cause"><b>Oorzaak:</b> ${item.cause}</div>
          <div class="err-item-fix"><b>Troubleshooting:</b> ${item.fix}</div>
        </div>`;
    })
    .join("");
}