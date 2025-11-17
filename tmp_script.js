  // ================= CONFIG =================
  const API_BASE = "/api/frame-layout"; // relative: cháº¡y Ä‘Æ°á»£c cáº£ localhost & ngrok
  const BASE_SIZE = 1080;
  const DEFAULT_OVERLAY_RADIUS = 20;
  const DEFAULT_OVERLAY_ALPHA = 1;
  const FIT_MODE = "cover";
  const FONT_FAMILY = "Montserrat, system-ui, -apple-system, sans-serif";

  // ================= DOM =================
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const frameSelect = document.getElementById("frameSelect");
  const statusText = document.getElementById("statusText");

  const lineHeightEl = document.getElementById("lineHeight");
  const paddingEl = document.getElementById("padding");
  const exportSizeEl = document.getElementById("exportSize");
  const previewZoomEl = document.getElementById("previewZoom");
  const zoomLabel = document.getElementById("zoomLabel");

  const overlayInput = document.getElementById("overlayInput");
  const overlayToggleBtn = document.getElementById("overlayToggleBtn");
  const overlayBtnText = document.getElementById("overlayBtnText");
  const overlayBtnIcon = document.getElementById("overlayBtnIcon");

  const downloadBtn = document.getElementById("downloadBtn");
  const FRAME_DEFAULT_COLORS = {
    "new__default1": "mÃ u Ä‘á»",
    "new__default": "mÃ u Ä‘en",
    "my_frame4": "mÃ u xanh dÆ°Æ¡ng",
    "my_frame3": "mÃ u xanh ngá»c",
    "my_frame5": "mÃ u tráº¯ng",
  };

  const templateInputs = document.querySelectorAll("[data-template-input]");
  const templateFieldMap = {
    busy: document.getElementById("templateBusy"),
    highlight: document.getElementById("templateHighlight"),
    sometimes: document.getElementById("templateSometimes"),
    unique: document.getElementById("templateUnique"),
    threeWords: document.getElementById("templateThreeWords"),
    color: document.getElementById("templateColor"),
  };
  const pageParams = new URLSearchParams(window.location.search);
  const presetColor = pageParams.get("color") || "";
  if (presetColor && templateFieldMap.color && !templateFieldMap.color.value) {
    templateFieldMap.color.value = presetColor;
  }
  templateInputs.forEach((input) => {
    safeAddListener(input, "input", sizeChange);
  });
  const imageZoomEl = document.getElementById("imageZoom");
  const zoomImageLabel = document.getElementById("zoomImageLabel");
  const cropControls = document.getElementById("cropControls");
  const resetImageBtn = document.getElementById("resetImageBtn");

  // ================= STATE =================
  let frames = [];
  let currentKey = null;
  let currentLayout = null; // { frame_url, textBox, imageBox, colors... }

  let frameImg = new Image();
  let frameLoaded = false;
  let layoutLoaded = false;

  let overlayImg = null;
  let hasOverlay = false;
  // --- ThÃªm biáº¿n tráº¡ng thÃ¡i cho áº£nh Overlay ---
  let overlayZoom = 1.0;          // Tá»‰ lá»‡ zoom cá»§a áº£nh gá»‘c (1.0 = fit)
  let overlayOffsetX = 0;         // Dá»‹ch chuyá»ƒn X (px)
  let overlayOffsetY = 0;         // Dá»‹ch chuyá»ƒn Y (px)
  // ------------------------------------------
  

  // ================= HELPERS =================
  function setStatus(msg, error = false) {
    if (!statusText) return;
    statusText.textContent = msg;
    statusText.style.color = error ? "#f97316" : "#6b7280";
  }

  function safeAddListener(el, ev, fn) {
    if (el) el.addEventListener(ev, fn);
  }

  function boxPercentToPx(box, size) {
    return {
      x: (box.x / 100) * size,
      y: (box.y / 100) * size,
      w: (box.w / 100) * size,
      h: (box.h / 100) * size,
    };
  }

  // ===== Template Text Helpers =====
  const TEMPLATE_BLANK = "__________________";

  function readTemplateField(field) {
    if (!field) return "";
    return (field.value || "").trim();
  }

  function getTemplateValues() {
    return {
      busy: readTemplateField(templateFieldMap.busy),
      highlight: readTemplateField(templateFieldMap.highlight),
      sometimes: readTemplateField(templateFieldMap.sometimes),
      unique: readTemplateField(templateFieldMap.unique),
      threeWords: readTemplateField(templateFieldMap.threeWords),
      color: readTemplateField(templateFieldMap.color),
    };
  }

  function createValueSegment(value) {
    const text = value || TEMPLATE_BLANK;
    const htmlText = `<b>${text}</b>`;
    return {
      text,
      htmlText,
      bold: true,
      hasUserInput: !!value,
    };
  }

  function createStaticSegment(text) {
    return {
      text,
      htmlText: text,
      bold: false,
      hasUserInput: false,
    };
  }

  function buildTemplateLineSegments() {
    const values = getTemplateValues();
    return [
      [
        createStaticSegment('HÃ´m nay tÃ´i "báº­n" kiá»ƒu '),
        createValueSegment(values.busy),
      ],
      [
        createStaticSegment('TÃ­nh cÃ¡ch - cáº£m xÃºc Ä‘Ã³ thá»ƒ hiá»‡n rÃµ nháº¥t khi '),
        createValueSegment(values.highlight),
      ],
      [
        createStaticSegment('Tuy Ä‘Ã´i khi tÃ´i tháº¥y mÃ¬nh '),
        createValueSegment(values.sometimes),
        createStaticSegment(' nhÆ°ng Ä‘Ã³ váº«n lÃ  tÃ´i.'),
      ],
      [
        createStaticSegment('TÃ´i nghÄ© Ä‘iá»u khiáº¿n tÃ´i khÃ¡c biá»‡t lÃ  '),
        createValueSegment(values.unique),
      ],
      [
        createStaticSegment('Äá»ƒ mÃ´ táº£ tÃ­nh cÃ¡ch - cáº£m xÃºc Ä‘Ã³ vá»›i 3 tá»« khÃ¡c nhau thÃ¬ sáº½ lÃ  '),
        createValueSegment(values.threeWords),
      ],
      [
        createStaticSegment('Báº¡n tháº¥y trong 5 mÃ u (tráº¯ng/xanh navy/xanh ve chai/xÃ¡m/Ä‘á») mÃ u nÃ o bá»™c lá»™ vÃ  thá»ƒ hiá»‡n Ä‘Æ°á»£c tÃ­nh cÃ¡ch - cáº£m xÃºc chÃ­nh cá»§a báº¡n? '),
        createValueSegment(values.color),
      ],
    ];
  }

  function buildTemplateRenderData() {
    const lineSegments = buildTemplateLineSegments();
    let text = '';
    let html = '';
    const runs = [];
    let cursor = 0;

    lineSegments.forEach((line, idx) => {
      line.forEach((segment) => {
        if (!segment.text) return;
        text += segment.text;
        html += segment.htmlText || segment.text;
        runs.push({
          start: cursor,
          end: cursor + segment.text.length,
          bold: !!segment.bold,
          hasUserInput: !!segment.hasUserInput,
        });
        cursor += segment.text.length;
      });

      if (idx < lineSegments.length - 1) {
        text += '\n';
        html += '<br/>';
        runs.push({ start: cursor, end: cursor + 1, bold: false, hasUserInput: false });
        cursor += 1;
      }
    });

    return { text, html, runs };
  }

  function getTemplatePlainText() {
    return buildTemplateRenderData().text;
  }

  function getTemplateHtmlText() {
    return buildTemplateRenderData().html;
  }

  // ===== Wrap & fit =====
  function wrapLines(ctx, text, maxWidth) {
    const lines = [];
    const paragraphs = text.split("\n");

    for (const para of paragraphs) {
      if (para === "") {
        lines.push("");
        continue;
      }
      const words = para.split(/\s+/);
      let line = "";
      for (const w of words) {
        if (!w) continue;
        const test = line ? line + " " + w : w;
        if (ctx.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          if (line) lines.push(line);
          line = w;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  function computeFittedLines(text, boxPx, padding, lineH) {
    const MAX_FONT = 28;
    const MIN_FONT = 14;
    let fontPx = MAX_FONT;
    const maxHeight = boxPx.h - padding * 2;
    let lines = [];

    while (fontPx >= MIN_FONT) {
      ctx.font = `normal 400 ${fontPx}px ${FONT_FAMILY}`;
      const maxWidth = Math.max(0, boxPx.w - padding * 2);
      lines = wrapLines(ctx, text, maxWidth);

      const lh = lineH * fontPx;
      const totalH = lines.length * lh;

      if (totalH <= maxHeight) {
        return { fontPx, lines, lh };
      }
      fontPx--;
    }

    ctx.font = `normal 400 ${MIN_FONT}px ${FONT_FAMILY}`;
    const maxWidth = Math.max(0, boxPx.w - padding * 2);
    lines = wrapLines(ctx, text, maxWidth);
    return { fontPx: MIN_FONT, lines, lh: lineH * MIN_FONT };
  }

  function drawRoundedRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function updateOverlayButton() {
    if (!overlayToggleBtn || !overlayBtnText) return;

    if (hasOverlay) {
      overlayBtnText.innerHTML = '<i class="bi bi-x-lg"></i> Gá»¡ áº£nh';
      overlayToggleBtn.style.background = "linear-gradient(180deg, var(--brand-red), var(--brand-red-700))";
      overlayToggleBtn.style.color = "#fff";
      
      // Hiá»ƒn thá»‹ crop controls
      if (cropControls) cropControls.style.display = "block";
    } else {
      overlayBtnText.innerHTML = '<i class="bi bi-camera-fill"></i> Chá»n áº£nh';
      overlayToggleBtn.style.background = "var(--brand-beige-50)";
      overlayToggleBtn.style.color = "var(--brand-red-900)";
      
      // áº¨n crop controls
      if (cropControls) cropControls.style.display = "none";
    }
  }

  // ================= RENDER =================
  function render(targetSize = BASE_SIZE, opts = {}) {
    if (!frameLoaded || !layoutLoaded || !currentLayout) return;

    const { forceHideBox = false } = opts;

    const textColor      = currentLayout.textColor        || "#333333";
    const imgBorderColor = currentLayout.imageBorderColor || "#000000";
    const textBoxColor   = currentLayout.textBoxColor     || "#22c55e";
    const imageBoxColor  = currentLayout.imageBoxColor    || "#38bdf8";

    const DPR = window.devicePixelRatio || 1;
    canvas.width = targetSize * DPR;
    canvas.height = targetSize * DPR;

    const zoom = parseInt(previewZoomEl?.value || "70", 10) / 100;
    canvas.style.width = targetSize * zoom + "px";
    canvas.style.height = "auto";

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, targetSize, targetSize);

    // Váº½ frame (cover)
    const ir = frameImg.width / frameImg.height || 1;
    let w, h, x, y;
    if (ir > 1) {
      h = targetSize;
      w = h * ir;
      x = -(w - targetSize) / 2;
      y = 0;
    } else {
      w = targetSize;
      h = w / ir;
      x = 0;
      y = -(h - targetSize) / 2;
    }
    ctx.drawImage(frameImg, x, y, w, h);

    const textPx = boxPercentToPx(currentLayout.textBox, targetSize);
    const imagePx = boxPercentToPx(currentLayout.imageBox, targetSize);

    // áº¢nh overlay trong khung
    const rad = DEFAULT_OVERLAY_RADIUS;

    ctx.save();
    drawRoundedRectPath(ctx, imagePx.x, imagePx.y, imagePx.w, imagePx.h, rad);
    ctx.clip();

    // ná»n tráº¯ng máº·c Ä‘á»‹nh
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(imagePx.x, imagePx.y, imagePx.w, imagePx.h);

    if (overlayImg && hasOverlay) {
      // TÃ­nh kÃ­ch thÆ°á»›c gá»‘c cá»§a áº£nh dÃ¹ng cover mode (áº£nh phá»§ Ä‘áº§y khung)
      const ir2 = overlayImg.width / overlayImg.height;
      const br = imagePx.w / imagePx.h;
      let initialW, initialH, initialX, initialY;

      if (ir2 > br) { // áº£nh rá»™ng hÆ¡n khung
        initialH = imagePx.h;
        initialW = initialH * ir2;
        initialX = imagePx.x - (initialW - imagePx.w) / 2;
        initialY = imagePx.y;
      } else { // áº£nh cao hÆ¡n khung
        initialW = imagePx.w;
        initialH = initialW / ir2;
        initialX = imagePx.x;
        initialY = imagePx.y - (initialH - imagePx.h) / 2;
      }

      // Ãp dá»¥ng zoom (phÃ³ng to/thu nhá» tá»« tÃ¢m)
      const zoomedW = initialW * overlayZoom;
      const zoomedH = initialH * overlayZoom;
      const zoomCenterX = initialX + initialW / 2;
      const zoomCenterY = initialY + initialH / 2;

      // Váº½ áº£nh vá»›i zoom vÃ  pan (kÃ©o)
      const drawX = zoomCenterX - zoomedW / 2 + overlayOffsetX;
      const drawY = zoomCenterY - zoomedH / 2 + overlayOffsetY;

      ctx.globalAlpha = DEFAULT_OVERLAY_ALPHA;
      ctx.drawImage(overlayImg, drawX, drawY, zoomedW, zoomedH);
    }

    ctx.restore();

    // viá»n khung áº£nh
    ctx.save();
    drawRoundedRectPath(ctx, imagePx.x, imagePx.y, imagePx.w, imagePx.h, rad);
    ctx.lineWidth = 6;
    ctx.strokeStyle = imgBorderColor;
    ctx.stroke();
    ctx.restore();

    // KHUNG DEBUG (táº¯t máº·c Ä‘á»‹nh)
    const showNow = false;
    if (showNow && !forceHideBox) {
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2.5;

      ctx.strokeStyle = textBoxColor;
      ctx.strokeRect(textPx.x, textPx.y, textPx.w, textPx.h);

      ctx.strokeStyle = imageBoxColor;
      ctx.strokeRect(imagePx.x, imagePx.y, imagePx.w, imagePx.h);

      ctx.setLineDash([]);
      ctx.restore();
    }

            // ===== Váº½ text =====
    const padding = parseFloat(paddingEl?.value) || 0;

    let rawLH = parseFloat(lineHeightEl?.value);
    if (isNaN(rawLH)) rawLH = 1.0;
    const lineH = Math.max(0.8, rawLH);

    const renderData = buildTemplateRenderData();
    const plain = renderData.text;
    const fit = computeFittedLines(plain, textPx, padding, lineH);

    ctx.textBaseline = "top";
    const resolvedTextColor = currentLayout.textColor || currentLayout.imageBorderColor || "#333";
    ctx.fillStyle = resolvedTextColor;

    const innerLeft = textPx.x + padding;
    const innerRight = textPx.x + textPx.w - padding;
    const innerWidth = innerRight - innerLeft;

    ctx.save();
    ctx.beginPath();
    ctx.rect(textPx.x, textPx.y, textPx.w, textPx.h);
    ctx.clip();

    let ty = textPx.y + padding;
    const align = getEditorAlign();
    const renderState = { charPos: 0, runIndex: 0 };
    const runs = renderData.runs;

    for (const line of fit.lines) {
      advanceRenderState(renderState, plain, runs);

      const styledSegments = line
        ? extractSegmentsForLine(line, renderState, plain, runs)
        : [];

      let lineWidth = 0;
      const measuredSegments = styledSegments.map((segment) => {
        ctx.font = `${segment.bold ? "600" : "400"} ${fit.fontPx}px ${FONT_FAMILY}`;
        const width = ctx.measureText(segment.text).width;
        lineWidth += width;
        return { ...segment, width };
      });

      let startX = innerLeft;
      if (align === "center") startX = innerLeft + (innerWidth - lineWidth) / 2;
      if (align === "right") startX = innerRight - lineWidth;

      let cursorX = startX;
      measuredSegments.forEach((segment) => {
        ctx.font = `${segment.bold ? "600" : "400"} ${fit.fontPx}px ${FONT_FAMILY}`;
        ctx.fillStyle = resolvedTextColor;
        ctx.fillText(segment.text, cursorX, ty);
        cursorX += segment.width;
      });

      ty += fit.lh;

      if (ty > textPx.y + textPx.h - padding) break;
    }

    ctx.restore();
  }

// ================= LOAD FRAMES FROM API =================
  const FRAME_API_BASE = "/api/frame-layout";
  const TEMPLATE_API_BASE = "/api/templates";

  async function loadFrameList() {
    const params = new URLSearchParams(window.location.search);
    const tplKey = params.get("tpl");             // template Ä‘Æ°á»£c chá»n (náº¿u cÃ³)
    const frameKeyFromUrl = params.get("frame");  // optional: deep-link frame

    try {
      if (tplKey) {
        setStatus(`Äang táº£i frame cá»§a template "${tplKey}"...`);
        const res = await fetch(`${TEMPLATE_API_BASE}/${encodeURIComponent(tplKey)}`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();

        if (!data.frames || !data.frames.length) {
          setStatus("Template nÃ y chÆ°a cÃ³ frame nÃ o. HÃ£y cáº¥u hÃ¬nh frame_layouts vá»›i template_id tÆ°Æ¡ng á»©ng.", true);
          frameSelect.innerHTML = "";
          return;
        }

        frames = data.frames; // [{layout_key, frame_url}, ...]
        frameSelect.innerHTML = "";
        frames.forEach(f => {
          const opt = document.createElement("option");
          opt.value = f.layout_key;
          opt.textContent = f.layout_key;
          frameSelect.appendChild(opt);
        });

        const initialKey = (frameKeyFromUrl && frames.some(f => f.layout_key === frameKeyFromUrl))
          ? frameKeyFromUrl
          : frames[0].layout_key;

        currentKey = initialKey;
        frameSelect.value = currentKey;

        await loadLayout(currentKey);
        setStatus(`Template: ${data.name || tplKey} â€¢ Äang dÃ¹ng frame "${currentKey}"`);
        return;
      }

      // Fallback: láº¥y táº¥t cáº£ frame
      setStatus("Äang táº£i danh sÃ¡ch frame...");

      const res = await fetch(FRAME_API_BASE);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const list = await res.json();

      if (!list.length) {
        setStatus("ChÆ°a cÃ³ frame nÃ o trong há»‡ thá»‘ng.", true);
        frameSelect.innerHTML = "";
        return;
      }

      frames = list; // [{layout_key, ...}, ...]
      frameSelect.innerHTML = "";
      frames.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f.layout_key;
        opt.textContent = f.layout_key;
        frameSelect.appendChild(opt);
      });

      const initialKey = (frameKeyFromUrl && frames.some(f => f.layout_key === frameKeyFromUrl))
        ? frameKeyFromUrl
        : frames[0].layout_key;

      currentKey = initialKey;
      frameSelect.value = currentKey;

      await loadLayout(currentKey);
      setStatus(`Äang dÃ¹ng frame "${currentKey}"`);
    } catch (err) {
      console.error(err);
      setStatus("KhÃ´ng load Ä‘Æ°á»£c danh sÃ¡ch frame.", true);
    }
  }

  async function loadLayout(key) {
    layoutLoaded = false;
    frameLoaded = false;
    overlayImg = null;
    hasOverlay = false;

    if (overlayInput) overlayInput.value = "";
    updateOverlayButton();

    // --- Reset tráº¡ng thÃ¡i Overlay ---
    overlayZoom = 1.0;
    overlayOffsetX = 0;
    overlayOffsetY = 0;
    if (imageZoomEl) {
      imageZoomEl.value = 100;
      if (zoomImageLabel) zoomImageLabel.textContent = "100";
    }

    setStatus("Äang táº£i layout " + key + "...");
    try {
      const res = await fetch(`/api/frame-layout/${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      currentLayout = {
        frame_url: data.frame_url,
        textBox: data.textBox,
        imageBox: data.imageBox,
        textColor: data.textColor || "#333333",
        imageBorderColor: data.imageBorderColor || "#000000",
        textBoxColor: data.textBoxColor || "#22c55e",
        imageBoxColor: data.imageBoxColor || "#38bdf8",
      };

      const mappedColor = FRAME_DEFAULT_COLORS[key];
      if (mappedColor && templateFieldMap.color) {
        templateFieldMap.color.value = mappedColor;
      }

      await loadFrameImage(currentLayout.frame_url);
      layoutLoaded = true;
      setStatus(`ÄÃ£ táº£i frame "${key}". Nháº­p ná»™i dung & chá»n áº£nh.`);
      sizeChange();
    } catch (err) {
      console.error(err);
      setStatus("KhÃ´ng load Ä‘Æ°á»£c layout/frame.", true);
    }
  }

  function loadFrameImage(url) {
    return new Promise((resolve) => {
      frameImg = new Image();
      frameImg.onload = () => {
        frameLoaded = true;
        resolve();
      };
      frameImg.onerror = () => {
        setStatus("KhÃ´ng load Ä‘Æ°á»£c frame_url: " + url, true);
        resolve();
      };
      frameImg.src = url;
    });
  }

  // ================= EVENTS =================
  // chá»n frame khÃ¡c
  safeAddListener(frameSelect, "change", async () => {
    const key = frameSelect.value;
    if (!key) return;
    currentKey = key;
    await loadLayout(currentKey);
    sizeChange();
  });

  // Template inputs trigger render via listeners registered near the top

  // auto render khi thay Ä‘á»•i text / lineHeight / padding / exportSize
  ["input", "change"].forEach((ev) => {
    safeAddListener(lineHeightEl, ev, sizeChange);
    safeAddListener(paddingEl, ev, sizeChange);
    safeAddListener(exportSizeEl, ev, sizeChange);
  });

  // zoom preview
  if (previewZoomEl && zoomLabel) {
    const handleZoom = () => {
      zoomLabel.textContent = previewZoomEl.value;
      sizeChange();
    };
    previewZoomEl.addEventListener("input", handleZoom);
    previewZoomEl.addEventListener("change", handleZoom);
  }

  // zoom image overlay
  if (imageZoomEl && zoomImageLabel) {
    const handleImageZoom = () => {
      const zoomPercent = parseInt(imageZoomEl.value, 10);
      zoomImageLabel.textContent = zoomPercent;
      overlayZoom = zoomPercent / 100;
      // Clamp offset khi zoom thay Ä‘á»•i (vÃ¬ giá»›i háº¡n thay Ä‘á»•i theo zoom)
      clampImageOffset();
      sizeChange();
    };
    imageZoomEl.addEventListener("input", handleImageZoom);
    imageZoomEl.addEventListener("change", handleImageZoom);
  }

  // nÃºt reset áº£nh
  safeAddListener(resetImageBtn, "click", () => {
    // Reset zoom vá» 100%
    if (imageZoomEl) {
      imageZoomEl.value = 100;
      overlayZoom = 1.0;
      if (zoomImageLabel) zoomImageLabel.textContent = "100";
    }
    // Reset offset vá» (0, 0)
    overlayOffsetX = 0;
    overlayOffsetY = 0;
    sizeChange();
  });

  // nÃºt chá»n / gá»¡ áº£nh
  safeAddListener(overlayToggleBtn, "click", () => {
    if (hasOverlay) {
      overlayImg = null;
      hasOverlay = false;
      if (overlayInput) overlayInput.value = "";
      updateOverlayButton();
      sizeChange();
    } else {
      if (overlayInput) overlayInput.click();
    }
  });

  // upload áº£nh overlay
  safeAddListener(overlayInput, "change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        overlayImg = img;
        hasOverlay = true;
        // Reset offset vá» 0 khi upload áº£nh má»›i (áº£nh sáº½ á»Ÿ vá»‹ trÃ­ máº·c Ä‘á»‹nh)
        overlayOffsetX = 0;
        overlayOffsetY = 0;
        updateOverlayButton();
        sizeChange();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // ================= DRAG TO PAN IMAGE =================
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartOffsetX = 0;
  let dragStartOffsetY = 0;

  // HÃ m tÃ­nh giá»›i háº¡n offset Ä‘á»ƒ áº£nh khÃ´ng kÃ©o ra ngoÃ i khung
  function clampImageOffset(targetSize = BASE_SIZE) {
    if (!overlayImg || !currentLayout) return;

    const imagePx = boxPercentToPx(currentLayout.imageBox, targetSize);
    const ir2 = overlayImg.width / overlayImg.height;
    const br = imagePx.w / imagePx.h;
    
    // TÃ­nh kÃ­ch thÆ°á»›c ban Ä‘áº§u (cover mode)
    let initialW, initialH;
    if (ir2 > br) {
      initialH = imagePx.h;
      initialW = initialH * ir2;
    } else {
      initialW = imagePx.w;
      initialH = initialW / ir2;
    }

    // KÃ­ch thÆ°á»›c sau khi zoom
    const zoomedW = initialW * overlayZoom;
    const zoomedH = initialH * overlayZoom;

    // TÃ­nh giá»›i háº¡n offset
    // Náº¿u áº£nh lá»›n hÆ¡n khung: cÃ³ thá»ƒ kÃ©o trong pháº¡m vi
    // Náº¿u áº£nh nhá» hÆ¡n khung: khÃ´ng thá»ƒ kÃ©o (offset = 0)
    
    let minOffsetX, maxOffsetX;
    if (zoomedW > imagePx.w) {
      // áº¢nh lá»›n hÆ¡n khung: cÃ³ thá»ƒ kÃ©o
      maxOffsetX = (zoomedW - imagePx.w) / 2;
      minOffsetX = -maxOffsetX;
    } else {
      // áº¢nh nhá» hÆ¡n khung: khÃ´ng thá»ƒ kÃ©o, pháº£i á»Ÿ giá»¯a
      minOffsetX = 0;
      maxOffsetX = 0;
    }

    let minOffsetY, maxOffsetY;
    if (zoomedH > imagePx.h) {
      // áº¢nh lá»›n hÆ¡n khung: cÃ³ thá»ƒ kÃ©o
      maxOffsetY = (zoomedH - imagePx.h) / 2;
      minOffsetY = -maxOffsetY;
    } else {
      // áº¢nh nhá» hÆ¡n khung: khÃ´ng thá»ƒ kÃ©o, pháº£i á»Ÿ giá»¯a
      minOffsetY = 0;
      maxOffsetY = 0;
    }

    // Clamp offset vá» trong giá»›i háº¡n
    overlayOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, overlayOffsetX));
    overlayOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, overlayOffsetY));
  }

  // Helper function Ä‘á»ƒ láº¥y tá»a Ä‘á»™ tá»« mouse hoáº·c touch event
  function getEventCoords(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  const canvasWrap = document.querySelector('.canvas-wrap');
  if (canvasWrap) {
    // Mouse events (desktop)
    canvasWrap.addEventListener('mousedown', (e) => {
      if (!hasOverlay || !currentLayout) return;
      
      isDragging = true;
      const coords = getEventCoords(e);
      dragStartX = coords.x;
      dragStartY = coords.y;
      dragStartOffsetX = overlayOffsetX;
      dragStartOffsetY = overlayOffsetY;
      canvasWrap.style.cursor = 'grabbing';
      e.preventDefault();
    });

    // Helper function Ä‘á»ƒ tÃ­nh scale dá»±a trÃªn canvas thá»±c táº¿
    function calculateScale() {
      const previewZoom = parseInt(previewZoomEl?.value || "70", 10) / 100;
      // Láº¥y kÃ­ch thÆ°á»›c thá»±c táº¿ cá»§a canvas trÃªn mÃ n hÃ¬nh
      const canvasRect = canvas.getBoundingClientRect();
      const canvasDisplayWidth = canvasRect.width || (520 * previewZoom);
      return BASE_SIZE / canvasDisplayWidth;
    }

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const scale = calculateScale();
      const coords = getEventCoords(e);
      const deltaX = (coords.x - dragStartX) * scale;
      const deltaY = (coords.y - dragStartY) * scale;

      // Cáº­p nháº­t offset táº¡m thá»i
      overlayOffsetX = dragStartOffsetX + deltaX;
      overlayOffsetY = dragStartOffsetY + deltaY;

      // Giá»›i háº¡n offset trong vÃ¹ng khung áº£nh
      clampImageOffset();

      sizeChange();
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        canvasWrap.style.cursor = 'grab';
      }
    });

    // Touch events (mobile)
    canvasWrap.addEventListener('touchstart', (e) => {
      if (!hasOverlay || !currentLayout) return;
      if (e.touches.length !== 1) return; // Chá»‰ xá»­ lÃ½ single touch
      
      isDragging = true;
      const coords = getEventCoords(e);
      dragStartX = coords.x;
      dragStartY = coords.y;
      dragStartOffsetX = overlayOffsetX;
      dragStartOffsetY = overlayOffsetY;
      e.preventDefault(); // NgÄƒn scroll khi drag
    }, { passive: false });

    canvasWrap.addEventListener('touchmove', (e) => {
      if (!isDragging || !hasOverlay) return;
      if (e.touches.length !== 1) return;

      const scale = calculateScale();
      const coords = getEventCoords(e);
      const deltaX = (coords.x - dragStartX) * scale;
      const deltaY = (coords.y - dragStartY) * scale;

      // Cáº­p nháº­t offset táº¡m thá»i
      overlayOffsetX = dragStartOffsetX + deltaX;
      overlayOffsetY = dragStartOffsetY + deltaY;

      // Giá»›i háº¡n offset trong vÃ¹ng khung áº£nh
      clampImageOffset();

      sizeChange();
      e.preventDefault(); // NgÄƒn scroll khi drag
    }, { passive: false });

    canvasWrap.addEventListener('touchend', (e) => {
      if (isDragging) {
        isDragging = false;
      }
    });

    canvasWrap.addEventListener('touchcancel', () => {
      if (isDragging) {
        isDragging = false;
      }
    });

    // Mouse hover effects (chá»‰ desktop)
    canvasWrap.addEventListener('mouseenter', () => {
      if (hasOverlay && !isDragging) {
        canvasWrap.style.cursor = 'grab';
      }
    });

    canvasWrap.addEventListener('mouseleave', () => {
      canvasWrap.style.cursor = 'default';
    });
  }

  // download: desktop táº£i file, mobile/in-app má»Ÿ JPEG Ä‘á»ƒ giá»¯-lÆ°u
  safeAddListener(downloadBtn, "click", () => {
    if (!frameLoaded || !layoutLoaded || !currentLayout) return;

    const size = parseInt(exportSizeEl?.value || "1080", 10);
    const fileName = `${currentKey || "frame"}_export.jpg`;

    // váº½ báº£n sáº¡ch
    render(size, { forceHideBox: true });

    const ua = navigator.userAgent || "";
    const isIOS    = /iP(hone|od|ad)/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isInApp  = /(FBAN|FBAV|FB_IAB|FB4A|Instagram|Messenger)/i.test(ua);

    // xuáº¥t JPEG cho mobile/in-app
    const dataUrlJpeg = canvas.toDataURL("image/jpeg", 0.92);

    // In-app (Messenger / FB / IG): má»Ÿ trang chá»‰ cÃ³ áº£nh
    if (isInApp) {
      const html =
        '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>LÆ°u áº£nh</title></head>' +
        '<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;">' +
        '<img src="' + dataUrlJpeg + '" style="max-width:100%;height:auto;display:block;" />' +
        '</body></html>';

      const win = window.open();
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
      } else {
        document.open();
        document.write(html);
        document.close();
      }
      sizeChange();
      return;
    }

    // iOS Safari: má»Ÿ áº£nh riÃªng Ä‘á»ƒ long-press lÆ°u
    if (isIOS && isSafari) {
      const win = window.open();
      if (win) {
        win.document.open();
        win.document.write(
          '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<title>LÆ°u áº£nh</title></head>' +
          '<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;">' +
          '<img src="' + dataUrlJpeg + '" style="max-width:100%;height:auto;display:block;" />' +
          '</body></html>'
        );
        win.document.close();
      } else {
        window.location.href = dataUrlJpeg;
      }
      sizeChange();
      return;
    }

    // Desktop + Ä‘a sá»‘ Android browser: táº£i file bÃ¬nh thÆ°á»ng
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      sizeChange();
    });
  });

  // ================= INIT =================
  function sizeChange() {
    // Render preview theo kÃ­ch thÆ°á»›c gá»‘c BASE_SIZE
    render(BASE_SIZE);
  }

  (async function init() {
    updateOverlayButton();
    setStatus("Äang táº£i danh sÃ¡ch frame...");
    await loadFrameList();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(sizeChange);
    } else {
      sizeChange();
    }

    window.addEventListener("resize", sizeChange);
  })();
