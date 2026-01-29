/**
 * VOLUNTEER CALL APP - LOGIC
 * Core logic for fetching contacts, tracking calls, and managing UI state.
 */

// ================= CONSTANTS & CONFIG =================
const CONFIG = {
    CONTACTS_PER_VOLUNTEER: 100,
    // If running locally (file://), use a proxy to bypass CORS errors. Otherwise use direct link.
    SHEET_CSV_URL: window.location.protocol === 'file:'
        ? "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://docs.google.com/spreadsheets/d/1QXUuzeAkqEUhul7Cpmz1kowOkrjh530VvCZqfWrCSUI/export?format=csv&gid=0")
        : "https://docs.google.com/spreadsheets/d/1QXUuzeAkqEUhul7Cpmz1kowOkrjh530VvCZqfWrCSUI/export?format=csv&gid=0",
    TRACKING_URL: "https://script.google.com/macros/s/AKfycby_497bE4f96xxoSxG5-iOxHqNHYR9xb0N25WpLArn4bwl37Wnp1tdzsh78u2T4j49Y8w/exec",
    MESSAGE_TEMPLATE: `
प्रणाम 🙏
हम विक्रम कृपा परिवार से बात कर रहे है।

✨ गुरुदेव आचार्य भगवंत यशोवर्मसुरीजी की गच्छाधिपति पदवी सुरत में तारीख २२.२.२६ को है।

यह पदवी ६ गच्छाधिपति, ३६ आचार्य भगवंत, १००० से अधिक साधु साध्वीजी की उपस्थिति में होगी।
📅 यह महोत्सव २०-२२ फ़रवरी तीन दिनों का है।
📚 १०८ ग्रंथों का विमोचन और बहुत सारे शुभ मंगल कार्यों साथ में होंगे।

यह ऐतिहासिक कार्यक्रम में आप सब सहपरिवार पधारना है।
धन्यवाद।
`.trim()
};

const VOLUNTEER_MAP = {
    volunteer1: 0,
    volunteer2: 1,
    volunteer3: 2,
    volunteer4: 3,
    volunteer5: 4,
    volunteer6: 5,
    volunteer7: 6,
    volunteer8: 7,
    volunteer9: 8,
    volunteer10: 9,
    volunteer11: 10,
    volunteer12: 11,
    volunteer13: 12,
    volunteer14: 13,
    volunteer15: 14,
    volunteer16: 15,
    volunteer17: 16
};

// ================= STATE =================
const State = {
    volunteerKey: "",
    volunteerIndex: -1,
    contacts: [],
    callsCompleted: 0
};

// ================= DOM ELEMENTS =================
const UI = {
    volName: document.getElementById("vol-name"),
    volInitial: document.getElementById("vol-initial"),
    volRange: document.getElementById("vol-range"),
    progressFill: document.getElementById("progress-fill"),
    progressText: document.getElementById("progress-text"),
    contactList: document.getElementById("contact-list"),
    scriptHeader: document.getElementById("script-header"),
    scriptContent: document.getElementById("script-content"),
    scriptArrow: document.getElementById("script-arrow"),
    toast: document.getElementById("toast")
};

// ================= INIT =================
function init() {
    // 1. Get Volunteer from URL
    const params = new URLSearchParams(window.location.search);
    const vKey = (params.get("v") || "").toLowerCase();

    if (!VOLUNTEER_MAP.hasOwnProperty(vKey)) {
        renderError("Volunteer not found. Please check your link.");
        return;
    }

    State.volunteerKey = vKey;
    State.volunteerIndex = VOLUNTEER_MAP[vKey];

    // 2. Setup UI
    setupVolunteerInfo();
    setupScriptAccordion();

    // 3. Load Data
    fetchContacts();
}

// ================= CORE LOGIC =================

function setupVolunteerInfo() {
    const start = State.volunteerIndex * CONFIG.CONTACTS_PER_VOLUNTEER + 1;
    const end = start + CONFIG.CONTACTS_PER_VOLUNTEER - 1;

    UI.volName.textContent = State.volunteerKey.toUpperCase();
    UI.volInitial.textContent = State.volunteerKey.charAt(0).toUpperCase();
    UI.volRange.textContent = `Contacts ${start} - ${end}`;
}

function setupScriptAccordion() {
    UI.scriptHeader.addEventListener("click", () => {
        const isOpen = UI.scriptContent.classList.contains("open");
        if (isOpen) {
            UI.scriptContent.classList.remove("open");
            UI.scriptArrow.style.transform = "rotate(0deg)";
        } else {
            UI.scriptContent.classList.add("open");
            UI.scriptArrow.style.transform = "rotate(180deg)";
        }
    });
}

function fetchContacts() {
    renderLoading(true);

    fetch(CONFIG.SHEET_CSV_URL)
        .then(res => res.text())
        .then(csvText => {
            const rows = parseCSV(csvText);
            const start = State.volunteerIndex * CONFIG.CONTACTS_PER_VOLUNTEER;
            const end = start + CONFIG.CONTACTS_PER_VOLUNTEER;

            // Filter and simple parse
            State.contacts = rows.slice(start, end).map((row, i) => {
                const [name, rawPhone] = row.split(",");
                if (!name || !rawPhone) return null;

                const phone = rawPhone.replace(/\D/g, "");
                return {
                    id: start + i + 1,
                    name: name.trim(),
                    phone: phone,
                    isCalled: localStorage.getItem(`called_${State.volunteerKey}_${phone}`) === "true"
                };
            }).filter(Boolean); // remove nulls

            renderContacts();
            updateProgress();
            renderLoading(false);
        })
        .catch(err => {
            console.error(err);
            renderError("Failed to load contacts. Pull to refresh.");
        });
}

function parseCSV(text) {
    // Simple CSV parser assuming no commas in values
    // detailed implementations would use a library, but this is simple enough for names/phones
    return text.split("\n").slice(1).filter(r => r.trim());
}

function updateProgress() {
    const total = State.contacts.length;
    const done = State.contacts.filter(c => c.isCalled).length;
    State.callsCompleted = done;

    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    UI.progressFill.style.width = `${percent}%`;
    UI.progressText.textContent = `${done} / ${total}`;
}

// ================= RENDERING =================

function renderLoading(isLoading) {
    if (isLoading) {
        UI.contactList.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading contacts...</p></div>`;
    }
}

function renderError(msg) {
    UI.contactList.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>${msg}</p></div>`;
}

function renderContacts() {
    UI.contactList.innerHTML = "";

    if (State.contacts.length === 0) {
        UI.contactList.innerHTML = `<div class="empty-state"><p>No contacts assigned.</p></div>`;
        return;
    }

    State.contacts.forEach(contact => {
        const card = document.createElement("div");
        card.className = `contact-card ${contact.isCalled ? "called" : ""} fade-in`;
        card.id = `card-${contact.phone}`;

        // Status text
        const statusText = contact.isCalled ?
            `<span class="contact-status"><i class="fas fa-check"></i> DONE</span>` :
            `<span class="contact-status"><i class="far fa-circle"></i> PENDING</span>`;

        // WhatsApp Link
        const waLink = `https://api.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent(CONFIG.MESSAGE_TEMPLATE)}`;

        // Ensure +91 for dialer to be robust
        const dialNumber = contact.phone.length === 10 ? `+91${contact.phone}` : contact.phone;

        card.innerHTML = `
      <div class="contact-main">
        <div class="contact-header">
          <span class="serial-badge">#${contact.id}</span>
          ${statusText}
        </div>
        <div class="contact-name">${contact.name}</div>
        <div style="font-size:0.9rem; color:#666;">${formatPhone(contact.phone)}</div>
      </div>
      
      <div class="contact-actions">
        <a href="tel:${dialNumber}" class="action-btn btn-call" onclick="handleCall('${contact.phone}', '${contact.name}')">
          <i class="fas fa-phone-alt"></i> Call
        </a>
        <a href="${waLink}" target="_blank" class="action-btn btn-wa">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
      </div>
    `;

        UI.contactList.appendChild(card);
    });
}

function formatPhone(phone) {
    if (phone.length === 10) return `+91 ${phone.substring(0, 5)} ${phone.substring(5)}`;
    return phone;
}

// ================= ACTIONS =================

window.handleCall = function (phone, name) {
    // 1. Mark as called locally
    localStorage.setItem(`called_${State.volunteerKey}_${phone}`, "true");

    // 2. Update State
    const contact = State.contacts.find(c => c.phone === phone);
    if (contact && !contact.isCalled) {
        contact.isCalled = true;
        updateProgress();

        // 3. Update UI Card immediately (optimistic UI)
        const card = document.getElementById(`card-${phone}`);
        if (card) {
            card.classList.add("called");
            const statusEl = card.querySelector(".contact-status");
            statusEl.innerHTML = `<i class="fas fa-check"></i> DONE`;
            statusEl.parentElement.innerHTML = `<span class="serial-badge">#${contact.id}</span> ${statusEl.outerHTML}`; // hacky re-render
        }

        showToast("Call marked as completed ✔");

        // 4. Send Tracking (Fire and forget)
        sendTracking(name, phone);
    }
};

window.copyScript = function () {
    const range = document.createRange();
    range.selectNode(document.getElementById("script-text"));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    showToast("Script copied to clipboard!");
}

function sendTracking(name, phone) {
    fetch(CONFIG.TRACKING_URL, {
        method: "POST",
        mode: 'no-cors', // Important for Google Script
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            volunteer: State.volunteerKey,
            name,
            phone,
            status: "called",
            timestamp: new Date().toISOString()
        })
    }).catch(e => console.log("Tracking error (ignored)", e));
}

function showToast(msg) {
    UI.toast.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
    UI.toast.classList.add("show");
    setTimeout(() => {
        UI.toast.classList.remove("show");
    }, 3000);
}

// Start App
document.addEventListener("DOMContentLoaded", init);
