// =========================================================================
// HOVER & STEP-HOLD HELPERS (NO SMOOTHING / NO LINEAR INTERPOLATION)
// =========================================================================
const hoverState = {
  top: null,
  stooklijn: null
};

const tooltipEl = document.getElementById("chartTooltip");

function showTooltip(clientX, clientY, htmlContent) {
  tooltipEl.innerHTML = htmlContent;
  tooltipEl.style.display = "block";
  const rect = tooltipEl.getBoundingClientRect();
  let left = clientX + 16;
  let top = clientY - rect.height / 2;

  if (left + rect.width > window.innerWidth - 12) {
    left = clientX - rect.width - 16;
  }
  if (top < 10) top = 10;
  if (top + rect.height > window.innerHeight - 10) {
    top = window.innerHeight - rect.height - 10;
  }

  tooltipEl.style.left = left + "px";
  tooltipEl.style.top = top + "px";
}

function hideTooltip() {
  tooltipEl.style.display = "none";
}

function formatHourLabel(hr) {
  const hoursAgo = Math.max(0, 24 - hr);
  const targetDate = new Date(Date.now() - hoursAgo * 3600 * 1000);
  const hh = String(targetDate.getHours()).padStart(2, "0");
  const mm = String(targetDate.getMinutes()).padStart(2, "0");
  const nowLbl = typeof t === "function" ? t("now") : "Now";
  const hrUnit = typeof t === "function" ? t("hrShort") : "h";
  if (hoursAgo < 0.02) return `${hh}:${mm} (${nowLbl})`;
  if (hoursAgo < 1.0) return `${hh}:${mm} (-${Math.round(hoursAgo * 60)}m)`;
  return `${hh}:${mm} (-${hoursAgo.toFixed(1)}${hrUnit})`;
}

function getStepValueAtHr(pts, targetHr) {
  if (!pts || pts.length === 0) return null;
  if (targetHr <= pts[0].hr) return pts[0].val;
  if (targetHr >= pts[pts.length - 1].hr) return pts[pts.length - 1].val;
  for (let i = 0; i < pts.length - 1; i++) {
    if (targetHr >= pts[i].hr && targetHr < pts[i + 1].hr) {
      return pts[i].val;
    }
  }
  return pts[pts.length - 1].val;
}

function sliceSeriesToWindow(fullPts, rangeHours) {
  if (!fullPts || fullPts.length === 0) return [];
  const startHr = 24 - rangeHours;
  const startVal = getStepValueAtHr(fullPts, startHr);
  const inside = fullPts.filter((p) => p.hr > startHr && p.hr <= 24);
  const result = [];
  if (startVal !== null) {
    result.push({ hr: startHr, val: startVal });
  }
  return result.concat(inside);
}

function traceStepPath(ctx, pts, xForTime, yForVal) {
  pts.forEach((pt, idx) => {
    const x = xForTime(pt.hr);
    const y = yForVal(pt.val);
    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      const prevY = yForVal(pts[idx - 1].val);
      ctx.lineTo(x, prevY);
      ctx.lineTo(x, y);
    }
  });
}

function drawCrosshair(ctx, x, y, padLeft, wMinusPadRight, padTop, hMinusPadBottom) {
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(226, 232, 240, 0.35)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x, padTop);
  ctx.lineTo(x, hMinusPadBottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padLeft, y);
  ctx.lineTo(wMinusPadRight, y);
  ctx.stroke();
  ctx.restore();
}

function drawHighlightDot(ctx, x, y, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.restore();
}

function bindCanvasHover(canvasId, key, redrawFn) {
  const canvas = document.getElementById(canvasId);
  const handleMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    hoverState[key] = {
      mx: clientX - rect.left,
      my: clientY - rect.top,
      clientX,
      clientY
    };
    redrawFn();
  };

  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("touchstart", handleMove, { passive: true });
  canvas.addEventListener("touchmove", handleMove, { passive: true });
  canvas.addEventListener("mouseleave", () => {
    hoverState[key] = null;
    hideTooltip();
    redrawFn();
  });
}

function drawTimeAxisLabels(ctx, startHr, rangeHours, xForTime, h) {
  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px sans-serif";
  const nowLbl = typeof t === "function" ? t("now") : "Now";
  const hrUnit = typeof t === "function" ? t("hrShort") : "h";
  const ticks = 6;
  for (let i = 0; i <= ticks; i++) {
    const hr = startHr + (i / ticks) * rangeHours;
    const x = xForTime(hr);
    const hoursAgo = 24 - hr;
    let label;
    if (i === ticks) {
      label = nowLbl;
    } else if (rangeHours === 1) {
      label = `-${Math.round(hoursAgo * 60)}m`;
    } else {
      label = `-${Math.round(hoursAgo)}${hrUnit}`;
    }
    ctx.fillText(label, x - (i === ticks ? 12 : 12), h - 5);
  }
}

function buildThermalSeries() {
  if (historySeries.thermal && historySeries.thermal.length >= 2) {
    return historySeries.thermal;
  }
  if (!historySeries.supply.length || !historySeries.ret.length || !historySeries.flow.length) {
    return [];
  }
  return historySeries.flow.map((pt) => {
    const sup = getStepValueAtHr(historySeries.supply, pt.hr);
    const ret = getStepValueAtHr(historySeries.ret, pt.hr);
    const dt = (sup !== null && ret !== null) ? (sup - ret) : 0;
    const kw = (pt.val > 5.0 && dt > 0) ? ((pt.val / 60.0) * 4.186 * dt) : 0;
    return { hr: pt.hr, val: Math.max(0, +kw.toFixed(2)) };
  });
}

function buildElecSeries() {
  if (historySeries.elec && historySeries.elec.length >= 2) {
    return historySeries.elec;
  }
  const thSeries = buildThermalSeries();
  if (!thSeries.length) return [];
  return thSeries.map((pt) => {
    const pThW = pt.val * 1000;
    if (pThW <= 50) {
      const fVal = getStepValueAtHr(historySeries.flow, pt.hr) || 0;
      return { hr: pt.hr, val: fVal > 5.0 ? 0.035 : 0.012 };
    }
    const lwt = getStepValueAtHr(historySeries.supply, pt.hr) || currentState.supply || 28;
    const oat = getStepValueAtHr(historySeries.outdoor, pt.hr) || currentState.outdoor || 7;
    const sww = lwt > 36;
    const overhead = sww ? 110 : 85;
    const lift = Math.max(lwt - oat, 8.0);
    const carnot = (lwt + 273.15) / (lift + 5.0);
    const loadPenalty = Math.max((pThW - 2000.0) / 5000.0, 0.0) * 0.07;
    const effFactor = (sww ? 0.45 : 0.50) - loadPenalty;
    const estCop = Math.min(Math.max(carnot * effFactor, 1.7), 6.4);
    const compEl = pThW > 500 ? (pThW / estCop) : 380;
    return { hr: pt.hr, val: +((compEl + overhead) / 1000).toFixed(2) };
  });
}

function buildTargetCvSeries() {
  const oatLow = currentState.oatLow !== undefined ? currentState.oatLow : -10;
  const lwtHigh = currentState.lwtHigh !== undefined ? currentState.lwtHigh : 35;
  const oatHigh = currentState.oatHigh !== undefined ? currentState.oatHigh : 15;
  const lwtLow = currentState.lwtLow !== undefined ? currentState.lwtLow : 25;
  const curShift = currentState.shift || 0;
  const curOat = currentState.outdoor !== undefined ? currentState.outdoor : 6.5;

  const calcTarget = (tOut, shiftK) => {
    if (typeof calculateStooklijnTarget === "function") {
      return calculateStooklijnTarget(tOut, shiftK, oatLow, lwtHigh, oatHigh, lwtLow);
    }
    let base;
    if (tOut <= oatLow) base = lwtHigh;
    else if (tOut >= oatHigh) base = lwtLow;
    else base = lwtHigh - ((tOut - oatLow) / (oatHigh - oatLow)) * (lwtHigh - lwtLow);
    return base + shiftK;
  };

  const curTarget = +(calcTarget(curOat, curShift)).toFixed(1);

  if (historySeries.outdoor && historySeries.outdoor.length >= 2) {
    const hrs = new Set(historySeries.outdoor.map((p) => p.hr));
    if (historySeries.shift && historySeries.shift.length > 0) {
      historySeries.shift.forEach((p) => hrs.add(p.hr));
    }
    const sortedHrs = Array.from(hrs).sort((a, b) => a - b);
    const pts = sortedHrs.map((hr) => {
      const oat = getStepValueAtHr(historySeries.outdoor, hr);
      const sh = (historySeries.shift && historySeries.shift.length > 0)
        ? getStepValueAtHr(historySeries.shift, hr)
        : curShift;
      const useOat = oat !== null ? oat : curOat;
      const useSh = sh !== null ? sh : curShift;
      return { hr, val: +(calcTarget(useOat, useSh)).toFixed(1) };
    });
    pts.push({ hr: 24, val: curTarget });
    return pts;
  }

  const fallbackPts = [];
  for (let i = 0; i <= 96; i++) {
    const hr = i * 0.25;
    fallbackPts.push({ hr, val: curTarget });
  }
  return fallbackPts;
}

// =========================================================================
// EXPANDABLE TOP METRIC CHART
// =========================================================================
function drawTopMetricChart() {
  if (!activeKpiKey || activeKpiKey === "error") return;
  const canvas = document.getElementById("topMetricCanvas");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  const padLeft = 48;
  const padRight = 18;
  const padBottom = 25;
  const padTop = 24;
  const innerW = w - padLeft - padRight;
  const innerH = h - padTop - padBottom;

  const rangeHours = selectedChartHours;
  const startHr = 24 - rangeHours;
  const xForTime = (hr) => padLeft + ((hr - startHr) / rangeHours) * innerW;
  const hrUnit = typeof t === "function" ? t("hrShort") : "h";

  // MULTI-LINE STEP CHART FOR WATER TEMPERATURES (SUPPLY LWT + RETURN EWT + CALCULATED SETPOINT CH + DELTA T)
  if (activeKpiKey === "water") {
    const waterTitle = typeof t === "function" ? t("chartWaterTitle") : "Water Temp & ΔT";
    document.getElementById("drawerTitle").textContent = `${waterTitle} (${rangeHours}${hrUnit})`;

    let fullSup = [];
    let fullRet = [];
    if (historySeries.supply && historySeries.supply.length >= 2) {
      fullSup = historySeries.supply.slice();
      fullSup.push({ hr: 24, val: currentState.supply });
      fullRet = historySeries.ret.length >= 2 ? historySeries.ret.slice() : [];
      if (fullRet.length > 0) fullRet.push({ hr: 24, val: currentState.ret });
    } else {
      for (let i = 0; i <= 96; i++) {
        const hr = i * 0.25;
        fullSup.push({ hr, val: currentState.supply + Math.sin(hr * 0.45) * 1.5 });
        fullRet.push({ hr, val: currentState.ret + Math.sin(hr * 0.45) * 1.2 });
      }
    }

    const fullTarget = buildTargetCvSeries();

    const supPts = sliceSeriesToWindow(fullSup, rangeHours);
    const retPts = sliceSeriesToWindow(fullRet, rangeHours);
    const targetPts = sliceSeriesToWindow(fullTarget, rangeHours);

    const supVals = supPts.map((p) => p.val);
    const retVals = retPts.map((p) => p.val);
    const targetVals = targetPts.map((p) => p.val);
    const allWaterVals = supVals.concat(retVals).concat(targetVals);

    const minSup = Math.min(...supVals);
    const maxSup = Math.max(...supVals);
    const curTargetVal = targetPts.length > 0 ? targetPts[targetPts.length - 1].val : 28.0;

    const isOutletMode = typeof userSettings !== "undefined" && userSettings.curveControl === "outlet";
    const refTag = isOutletMode ? "LWT" : "EWT";
    const setpointShort = typeof t === "function" ? t("setpointCvShort") : "Setpoint CH";

    document.getElementById("drawerBadge").textContent =
      `${minSup.toFixed(1)}–${maxSup.toFixed(1)}°C • ${setpointShort} (${refTag}): ${curTargetVal.toFixed(1)}°C • ΔT: ${(currentState.supply - currentState.ret).toFixed(2)}K`;

    const yMin = Math.min(20, Math.floor((Math.min(...allWaterVals) - 2) / 5) * 5);
    const yMax = Math.max(35, Math.ceil((Math.max(...allWaterVals) + 3) / 5) * 5);
    const yStep = (yMax - yMin) <= 25 ? 5 : 10;

    const yForTemp = (temp) => padTop + ((yMax - temp) / Math.max(1, yMax - yMin)) * innerH;

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    ctx.lineWidth = 1;

    for (let temp = yMin; temp <= yMax; temp += yStep) {
      const y = yForTemp(temp);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();
      ctx.fillText(temp + "°C", 5, y + 3);
    }

    drawTimeAxisLabels(ctx, startHr, rangeHours, xForTime, h);

    const plotWaterStepLine = (pts, color, fill, dash = null) => {
      if (!pts || pts.length < 2) return;
      ctx.save();
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      traceStepPath(ctx, pts, xForTime, yForTemp);
      ctx.strokeStyle = color;
      ctx.lineWidth = dash ? 2.2 : 2.4;
      ctx.stroke();
      ctx.restore();

      if (fill) {
        ctx.save();
        ctx.beginPath();
        traceStepPath(ctx, pts, xForTime, yForTemp);
        ctx.lineTo(xForTime(pts[pts.length - 1].hr), yForTemp(yMin));
        ctx.lineTo(xForTime(pts[0].hr), yForTemp(yMin));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
      }
    };

    plotWaterStepLine(supPts, "#f97316", "rgba(249, 115, 22, 0.12)");
    plotWaterStepLine(retPts, "#38bdf8", "rgba(56, 189, 248, 0.08)");
    plotWaterStepLine(targetPts, "#10b981", null, [6, 4]);

    const lblSupply = typeof t === "function" ? t("supplyLwt") : "Supply (LWT)";
    const lblReturn = typeof t === "function" ? t("returnEwt") : "Return (EWT)";
    const lblSetpointLegend = `${setpointShort} (${refTag})`;

    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#f97316";
    ctx.fillText("● " + lblSupply, padLeft + 5, 14);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("● " + lblReturn, padLeft + 115, 14);
    ctx.fillStyle = "#10b981";
    ctx.fillText("┄ " + lblSetpointLegend, padLeft + 222, 14);

    const hov = hoverState.top;
    if (hov && hov.mx >= padLeft && hov.mx <= w - padRight && hov.my >= padTop && hov.my <= h - padBottom) {
      const hoverHr = Math.max(startHr, Math.min(24, startHr + ((hov.mx - padLeft) / innerW) * rangeHours));
      const cursorTemp = yMax - ((hov.my - padTop) / innerH) * (yMax - yMin);
      const supVal = getStepValueAtHr(supPts, hoverHr);
      const retVal = getStepValueAtHr(retPts, hoverHr);
      const targetVal = getStepValueAtHr(targetPts, hoverHr);

      const cx = xForTime(hoverHr);
      drawCrosshair(ctx, cx, hov.my, padLeft, w - padRight, padTop, h - padBottom);
      if (supVal !== null) drawHighlightDot(ctx, cx, yForTemp(supVal), "#f97316");
      if (retVal !== null) drawHighlightDot(ctx, cx, yForTemp(retVal), "#38bdf8");
      if (targetVal !== null) drawHighlightDot(ctx, cx, yForTemp(targetVal), "#10b981");

      const dtVal = (supVal !== null && retVal !== null) ? (supVal - retVal) : 0;
      const compareVal = isOutletMode ? supVal : retVal;
      const hystDiff = (compareVal !== null && targetVal !== null) ? (compareVal - targetVal) : null;
      const hystTxt = hystDiff !== null ? (`${refTag} ${hystDiff >= 0 ? "+" : ""}${hystDiff.toFixed(1)} K`) : "--";
      const timeLbl = typeof t === "function" ? t("ttTime") : "Time";
      const cursorYLbl = typeof t === "function" ? t("ttCursorY") : "Cursor Y-axis";

      showTooltip(
        hov.clientX,
        hov.clientY,
        `<div class="tt-header">${timeLbl}: ${formatHourLabel(hoverHr)}</div>
         <div class="tt-row">
           <span class="tt-lbl"><span class="tt-dot" style="background:#f97316"></span>${lblSupply}:</span>
           <span class="tt-val">${supVal !== null ? supVal.toFixed(1) : "--"} °C</span>
         </div>
         <div class="tt-row">
           <span class="tt-lbl"><span class="tt-dot" style="background:#38bdf8"></span>${lblReturn}:</span>
           <span class="tt-val">${retVal !== null ? retVal.toFixed(1) : "--"} °C</span>
         </div>
         <div class="tt-row">
           <span class="tt-lbl"><span class="tt-dot" style="background:#10b981"></span>${setpointShort} (${refTag}):</span>
           <span class="tt-val">${targetVal !== null ? targetVal.toFixed(1) : "--"} °C (${hystTxt})</span>
         </div>
         <div class="tt-row">
           <span class="tt-lbl"><span class="tt-dot" style="background:#a855f7"></span>Delta T:</span>
           <span class="tt-val">${dtVal.toFixed(2)} K</span>
         </div>
         <div class="tt-row tt-sub">
           <span>${cursorYLbl}:</span>
           <span>${cursorTemp.toFixed(1)} °C</span>
         </div>`
      );
    }
    return;
  }

  const normKey = activeKpiKey === "sub_pressure" ? "pressure" : activeKpiKey;
  const tr = (k, fb) => (typeof t === "function" ? t(k) : fb);

  const metaMap = {
    pressure: {
      title: `${tr("chartPressureTitle", "Water Pressure")} (${rangeHours}${hrUnit})`,
      shortLabel: tr("chartPressureShort", "Pressure"),
      unit: " bar",
      color: "#38bdf8",
      fill: "rgba(56, 189, 248, 0.14)",
      decimals: 1,
      curVal: currentState.pressure,
      series: historySeries.pressure,
      fallbackFn: () => currentState.pressure || 1.8
    },
    indoor: {
      title: `${tr("chartIndoorTitle", "Indoor Temp")} (${rangeHours}${hrUnit})`,
      shortLabel: tr("chartIndoorShort", "Indoor"),
      unit: " °C",
      color: "#14b8a6",
      fill: "rgba(20, 184, 166, 0.14)",
      decimals: 1,
      curVal: currentState.indoor,
      series: historySeries.indoor,
      fallbackFn: () => currentState.indoor
    },
    outdoor: {
      title: `${tr("chartOutdoorTitle", "Outdoor Temp")} (${rangeHours}${hrUnit})`,
      shortLabel: tr("chartOutdoorShort", "Outdoor"),
      unit: " °C",
      color: "#f59e0b",
      fill: "rgba(245, 158, 11, 0.14)",
      decimals: 1,
      curVal: currentState.outdoor,
      series: historySeries.outdoor,
      fallbackFn: () => currentState.outdoor
    },
    cop: {
      title: `${tr("chartCopTitle", "Efficiency COP")} (${rangeHours}${hrUnit})`,
      shortLabel: tr("chartCopShort", "COP"),
      unit: " COP",
      color: "#10b981",
      fill: "rgba(16, 185, 129, 0.14)",
      decimals: 2,
      curVal: currentState.cop,
      series: historySeries.cop,
      fallbackFn: () => currentState.cop
    },
    flow: {
      title: `${tr("chartFlowTitle", "Flow Rate")} (${rangeHours}${hrUnit})`,
      shortLabel: tr("chartFlowShort", "Flow"),
      unit: " L/min",
      color: "#38bdf8",
      fill: "rgba(56, 189, 248, 0.14)",
      decimals: 1,
      curVal: currentState.flow,
      series: historySeries.flow,
      fallbackFn: () => currentState.flow
    },
    dhw: {
      title: `${tr("chartDhwTitle", "DHW Tank Temp")} (${rangeHours}${hrUnit})`,
      shortLabel: tr("chartDhwShort", "DHW Tank"),
      unit: " °C",
      color: "#f59e0b",
      fill: "rgba(245, 158, 11, 0.14)",
      decimals: 1,
      curVal: currentState.dhwTemp,
      series: historySeries.dhw,
      fallbackFn: () => currentState.dhwTemp
    },
    sub_thermal: {
      title: `${tr("chartThermalTitle", "Thermal Output")} (${rangeHours}${hrUnit})`,
      shortLabel: tr("chartThermalShort", "Thermal"),
      unit: " kW",
      color: "#14b8a6",
      fill: "rgba(20, 184, 166, 0.14)",
      decimals: 2,
      curVal: currentState.thermalKw,
      series: buildThermalSeries(),
      fallbackFn: () => currentState.thermalKw || 0.0
    },
    sub_elec: {
      title: `${tr("chartElecTitle", "Electrical Power")} (${rangeHours}${hrUnit})`,
      shortLabel: tr("chartElecShort", "Electrical"),
      unit: " kW",
      color: "#f43f5e",
      fill: "rgba(244, 63, 94, 0.14)",
      decimals: 2,
      curVal: currentState.elecKw,
      series: buildElecSeries(),
      fallbackFn: () => currentState.elecKw || 0.01
    }
  };

  const cfg = metaMap[normKey];
  if (!cfg) return;
  document.getElementById("drawerTitle").textContent = cfg.title;

  let fullPts = [];
  if (cfg.series && cfg.series.length >= 2) {
    fullPts = cfg.series.slice();
    if (cfg.curVal !== null && !isNaN(cfg.curVal)) {
      fullPts.push({ hr: 24, val: cfg.curVal });
    }
  } else {
    for (let i = 0; i <= 96; i++) {
      const hr = i * 0.25;
      fullPts.push({ hr, val: cfg.fallbackFn(hr) });
    }
  }

  const pts = sliceSeriesToWindow(fullPts, rangeHours);
  if (pts.length === 0) return;

  const vals = pts.map((p) => p.val);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const avgVal = vals.reduce((a, b) => a + b, 0) / vals.length;

  let badgeTxt = `Min: ${minVal.toFixed(cfg.decimals)} • Max: ${maxVal.toFixed(cfg.decimals)} • ${tr("avgShort", "Avg")}: ${avgVal.toFixed(cfg.decimals)}${cfg.unit}`;
  if (normKey === "flow") {
    badgeTxt += ` • ${tr("chartPressureShort", "Pressure")}: ${currentState.pressure.toFixed(1)} bar`;
  }
  document.getElementById("drawerBadge").textContent = badgeTxt;

  let yMin, yMax, yStep;
  if (normKey === "pressure") {
    yMin = 0;
    yMax = 3.0;
    yStep = 0.5;
  } else if (normKey === "cop") {
    yMin = 0;
    yMax = 9;
    yStep = 3;
  } else if (normKey === "flow") {
    yMin = 0;
    yMax = Math.max(25, Math.ceil((maxVal + 3) / 5) * 5);
    yStep = 5;
  } else if (normKey === "sub_thermal") {
    yMin = 0;
    yMax = Math.max(4.0, Math.ceil(maxVal + 0.5));
    yStep = yMax > 6 ? 2 : 1;
  } else if (normKey === "sub_elec") {
    yMin = 0;
    yMax = Math.max(2.0, Math.ceil((maxVal + 0.2) * 2) / 2);
    yStep = yMax > 3 ? 1 : 0.5;
  } else if (normKey === "dhw") {
    yMin = Math.min(20, Math.floor((minVal - 2) / 5) * 5);
    yMax = Math.max(55, Math.ceil((maxVal + 2) / 5) * 5);
    yStep = 10;
  } else if (normKey === "indoor") {
    yMin = Math.floor(Math.min(18, minVal - 1));
    yMax = Math.ceil(Math.max(23, maxVal + 1));
    yStep = (yMax - yMin) > 8 ? 2 : 1;
  } else {
    yMin = Math.floor((minVal - 2) / 2) * 2;
    yMax = Math.ceil((maxVal + 2) / 2) * 2;
    if (yMax - yMin < 8) {
      yMin -= 2;
      yMax += 2;
    }
    yStep = (yMax - yMin) > 16 ? 4 : 2;
  }

  const yForVal = (v) => padTop + ((yMax - v) / Math.max(0.001, yMax - yMin)) * innerH;

  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px sans-serif";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
  ctx.lineWidth = 1;

  for (let v = yMin; v <= yMax + 0.0001; v += yStep) {
    const y = yForVal(v);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
    let lbl;
    if (normKey === "pressure") {
      lbl = v.toFixed(1) + "b";
    } else if (normKey === "sub_thermal" || normKey === "sub_elec") {
      lbl = (yStep < 1 ? v.toFixed(1) : v.toFixed(0)) + " kW";
    } else {
      lbl = v.toFixed(0) + cfg.unit;
    }
    ctx.fillText(lbl, 4, y + 3);
  }

  if (normKey === "outdoor" && yMin < 0 && yMax > 0) {
    const yZero = yForVal(0);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
    ctx.beginPath();
    ctx.moveTo(padLeft, yZero);
    ctx.lineTo(w - padRight, yZero);
    ctx.stroke();
    ctx.restore();
  }

  drawTimeAxisLabels(ctx, startHr, rangeHours, xForTime, h);

  ctx.beginPath();
  traceStepPath(ctx, pts, xForTime, yForVal);
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.lineTo(xForTime(pts[pts.length - 1].hr), yForVal(yMin));
  ctx.lineTo(xForTime(pts[0].hr), yForVal(yMin));
  ctx.closePath();
  ctx.fillStyle = cfg.fill;
  ctx.fill();

  // Hover Crosshair & Tooltip
  const hov = hoverState.top;
  if (hov && hov.mx >= padLeft && hov.mx <= w - padRight && hov.my >= padTop && hov.my <= h - padBottom) {
    const hoverHr = Math.max(startHr, Math.min(24, startHr + ((hov.mx - padLeft) / innerW) * rangeHours));
    const cursorYVal = yMax - ((hov.my - padTop) / innerH) * (yMax - yMin);
    const curveVal = getStepValueAtHr(pts, hoverHr);

    const cx = xForTime(hoverHr);
    const cy = yForVal(curveVal);

    drawCrosshair(ctx, cx, hov.my, padLeft, w - padRight, padTop, h - padBottom);
    drawHighlightDot(ctx, cx, cy, cfg.color);

    const timeLbl = tr("ttTime", "Time");
    const cursorYLbl = tr("ttCursorY", "Cursor Y-axis");

    showTooltip(
      hov.clientX,
      hov.clientY,
      `<div class="tt-header">${timeLbl}: ${formatHourLabel(hoverHr)}</div>
       <div class="tt-row">
         <span class="tt-lbl"><span class="tt-dot" style="background:${cfg.color}"></span>${cfg.shortLabel}:</span>
         <span class="tt-val">${curveVal.toFixed(cfg.decimals)}${cfg.unit}</span>
       </div>
       <div class="tt-row tt-sub">
         <span>${cursorYLbl}:</span>
         <span>${cursorYVal.toFixed(cfg.decimals)}${cfg.unit}</span>
       </div>`
    );
  }
}

// =========================================================================
// STOOKLIJN CANVAS CHART WITH INTERACTIVE HOVER
// =========================================================================
function drawStooklijn(outdoorTemp, shiftK, oatLow, lwtHigh, oatHigh, lwtLow) {
  const canvas = document.getElementById("stooklijnChart");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  const padLeft = 40;
  const padRight = 20;
  const padBottom = 25;
  const padTop = 20;

  const innerW = w - padLeft - padRight;
  const innerH = h - padTop - padBottom;

  const xForTemp = (t) => padLeft + ((t + 15) / 35) * innerW;
  const yForLwt = (lwt) => padTop + ((45 - lwt) / 25) * innerH;

  ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px sans-serif";

  for (let lwt = 20; lwt <= 45; lwt += 5) {
    const y = yForLwt(lwt);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
    ctx.fillText(lwt + "°C", 5, y + 3);
  }

  for (let t = -15; t <= 20; t += 5) {
    const x = xForTemp(t);
    ctx.fillText(t + "°C", x - 12, h - 5);
  }

  ctx.beginPath();
  for (let t = -15; t <= 20; t += 1) {
    const x = xForTemp(t);
    const y = yForLwt(calculateStooklijnTarget(t, shiftK, oatLow, lwtHigh, oatHigh, lwtLow));
    if (t === -15) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "#14b8a6";
  ctx.lineWidth = 3;
  ctx.stroke();

  const curTarget = calculateStooklijnTarget(outdoorTemp, shiftK, oatLow, lwtHigh, oatHigh, lwtLow);
  const cx = xForTemp(Math.max(-15, Math.min(20, outdoorTemp)));
  const cy = yForLwt(curTarget);

  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#f97316";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();

  const opPointPrefix = typeof t === "function" ? t("operatingPoint") : "Operating Point";
  const isOutletMode = typeof userSettings !== "undefined" && userSettings.curveControl === "outlet";
  const refTag = isOutletMode ? "LWT" : "EWT";

  document.getElementById("curveOperatingPoint").textContent =
    `${opPointPrefix}: ${outdoorTemp.toFixed(1)}°C → ${curTarget.toFixed(1)}°C (${refTag})`;

  const hov = hoverState.stooklijn;
  if (hov && hov.mx >= padLeft && hov.mx <= w - padRight && hov.my >= padTop && hov.my <= h - padBottom) {
    const hoverOat = -15 + ((hov.mx - padLeft) / innerW) * 35;
    const cursorLwt = 45 - ((hov.my - padTop) / innerH) * 25;
    const curveLwt = calculateStooklijnTarget(hoverOat, shiftK, oatLow, lwtHigh, oatHigh, lwtLow);

    const hx = xForTemp(hoverOat);
    const hy = yForLwt(curveLwt);

    drawCrosshair(ctx, hx, hov.my, padLeft, w - padRight, padTop, h - padBottom);
    drawHighlightDot(ctx, hx, hy, "#14b8a6");

    const oatLbl = typeof t === "function" ? t("chartOutdoorShort") : "Outdoor";
    const curveTargetLbl = typeof t === "function" ? t("curveTarget") : "Curve Target";
    const cursorYLbl = typeof t === "function" ? t("ttCursorY") : "Cursor Y-axis";

    showTooltip(
      hov.clientX,
      hov.clientY,
      `<div class="tt-header">${oatLbl}: ${hoverOat.toFixed(1)} °C</div>
       <div class="tt-row">
         <span class="tt-lbl"><span class="tt-dot" style="background:#14b8a6"></span>${curveTargetLbl} (${refTag}):</span>
         <span class="tt-val">${curveLwt.toFixed(1)} °C</span>
       </div>
       <div class="tt-row tt-sub">
         <span>${cursorYLbl}:</span>
         <span>${cursorLwt.toFixed(1)} °C</span>
       </div>`
    );
  }
}
