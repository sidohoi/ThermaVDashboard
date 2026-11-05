// =========================================================================
// COMPLETE LG THERMA V R290 ERROR CODE & TROUBLESHOOTING DATABASE
// =========================================================================
const LG_ERROR_CODES = [
  {
    code: 1,
    ch: "CH 01",
    title: "Binnenruimte temperatuursensor fout",
    cause: "De interne ruimtetemperatuursensor (in de bedrade LG-afstandsbediening) is onderbroken of kortgesloten.",
    fix: "Controleer de 3-aderige communicatiekabel tussen de LG-controller en de monobloc en controleer de stekkerverbinding op de printplaat.",
    title_en: "Indoor air temperature sensor error",
    cause_en: "The internal room temperature sensor (inside the wired LG remote controller) is open or short-circuited.",
    fix_en: "Check the 3-core communication cable between the LG controller and the monobloc and inspect the PCB connector."
  },
  {
    code: 2,
    ch: "CH 02",
    title: "Koudemiddel-inlaatsensor fout",
    cause: "Kortsluiting of onderbreking in de koudemiddel-inlaatthermistor van de platenwisselaar.",
    fix: "Meet de weerstand van de leidingthermistor op de printplaat na en controleer de stekker op oxidatie.",
    title_en: "Refrigerant inlet temperature sensor error",
    cause_en: "Short circuit or open circuit in the refrigerant inlet thermistor of the plate heat exchanger.",
    fix_en: "Measure the resistance of the pipe thermistor on the PCB and inspect the connector for corrosion."
  },
  {
    code: 3,
    ch: "CH 03",
    title: "Communicatiefout bedrade thermostaat ↔ warmtepomp",
    cause: "Geen dataverbinding tussen de LG wandcontroller (RMC) en de hoofdprintplaat van de monobloc.",
    fix: "Controleer de verbindingskabel naar de wandthermostaat. Controleer of de Elfin EW11 Modbus-adapter niet op dezelfde bus-lijn stoort.",
    title_en: "Communication error wired remote ↔ heat pump",
    cause_en: "No data connection between the LG wall controller (RMC) and the main PCB of the monobloc.",
    fix_en: "Check the cable to the wall controller and verify that the Elfin EW11 Modbus gateway is not interfering on the bus."
  },
  {
    code: 5,
    ch: "CH 05",
    title: "Interne communicatiefout hoofdprint ↔ inverterprint",
    cause: "Signaalverlies tussen de hydronische stuurprint en de buitenunit/inverter-printplaat.",
    fix: "Schakel de werkschakelaar/automaat van de warmtepomp 3 minuten volledig stroomloos en schakel weer in.",
    title_en: "Internal communication error Main PCB ↔ Inverter PCB",
    cause_en: "Signal loss between the hydronic control PCB and the outdoor inverter PCB.",
    fix_en: "Turn off the main circuit breaker of the heat pump for 3 minutes to power-cycle, then switch back on."
  },
  {
    code: 6,
    ch: "CH 06",
    title: "Koudemiddel-uitlaatsensor fout",
    cause: "De koudemiddel-uitlaatthermistor bij de platenwisselaar geeft een ongeldige weerstandswaarde.",
    fix: "Controleer de connector van de koudemiddel-uitlaatsensor op de hoofdprintplaat.",
    title_en: "Refrigerant outlet temperature sensor error",
    cause_en: "The refrigerant outlet thermistor at the plate heat exchanger reports an invalid resistance value.",
    fix_en: "Inspect the refrigerant outlet sensor connector on the main PCB."
  },
  {
    code: 8,
    ch: "CH 08",
    title: "SWW Tapwaterboiler temperatuursensor fout",
    cause: "De dompelvoeler (NTC) in de 200L SWW-boiler is losgekoppeld, onderbroken of kortgesloten.",
    fix: "Controleer de boilervoeler in de dompelbuis van de 200L boiler en de aansluitstekker op de LG-printplaat (CN_TH4).",
    title_en: "DHW tank temperature sensor error",
    cause_en: "The immersion NTC sensor in the DHW tank is disconnected, open, or short-circuited.",
    fix_en: "Check the tank sensor in the immersion well and its connector on the LG main PCB (CN_TH4)."
  },
  {
    code: 9,
    ch: "CH 09",
    title: "EEPROM geheugenfout hoofdprintplaat",
    cause: "Corrupte configuratiedata of leesfout op de EEPROM-chip van de hoofdprintplaat.",
    fix: "Reset de warmtepomp spanningsloos (3 min). Blijft CH09 terugkomen, dan moet de EEPROM/hoofdprint vervangen worden.",
    title_en: "Main PCB EEPROM memory error",
    cause_en: "Corrupted configuration data or read failure on the main PCB EEPROM chip.",
    fix_en: "Power-cycle the heat pump for 3 minutes. If CH09 persists, the EEPROM or main PCB must be replaced."
  },
  {
    code: 10,
    ch: "CH 10",
    title: "BLDC Motor terugkoppelingsfout (Pomp / Ventilator)",
    cause: "Geen tacho/toerentalsignaal ontvangen van de interne circulatiepomp of ventilator.",
    fix: "Controleer of de interne circulatiepomp niet vastzit door vuil/magnetiet en controleer de PWM/voedingsstekker.",
    title_en: "BLDC motor feedback error (Pump / Fan)",
    cause_en: "No tachometer RPM feedback signal received from the internal circulation pump or fan motor.",
    fix_en: "Check that the internal circulation pump is not seized by debris/magnetite and inspect the PWM/power connector."
  },
  {
    code: 14,
    ch: "CH 14",
    title: "Debietfout / Sika Flowsensor te laag",
    cause: "Het waterdebiet zakt tijdens bedrijf onder de minimale veiligheidsgrens of valt weg bij het schakelen van de 3-wegklep.",
    fix: "1) Reinig de vuilafscheider/magneetfilter. 2) Controleer of de vloerverwarmingsgroepen open staan. 3) Ontlucht het systeem. 4) Controleer of de 3-wegklep niet halverwege blokkeert.",
    title_en: "Water flow rate error / Flow switch low",
    cause_en: "Water flow rate dropped below the minimum safety threshold during operation or while switching the 3-way valve.",
    fix_en: "1) Clean the magnetic dirt separator/strainer. 2) Ensure underfloor heating loops are open. 3) Bleed air from the system. 4) Verify the 3-way valve does not jam mid-stroke."
  },
  {
    code: 15,
    ch: "CH 15",
    title: "Oververhitting waterzijdig (Aanvoertemperatuur te hoog)",
    cause: "De wateruittredetemperatuur (LWT) is boven de maximale veiligheidslimiet gestegen.",
    fix: "Controleer of het waterdebiet voldoende is (min. 10-12 L/min) en of de 3-wegklep bij SWW-laden vrij doorstroomt door de boilerspiraal.",
    title_en: "Water-side overheating (Supply temperature too high)",
    cause_en: "Leaving water temperature (LWT) exceeded the maximum safety limit.",
    fix_en: "Verify sufficient water flow (min. 10–12 L/min) and ensure unobstructed flow through the DHW tank coil."
  },
  {
    code: 16,
    ch: "CH 16",
    title: "Gecombineerde fout watertemperatuursensoren",
    cause: "Meerdere waterzijdige NTC-sensoren geven tegelijkertijd onwaarschijnlijke waarden.",
    fix: "Controleer de gezamenlijke sensor-kabelboom naar de waterinlaat- en wateruitlaatsensoren in de monobloc.",
    title_en: "Combined water temperature sensors error",
    cause_en: "Multiple water-side NTC thermistors simultaneously report out-of-range values.",
    fix_en: "Inspect the shared sensor wiring harness for the water inlet and outlet sensors inside the monobloc."
  },
  {
    code: 17,
    ch: "CH 17",
    title: "Retourwater temperatuursensor (EWT) fout",
    cause: "De retourwater-thermistor (inlaat monobloc) is open of kortgesloten.",
    fix: "Controleer de retourwatersensor op de leiding in de buitenunit en de stekker op de printplaat.",
    title_en: "Return water temperature sensor (EWT) error",
    cause_en: "The entering water thermistor (monobloc inlet) is open or short-circuited.",
    fix_en: "Inspect the return water sensor on the inlet pipe inside the outdoor unit and its PCB connector."
  },
  {
    code: 18,
    ch: "CH 18",
    title: "Aanvoerwater temperatuursensor (LWT) fout",
    cause: "De aanvoerwater-thermistor (uitlaat monobloc) is open of kortgesloten.",
    fix: "Controleer de aanvoerwatersensor op de leiding na de platenwisselaar en de stekker op de printplaat.",
    title_en: "Supply water temperature sensor (LWT) error",
    cause_en: "The leaving water thermistor (monobloc outlet) is open or short-circuited.",
    fix_en: "Inspect the supply water sensor after the plate heat exchanger and its PCB connector."
  },
  {
    code: 19,
    ch: "CH 19",
    title: "Backup Heater uittredesensor fout",
    cause: "De temperatuursensor bij het elektrische verwarmingselement is onderbroken of kortgesloten.",
    fix: "Controleer de sensorbekabeling op de behuizing van de elektrische backup heater.",
    title_en: "Backup heater outlet temperature sensor error",
    cause_en: "The temperature sensor at the electric backup heater is open or short-circuited.",
    fix_en: "Inspect the sensor wiring on the electric backup heater housing."
  },
  {
    code: 20,
    ch: "CH 20",
    title: "Externe / Zonneboiler temperatuursensor fout",
    cause: "Fout op de ingang voor een optionele zonneboiler- of externe buffervoeler.",
    fix: "Controleer in het installateursmenu of externe thermische bronnen per ongeluk zijn ingeschakeld.",
    title_en: "External / Solar thermal temperature sensor error",
    cause_en: "Fault on the input for an optional solar thermal or external buffer sensor.",
    fix_en: "Check the installer menu to verify whether external thermal sources were inadvertently enabled."
  },
  {
    code: 21,
    ch: "CH 21",
    title: "Inverter DC Peak / IPM Overstroomfout",
    cause: "De Intelligent Power Module (IPM) van de compressor heeft een plotselinge piekstroom gedetecteerd.",
    fix: "Schakel de stroom 5 minuten uit. Controleer bij herhaling of de compressor niet tegen extreem hoge druk opstart of een fase-sluiting heeft.",
    title_en: "Inverter DC Peak / IPM overcurrent fault",
    cause_en: "The compressor Intelligent Power Module (IPM) detected a sudden peak current.",
    fix_en: "Turn off power for 5 minutes. If repeated, check if the compressor is starting against excessive pressure or has a phase short."
  },
  {
    code: 22,
    ch: "CH 22",
    title: "Max. ingangsstroom (CT2) overschreden",
    cause: "Het totale opgenomen vermogen/stroomsterkte van de buitenunit overschrijdt de ingestelde limiet.",
    fix: "Controleer de netspanning (geen zware spanningsval onder belasting) en controleer of de condensor/waterafgifte niet geblokkeerd is.",
    title_en: "Max input current (CT2) exceeded",
    cause_en: "Total input current of the outdoor unit exceeded the configured limit.",
    fix_en: "Check grid voltage under load and verify that water heat rejection is not blocked."
  },
  {
    code: 23,
    ch: "CH 23",
    title: "DC-Link spanning te laag of te hoog",
    cause: "De gelijkspanning op de inverter-tussenkring wijkt af (< 140V of > 420V).",
    fix: "Controleer de netspanning in de meterkast. Een korte netspanningsdip kan deze fout veroorzaken; reset de unit spanningsloos.",
    title_en: "DC-Link voltage too low or too high",
    cause_en: "DC bus voltage on the inverter PCB is out of bounds (< 140V or > 420V).",
    fix_en: "Check mains voltage stability. A brief grid dip can trigger this fault; power-cycle the unit to reset."
  },
  {
    code: 24,
    ch: "CH 24",
    title: "Hogedruk- of lagedruk-pressostaat aangesproken",
    cause: "De mechanische drukbeveiliging in het R290-koudemiddelcircuit is geactiveerd.",
    fix: "Bij verwarmen meestal veroorzaakt door te weinig waterafgifte (pomp/klep dicht -> hogedruk). Controleer debiet en laat het systeem afkoelen.",
    title_en: "High/Low pressure switch tripped",
    cause_en: "The mechanical pressure safety switch in the R290 refrigerant circuit opened.",
    fix_en: "During heating, usually caused by insufficient water flow (high pressure). Check flow rate and allow the system to cool down."
  },
  {
    code: 26,
    ch: "CH 26",
    title: "DC Compressor start- / positiedetectiefout",
    cause: "De R290 scroll-compressor komt niet op toeren tijdens de startpuls.",
    fix: "Kan optreden bij zeer lage buitentemperaturen of na een stroomonderbreking terwijl er nog drukverschil staat. Reset na 5 minuten rust.",
    title_en: "DC Compressor start / position detection error",
    cause_en: "The R290 scroll compressor failed to spin up during the startup sequence.",
    fix_en: "Can occur at very low ambient temperatures or after a power cut while pressure differential remains. Reset after 5 minutes."
  },
  {
    code: 27,
    ch: "CH 27",
    title: "PSC / PFC Overstroomfout op inverterprint",
    cause: "Fout in het Power Factor Correction (PFC) circuit op de buitenunit-printplaat.",
    fix: "Controleer de netspanningskwaliteit en reset de voeding gedurende 5 minuten.",
    title_en: "PSC / PFC overcurrent fault on Inverter PCB",
    cause_en: "Fault in the Power Factor Correction (PFC) circuit on the outdoor unit PCB.",
    fix_en: "Verify grid power quality and power-cycle the unit for 5 minutes."
  },
  {
    code: 29,
    ch: "CH 29",
    title: "Compressor fasestroom te hoog (Overcurrent)",
    cause: "De compressor trekt meer stroom dan toegestaan bij het huidige toerental.",
    fix: "Controleer of de aanvoertemperatuur/condensatiedruk niet extreem oploopt door gebrek aan waterflow.",
    title_en: "Compressor phase overcurrent",
    cause_en: "The compressor is drawing more phase current than permitted at the current RPM.",
    fix_en: "Check that supply water temperature and condensing pressure are not spiking due to restricted water flow."
  },
  {
    code: 32,
    ch: "CH 32",
    title: "Persgastemperatuur compressor te hoog",
    cause: "De heetgastemperatuur van de compressor is boven de ~105 °C gestegen.",
    fix: "Controleer tijdens SWW-laden op hoge temperatuur (55-60°C) of het debiet hoog genoeg is. Kan ook wijzen op een haperend expansieventiel (EEV).",
    title_en: "Compressor discharge gas temperature too high",
    cause_en: "Compressor hot gas discharge temperature exceeded ~105 °C.",
    fix_en: "Check water flow rate during high-temperature DHW charging (55–60°C). May also indicate a sticking expansion valve (EEV)."
  },
  {
    code: 34,
    ch: "CH 34",
    title: "Hogedruksensor fout of condensatiedruk te hoog",
    cause: "De koudemiddeldruk aan de warme zijde loopt te hoog op omdat de platenwisselaar zijn warmte niet kwijt kan.",
    fix: "Controleer het waterdebiet (L/min) en controleer of de 200L boilerspiraal of vloerverdeler voldoende warmte afneemt.",
    title_en: "High pressure sensor error or condensing pressure too high",
    cause_en: "High-side refrigerant pressure is excessive because the plate heat exchanger cannot reject heat.",
    fix_en: "Check water flow rate (L/min) and ensure the DHW coil or underfloor manifold absorbs heat properly."
  },
  {
    code: 35,
    ch: "CH 35",
    title: "Lagedruksensor fout of verdampingsdruk te laag",
    cause: "De zuigdruk in de verdamper zakt onder de ondergrens.",
    fix: "Controleer of de buitenverdamper niet volledig dichtgevroren is (luchtstroom geblokkeerd) en of het expansieventiel goed regelt.",
    title_en: "Low pressure sensor error or suction pressure too low",
    cause_en: "Evaporator suction pressure dropped below the minimum threshold.",
    fix_en: "Check that the outdoor evaporator coil is not iced over or airflow-blocked and that the EEV operates properly."
  },
  {
    code: 40,
    ch: "CH 40",
    title: "CT (Current Transformer) stroomsensor fout",
    cause: "De interne stroommeting op de inverterprint geeft een onjuist nul- of meetsignaal.",
    fix: "Schakel de spanning 3 minuten uit en weer in. Bij blijvende fout is het CT-circuit op de inverterprint defect.",
    title_en: "CT (Current Transformer) sensor error",
    cause_en: "The current sensing circuit on the inverter PCB reports an invalid zero or measurement signal.",
    fix_en: "Power-cycle for 3 minutes. If the fault persists, the CT circuit on the inverter PCB is defective."
  },
  {
    code: 41,
    ch: "CH 41",
    title: "Persgastemperatuursensor defect",
    cause: "De discharge-thermistor op de compressorpersleiding is onderbroken of kortgesloten.",
    fix: "Controleer de stekker en weerstandswaarde van de persgassensor bovenop de compressor.",
    title_en: "Compressor discharge temperature sensor error",
    cause_en: "The discharge thermistor on the compressor discharge pipe is open or short-circuited.",
    fix_en: "Check the connector and resistance of the discharge temperature sensor on top of the compressor."
  },
  {
    code: 42,
    ch: "CH 42",
    title: "Lagedruksensor elektrisch defect",
    cause: "Geen 0-5V signaal van de lagedruktransducer.",
    fix: "Controleer de 3-polige stekker van de lagedruksensor op de inverterprintplaat.",
    title_en: "Low pressure sensor electrical fault",
    cause_en: "Missing or invalid 0–5V signal from the low-pressure transducer.",
    fix_en: "Inspect the 3-pin connector of the low-pressure transducer on the inverter PCB."
  },
  {
    code: 43,
    ch: "CH 43",
    title: "Hogedruksensor elektrisch defect",
    cause: "Geen 0-5V signaal van de hogedruktransducer.",
    fix: "Controleer de 3-polige stekker van de hogedruktransducer op de inverterprintplaat.",
    title_en: "High pressure sensor electrical fault",
    cause_en: "Missing or invalid 0–5V signal from the high-pressure transducer.",
    fix_en: "Inspect the 3-pin connector of the high-pressure transducer on the inverter PCB."
  },
  {
    code: 44,
    ch: "CH 44",
    title: "Buitenlucht temperatuursensor fout",
    cause: "De buitentemperatuurvoeler achterop de verdamper is onderbroken of kortgesloten.",
    fix: "Controleer de zwarte NTC-sensor aan de achterzijde van de buitenunit en de connector op de print.",
    title_en: "Outdoor ambient temperature sensor error",
    cause_en: "The outdoor ambient thermistor behind the evaporator is open or short-circuited.",
    fix_en: "Check the black NTC sensor at the rear of the outdoor unit and its PCB connector."
  },
  {
    code: 45,
    ch: "CH 45",
    title: "Condensor / Wisselaar midden-temperatuursensor fout",
    cause: "De leidingvoeler op de buitenwisselaar geeft een ongeldige waarde.",
    fix: "Controleer de sensorbekabeling op de verdamper/condensor-bochten in de buitenunit.",
    title_en: "Heat exchanger middle pipe sensor error",
    cause_en: "The coil thermistor on the outdoor heat exchanger reports an invalid reading.",
    fix_en: "Check the sensor wiring on the evaporator/condenser return bends inside the outdoor unit."
  },
  {
    code: 46,
    ch: "CH 46",
    title: "Zuiggastemperatuursensor fout",
    cause: "De thermistor op de zuigleiding naar de compressor is open of kortgesloten.",
    fix: "Controleer de zuiggassensor en de aansluiting op de printplaat.",
    title_en: "Suction gas temperature sensor error",
    cause_en: "The thermistor on the compressor suction line is open or short-circuited.",
    fix_en: "Inspect the suction gas thermistor and its PCB connection."
  },
  {
    code: 52,
    ch: "CH 52",
    title: "Communicatiefout Main PCB ↔ Inverter PCB",
    cause: "Interne UART-communicatie tussen de twee printplaten in de monobloc is weggevallen.",
    fix: "Controleer de interne verbindingskabel tussen beide printplaten en voer een spanningsloze reset uit.",
    title_en: "Communication fault Main PCB ↔ Inverter PCB",
    cause_en: "Internal UART communication between the two PCBs inside the monobloc was lost.",
    fix_en: "Inspect the internal harness between both PCBs and perform a power-off reset."
  },
  {
    code: 53,
    ch: "CH 53",
    title: "Communicatiefout Buitenunit ↔ Regelaar / Modbus Timeout",
    cause: "De verbinding met de binnenregelaar of externe Modbus-master (indien bewaakt) is verbroken.",
    fix: "Controleer de signaalkabel naar binnen en controleer of de Elfin EW11 op 9600 baud (8N1) niet botst met de wandthermostaat.",
    title_en: "Communication fault Outdoor Unit ↔ Controller / Modbus Timeout",
    cause_en: "Connection to the indoor controller or external Modbus master was interrupted.",
    fix_en: "Check the indoor signal cable and ensure the Elfin EW11 (9600 baud 8N1) does not conflict with the wall controller."
  },
  {
    code: 60,
    ch: "CH 60",
    title: "EEPROM checksum-fout op Inverter PCB",
    cause: "Geheugenfout op de inverter-printplaat van de buitenunit.",
    fix: "Schakel de hoofdschakelaar 5 minuten uit om de inverter-processor volledig te herstarten.",
    title_en: "Inverter PCB EEPROM checksum error",
    cause_en: "Memory checksum fault on the outdoor unit inverter PCB.",
    fix_en: "Turn off the main isolator for 5 minutes to fully reboot the inverter processor."
  },
  {
    code: 61,
    ch: "CH 61",
    title: "Condensatietemperatuur te hoog",
    cause: "De koudemiddel-condensatietemperatuur stijgt boven de veilige grens (~65-68°C).",
    fix: "Ontstaat meestal aan het einde van een SWW-run op hoge temperatuur wanneer het debiet of de warmteoverdracht in de boiler te laag wordt. Verlaag het SWW-setpoint met 2°C of verhoog het pompdebiet.",
    title_en: "Condensing pipe temperature too high",
    cause_en: "Refrigerant condensing temperature rose above the safety limit (~65–68°C).",
    fix_en: "Typically occurs near the end of a high-temp DHW cycle when coil heat transfer drops. Lower DHW target by 2°C or increase pump flow."
  },
  {
    code: 62,
    ch: "CH 62",
    title: "Inverter Heatsink (Koellichaam) te heet",
    cause: "Het aluminium koelblok van de inverter-vermogensmodule wordt niet voldoende gekoeld.",
    fix: "Controleer of de buitenventilator vrij draait en of de koelribben van de printplaat stof- en bladvrij zijn.",
    title_en: "Inverter heatsink temperature too high",
    cause_en: "The aluminum heatsink of the inverter power module is overheating.",
    fix_en: "Verify that the outdoor fan spins freely and that the heatsink fins are clear of dust and leaves."
  },
  {
    code: 65,
    ch: "CH 65",
    title: "Heatsink temperatuursensor defect",
    cause: "De temperatuursensor op het koellichaam van de inverterprint is open of kortgesloten.",
    fix: "Controleer de connector op de inverterprint of herstart de unit spanningsloos.",
    title_en: "Heatsink temperature sensor error",
    cause_en: "The thermistor on the inverter PCB heatsink is open or short-circuited.",
    fix_en: "Check the connector on the inverter PCB or power-cycle the unit."
  },
  {
    code: 67,
    ch: "CH 67",
    title: "Buitenventilator BLDC-motor geblokkeerd",
    cause: "De ventilator van de monobloc kan niet draaien of ondervindt te veel weerstand.",
    fix: "Controleer of er bladeren, takken of ijsvorming tegen het ventilatorblad zitten.",
    title_en: "Outdoor BLDC fan motor locked / blocked",
    cause_en: "The monobloc outdoor fan cannot rotate or encounters excessive resistance.",
    fix_en: "Check for leaves, branches, or ice buildup obstructing the fan blades."
  },
  {
    code: 82,
    ch: "CH 82",
    title: "R290 Koudemiddel-lekkagedetectie / Beveiliging",
    cause: "De interne R290-veiligheidssensor of drukbeveiliging in de monobloc is geactiveerd.",
    fix: "Ventileer de omgeving rond de buitenunit, gebruik geen open vuur, en controleer de koudemiddeldrukken en automatische ontluchter.",
    title_en: "R290 Refrigerant leak detection / Safety protection",
    cause_en: "The internal R290 gas safety sensor or pressure protection inside the monobloc was triggered.",
    fix_en: "Ventilate the area around the outdoor unit, avoid ignition sources, and inspect refrigerant pressures and air vents."
  },
  {
    code: 86,
    ch: "CH 86",
    title: "Thermische beveiliging Backup Heater aangesproken",
    cause: "De klixon / maximaalthermostaat op het elektrische element is uitgeslagen door oververhitting.",
    fix: "Controleer de waterdoorstroming en druk op de handmatige resetknop op het verwarmingselement (na spanningsloos maken).",
    title_en: "Backup heater thermal cutout tripped",
    cause_en: "The bi-metal high-limit thermostat on the electric backup heater tripped due to overheating.",
    fix_en: "Verify water flow and press the manual reset button on the heater housing (after isolating power)."
  },
  {
    code: 93,
    ch: "CH 93",
    title: "Onvoldoende circulatie tijdens Defrost / Vorstbeveiliging",
    cause: "Tijdens een ontdooicyclus (defrost) is het debiet of de watertemperatuur te laag om de wisselaar veilig te ontdooien.",
    fix: "Zorg dat tijdens defrost voldoende vloerverwarmingsgroepen volledig open staan (direct injection zonder buffer vereist vrije doorstroming door de vloerverwarming).",
    title_en: "Insufficient flow during Defrost / Anti-freeze protection",
    cause_en: "During a defrost cycle, water flow or water temperature was too low to safely defrost the plate heat exchanger.",
    fix_en: "Ensure sufficient underfloor heating loops remain fully open during defrost to guarantee free circulation."
  },
  {
    code: 94,
    ch: "CH 94",
    title: "Vorstbeveiliging platenwisselaar geactiveerd",
    cause: "De watertemperatuur in de platenwisselaar dreigt tijdens een defrost onder de 2-4 °C te zakken.",
    fix: "Controleer het debiet tijdens defrost en controleer of de retourwatertemperatuur uit de vloer niet te laag is.",
    title_en: "Plate heat exchanger anti-freeze protection active",
    cause_en: "Water temperature inside the plate heat exchanger risked dropping below 2–4 °C during defrost.",
    fix_en: "Check flow rate during defrost and verify that return water temperature from the heating circuit is not too low."
  }
];

const ERR_UI_TEXT = {
  en: {
    okTitle: "✅ Current Status: CH 00 — No active fault codes",
    okBadge: "No active fault",
    okSub: "The heat pump is operating normally without faults. Search the LG Therma V R290 CH error code database below.",
    faultPrefix: "⚠️ ACTIVE FAULT:",
    faultCodeLbl: "Error code",
    unknownTitle: "Unknown LG Error Code",
    unknownCause: "The heat pump is reporting an active fault code.",
    unknownFix: "Check the wired LG remote controller display and power-cycle the unit.",
    causeLbl: "Cause:",
    fixLbl: "Troubleshooting:"
  },
  nl: {
    okTitle: "✅ Actuele Status: CH 00 — Geen actieve foutcodes",
    okBadge: "Geen storing actief",
    okSub: "De warmtepomp functioneert normaal zonder storingen. Zoek hieronder in de LG Therma V R290 CH-foutcodelijst.",
    faultPrefix: "⚠️ ACTIEVE STORING:",
    faultCodeLbl: "Foutcode",
    unknownTitle: "Onbekende LG Foutcode",
    unknownCause: "De warmtepomp rapporteert een actieve foutcode.",
    unknownFix: "Controleer het display van de bedrade LG-thermostaat en reset de voeding.",
    causeLbl: "Oorzaak:",
    fixLbl: "Troubleshooting:"
  },
  de: {
    okTitle: "✅ Aktueller Status: CH 00 — Keine aktiven Fehlercodes",
    okBadge: "Keine Störung aktiv",
    okSub: "Die Wärmepumpe arbeitet normal ohne Störungen. Durchsuchen Sie unten die LG Therma V R290 CH-Fehlerdatenbank.",
    faultPrefix: "⚠️ AKTIVE STÖRUNG:",
    faultCodeLbl: "Fehlercode",
    unknownTitle: "Unbekannter LG Fehlercode",
    unknownCause: "Die Wärmepumpe meldet einen aktiven Fehlercode.",
    unknownFix: "Prüfen Sie das Display der LG-Fernbedienung und starten Sie das Gerät spannungsfrei neu.",
    causeLbl: "Ursache:",
    fixLbl: "Fehlerbehebung:"
  },
  fr: {
    okTitle: "✅ État actuel : CH 00 — Aucun code d'erreur actif",
    okBadge: "Aucun défaut actif",
    okSub: "La pompe à chaleur fonctionne normalement sans défaut. Recherchez ci-dessous dans la base de codes CH LG Therma V R290.",
    faultPrefix: "⚠️ DÉFAUT ACTIF :",
    faultCodeLbl: "Code d'erreur",
    unknownTitle: "Code d'erreur LG inconnu",
    unknownCause: "La pompe à chaleur signale un code d'erreur actif.",
    unknownFix: "Vérifiez l'écran de la télécommande filaire LG et redémarrez l'alimentation.",
    causeLbl: "Cause :",
    fixLbl: "Dépannage :"
  },
  es: {
    okTitle: "✅ Estado actual: CH 00 — Sin códigos de error activos",
    okBadge: "Sin avería activa",
    okSub: "La bomba de calor funciona normalmente sin fallos. Busque abajo en la base de datos de códigos CH de LG Therma V R290.",
    faultPrefix: "⚠️ AVERÍA ACTIVA:",
    faultCodeLbl: "Código de error",
    unknownTitle: "Código de error LG desconocido",
    unknownCause: "La bomba de calor informa un código de error activo.",
    unknownFix: "Compruebe la pantalla del mando por cable LG y reinicie la alimentación.",
    causeLbl: "Causa:",
    fixLbl: "Solución:"
  }
};

function getErrItemText(item, lang) {
  if (lang === "nl") {
    return { title: item.title, cause: item.cause, fix: item.fix };
  }
  return {
    title: item.title_en || item.title,
    cause: item.cause_en || item.cause,
    fix: item.fix_en || item.fix
  };
}

function renderErrorDatabase(query = "") {
  const q = query.trim().toLowerCase();
  const bannerEl = document.getElementById("errActiveBanner");
  const gridEl = document.getElementById("errGridContainer");
  const curErr = currentState.errCode || 0;
  const lang = (typeof userSettings !== "undefined" && userSettings.lang) ? userSettings.lang : "en";
  const ui = ERR_UI_TEXT[lang] || ERR_UI_TEXT.en;

  if (curErr === 0) {
    bannerEl.className = "err-active-banner err-banner-ok";
    bannerEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <strong style="color:#34d399; font-size:13.5px;">${ui.okTitle}</strong>
        <span style="font-size:11.5px; color:var(--text-secondary);">${ui.okBadge}</span>
      </div>
      <div style="font-size:12px; color:var(--text-secondary);">
        ${ui.okSub}
      </div>`;
  } else {
    const match = LG_ERROR_CODES.find((e) => e.code === curErr);
    const loc = match ? getErrItemText(match, lang) : null;
    const title = loc ? loc.title : ui.unknownTitle;
    const cause = loc ? loc.cause : ui.unknownCause;
    const fix = loc ? loc.fix : ui.unknownFix;
    bannerEl.className = "err-active-banner err-banner-fault";
    bannerEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <strong style="color:var(--rose); font-size:14px;">${ui.faultPrefix} CH ${String(curErr).padStart(2, "0")} — ${title}</strong>
        <span style="font-size:11.5px; color:#fda4af;">${ui.faultCodeLbl} ${curErr}</span>
      </div>
      <div style="font-size:12.5px; color:var(--text-primary);"><b>${ui.causeLbl}</b> ${cause}</div>
      <div style="font-size:12.5px; color:#5eead4; margin-top:2px;"><b>${ui.fixLbl}</b> ${fix}</div>`;
  }

  const filtered = LG_ERROR_CODES.filter((item) => {
    if (!q) return true;
    return (
      item.ch.toLowerCase().includes(q) ||
      item.ch.replace(/\s+/g, "").toLowerCase().includes(q) ||
      String(item.code) === q ||
      item.title.toLowerCase().includes(q) ||
      item.cause.toLowerCase().includes(q) ||
      item.fix.toLowerCase().includes(q) ||
      (item.title_en && item.title_en.toLowerCase().includes(q)) ||
      (item.cause_en && item.cause_en.toLowerCase().includes(q)) ||
      (item.fix_en && item.fix_en.toLowerCase().includes(q))
    );
  });

  gridEl.innerHTML = filtered
    .map((item) => {
      const isCurrent = item.code === curErr && curErr > 0;
      const loc = getErrItemText(item, lang);
      return `
        <div class="err-item ${isCurrent ? "is-current-fault" : ""}">
          <div class="err-item-head">
            <span class="err-code-pill">${item.ch}</span>
            <span class="err-item-title">${loc.title}</span>
          </div>
          <div class="err-item-cause"><b>${ui.causeLbl}</b> ${loc.cause}</div>
          <div class="err-item-fix"><b>${ui.fixLbl}</b> ${loc.fix}</div>
        </div>`;
    })
    .join("");
}
