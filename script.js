// FormSubmit emails each lead to us and sends the buyer an auto-reply.
// Swap the address for FormSubmit's private alias once it's activated.
const LEADS_URL = "https://formsubmit.co/ajax/adanmantilla@JasonMitchellgroup.com";

const LABELS = {
  budget: { under800: "Under $800K", "800-1200": "$800K to $1.2M", "1200-1800": "$1.2M to $1.8M", "1800plus": "$1.8M+" },
  timeline: { "0-3": "Next 3 months", "3-6": "3 to 6 months", "6-12": "6 to 12 months", looking: "Just looking" },
  homeType: { any: "Anything", house: "House", condo: "Condo or townhome", multi: "2 to 4 units" },
  preapproval: { preapproved: "Pre-approved", working: "Working on it", cash: "Cash", "not-started": "Not started" },
  fixer: { yes: "Yes", maybe: "Maybe, light work", no: "No, move-in ready" },
  sellFirst: { yes: "Yes", no: "No", rent: "Rents" },
  hasAgent: { yes: "Yes", no: "No" },
};

const AUTO_REPLY =
  "Thanks for setting your radius. Here's what happens next: " +
  "1) MyHomeRadius will reach out to you within the next 48 hours. " +
  "2) We'll go over what you're looking for and your timing. " +
  "3) Then we start sending you off-market homes inside your radius as they come up. " +
  "Questions before then? Call or text 415-770-0722. MyHomeRadius, powered by Believe The Process Ventures LLC.";

// Lead email rows, in the order we want to read them. FormSubmit needs the
// buyer's address under the key "email" to send the auto-reply.
const ROWS = [
  ["Name", "name"], ["Phone", "phone"], ["email", "email"],
  ["Area", "city"], ["Radius (miles)", "radius"],
  ["Price range", "budget"], ["Timeline", "timeline"], ["Financing", "preapproval"],
  ["Beds (min)", "beds"], ["Baths (min)", "baths"], ["Home type", "homeType"],
  ["Open to a home that needs work", "fixer"], ["Needs to sell first", "sellFirst"],
  ["Has an agent", "hasAgent"], ["Notes", "notes"],
];

function buildSubmission(raw) {
  const label = k => (LABELS[k] && LABELS[k][raw[k]]) || raw[k] || "";
  const d = {};
  ROWS.forEach(([title, k]) => { d[title] = label(k); });
  d["Map pin"] = raw.lat ? `https://www.google.com/maps?q=${raw.lat},${raw.lng}` : "No pin dropped";
  d["Text opt-in (info)"] = raw.smsTransactional === "yes" ? "Yes" : "No";
  d["Text opt-in (marketing)"] = raw.smsMarketing === "yes" ? "Yes" : "No";
  d._honey = raw.website || "";
  d._subject = `New MyHomeRadius lead: ${raw.name}, ${raw.city}, ${label("budget")}, ${label("timeline")}`;
  d._template = "table";
  d._autoresponse = AUTO_REPLY;
  return d;
}

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- MAP ---------- */
  const DEFAULT_CENTER = [37.4, -121.98]; // roughly Santa Clara County
  const map = L.map("map", { zoomControl: true, scrollWheelZoom: false }).setView(DEFAULT_CENTER, 9);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  const radiusInput = document.getElementById("radiusRange");
  const radiusValueLabel = document.getElementById("radiusValue");
  const mapHint = document.getElementById("mapHint");
  const radiusSummary = document.getElementById("radiusSummary");
  const fLat = document.getElementById("fLat");
  const fLng = document.getElementById("fLng");
  const fRadius = document.getElementById("fRadius");

  let centerPoint = null;
  let radiusCircle = null;
  let centerMarker = null;

  function milesToMeters(mi) {
    return mi * 1609.34;
  }

  // Keep the form in sync with whatever the visitor set on the map
  function syncForm() {
    const mi = Number(radiusInput.value);
    fRadius.value = mi;
    if (!centerPoint) return;
    fLat.value = centerPoint.lat.toFixed(5);
    fLng.value = centerPoint.lng.toFixed(5);
    radiusSummary.innerHTML = `Your radius: <strong>${mi} miles</strong> around the pin you dropped. <a href="#map-card">Change it</a>`;
    mapHint.innerHTML = `Radius set. <a href="#radius-form">Tell us what you're looking for →</a>`;
  }

  function drawCircle() {
    if (radiusCircle) map.removeLayer(radiusCircle);
    radiusCircle = L.circle(centerPoint, {
      radius: milesToMeters(Number(radiusInput.value)),
      color: "#235D72",
      weight: 1.5,
      fillColor: "#235D72",
      fillOpacity: 0.07,
    }).addTo(map);
    map.fitBounds(radiusCircle.getBounds(), { padding: [24, 24] });
  }

  function setCenter(latlng) {
    centerPoint = latlng;
    if (centerMarker) map.removeLayer(centerMarker);
    centerMarker = L.marker(latlng).addTo(map);
    drawCircle();
    syncForm();
  }

  map.on("click", e => setCenter(e.latlng));

  radiusInput.addEventListener("input", () => {
    radiusValueLabel.textContent = `${radiusInput.value} mi`;
    if (centerPoint) drawCircle();
    syncForm();
  });

  // Phase 2: live for-sale listings inside the radius plug in here once a
  // listings feed is chosen (Repliers was ruled out on cost).

  /* ---------- FORM ---------- */
  const form = document.getElementById("radiusForm");
  const formNote = document.getElementById("formNote");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Setting your radius…";

    try {
      const res = await fetch(LEADS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(buildSubmission(data)),
      });
      const out = await res.json();
      if (String(out.success) !== "true") throw new Error(out.message || "not sent");

      form.style.display = "none";
      formNote.textContent = "Got it. Check your email for next steps. We'll reach out within 48 hours.";
      formNote.classList.add("form-note-success");
    } catch (err) {
      console.error("Lead submission failed:", err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Set my radius";
      formNote.textContent = "Something went wrong sending that. Please try again, or call/text (415) 770-0722.";
      formNote.classList.add("form-note-error");
    }
  });
});
