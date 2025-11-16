const statusEl = document.getElementById("status");
const emptyStateEl = document.getElementById("empty-state");
const mainEl = document.getElementById("event-main");
const titleEl = document.getElementById("event-title");
const dateEl = document.getElementById("event-date");
const categoryEl = document.getElementById("event-category");
const iconEl = document.getElementById("event-icon");
const historyEl = document.getElementById("event-history");
const traditionsEl = document.getElementById("event-traditions");
const feastingEl = document.getElementById("event-feasting");
const summaryEl = document.getElementById("event-summary");
const overviewSection = document.getElementById("event-overview");
const imageFigure = document.getElementById("event-image");
const imageEl = document.getElementById("event-image-src");
const shareButton = document.getElementById("copy-link");
const shareFeedback = document.getElementById("share-feedback");

const params = new URLSearchParams(window.location.search);
const requestedSlug = params.get("event");

const directoryBase = new URL(".", document.baseURI).href;

const normaliseForSlug = (value = "") =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const slugify = (title = "", rawDate = "", index = 0) => {
  const base = normaliseForSlug(`${title || ""} ${rawDate || ""}`.trim());
  const cleaned = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || `event-${index + 1}`;
};

const resolveImageSrc = (value = "") => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const trimmed = value.startsWith("/") ? value.slice(1) : value;
  return new URL(trimmed, directoryBase).href;
};

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

  const slugCounts = new Map();

  return events.map((event, index) => {
    const { SUMMARY, DTSTART, DESCRIPTION, CATEGORIES } = event;
    const meta = extractMeta(DESCRIPTION);
    const category = meta.category || unescapeText(CATEGORIES || "").trim();
    const fullTitle =
      unescapeText(SUMMARY || "").trim() ||
      meta.summary ||
      (DTSTART ? `Event on ${toDateLabel(DTSTART)}` : "Untitled Event");
    const imagePath = event["X-IMAGE"] ? event["X-IMAGE"].trim() : "";
    const baseSlug = slugify(fullTitle, DTSTART || "", index);
    const count = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, count + 1);
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;

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
      image: resolveImageSrc(imagePath),
      summary: meta.summary,
      slug,
    };
  });
};

const setTextOrFallback = (element, text, fallback) => {
  if (!element) return;
  const content = text?.trim();
  element.textContent = content || fallback;
};

const toggleHidden = (element, hidden) => {
  if (!element) return;
  element.classList.toggle("hidden", hidden);
};

const handleShare = async () => {
  if (!navigator.clipboard) {
    shareFeedback.textContent = "Copy this link manually:";
    window.prompt(
      "Share this event with the link below:",
      window.location.href
    );
    setTimeout(() => {
      shareFeedback.textContent = "";
    }, 5000);
    return;
  }

  try {
    await navigator.clipboard.writeText(window.location.href);
    shareFeedback.textContent = "Link copied to clipboard.";
    setTimeout(() => {
      shareFeedback.textContent = "";
    }, 3000);
  } catch (error) {
    shareFeedback.textContent = "Unable to copy link automatically.";
  }
};

const renderEvent = (event) => {
  if (!event) {
    toggleHidden(mainEl, true);
    emptyStateEl.textContent =
      "We couldn't find that event. Please return to the calendar and try again.";
    toggleHidden(emptyStateEl, false);
    statusEl.textContent = "Event not found.";
    return;
  }

  document.title = `${event.fullTitle} – MSS Event Detail`;
  titleEl.textContent = event.fullTitle;
  dateEl.textContent = event.date ? `Happening on ${event.date}` : "";

  if (event.category && event.category.toLowerCase() !== "uncategorized") {
    categoryEl.textContent = event.category;
    toggleHidden(categoryEl, false);
  } else {
    toggleHidden(categoryEl, true);
  }

  if (event.icon) {
    iconEl.textContent = `Icon: ${event.icon}`;
    toggleHidden(iconEl, false);
  } else {
    toggleHidden(iconEl, true);
  }

  setTextOrFallback(
    historyEl,
    event.history,
    "History details will be added soon."
  );
  setTextOrFallback(
    traditionsEl,
    event.traditions,
    "Traditions will be documented shortly."
  );
  setTextOrFallback(
    feastingEl,
    event.feasting,
    "Feasting notes will be shared once they're ready."
  );

  const hasSummary =
    event.summary &&
    !/^history:/i.test(event.summary.trim()) &&
    event.summary.trim().length > 0;
  if (hasSummary) {
    summaryEl.textContent = event.summary.trim();
    toggleHidden(overviewSection, false);
  } else {
    toggleHidden(overviewSection, true);
  }

  if (event.image) {
    imageEl.src = event.image;
    imageEl.alt = event.fullTitle;
    toggleHidden(imageFigure, false);
  } else {
    toggleHidden(imageFigure, true);
  }

  toggleHidden(mainEl, false);
  toggleHidden(emptyStateEl, true);
  statusEl.textContent = "Event ready.";
};

const initialise = async () => {
  if (!requestedSlug) {
    statusEl.textContent = "No event specified.";
    emptyStateEl.textContent =
      "We need an event link to show details. Please return to the calendar.";
    toggleHidden(emptyStateEl, false);
    return;
  }

  try {
    const response = await fetch("MSS.ics", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status} ${response.statusText}`
      );
    }

    const text = await response.text();
    const parsedEvents = parseIcs(text);
    const match = parsedEvents.find((event) => event.slug === requestedSlug);
    renderEvent(match);
  } catch (error) {
    statusEl.textContent = `Failed to load event: ${error.message}`;
    emptyStateEl.textContent =
      "We hit a snag while grabbing this event. Please try reloading or return to the event list.";
    toggleHidden(emptyStateEl, false);
    toggleHidden(mainEl, true);
  }
};

if (shareButton) {
  shareButton.addEventListener("click", handleShare);
}

initialise();
