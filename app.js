/**
 * VOLUNTEER CALL APP - LOGIC
 * Core logic for fetching contacts, tracking calls, and managing UI state.
 */

// ================= CONSTANTS & CONFIG =================
const CONFIG = {
    CONTACTS_PER_VOLUNTEER: 100,
    // If running locally (file://), use a proxy to bypass CORS errors. Otherwise use direct link.
    SHEET_CSV_URL: window.location.protocol === 'file:'
        ? "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://docs.google.com/spreadsheets/d/1QXUuzeAkqEUhul7Cpmz1kowOkrjh530VvCZqfWrCSUI/export?format=csv&gid=1776207677")
        : "https://docs.google.com/spreadsheets/d/1QXUuzeAkqEUhul7Cpmz1kowOkrjh530VvCZqfWrCSUI/export?format=csv&gid=1776207677",
    TRACKING_URL: "https://script.google.com/macros/s/AKfycby_497bE4f96xxoSxG5-iOxHqNHYR9xb0N25WpLArn4bwl37Wnp1tdzsh78u2T4j49Y8w/exec",
    MESSAGE_TEMPLATE: `
!!श्री श्रैयांशनाथ नम:!!
श्री प्रेम भुवनभानु पभ-जयघोष-राजेंद्र-हेमचंदसुरी- सदगुरुभ्यो नमः 

श्री नवी मुंबई विहार~सेवा गुप्र प्रथम महा-सम्मेलन नरूल नगरे-2026 

               पावन निश्रा🙌 
प्रवचन प्रभावक:-परम पुज्य आचार्य भंगवत श्रीमद् विजय अक्षयबोधि सुरिश्वरजी महाराजा साहेबजी 
प्रवचन शिखर विहार~सेवा प्रेरणादाता:-परम पुज्य आचार्य भगवंत श्रीमद् विजय महाबोधि सुरिश्वरजी महाराजा साहेबजी 

शासन~सेवा~प्रेमीयो का महाकुंभ नरूल नगरे....
15/03/2026 रविवार

            विषेश आकर्षण
१ नवी मुंबई का एक मात्र श्रैयांश भगवान का भव्य -जिनलाय नेरुल नगरे 
२ नवी मुंबई विहार~सेवा गुप्र का प्रथम महा सम्मेलन नेरुल नगरे
३ 15 से ज्यादा विहार-सेवा गुप्रो का महाकुंभ नेरूल नगरे
४ कई विरले विहार सेवकों एवं सेविकाओं की गुरु~भक्ति नेरुल नगरे
५ नवी मुंबई को औल इंडिया विहार~सेवा गुप्र द्बारा सम्मानित ट्रॉफी को सब गुप्रो के साथ प्रवेश
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
    siddharth: 10,
    parv: 11,
    keval: 12,
    n1: 13,
    n2: 14,
    n3: 15,
    n4: 16,
    n5: 17,
    n6: 18,
    n7: 19,
    n8: 20,
    n9: 21,
    n10: 22,
    n11: 23,
    n12: 24,
    n13: 25,
    n14: 26,
    n15: 27,
    n16: 28,
    n17: 29,
    n18: 30,
    n19: 31,
    n20: 32
};

const SAMPLE_CONTACTS = [
    { id: 1, name: "Pakshal Jain", phone: "8591911797" },
    { id: 2, name: "Mamta Bhandari", phone: "9819037174" },
    { id: 3, name: "Tanu Jain", phone: "9833399129" },
    { id: 4, name: "Rashmita Jain", phone: "9833390144" },
    { id: 5, name: "Maulik Kumar", phone: "8000133016" },
    { id: 6, name: "Rinku Jain", phone: "9619886777" },
    { id: 7, name: "Alpesh Shah", phone: "9324503214" },
    { id: 8, name: "Vijay Mehta", phone: "9930108172" },
    { id: 9, name: "Ashika Jain", phone: "9769719294" },
    { id: 10, name: "Silvi Jain", phone: "9619886777" },
    { id: 11, name: "Nisha Kothari", phone: "9769235421" },
    { id: 12, name: "Shilpa Mutha", phone: "9821321010" },
    { id: 13, name: "Rakhi Sonigara", phone: "9326903020" },
    { id: 14, name: "Kavita Mutha", phone: "9324007931" },
    { id: 15, name: "Amit Singhi", phone: "9820537874" },
    { id: 16, name: "Anil Munoth", phone: "7387513559" },
    { id: 17, name: "Dhiraj Jain", phone: "9833017806" },
    { id: 18, name: "Dilip Jain", phone: "9594688425" },
    { id: 19, name: "Dinesh Kothari", phone: "8097604229" },
    { id: 20, name: "Manish Gundecha", phone: "9819580002" },
    { id: 21, name: "Mohan Jain", phone: "9930824089" },
    { id: 22, name: "Sanjay Gujarathi", phone: "9869501902" },
    { id: 23, name: "Suparas Jain", phone: "9819012815" },
    { id: 24, name: "Nitesh Jain", phone: "9820463003" }
];

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

    // If the page is opened locally or if the sheet proxy is unavailable,
    // use a static sample contact list so the volunteer view still renders.
    if (window.location.protocol === 'file:') {
        State.contacts = SAMPLE_CONTACTS.map(contact => ({
            ...contact,
            isCalled: localStorage.getItem(`called_${State.volunteerKey}_${contact.phone}`) === "true"
        }));

        renderContacts();
        updateProgress();
        renderLoading(false);
        return;
    }

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
