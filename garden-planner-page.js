const { useState, useMemo, useCallback, useRef, useEffect } = React;

/* ═══════════════════════════════════════════
   CONSTANTS & DATA
   ═══════════════════════════════════════════ */
const B = {
  dark: "#0f2a18", primary: "#1D6B35", accent: "#4caf50",
  light: "#edf5ef", white: "#ffffff", cream: "#fafaf6",
  gray: "#f2f1ec", border: "#d8d7cf", borderLight: "#e8e7e0",
  text: "#1e1e1c", textMuted: "#7a796f", danger: "#c62828",
  info: "#1565c0", infoBg: "#eff6ff",
  warn: "#e65100", warnBg: "#fff8e1",
};

const PRODUCTS = [
  { id: "CED-030", name: "Cedro 30mm", price: 14.5, color: "#4a8c3f" },
  { id: "OLI-035", name: "Olivo 35mm", price: 16.0, color: "#3d7a35" },
  { id: "PIN-040", name: "Pino 40mm", price: 18.5, color: "#2d6b2a" },
  { id: "QUE-025", name: "Quercia 25mm", price: 12.0, color: "#5a9c4f" },
  { id: "ACE-030", name: "Acero 30mm", price: 15.0, color: "#3f8535" },
  { id: "FRA-045", name: "Frassino 45mm", price: 21.0, color: "#1f5c20" },
  { id: "LAU-035", name: "Lauro 35mm", price: 17.5, color: "#358030" },
  { id: "SAL-020", name: "Salice 20mm", price: 10.5, color: "#6aac5f" },
  { id: "TIG-030", name: "Tiglio 30mm", price: 14.0, color: "#4f9040" },
  { id: "CIP-050", name: "Cipresso 50mm", price: 24.0, color: "#155518" },
];

const ROLL_WIDTH = 2;

const BORDER_TYPES = [
  { id: "pvc", name: "Bordura PVC", price: 4.5, unit: "m" },
  { id: "nessuna", name: "Nessuna bordura", price: 0, unit: "m" },
];

const INFILL_FO30 = {
  name: "Sabbia silicea FO30",
  kgPerSqm: 5,
  bagKg: 25,
  pricePerTon: 92,
};

const GLUE_BUCKET_KG = 6;
const TAPE_ROLL_M = 25;

const DEFAULT_TRAVEL_SETTINGS = {
  departureBase: "Orta di Atella",
  kmTotal: 0,
  fuelPer100Km: 9.5,
  fuelPrice: 1.73,
  tollCost: 0,
  driveMinutes: 0,
  routeNote: "",
  routeStatus: "",
  routeLoading: false,
};

const ESTIMATED_TOLL_RATE_CLASS_B = 0.088;

const DECO_CATALOG = [
  { id: "detergente_prato", name: "Detergente prato sintetico", unit: "pz", pricePerUnit: 12.9, defaultQty: 0, cat: "Cura del prato", note: "Flacone pronto uso" },
  { id: "igienizzante_prato", name: "Igienizzante anti-odore prato sintetico", unit: "pz", pricePerUnit: 14.9, defaultQty: 0, cat: "Cura del prato", note: "Flacone trattamento" },
  { id: "scopa_ravvivante", name: "Scopa ravvivante manuale", unit: "pz", pricePerUnit: 24.9, defaultQty: 0, cat: "Cura del prato" },
  { id: "spazzola_prof", name: "Spazzola ravvivante professionale", unit: "pz", pricePerUnit: 39.9, defaultQty: 0, cat: "Cura del prato" },
  { id: "banda_extra", name: "Banda di giunzione - 25 mt", unit: "rotoli", pricePerUnit: 15.0, defaultQty: 0, cat: "Accessori posa" },
  { id: "colla_extra", name: "Colla bi-componente (A+B) - 6 Kg", unit: "secchi", pricePerUnit: 72.0, defaultQty: 0, cat: "Accessori posa" },
  { id: "picchetti_extra", name: "Picchetti a U", unit: "pz", pricePerUnit: 0.45, defaultQty: 0, cat: "Accessori posa" },
  { id: "telo_extra", name: "Telo da pacciamatura", unit: "rotoli", pricePerUnit: 48.0, defaultQty: 0, cat: "Accessori posa" },
];

const SHAPES = [
  { id: "rect", name: "Rettangolare", icon: "\u25AC" },
  { id: "lshape", name: "A L", icon: "\u231F" },
  { id: "ushape", name: "A U", icon: "\u2294" },
  { id: "custom", name: "Disegno libero", icon: "\u270E" },
];

const fmt = (n, d = 1) => Number(n).toFixed(d);
const fmtE = (n) => "\u20AC " + Number(n).toFixed(2);
const uid = () => Math.random().toString(36).slice(2, 8);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const getLocalISODate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

async function geocodeItalianAddress(query) {
  const cleaned = String(query || "").trim();
  if (!cleaned) throw new Error("missing_address");
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=it&q=${encodeURIComponent(cleaned)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error("geocoding_failed");
  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;
  if (!first) throw new Error("address_not_found");
  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    label: first.display_name || cleaned,
  };
}

async function fetchDrivingRoute(origin, destination) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false&alternatives=false&steps=false`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("routing_failed");
  const data = await response.json();
  const route = data?.routes?.[0];
  if (!route) throw new Error("route_not_found");
  return {
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
  };
}

function estimateItalianTolls(distanceKm) {
  const km = Math.max(0, Number(distanceKm) || 0);
  if (km < 20) return 0;
  return km * ESTIMATED_TOLL_RATE_CLASS_B;
}

function sanitizeDims(shape, dims) {
  const safe = {
    a: Math.max(0, Number(dims.a) || 0),
    b: Math.max(0, Number(dims.b) || 0),
    c: Math.max(0, Number(dims.c) || 0),
    d: Math.max(0, Number(dims.d) || 0),
  };

  if (shape === "lshape") {
    safe.c = clamp(safe.c, 0, safe.a);
    safe.d = clamp(safe.d, 0, safe.b);
  }
  if (shape === "ushape") {
    safe.c = clamp(safe.c, 0, safe.a / 2);
    safe.d = clamp(safe.d, 0, safe.b);
  }
  return safe;
}

/* ═══════════════════════════════════════════
   GEOMETRY
   ═══════════════════════════════════════════ */
function calcShapeArea(shape, dims) {
  const { a = 0, b = 0, c = 0, d = 0 } = sanitizeDims(shape, dims);
  if (shape === "rect") return a * b;
  if (shape === "lshape") return (a * b) - ((a - c) * (b - d));
  if (shape === "ushape") return (a * b) - ((a - 2 * c) * d);
  return 0;
}
function calcShapePerimeter(shape, dims) {
  const { a = 0, b = 0, c = 0, d = 0 } = sanitizeDims(shape, dims);
  if (shape === "rect") return 2 * (a + b);
  if (shape === "lshape") return 2 * (a + b);
  if (shape === "ushape") return 2 * (a + b + d);
  return 0;
}
function polyArea(pts) {
  if (pts.length < 3) return 0;
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; a += pts[i].x * pts[j].y - pts[j].x * pts[i].y; }
  return Math.abs(a) / 2;
}
function polyPerimeter(pts) {
  if (pts.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; p += Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y); }
  return p;
}
function polyBBox(pts) {
  if (!pts.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pts.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
function calcJointLength(rolls) {
  if (rolls.length < 2) return 0;
  return rolls.slice(1).reduce((sum, roll, i) => {
    const prevLength = Number(rolls[i].length) || 0;
    const nextLength = Number(roll.length) || 0;
    return sum + Math.min(prevLength, nextLength);
  }, 0);
}

function getShapePolygon(shape, dims) {
  const { a = 0, b = 0, c = 0, d = 0 } = sanitizeDims(shape, dims);
  if (shape === "rect" && a > 0 && b > 0) {
    return [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: b }, { x: 0, y: b }];
  }
  if (shape === "lshape" && a > 0 && b > 0) {
    return [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: d }, { x: c, y: d }, { x: c, y: b }, { x: 0, y: b }];
  }
  if (shape === "ushape" && a > 0 && b > 0) {
    return [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: b }, { x: a - c, y: b }, { x: a - c, y: d }, { x: c, y: d }, { x: c, y: b }, { x: 0, y: b }];
  }
  return [];
}

function getEdgeLabel(shape, index, count) {
  if (shape === "rect") {
    return ["Lato superiore", "Lato destro", "Lato inferiore", "Lato sinistro"][index] || `Lato ${index + 1}`;
  }
  if (shape === "custom") {
    return `Lato ${index + 1}`;
  }
  return count > 0 ? `Lato ${index + 1}` : "Lato";
}

function getShapeEdges(shape, dims, customPts, customClosed) {
  const pts = shape === "custom" ? (customClosed ? customPts : []) : getShapePolygon(shape, dims);
  if (!pts.length || pts.length < 2) return [];
  return pts.map((point, index) => {
    const next = pts[(index + 1) % pts.length];
    return {
      id: `${shape}-edge-${index}`,
      label: getEdgeLabel(shape, index, pts.length),
      length: Math.hypot(next.x - point.x, next.y - point.y),
    };
  });
}

function autoCalcRolls(area, shape, dims, customPts, customClosed) {
  if (area <= 0) return [];
  const rolls = [];
  let coverW, coverH;
  const safeDims = sanitizeDims(shape, dims);

  if (shape === "custom" && customClosed && customPts.length >= 3) {
    const bb = polyBBox(customPts);
    coverW = bb.w;
    coverH = bb.h;
    if (coverW < coverH) { const t = coverW; coverW = coverH; coverH = t; }
  } else if (shape === "rect") {
    coverW = Math.max(safeDims.a || 0, safeDims.b || 0);
    coverH = Math.min(safeDims.a || 0, safeDims.b || 0);
  } else {
    coverW = safeDims.a || 0;
    coverH = safeDims.b || 0;
  }

  if (coverW <= 0 || coverH <= 0) {
    const totalLen = Math.ceil(area / ROLL_WIDTH);
    const n = Math.max(1, Math.ceil(totalLen / 10));
    const per = Math.round((totalLen / n) * 10) / 10;
    for (let i = 0; i < n; i++) rolls.push({ id: uid(), rollNum: i + 1, length: per, width: ROLL_WIDTH, product: "CED-030", note: "" });
    return rolls;
  }

  const nRolls = Math.ceil(coverH / ROLL_WIDTH);
  for (let i = 0; i < nRolls; i++) {
    const isLast = i === nRolls - 1;
    const remaining = Math.round((coverH - i * ROLL_WIDTH) * 100) / 100;
    const ew = isLast && remaining < ROLL_WIDTH ? remaining : ROLL_WIDTH;
    rolls.push({
      id: uid(), rollNum: i + 1,
      length: Math.round(coverW * 10) / 10,
      width: ROLL_WIDTH, product: "CED-030",
      note: isLast && ew < ROLL_WIDTH ? "Taglio largo. a " + fmt(ew) + "m" : "",
    });
  }
  return rolls;
}

/* ═══════════════════════════════════════════
   CANVAS
   ═══════════════════════════════════════════ */
const GRID = 0.5;
const BASE_PX = 36;

function FreeDrawCanvas({ points, setPoints, closed, setClosed }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoverPt, setHoverPt] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [canvasW, setCanvasW] = useState(760);
  const [zoom, setZoom] = useState(1);
  const canvasH = 420;
  const PX = BASE_PX * zoom;

  const snap = v => Math.round(v / GRID) * GRID;
  const normalizePointValue = v => snap(Math.max(0, v));
  const toM = px => snap(px / PX);
  const toPx = m => m * PX;

  useEffect(() => {
    if (!containerRef.current) return;

    const updateCanvasW = () => {
      const w = Math.max(280, Math.floor(containerRef.current?.offsetWidth || 0));
      if (w > 0) setCanvasW(w);
    };

    updateCanvasW();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateCanvasW);
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateCanvasW);
    return () => window.removeEventListener("resize", updateCanvasW);
  }, []);

  const getPos = e => {
    const r = canvasRef.current.getBoundingClientRect();
    return { mx: toM(e.clientX - r.left), my: toM(e.clientY - r.top) };
  };

  const handleClick = e => {
    if (closed && dragging === null) return;
    const { mx, my } = getPos(e);
    if (points.length > 2) { if (Math.hypot(mx - points[0].x, my - points[0].y) < 0.7) { setClosed(true); return; } }
    setPoints(prev => [...prev, { x: mx, y: my }]);
  };

  const handleMove = e => {
    const { mx, my } = getPos(e);
    setHoverPt({ x: mx, y: my });
    if (dragging !== null && closed) setPoints(prev => prev.map((p, i) => i === dragging ? { x: mx, y: my } : p));
  };

  const handleMouseDown = e => {
    if (!closed) return;
    const { mx, my } = getPos(e);
    const idx = points.findIndex(p => Math.hypot(p.x - mx, p.y - my) < 0.6);
    if (idx >= 0) { setDragging(idx); e.stopPropagation(); e.preventDefault(); }
  };

  const reset = () => { setPoints([]); setClosed(false); setDragging(null); };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = "#fafaf7"; ctx.fillRect(0, 0, canvasW, canvasH);

    // Sub-grid
    ctx.strokeStyle = "#eceae2"; ctx.lineWidth = 0.5;
    for (let x = 0; x < canvasW; x += GRID * PX) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke(); }
    for (let y = 0; y < canvasH; y += GRID * PX) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke(); }
    // Meter grid
    ctx.strokeStyle = "#d8d7cf"; ctx.lineWidth = 1;
    for (let x = 0; x < canvasW; x += PX) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke(); }
    for (let y = 0; y < canvasH; y += PX) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke(); }
    // Labels
    ctx.fillStyle = B.textMuted; ctx.font = "10px sans-serif";
    for (let m = 1; m * PX < canvasW; m++) ctx.fillText(m + "m", m * PX + 2, 11);
    for (let m = 1; m * PX < canvasH; m++) ctx.fillText(m + "m", 3, m * PX - 3);

    // Polygon
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(toPx(points[0].x), toPx(points[0].y));
      for (let i = 1; i < points.length; i++) ctx.lineTo(toPx(points[i].x), toPx(points[i].y));
      if (!closed && hoverPt) ctx.lineTo(toPx(hoverPt.x), toPx(hoverPt.y));
      if (closed) { ctx.closePath(); ctx.fillStyle = "rgba(29,107,53,0.1)"; ctx.fill(); }
      ctx.strokeStyle = B.primary; ctx.lineWidth = 2.5; ctx.stroke();

      // Edge lengths
      const all = [...points]; if (closed) all.push(all[0]);
      for (let i = 0; i < all.length - 1; i++) {
        const ax = toPx(all[i].x), ay = toPx(all[i].y), bx = toPx(all[i + 1].x), by = toPx(all[i + 1].y);
        const len = Math.hypot(all[i + 1].x - all[i].x, all[i + 1].y - all[i].y);
        if (len < 0.3) continue;
        const mx2 = (ax + bx) / 2, my2 = (ay + by) / 2, txt = fmt(len, 2) + "m";
        ctx.font = "bold 11px sans-serif"; const tw = ctx.measureText(txt).width;
        ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fillRect(mx2 - tw / 2 - 3, my2 - 9, tw + 6, 18);
        ctx.fillStyle = B.dark; ctx.textAlign = "center"; ctx.fillText(txt, mx2, my2 + 4); ctx.textAlign = "start";
      }

      // Vertices
      points.forEach((p, i) => {
        const px = toPx(p.x), py = toPx(p.y);
        ctx.beginPath(); ctx.arc(px, py, closed ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 && !closed ? B.accent : B.primary; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
        if (closed) { ctx.fillStyle = "#fff"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center"; ctx.fillText("" + (i + 1), px, py + 3); ctx.textAlign = "start"; }
      });

      // Close hint
      if (!closed && hoverPt && points.length > 2) {
        if (Math.hypot(hoverPt.x - points[0].x, hoverPt.y - points[0].y) < 0.7) {
          ctx.beginPath(); ctx.arc(toPx(points[0].x), toPx(points[0].y), 14, 0, Math.PI * 2);
          ctx.strokeStyle = B.accent; ctx.lineWidth = 2.5; ctx.stroke();
        }
      }
    }

    if (points.length === 0) {
      ctx.fillStyle = B.textMuted; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Clicca per posizionare i vertici del giardino", canvasW / 2, canvasH / 2 - 10);
      ctx.font = "12px sans-serif";
      ctx.fillText("Griglia = 0.5m \u00B7 Clicca vicino al punto 1 per chiudere", canvasW / 2, canvasH / 2 + 14);
      ctx.textAlign = "start";
    }
  }, [points, hoverPt, closed, canvasW, canvasH, PX, zoom]);

  return (
    <div ref={containerRef}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: closed ? B.primary : B.textMuted, fontWeight: 500 }}>
          {closed ? "Area chiusa \u2014 trascina i vertici per modificare" : points.length === 0 ? "Clicca per posizionare il primo vertice" : "Clicca per aggiungere vertici \u00B7 Chiudi sul punto 1"}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: B.textMuted }}>Zoom:</span>
          {[0.6, 0.8, 1, 1.3, 1.6].map(z => (
            <button key={z} onClick={() => setZoom(z)} style={{
              padding: "3px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer",
              border: zoom === z ? "1.5px solid " + B.primary : "1px solid " + B.border,
              background: zoom === z ? B.light : B.white, color: zoom === z ? B.primary : B.text, fontWeight: zoom === z ? 600 : 400,
            }}>{Math.round(z * 100)}%</button>
          ))}
          <button onClick={reset} style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11, cursor: "pointer", color: B.text, marginLeft: 8 }}>Ricomincia</button>
        </div>
      </div>
      <canvas ref={canvasRef} width={canvasW} height={canvasH}
        onClick={handleClick} onMouseMove={handleMove} onMouseDown={handleMouseDown}
        onMouseUp={() => setDragging(null)} onMouseLeave={() => { setHoverPt(null); setDragging(null); }}
        style={{ width: "100%", height: canvasH, borderRadius: 10, border: "1.5px solid " + (closed ? B.primary : B.border), cursor: closed ? (dragging !== null ? "grabbing" : "default") : "crosshair", display: "block" }}
      />

      {points.length > 0 && (
        <div style={{ marginTop: 10, padding: "10px 12px", border: "1px solid " + B.borderLight, borderRadius: 8, background: B.white, fontSize: 12, color: B.textMuted }}>
          {closed
            ? `${points.length} vertici definiti. Per modificare il perimetro trascina i punti direttamente sul disegno.`
            : `${points.length} vertici inseriti. Continua a cliccare sul disegno e chiudi il perimetro sul punto iniziale.`}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   UI ATOMS
   ═══════════════════════════════════════════ */
function Header() {
  return (
    <div style={{ background: "linear-gradient(135deg, #0f2a18 0%, #163a22 100%)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) window.history.back();
          else window.location.href = "./index.html";
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.16)",
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        <span aria-hidden="true">←</span>
        <span>Torna al portale</span>
      </button>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: B.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 18, border: "2px solid rgba(255,255,255,0.2)" }}>PS</div>
      <div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>Garden Planner</div>
        <div style={{ color: B.accent, fontSize: 11, fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}>Prato Sintetico Italia - Vertex SRLS</div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>v3.0</div>
    </div>
  );
}
function MetricCard({ label, value, sub, accent, warning }) {
  return (
    <div style={{ background: warning ? B.warnBg : accent ? B.infoBg : B.gray, borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 130, border: "1px solid " + (warning ? "#ffe0b2" : accent ? "#bbdefb" : B.borderLight) }}>
      <div style={{ fontSize: 10, color: B.textMuted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: warning ? B.warn : accent ? B.info : B.dark }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function StepBadge({ n }) {
  return <div style={{ width: 28, height: 28, borderRadius: "50%", background: B.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{n}</div>;
}
function DimInput({ label, value, onChange, unit }) {
  return (
    <div style={{ flex: 1, minWidth: 100 }}>
      <label style={{ display: "block", fontSize: 11, color: B.textMuted, marginBottom: 4, fontWeight: 500 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input type="number" min={0} step={0.1} value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder="0.0"
          style={{ width: "100%", padding: "9px 12px", paddingRight: unit ? 36 : 12, border: "1.5px solid " + B.border, borderRadius: 8, fontSize: 15, fontWeight: 600, boxSizing: "border-box", color: B.dark, outline: "none" }}
          onFocus={e => e.target.style.borderColor = B.primary} onBlur={e => e.target.style.borderColor = B.border} />
        {unit && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: B.textMuted }}>{unit}</span>}
      </div>
    </div>
  );
}
function ShapePreview({ shape, dims }) {
  const W = 240, H = 150, pad = 25;
  const { a = 0, b = 0, c = 0, d = 0 } = sanitizeDims(shape, dims);
  if (a <= 0 || b <= 0) return null;
  const scale = Math.min((W - pad * 2) / a, (H - pad * 2) / b);
  const sw = a * scale, sh = b * scale, ox = (W - sw) / 2, oy = (H - sh) / 2;
  let path = "";
  if (shape === "rect") path = "M" + ox + "," + oy + " h" + sw + " v" + sh + " h" + (-sw) + " Z";
  else if (shape === "lshape") { const cw = c * scale, cd = d * scale; path = "M" + ox + "," + oy + " h" + sw + " v" + cd + " h" + (-cw) + " v" + (sh - cd) + " h" + (-(sw - cw)) + " Z"; }
  else if (shape === "ushape") { const cw = c * scale, cd = d * scale; path = "M" + ox + "," + oy + " h" + sw + " v" + sh + " h" + (-cw) + " v" + (-cd) + " h" + (-(sw - 2 * cw)) + " v" + cd + " h" + (-cw) + " Z"; }
  const rollLines = []; const n = Math.ceil(b / ROLL_WIDTH);
  for (let i = 1; i < n; i++) { const y = oy + i * ROLL_WIDTH * scale; if (y < oy + sh) rollLines.push(y); }
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
      <svg width={W} height={H} style={{ borderRadius: 8, background: B.cream, border: "1px solid " + B.borderLight }}>
        <path d={path} fill={B.primary + "18"} stroke={B.primary} strokeWidth={2} />
        {rollLines.map((y, i) => <line key={i} x1={ox + 2} y1={y} x2={ox + sw - 2} y2={y} stroke={B.accent} strokeWidth={1} strokeDasharray="4,3" opacity={0.6} />)}
        <text x={ox + sw / 2} y={oy - 6} textAnchor="middle" fontSize={11} fill={B.primary} fontWeight={600}>{a}m</text>
        <text x={ox + sw + 8} y={oy + sh / 2} textAnchor="start" fontSize={11} fill={B.primary} fontWeight={600} dominantBaseline="middle">{b}m</text>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTIONS
   ═══════════════════════════════════════════ */
function ProjectHeader({ info, setInfo }) {
  const upd = (k, v) => setInfo(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 2, minWidth: 180 }}>
        <label style={lbl}>Nome cliente</label>
        <input value={info.client} onChange={e => upd("client", e.target.value)} placeholder="Es. Mario Rossi" style={fieldInp} />
      </div>
      <div style={{ flex: 3, minWidth: 220 }}>
        <label style={lbl}>Indirizzo cantiere</label>
        <input value={info.address} onChange={e => upd("address", e.target.value)} placeholder="Es. Via Roma 1, Milano" style={fieldInp} />
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <label style={lbl}>Data</label>
        <input type="date" value={info.date} onChange={e => upd("date", e.target.value)} style={fieldInp} />
      </div>
      <div style={{ flex: 3, minWidth: 220 }}>
        <label style={lbl}>Note progetto</label>
        <input value={info.notes} onChange={e => upd("notes", e.target.value)} placeholder="Es. Giardino retro con piscina" style={fieldInp} />
      </div>
    </div>
  );
}

function TravelPlanner({ travel, setTravel }) {
  const upd = (key, value) => setTravel(prev => ({ ...prev, [key]: value }));
  const km = Math.max(0, Number(travel.kmTotal) || 0);
  const fuelRate = Math.max(0, Number(travel.fuelPer100Km) || 0);
  const fuelPrice = Math.max(0, Number(travel.fuelPrice) || 0);
  const tollCost = Math.max(0, Number(travel.tollCost) || 0);
  const liters = (km / 100) * fuelRate;
  const fuelCost = liters * fuelPrice;
  const tripCost = fuelCost + tollCost;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <label style={lbl}>Sede di partenza</label>
          <input
            value={travel.departureBase}
            onChange={e => upd("departureBase", e.target.value)}
            placeholder="Es. Orta di Atella"
            style={fieldInp}
          />
        </div>
        <DimInput label="Km totali" value={travel.kmTotal} onChange={v => upd("kmTotal", v)} unit="km" />
        <DimInput label="Consumo medio" value={travel.fuelPer100Km} onChange={v => upd("fuelPer100Km", v)} unit="l/100" />
        <DimInput label="Prezzo carburante" value={travel.fuelPrice} onChange={v => upd("fuelPrice", v)} unit="€/l" />
        <DimInput label="Caselli" value={travel.tollCost} onChange={v => upd("tollCost", v)} unit="€" />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 14px", borderRadius: 10, background: "#f7f7f2", border: "1px solid " + B.borderLight }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: B.dark }}>
            {travel.routeLoading ? "Calcolo tragitto in corso..." : "Calcolo automatico stile navigatore"}
          </div>
          <div style={{ fontSize: 11, color: B.textMuted, marginTop: 3 }}>
            {travel.routeStatus || "Inserisci sede di partenza e indirizzo cantiere: km, tempo, carburante e stima caselli si aggiornano in automatico."}
          </div>
        </div>
        {travel.driveMinutes > 0 ? (
          <div style={{ padding: "8px 12px", borderRadius: 999, background: B.infoBg, border: "1px solid #bbdefb", color: B.info, fontSize: 12, fontWeight: 700 }}>
            Tempo stimato: {Math.round(travel.driveMinutes)} min
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard label="Litri stimati" value={`${fmt(liters, 1)} l`} accent />
        <MetricCard label="Costo carburante" value={fmtE(fuelCost)} />
        <MetricCard label="Caselli" value={fmtE(tollCost)} sub="Stima modificabile" />
        <MetricCard label="Costo trasferta" value={fmtE(tripCost)} warning={tripCost > 0} sub={travel.departureBase ? `Partenza: ${travel.departureBase}` : "Compila la sede di partenza"} />
      </div>
    </div>
  );
}

function ShapeInput({ shape, setShape, dims, setDims, customPts, setCustomPts, customClosed, setCustomClosed }) {
  const updateDim = (key, val) => setDims(prev => sanitizeDims(shape, { ...prev, [key]: parseFloat(val) || 0 }));
  const handleShapeChange = nextShape => {
    setShape(nextShape);
    setDims(prev => sanitizeDims(nextShape, prev));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={secTitle}>Forma del giardino</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SHAPES.map(s => (
            <button key={s.id} onClick={() => handleShapeChange(s.id)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 8,
              border: shape === s.id ? "2px solid " + B.primary : "1px solid " + B.border,
              background: shape === s.id ? B.light : B.white, color: shape === s.id ? B.primary : B.text,
              fontWeight: shape === s.id ? 600 : 400, fontSize: 12, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}><span style={{ fontSize: 20 }}>{s.icon}</span>{s.name}</button>
          ))}
        </div>
      </div>
      {shape !== "custom" && (
        <div>
          <div style={secTitle}>Dimensioni (metri)</div>
          {shape === "rect" && <div style={{ display: "flex", gap: 12 }}><DimInput label="Lunghezza (A)" value={dims.a} onChange={v => updateDim("a", v)} unit="m" /><DimInput label="Larghezza (B)" value={dims.b} onChange={v => updateDim("b", v)} unit="m" /></div>}
          {shape === "lshape" && <><div style={{ display: "flex", gap: 12, marginBottom: 10 }}><DimInput label="Lungh. totale (A)" value={dims.a} onChange={v => updateDim("a", v)} unit="m" /><DimInput label="Largh. totale (B)" value={dims.b} onChange={v => updateDim("b", v)} unit="m" /></div><div style={{ display: "flex", gap: 12 }}><DimInput label="Rientranza larg. (C)" value={dims.c} onChange={v => updateDim("c", v)} unit="m" /><DimInput label="Rientranza lung. (D)" value={dims.d} onChange={v => updateDim("d", v)} unit="m" /></div></>}
          {shape === "ushape" && <><div style={{ display: "flex", gap: 12, marginBottom: 10 }}><DimInput label="Lunghezza (A)" value={dims.a} onChange={v => updateDim("a", v)} unit="m" /><DimInput label="Larghezza (B)" value={dims.b} onChange={v => updateDim("b", v)} unit="m" /></div><div style={{ display: "flex", gap: 12 }}><DimInput label="Spessore braccio (C)" value={dims.c} onChange={v => updateDim("c", v)} unit="m" /><DimInput label="Prof. rientranza (D)" value={dims.d} onChange={v => updateDim("d", v)} unit="m" /></div></>}
          <ShapePreview shape={shape} dims={dims} />
        </div>
      )}
      {shape === "custom" && <FreeDrawCanvas points={customPts} setPoints={setCustomPts} closed={customClosed} setClosed={setCustomClosed} />}
    </div>
  );
}

function RollsTable({ rolls, setRolls, area }) {
  const addRoll = () => setRolls(prev => [...prev, { id: uid(), rollNum: prev.length + 1, length: 5, width: ROLL_WIDTH, product: "CED-030", note: "" }]);
  const updateRoll = (id, key, val) => setRolls(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
  const removeRoll = id => setRolls(prev => prev.filter(r => r.id !== id).map((r, i) => ({ ...r, rollNum: i + 1 })));
  const totalRA = rolls.reduce((s, r) => s + r.width * r.length, 0);
  const cov = area > 0 ? Math.round((totalRA / area) * 100) : 0;

  return (
    <div>
      {area > 0 && <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: B.textMuted }}>Copertura: {fmt(totalRA)} m\u00B2 su {fmt(area)} m\u00B2</span>
          <span style={{ fontWeight: 700, color: cov >= 100 ? B.primary : B.danger }}>{cov}%</span>
        </div>
        <div style={{ height: 8, background: B.gray, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, transition: "width 0.3s", width: Math.min(cov, 100) + "%", background: cov >= 100 ? B.primary : cov >= 80 ? B.warn : B.danger }} />
        </div>
      </div>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
          <thead><tr style={{ background: B.gray }}>
            {["#", "Prodotto", "Lungh.", "Larg.", "m\u00B2", "Fuori totale", "Note", ""].map((h, i) => (
              <th key={i} style={{ padding: "8px 6px", textAlign: i > 1 && i < 6 ? "center" : "left", fontSize: 10, fontWeight: 600, color: B.textMuted, textTransform: "uppercase", borderBottom: "1px solid " + B.border, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rolls.map(r => {
              const prod = PRODUCTS.find(p => p.id === r.product) || PRODUCTS[0];
              const sqm = r.width * r.length;
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid " + B.borderLight }}>
                  <td style={tdS}><div style={{ width: 24, height: 24, borderRadius: 6, background: prod.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: prod.color, border: "1px solid " + prod.color + "44" }}>{r.rollNum}</div></td>
                  <td style={tdS}><select value={r.product} onChange={e => updateRoll(r.id, "product", e.target.value)} style={cSel}>{PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></td>
                  <td style={{ ...tdS, textAlign: "center" }}><input type="number" value={r.length} min={0.5} max={25} step={0.5} onChange={e => updateRoll(r.id, "length", parseFloat(e.target.value) || 0.5)} style={cInp} /></td>
                  <td style={{ ...tdS, textAlign: "center", color: B.textMuted, fontSize: 12 }}>{r.width}m</td>
                  <td style={{ ...tdS, textAlign: "center", fontWeight: 600 }}>{fmt(sqm)}</td>
                  <td style={{ ...tdS, textAlign: "center", fontWeight: 700, color: B.textMuted }}>Fuori totale</td>
                  <td style={tdS}><input type="text" value={r.note} placeholder="-" onChange={e => updateRoll(r.id, "note", e.target.value)} style={{ ...cInp, width: 85, textAlign: "left" }} /></td>
                  <td style={tdS}><button onClick={() => removeRoll(r.id)} style={{ background: "none", border: "none", color: B.danger, cursor: "pointer", fontSize: 15 }}>x</button></td>
                </tr>
              );
            })}
            {!rolls.length && <tr><td colSpan={8} style={{ padding: 18, textAlign: "center", color: B.textMuted }}>Nessun rotolo. Usa "Calcola automatico" o aggiungi manualmente.</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={addRoll} style={btnPrim}>+ Aggiungi rotolo</button>
      </div>
    </div>
  );
}

function DecoSection({ decoItems, setDecoItems }) {
  const cats = [...new Set(DECO_CATALOG.map(d => d.cat))];
  const update = (id, qty) => setDecoItems(prev => ({ ...prev, [id]: Math.max(0, parseFloat(qty) || 0) }));
  const activeCount = Object.values(decoItems).filter(v => v > 0).length;

  return (
    <div>
      {cats.map(cat => {
        const items = DECO_CATALOG.filter(d => d.cat === cat);
        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid " + B.borderLight }}>{cat}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              {items.map(item => {
                const qty = decoItems[item.id] || 0;
                const active = qty > 0;
                return (
                  <div key={item.id} style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: 8, border: "1px solid " + (active ? B.primary + "44" : B.borderLight),
                    background: active ? B.light : B.white,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: B.text, lineHeight: 1.25, whiteSpace: "normal", overflowWrap: "anywhere" }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4, lineHeight: 1.35 }}>{`Unità: ${item.unit}${item.note ? " | " + item.note : ""}`}</div>
                    </div>
                    <input type="number" min={0} step={1} value={qty || ""} placeholder="0"
                      onChange={e => update(item.id, e.target.value)}
                      style={{ width: 60, padding: "5px 6px", border: "1.5px solid " + (active ? B.primary + "66" : B.borderLight), borderRadius: 6, fontSize: 13, fontWeight: 600, textAlign: "center", outline: "none", boxSizing: "border-box" }}
                    />
                    <span style={{ fontSize: 11, color: B.textMuted, minWidth: 46, textAlign: "right" }}>{item.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {activeCount > 0 && (
        <div style={{ marginTop: 8, padding: "8px 12px", background: B.infoBg, borderRadius: 8, border: "1px solid #bbdefb", fontSize: 12, color: B.info }}>
          {activeCount} material{activeCount > 1 ? "i" : "e"} aggiuntiv{activeCount > 1 ? "i" : "o"} selezionat{activeCount > 1 ? "i" : "o"} - riepilogo pronto per l'ordine.
        </div>
      )}
    </div>
  );
}

function MaterialsReport({ area, perimeter, rolls, borderType, borderMeters, substrate, decoItems, projectInfo, travel }) {
  if (area <= 0) return <div style={{ color: B.textMuted, fontSize: 13, padding: 16, textAlign: "center" }}>Inserisci le dimensioni per vedere il riepilogo.</div>;

  const rollDetails = rolls.map(r => {
    const prod = PRODUCTS.find(p => p.id === r.product) || PRODUCTS[0];
    return { ...r, sqm: r.width * r.length, prodName: prod.name };
  });

  const scavoM3 = (area * substrate.scavoCm) / 100;
  const drenateM3 = (area * substrate.drenateCm) / 100;
  const sabbiaM3 = (area * substrate.sabbiaCm) / 100;
  const sabbiaKg = sabbiaM3 * 1500;
  const geo = area * 1.05;
  const glue = area * 0.3;
  const glueBuckets = Math.ceil(glue / GLUE_BUCKET_KG);
  const jLen = calcJointLength(rolls);
  const tapeRolls = Math.ceil(jLen / TAPE_ROLL_M);
  const pins = Math.ceil(area * 4);
  const border = BORDER_TYPES.find(b => b.id === borderType);
  const infillKg = area * INFILL_FO30.kgPerSqm;
  const infillBags = Math.ceil(infillKg / INFILL_FO30.bagKg);

  const decoLines = Object.entries(decoItems).filter(([, q]) => q > 0).map(([id, qty]) => {
    const item = DECO_CATALOG.find(d => d.id === id);
    return item ? { name: item.name, qty: qty + " " + item.unit } : null;
  }).filter(Boolean);
  const travelKm = Math.max(0, Number(travel?.kmTotal) || 0);
  const travelFuelRate = Math.max(0, Number(travel?.fuelPer100Km) || 0);
  const travelFuelPrice = Math.max(0, Number(travel?.fuelPrice) || 0);
  const travelTollCost = Math.max(0, Number(travel?.tollCost) || 0);
  const travelLiters = (travelKm / 100) * travelFuelRate;
  const travelFuelCost = travelLiters * travelFuelPrice;
  const travelCost = travelFuelCost + travelTollCost;

  const sections = [
    {
      cat: "PRATO SINTETICO · FABBISOGNO",
      meta: "Fuori totale",
      showCosts: false,
      items: rollDetails.length > 0
        ? rollDetails.map(r => ({ name: "Rotolo #" + r.rollNum + " " + r.prodName + " (" + r.width + "\u00D7" + r.length + "m)", qty: fmt(r.sqm) + " m\u00B2" }))
        : [{ name: "Nessun rotolo inserito", qty: "\u2014" }],
    },
    {
      cat: "PREPARAZIONE FONDO",
      meta: "Quantità da approvvigionare",
      showCosts: false,
      items: [
        substrate.scavoCm > 0 ? { name: "Scavo e smaltimento (" + substrate.scavoCm + "cm)", qty: fmt(scavoM3, 2) + " m\u00B3 \u2248 " + Math.round(scavoM3 * 1400) + " kg" } : null,
        substrate.drenateCm > 0 ? { name: "Pietrisco drenante (" + substrate.drenateCm + "cm)", qty: fmt(drenateM3, 2) + " m\u00B3 \u2248 " + Math.round(drenateM3 * 1600) + " kg" } : null,
        substrate.sabbiaCm > 0 ? { name: "Sabbia livellamento (" + substrate.sabbiaCm + "cm)", qty: Math.round(sabbiaKg) + " kg · " + fmt(sabbiaM3, 2) + " m\u00B3" } : null,
      ].filter(Boolean),
    },
    {
      cat: "MATERIALI POSA",
      meta: "Quantità da ordinare",
      showCosts: false,
      items: [
        { name: "Tessuto non tessuto", qty: fmt(geo) + " m\u00B2" },
        { name: "Colla bicomponente", qty: `${fmt(glue, 1)} kg${glueBuckets > 0 ? ` · ${glueBuckets} secch${glueBuckets > 1 ? "i" : "io"} da ${GLUE_BUCKET_KG} kg` : ""}` },
        jLen > 0 ? { name: "Nastro giunzione", qty: `${Math.round(jLen)} m${tapeRolls > 0 ? ` · ${tapeRolls} rotol${tapeRolls > 1 ? "i" : "o"} da ${TAPE_ROLL_M} m` : ""}` } : null,
        { name: "Chiodi a U", qty: pins + " pz" },
        borderType !== "nessuna" && borderMeters > 0 ? { name: border?.name || "Bordura", qty: fmt(borderMeters) + " m" } : null,
      ].filter(Boolean),
    },
    {
      cat: "INTASO",
      meta: "Quantità da ordinare",
      showCosts: false,
      items: [
        { name: INFILL_FO30.name, qty: `${Math.round(infillKg)} kg · ${infillBags} sacchi da ${INFILL_FO30.bagKg} kg` },
      ],
    },
  ];
  if (decoLines.length > 0) sections.push({ cat: "MATERIALI AGGIUNTIVI", meta: "Extra selezionati", showCosts: false, items: decoLines });
  if (travelKm > 0 || travelTollCost > 0 || travel?.departureBase) {
    sections.push({
      cat: "TRASFERTA E LOGISTICA",
      meta: "Stima costi",
      showCosts: true,
      items: [
        { name: "Sede di partenza", qty: travel?.departureBase || "Da definire", cost: null },
        { name: "Percorrenza totale", qty: `${fmt(travelKm, 1)} km`, cost: null },
        { name: "Carburante stimato", qty: `${fmt(travelLiters, 1)} l`, cost: travelFuelCost },
        { name: "Caselli", qty: travelTollCost > 0 ? fmtE(travelTollCost) : "—", cost: travelTollCost },
      ],
      sub: travelCost,
    });
  }

  return (
    <div>
      {/* Project info header */}
      {(projectInfo.client || projectInfo.address) && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: B.gray, borderRadius: 8, fontSize: 12, display: "flex", gap: 20, flexWrap: "wrap" }}>
          {projectInfo.client && <span><strong>Cliente:</strong> {projectInfo.client}</span>}
          {projectInfo.address && <span><strong>Cantiere:</strong> {projectInfo.address}</span>}
          {projectInfo.date && <span><strong>Data:</strong> {projectInfo.date}</span>}
          {projectInfo.notes && <span><strong>Note:</strong> {projectInfo.notes}</span>}
          {travel?.departureBase && <span><strong>Partenza:</strong> {travel.departureBase}</span>}
        </div>
      )}
      <div style={{ border: "1px solid " + B.border, borderRadius: 10, overflow: "hidden" }}>
        {sections.map((sec, si) => (
          <div key={si}>
            <div style={{ background: B.gray, padding: "8px 14px", fontSize: 11, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + B.borderLight, borderTop: si > 0 ? "1px solid " + B.border : "none", display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span>{sec.cat}</span>
              <span style={{ color: B.dark, whiteSpace: "nowrap" }}>{sec.showCosts && typeof sec.sub === "number" ? fmtE(sec.sub) : (sec.meta || "")}</span>
            </div>
            {sec.items.map((item, ii) => (
              <div key={ii} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", fontSize: 13, borderBottom: "1px solid " + B.borderLight, background: ii % 2 === 0 ? B.white : B.cream, flexWrap: "wrap", gap: 4 }}>
                <span style={{ flex: sec.showCosts ? 2 : 3, color: B.text, minWidth: 150 }}>{item.name}</span>
                <span style={{ flex: 1, textAlign: sec.showCosts ? "center" : "right", color: B.textMuted, minWidth: 120 }}>{item.qty}</span>
                {sec.showCosts ? (
                  <span style={{ minWidth: 80, textAlign: "right", fontWeight: 600, color: B.dark }}>{typeof item.cost === "number" ? fmtE(item.cost) : "\u2014"}</span>
                ) : null}
              </div>
            ))}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px", background: B.dark, color: "#fff", fontWeight: 700, fontSize: 16 }}>
          <span>STIMA COSTI TRASFERTA</span>
          <span style={{ color: B.accent, fontSize: 18 }}>{fmtE(travelCost)}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════ */
const secTitle = { fontSize: 12, fontWeight: 700, color: B.dark, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.2px" };
const tdS = { padding: "7px 6px", verticalAlign: "middle" };
const thS = { padding: "6px 8px", fontSize: 10, fontWeight: 600, color: B.textMuted, textTransform: "uppercase", textAlign: "center", borderBottom: "1px solid " + B.border };
const cInp = { width: 65, padding: "5px 6px", border: "1.5px solid " + B.borderLight, borderRadius: 6, fontSize: 13, textAlign: "center", fontWeight: 600, outline: "none", boxSizing: "border-box" };
const vtxInp = { width: 60, padding: "4px 6px", border: "1px solid " + B.borderLight, borderRadius: 4, fontSize: 12, textAlign: "center", fontWeight: 600, outline: "none", boxSizing: "border-box" };
const cSel = { padding: "5px 4px", border: "1.5px solid " + B.borderLight, borderRadius: 6, fontSize: 12, background: B.white, outline: "none", maxWidth: 180 };
const btnPrim = { padding: "8px 16px", borderRadius: 8, border: "none", background: B.primary, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const cardStyle = { background: B.white, borderRadius: 12, padding: "20px 24px", border: "1px solid " + B.borderLight };
const lbl = { display: "block", fontSize: 11, color: B.textMuted, marginBottom: 4, fontWeight: 500 };
const fieldInp = { width: "100%", padding: "10px 14px", border: "1.5px solid " + B.border, borderRadius: 10, fontSize: 13, boxSizing: "border-box", outline: "none", color: B.dark };

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
function GardenPlanner() {
  const [projectInfo, setProjectInfo] = useState({ client: "", address: "", date: getLocalISODate(), notes: "" });
  const [travel, setTravel] = useState(DEFAULT_TRAVEL_SETTINGS);
  const [shape, setShape] = useState("rect");
  const [dims, setDims] = useState({ a: 10, b: 6, c: 3, d: 3 });
  const [customPts, setCustomPts] = useState([]);
  const [customClosed, setCustomClosed] = useState(false);
  const [rolls, setRolls] = useState([]);
  const [borderType, setBorderType] = useState("pvc");
  const [selectedBorderEdges, setSelectedBorderEdges] = useState([]);
  const [substrate, setSubstrate] = useState({ scavoCm: 10, drenateCm: 5, sabbiaCm: 3 });
  const [decoItems, setDecoItems] = useState({});
  const safeDims = useMemo(() => sanitizeDims(shape, dims), [shape, dims]);
  const layoutKey = useMemo(() => JSON.stringify({ shape, dims: safeDims, customPts, customClosed }), [shape, safeDims, customPts, customClosed]);

  const area = useMemo(() => shape === "custom" ? (customClosed ? polyArea(customPts) : 0) : calcShapeArea(shape, safeDims), [shape, safeDims, customPts, customClosed]);
  const perimeter = useMemo(() => shape === "custom" ? (customClosed ? polyPerimeter(customPts) : 0) : calcShapePerimeter(shape, safeDims), [shape, safeDims, customPts, customClosed]);
  const borderEdges = useMemo(() => getShapeEdges(shape, safeDims, customPts, customClosed), [shape, safeDims, customPts, customClosed]);
  const selectedBorderMeters = useMemo(() => (
    borderEdges
      .filter(edge => selectedBorderEdges.includes(edge.id))
      .reduce((sum, edge) => sum + edge.length, 0)
  ), [borderEdges, selectedBorderEdges]);

  const handleAutoCalc = useCallback(() => {
    setRolls(autoCalcRolls(area, shape, safeDims, customPts, customClosed));
  }, [area, shape, safeDims, customPts, customClosed]);

  useEffect(() => {
    setRolls(prev => (prev.length ? [] : prev));
  }, [layoutKey]);

  useEffect(() => {
    setSelectedBorderEdges(borderEdges.map(edge => edge.id));
  }, [layoutKey, borderEdges]);

  useEffect(() => {
    const origin = String(travel.departureBase || "").trim();
    const destination = String(projectInfo.address || "").trim();
    if (!origin || !destination) {
      setTravel(prev => ({
        ...prev,
        routeLoading: false,
        routeStatus: "",
        routeNote: "",
        driveMinutes: 0,
      }));
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setTravel(prev => ({
        ...prev,
        routeLoading: true,
        routeStatus: "Recupero distanza e tempi di viaggio...",
      }));
      try {
        const [originPoint, destinationPoint] = await Promise.all([
          geocodeItalianAddress(origin),
          geocodeItalianAddress(destination),
        ]);
        const route = await fetchDrivingRoute(originPoint, destinationPoint);
        const tollEstimate = estimateItalianTolls(route.distanceKm);
        if (cancelled) return;
        setTravel(prev => ({
          ...prev,
          kmTotal: Number(route.distanceKm.toFixed(1)),
          driveMinutes: Number(route.durationMinutes.toFixed(0)),
          tollCost: Number(tollEstimate.toFixed(2)),
          routeLoading: false,
          routeNote: `${originPoint.label} → ${destinationPoint.label}`,
          routeStatus: `Percorso aggiornato automaticamente. Caselli stimati su tariffa media autostradale classe B.`,
        }));
      } catch (error) {
        if (cancelled) return;
        setTravel(prev => ({
          ...prev,
          routeLoading: false,
          routeStatus: "Non riesco a calcolare il tragitto automatico con questi indirizzi. Puoi correggerli o lasciare i valori manuali.",
        }));
      }
    }, 850);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [projectInfo.address, travel.departureBase]);

  return (
    <div style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif", minHeight: "100vh", background: B.cream }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Header />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* PROJECT INFO */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StepBadge n={0} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Dati progetto</span>
          </div>
          <ProjectHeader info={projectInfo} setInfo={setProjectInfo} />
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StepBadge n={"0B"} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Trasferta e costi viaggio</span>
          </div>
          <TravelPlanner travel={travel} setTravel={setTravel} />
        </div>

        {/* STEP 1: AREA */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StepBadge n={1} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Definisci l'area</span>
          </div>
          <ShapeInput shape={shape} setShape={setShape} dims={safeDims} setDims={setDims} customPts={customPts} setCustomPts={setCustomPts} customClosed={customClosed} setCustomClosed={setCustomClosed} />
          {area > 0 && (
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <MetricCard label="Superficie" value={fmt(area) + " m\u00B2"} accent />
              <MetricCard label="Perimetro" value={fmt(perimeter) + " m"} />
              {shape === "custom" && customClosed
                ? <MetricCard label="Vertici" value={`${customPts.length}`} sub="Punti del perimetro" />
                : null}
              <MetricCard label="Rotoli stimati" value={"" + Math.ceil(area / (ROLL_WIDTH * 5))} sub={"(da 2m \u00D7 5m)"} />
            </div>
          )}
        </div>

        {/* STEP 2: SUBSTRATE */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StepBadge n={2} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Preparazione fondo</span>
          </div>
          <div style={secTitle}>Spessori lavorazione</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <DimInput label="Scavo da effettuare" value={substrate.scavoCm} onChange={v => setSubstrate(p => ({ ...p, scavoCm: parseFloat(v) || 0 }))} unit="cm" />
            <DimInput label="Fondo drenante" value={substrate.drenateCm} onChange={v => setSubstrate(p => ({ ...p, drenateCm: parseFloat(v) || 0 }))} unit="cm" />
            <DimInput label="Sabbia livellamento" value={substrate.sabbiaCm} onChange={v => setSubstrate(p => ({ ...p, sabbiaCm: parseFloat(v) || 0 }))} unit="cm" />
          </div>
          {area > 0 && (
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              {substrate.scavoCm > 0 && <MetricCard label="Terra da smaltire" value={fmt((area * substrate.scavoCm) / 100, 2) + " m\u00B3"} sub={Math.round(area * substrate.scavoCm / 100 * 1400) + " kg circa"} warning />}
              {substrate.drenateCm > 0 && <MetricCard label="Pietrisco drenante" value={fmt((area * substrate.drenateCm) / 100, 2) + " m\u00B3"} sub={Math.round(area * substrate.drenateCm / 100 * 1600) + " kg circa"} />}
              {substrate.sabbiaCm > 0 && <MetricCard label="Sabbia livellamento" value={Math.round(area * substrate.sabbiaCm / 100 * 1500) + " kg"} sub={fmt((area * substrate.sabbiaCm) / 100, 2) + " m\u00B3"} />}
            </div>
          )}
        </div>

        {/* STEP 3: ROLLS */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <StepBadge n={3} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Rotoli prato sintetico</span>
            <div style={{ flex: 1 }} />
            {area > 0 && <button onClick={handleAutoCalc} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid " + B.primary, background: B.white, color: B.primary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Calcola automatico</button>}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Bordura perimetrale</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {BORDER_TYPES.map(bt => (
                <button key={bt.id} onClick={() => setBorderType(bt.id)} style={{
                  padding: "6px 12px", borderRadius: 8,
                  border: borderType === bt.id ? "2px solid " + B.primary : "1px solid " + B.border,
                  background: borderType === bt.id ? B.light : B.white, fontSize: 11, fontWeight: borderType === bt.id ? 600 : 400,
                  color: borderType === bt.id ? B.primary : B.text, cursor: "pointer",
                }}>{bt.name}</button>
              ))}
            </div>
          </div>
          {borderType === "pvc" && borderEdges.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Seleziona i lati dove posare la bordura</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {borderEdges.map(edge => {
                  const active = selectedBorderEdges.includes(edge.id);
                  return (
                    <button
                      key={edge.id}
                      type="button"
                      onClick={() => setSelectedBorderEdges(prev => prev.includes(edge.id) ? prev.filter(id => id !== edge.id) : [...prev, edge.id])}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 999,
                        border: active ? "2px solid " + B.primary : "1px solid " + B.border,
                        background: active ? B.light : B.white,
                        color: active ? B.primary : B.text,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {edge.label} · {fmt(edge.length)} m
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: B.textMuted }}>
                Bordura selezionata: <strong style={{ color: B.dark }}>{fmt(selectedBorderMeters)} m</strong>
              </div>
            </div>
          )}
          <RollsTable rolls={rolls} setRolls={setRolls} area={area} />
        </div>

        {/* STEP 4: DECORATIVE */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StepBadge n={4} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Materiali aggiuntivi</span>
          </div>
          <DecoSection decoItems={decoItems} setDecoItems={setDecoItems} />
        </div>

        {/* STEP 5: REPORT */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <StepBadge n={5} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Riepilogo materiali e trasferta</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => window.print()} style={{ ...btnPrim, whiteSpace: "nowrap" }}>Stampa report e disegno</button>
          </div>
          <MaterialsReport area={area} perimeter={perimeter} borderMeters={selectedBorderMeters} rolls={rolls} borderType={borderType} substrate={substrate} decoItems={decoItems} projectInfo={projectInfo} travel={travel} />
        </div>

        <div style={{ textAlign: "center", padding: "8px 0 24px", fontSize: 11, color: B.textMuted }}>
          Garden Planner v3.0 - Prato Sintetico Italia / VERTEX SRLS - Strumento interno
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<GardenPlanner />);
