const statusEl = document.getElementById("status");
const tableContainer = document.getElementById("table-container");
const tableCaption = document.getElementById("table-caption");
const tbody = document.getElementById("events-body");
const rowTemplate = document.getElementById("row-template");
const searchInput = document.getElementById("search");

const hoverMessage =
  "Hover a row to see history, traditions, foods, and imagery.";
let activeTooltip = null;

const unescapeText = (value = "") =>
  value
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\\\,/g, ",")
    .replace(/\\,/g, ",")
    .replace(/\\\\;/g, ";")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");

const toDateLabel = (value = "") => {
  const basic = value.trim();
  if (!basic) return "";
  const dateOnly = basic.slice(0, 8);
  const year = dateOnly.slice(0, 4);
  const month = dateOnly.slice(4, 6);
  const day = dateOnly.slice(6, 8);
  if (!year || !month || !day) return basic;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const extractSections = (description = "") => {
  const sections = {
    history: "",
    traditions: "",
    feasting: "",
  };
  const regex =
    /(History|Traditions|Feasting):\s*([\s\S]*?)(?=\n[A-Z][a-z]+:|\nIcon:|$)/g;
  let match;
  while ((match = regex.exec(description)) !== null) {
    const key = match[1].toLowerCase();
    sections[key] = match[2].trim();
  }
  return sections;
};

const extractMeta = (raw = "") => {
  const description = unescapeText(raw);
  const iconMatch =
    description.match(/\n\nIcon:\s*([^\n]+)/) ||
    description.match(/Icon:\s*([^\n]+)/);
  const categoryMatch =
    description.match(/\nCategory:\s*([^\n]+)/) ||
    description.match(/Category:\s*([^\n]+)/);
  const sections = extractSections(description);
  return {
    summary: description.split(/\n\nIcon:/)[0]?.trim() ?? "",
    icon: iconMatch ? iconMatch[1].trim() : "",
    category: categoryMatch ? categoryMatch[1].trim() : "",
    sections,
  };
};

const shortenTitle = (title = "") => {
  const stripped = title.replace(/\s*\(.*?\)\s*/g, "").trim();
  if (stripped.length <= 40) return stripped || title;
  return `${stripped.slice(0, 37)}…`;
};

const parseIcs = (icsText) => {
  const lines = icsText.split(/\r?\n/);
  const events = [];
  let current = null;
  let lastKey = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      lastKey = null;
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
      lastKey = null;
      continue;
    }
    if (!current) continue;

    if (line.startsWith(" ") && lastKey) {
      current[lastKey] = (current[lastKey] || "") + line.slice(1);
      continue;
    }

    const splitIndex = line.indexOf(":");
    if (splitIndex === -1) continue;
    const keyPart = line.slice(0, splitIndex);
    const value = line.slice(splitIndex + 1);
    const key = keyPart.split(";")[0];

    current[key] = value;
    lastKey = key;
  }

  return events.map((event) => {
    const { SUMMARY, DTSTART, DESCRIPTION, CATEGORIES } = event;
    const meta = extractMeta(DESCRIPTION);
    const category = meta.category || unescapeText(CATEGORIES || "").trim();
    const fullTitle =
      unescapeText(SUMMARY || "").trim() ||
      meta.summary ||
      (DTSTART ? `Event on ${toDateLabel(DTSTART)}` : "Untitled Event");
    const image = event["X-IMAGE"] ? event["X-IMAGE"].trim() : "";
    return {
      date: toDateLabel(DTSTART),
      rawDate: DTSTART,
      fullTitle,
      shortTitle: shortenTitle(fullTitle),
      icon: meta.icon,
      category: category || "uncategorized",
      history: meta.sections.history,
      traditions: meta.sections.traditions,
      feasting: meta.sections.feasting,
      image,
    };
  });
};

const createSnapshot = ({ history, traditions, feasting }) => {
  const source = history || traditions || feasting || "";
  if (!source) return "Details arriving soon.";
  return source.length > 150 ? `${source.slice(0, 147)}…` : source;
};

const hideTooltip = () => {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
};

const positionTooltip = (target, tooltip) => {
  const rect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  let top = window.scrollY + rect.top - tooltipRect.height - 12;
  if (top < window.scrollY + 12) {
    top = window.scrollY + rect.bottom + 12;
  }
  let left =
    window.scrollX + rect.left + rect.width / 2 - tooltipRect.width / 2;
  const minLeft = window.scrollX + 16;
  const maxLeft =
    window.scrollX +
    document.documentElement.clientWidth -
    tooltipRect.width -
    16;
  left = Math.min(Math.max(left, minLeft), maxLeft);
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
};

const showTooltip = (target, eventData) => {
  hideTooltip();
  const tooltip = document.createElement("div");
  tooltip.dataset.tooltip = "true";
  tooltip.className = "event-tooltip";
  tooltip.innerHTML = `
    <h3>${eventData.fullTitle}</h3>
    <div class="tooltip-meta">
      ${eventData.date || "Date TBC"} • ${eventData.category}
    </div>
    ${
      eventData.image
        ? `<div class="tooltip-image"><img src="${eventData.image}" alt="${eventData.fullTitle}"></div>`
        : ""
    }
    <div class="tooltip-section">
      <strong style="background: rgba(255,255,255,0.9); color: #0f172a; padding: 0.05rem 0.4rem; border-radius: 6px; display: inline-block;">History</strong>
      <p>${eventData.history || "No details provided yet."}</p>
    </div>
    <div class="tooltip-section">
      <strong style="background: rgba(255,255,255,0.9); color: #0f172a; padding: 0.05rem 0.4rem; border-radius: 6px; display: inline-block;">Traditions</strong>
      <p>${eventData.traditions || "No details provided yet."}</p>
    </div>
    <div class="tooltip-section">
      <strong style="background: rgba(255,255,255,0.9); color: #0f172a; padding: 0.05rem 0.4rem; border-radius: 6px; display: inline-block;">Feasting</strong>
      <p>${eventData.feasting || "No details provided yet."}</p>
    </div>
    ${
      eventData.icon
        ? `<div class="tooltip-icon">Icon: ${eventData.icon}</div>`
        : ""
    }
  `;
  document.body.appendChild(tooltip);
  positionTooltip(target, tooltip);
  activeTooltip = tooltip;
};

const renderTable = (events) => {
  hideTooltip();
  tbody.innerHTML = "";
  const fragment = document.createDocumentFragment();

  events.forEach((event) => {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector(".date").textContent = event.date || "—";

    const imageCell = row.querySelector(".image");
    imageCell.innerHTML = "";
    if (event.image) {
      const img = document.createElement("img");
      img.src = event.image;
      img.alt = event.fullTitle;
      img.className = "preview";
      imageCell.appendChild(img);
    } else {
      imageCell.textContent = "—";
    }

    row.querySelector(".title").textContent = event.shortTitle;
    row.querySelector(".category").textContent = event.category;
    row.querySelector(".icon").textContent = event.icon || "—";
    row.querySelector(".snapshot").textContent = createSnapshot(event);

    row.setAttribute("tabindex", "0");
    row.addEventListener("mouseenter", () => showTooltip(row, event));
    row.addEventListener("mouseleave", hideTooltip);
    row.addEventListener("focus", () => showTooltip(row, event));
    row.addEventListener("blur", hideTooltip);
    row.addEventListener("keydown", (evt) => {
      if (evt.key === "Escape") {
        hideTooltip();
      }
    });

    fragment.appendChild(row);
  });

  tbody.appendChild(fragment);
  tableCaption.textContent = `Calendar Events (${events.length.toLocaleString()} items)`;
};

const applyFilter = (events) => {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return events;
  return events.filter((event) => {
    const haystack = [
      event.fullTitle,
      event.shortTitle,
      event.date,
      event.category,
      event.icon,
      event.history,
      event.traditions,
      event.feasting,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
};

const attachSearch = (events) => {
  searchInput.addEventListener("input", () => {
    const filtered = applyFilter(events);
    renderTable(filtered);
    statusEl.textContent =
      filtered.length === events.length
        ? `Showing all ${events.length.toLocaleString()} events. ${hoverMessage}`
        : `Showing ${filtered.length.toLocaleString()} of ${events.length.toLocaleString()} events. ${hoverMessage}`;
  });
};

const initialise = async () => {
  try {
    const response = await fetch("MSS.ics", { cache: "no-store" });
    if (!response.ok)
      throw new Error(
        `Request failed: ${response.status} ${response.statusText}`
      );

    const text = await response.text();
    const parsed = parseIcs(text).sort((a, b) => {
      if (!a.rawDate) return 1;
      if (!b.rawDate) return -1;
      return a.rawDate.localeCompare(b.rawDate);
    });

    renderTable(parsed);
    attachSearch(parsed);

    tableContainer.classList.remove("hidden");
    statusEl.textContent = `Loaded ${parsed.length.toLocaleString()} events. ${hoverMessage}`;
  } catch (error) {
    statusEl.textContent = `Failed to load events: ${error.message}`;
    tableContainer.classList.add("hidden");
  }
};

initialise();
window.addEventListener("scroll", hideTooltip, { passive: true });
window.addEventListener("resize", hideTooltip);
