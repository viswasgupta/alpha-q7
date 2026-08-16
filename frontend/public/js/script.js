"use strict";

/* =========================================================
   ALPHA Q7 TRADING INSTITUTE
   MAIN WEBSITE JAVASCRIPT
========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const SITE_KEY =
    "alpha_q7_site";

const COURSES_KEY =
    "alpha_q7_courses";

const LEARN_KEY =
    "alpha_q7_learn";

const TESTIMONIALS_KEY =
    "alpha_q7_testimonials";

const FAQ_KEY =
    "alpha_q7_faq";

const LEADS_KEY =
    "alpha_q7_leads";


/* =========================================================
   WHATSAPP
========================================================= */

const DEFAULT_WHATSAPP =
    "917353228777";


/* =========================================================
   LIVE SYNC
========================================================= */

const SYNC_KEYS = [

    SITE_KEY,

    COURSES_KEY,

    LEARN_KEY,

    TESTIMONIALS_KEY,

    FAQ_KEY,

    LEADS_KEY,

    "alphaQ7FooterSettings"

];


const alphaQ7Channel =
    "BroadcastChannel" in window
        ? new BroadcastChannel(
            "alpha-q7-live-sync"
        )
        : null;


/* =========================================================
   DOM HELPERS
========================================================= */

function $(selector) {

    return document.querySelector(
        selector
    );

}


function $$(selector) {

    return [
        ...document.querySelectorAll(
            selector
        )
    ];

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadJSON(
    key,
    fallback
) {

    try {

        const value =
            localStorage.getItem(
                key
            );

        if (!value) {

            localStorage.setItem(
                key,
                JSON.stringify(
                    fallback
                )
            );

            return fallback;

        }

        return JSON.parse(
            value
        );

    } catch (error) {

        console.error(
            "Alpha Q7 storage error:",
            error
        );

        return fallback;

    }

}


function saveJSON(
    key,
    value
) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(
                value
            )
        );

        broadcastUpdate(
            key
        );

    } catch (error) {

        console.error(
            "Alpha Q7 save error:",
            error
        );

    }

}


function broadcastUpdate(key) {

    if (!alphaQ7Channel) {

        return;

    }

    alphaQ7Channel.postMessage({

        type:
            "ALPHA_Q7_DATA_UPDATED",

        key:
            key,

        time:
            Date.now()

    });

}


/* =========================================================
   DEFAULT SITE DATA
========================================================= */

const DEFAULT_SITE = {

    heroDescription:
        "Learn Forex, Commodities and Crypto Trading through structured education, practical market analysis and disciplined risk management.",

    aboutDescription:
        "Alpha Q7 focuses on practical market education, technical analysis, risk management and trading psychology.",

    whatsapp:
        DEFAULT_WHATSAPP,

    phoneDisplay:
        "+91 73532 28777",

    address:
        "22, 1st Floor, 1st Cross, Bannerghatta Rd, Bilekahalli, Bengaluru, Karnataka 560076",

    students:
        "10,000+",

    mentors:
        "50+",

    hours:
        "500+",

    satisfaction:
        "95%"

};


/* =========================================================
   DEFAULT COURSES
========================================================= */

const DEFAULT_COURSES = [

    {

        id:
            "forex",

        icon:
            "$",

        title:
            "Forex",

        subtitle:
            "Foreign Exchange Trading",

        whatIs:
            "Forex is the global marketplace where currencies are bought and sold.",

        howWorks:
            "Learn currency pairs, market structure, technical analysis, trading setups and disciplined risk management.",

        benefits: [

            "Understand currency pairs",

            "Learn technical analysis",

            "Build structured setups",

            "Understand market trends",

            "Learn position sizing",

            "Study risk management"

        ],

        whoCan: [

            "Beginners",

            "Working professionals",

            "Students",

            "Anyone interested in currency markets"

        ]

    },


    {

        id:
            "commodities",

        icon:
            "◉",

        title:
            "Commodities",

        subtitle:
            "Gold, Oil, Silver & More",

        whatIs:
            "Commodity trading focuses on markets connected to assets such as Gold, Silver and Crude Oil.",

        howWorks:
            "Learn commodity structure, technical analysis, economic catalysts and risk management.",

        benefits: [

            "Understand Gold",

            "Study Silver",

            "Understand Crude Oil",

            "Learn commodity trends",

            "Study market catalysts",

            "Build disciplined setups"

        ],

        whoCan: [

            "Beginners",

            "Commodity learners",

            "Professionals",

            "Students interested in markets"

        ]

    },


    {

        id:
            "crypto",

        icon:
            "₿",

        title:
            "Crypto",

        subtitle:
            "Cryptocurrency Trading",

        whatIs:
            "Crypto trading involves buying and selling digital assets such as Bitcoin and other cryptocurrencies.",

        howWorks:
            "Learn crypto market structure, volatility, technical analysis, trends and disciplined risk management.",

        benefits: [

            "Understand crypto markets",

            "Learn Bitcoin basics",

            "Study volatility",

            "Understand technical setups",

            "Learn risk management",

            "Build disciplined habits"

        ],

        whoCan: [

            "Crypto beginners",

            "Existing traders",

            "Fintech students",

            "Digital asset learners"

        ]

    }

];


/* =========================================================
   DEFAULT LEARNING SUBJECTS
========================================================= */

const DEFAULT_LEARN = [

    {

        id:
            "learn-1",

        title:
            "Market Structure",

        text:
            "Understand trends, swing highs, swing lows, support and resistance."

    },

    {

        id:
            "learn-2",

        title:
            "Technical Analysis",

        text:
            "Study candles, patterns, indicators, momentum and price action."

    },

    {

        id:
            "learn-3",

        title:
            "Risk Management",

        text:
            "Learn position sizing, risk per trade, stops and target planning."

    },

    {

        id:
            "learn-4",

        title:
            "Trading Psychology",

        text:
            "Build discipline, patience, emotional control and consistency."

    },

    {

        id:
            "learn-5",

        title:
            "Fundamental Analysis",

        text:
            "Understand economic events and macro factors that can influence markets."

    },

    {

        id:
            "learn-6",

        title:
            "Trading Plan",

        text:
            "Create a repeatable process with rules for entries, exits and review."

    },

    {

        id:
            "learn-7",

        title:
            "Multi-Timeframe Analysis",

        text:
            "Learn to combine higher and lower timeframes for stronger market context."

    },

    {

        id:
            "learn-8",

        title:
            "Trade Journaling",

        text:
            "Track decisions, setups, mistakes and performance over time."

    },

    {

        id:
            "learn-9",

        title:
            "Market Sessions",

        text:
            "Understand major market sessions, liquidity and market timing."

    }

];


/* =========================================================
   DEFAULT TESTIMONIALS
========================================================= */

const DEFAULT_TESTIMONIALS = [

    {

        id:
            "testimonial-1",

        stars:
            "★★★★★",

        text:
            "Alpha Q7 helped me understand market structure and trading discipline.",

        name:
            "Rahul Verma",

        role:
            "Forex Trader"

    },

    {

        id:
            "testimonial-2",

        stars:
            "★★★★★",

        text:
            "The risk management sessions were extremely useful for me.",

        name:
            "Priya Shah",

        role:
            "Commodity Trader"

    },

    {

        id:
            "testimonial-3",

        stars:
            "★★★★★",

        text:
            "The course gave me a structured understanding of crypto markets.",

        name:
            "Arjun Mehta",

        role:
            "Crypto Trader"

    }

];


/* =========================================================
   DEFAULT FAQ
========================================================= */

const DEFAULT_FAQ = [

    {

        id:
            "faq-1",

        question:
            "Is the masterclass free?",

        answer:
            "Yes. The introductory Alpha Q7 masterclass is free."

    },

    {

        id:
            "faq-2",

        question:
            "Do beginners need experience?",

        answer:
            "No. Beginners can start from the fundamentals."

    },

    {

        id:
            "faq-3",

        question:
            "What markets do you teach?",

        answer:
            "Forex, Commodities, Crypto, Technical Analysis, Risk Management and Trading Psychology."

    },

    {

        id:
            "faq-4",

        question:
            "Is trading risk-free?",

        answer:
            "No. Financial markets involve risk and returns are never guaranteed."

    }

];


/* =========================================================
   DEFAULT WHY ALPHA Q7
========================================================= */

const DEFAULT_WHY_ALPHA = {
    eyebrow: "WHY ALPHA Q7",
    title: "Why You Should Choose Alpha Q7",
    subtitle: "",
    journey: "Learn → Practice → Analyze → Improve",
    description: "At Alpha Q7, our goal is not to make you dependent on calls or tips. We help you develop the knowledge, discipline, strategy and risk-management skills needed to make informed trading decisions.",
    highlights: [
        { id: "highlight-1", title: "Practical, Market-Focused Learning", text: "Learn through practical market concepts, analysis and real trading situations." },
        { id: "highlight-2", title: "Learn to Analyze the Market Yourself", text: "Build the knowledge and confidence to understand charts, market structure and opportunities independently." },
        { id: "highlight-3", title: "Strategy & Risk Management", text: "Develop disciplined trading strategies while learning responsible risk management and capital protection." },
        { id: "highlight-4", title: "Real-Market Experience & Community Support", text: "Learn from real-market examples, experienced guidance and an ongoing learning community that helps you grow with confidence." }
    ],
    cta: ""
};

/* =========================================================
   GET DATA
========================================================= */

let PUBLIC_CONTENT = null;

async function fetchPublicContent() {
    try {
        const response = await fetch(
            "/api/content/public",
            {
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("Website content API unavailable");
        }

        PUBLIC_CONTENT =
            await response.json();

        return PUBLIC_CONTENT;
    } catch (error) {
        console.warn(
            "Using local website content fallback:",
            error
        );

        // Keep the public site fully renderable even when the CMS API is
        // temporarily unavailable. Admin persistence still uses the API.
        PUBLIC_CONTENT = {
            site: {
                ...DEFAULT_SITE,
                whyAlpha: structuredClone(DEFAULT_WHY_ALPHA)
            },
            courses: loadJSON(COURSES_KEY, DEFAULT_COURSES),
            learn: loadJSON(LEARN_KEY, DEFAULT_LEARN),
            testimonials: loadJSON(TESTIMONIALS_KEY, DEFAULT_TESTIMONIALS),
            faq: loadJSON(FAQ_KEY, DEFAULT_FAQ)
        };

        return PUBLIC_CONTENT;
    }
}

function getNestedValue(
    object,
    path
) {
    return path
        .split(".")
        .reduce(
            (value, key) =>
                value?.[key],
            object
        );
}

function renderEditableContent() {
    if (!PUBLIC_CONTENT) {
        return;
    }

    document
        .querySelectorAll(
            "[data-content]"
        )
        .forEach(
            element => {
                const value =
                    getNestedValue(
                        PUBLIC_CONTENT.site,
                        element.dataset.content
                    );

                if (
                    value === undefined ||
                    value === null
                ) {
                    return;
                }

                if (
                    element.tagName === "INPUT" ||
                    element.tagName === "TEXTAREA"
                ) {
                    element.value =
                        String(value);
                } else {
                    element.textContent =
                        String(value);
                }
            }
        );

    renderAboutCards();
    renderAnalysisCards();
    renderWhyAlpha();
}

function renderWhyAlpha() {
    const container = $("#whyAlphaContainer");
    const section = PUBLIC_CONTENT?.site?.whyAlpha;

    if (!container || !section) return;

    container.replaceChildren();

    const heading = document.createElement("div");
    heading.className = "why-alpha-heading";

    const eyebrow = document.createElement("span");
    eyebrow.className = "why-alpha-eyebrow";
    eyebrow.textContent = section.eyebrow || "WHY ALPHA Q7";

    const title = document.createElement("h2");
    title.textContent = section.title || "Why You Should Choose Alpha Q7";

    heading.append(eyebrow, title);

    const box = document.createElement("div");
    box.className = "why-alpha-box";

    const journey = document.createElement("div");
    journey.className = "why-alpha-journey";
    journey.textContent = section.journey || "Learn → Practice → Analyze → Improve";

    const description = document.createElement("p");
    description.className = "why-alpha-description";
    description.textContent = section.description || "At Alpha Q7, our goal is to help you develop the knowledge, discipline, strategy and risk-management skills needed to make informed trading decisions.";

    box.append(journey, description);

    const points = Array.isArray(section.highlights) ? section.highlights : [];

    points.forEach((point, index) => {
        const item = document.createElement("article");
        item.className = "why-alpha-point";

        const titleEl = document.createElement("h4");
        titleEl.textContent = point.title || point.text || `Alpha Q7 Advantage ${index + 1}`;

        const textEl = document.createElement("p");
        textEl.textContent = point.text || "";

        item.append(titleEl, textEl);
        box.appendChild(item);
    });

    if (section.cta) {
        const cta = document.createElement("p");
        cta.className = "why-alpha-cta";
        cta.textContent = section.cta;
        box.appendChild(cta);
    }

    container.append(heading, box);
}

function renderAboutCards() {
    const container =
        $("#aboutCards");

    const cards =
        PUBLIC_CONTENT?.site?.about?.cards;

    if (!container || !Array.isArray(cards)) {
        return;
    }

    container.innerHTML = "";

    cards.forEach(
        card => {
            const article =
                document.createElement("article");

            article.className =
                "about-card";

            article.innerHTML = `
                <span class="about-number">
                    ${escapeHtml(card.number)}
                </span>

                <h3>
                    ${escapeHtml(card.title)}
                </h3>

                <p>
                    ${escapeHtml(card.text)}
                </p>
            `;

            container.appendChild(article);
        }
    );
}

function renderAnalysisCards() {
    const container =
        $("#analysisCards");

    const cards =
        PUBLIC_CONTENT?.site?.analysis?.cards;

    if (!container || !Array.isArray(cards)) {
        return;
    }

    container.innerHTML = "";

    cards.forEach(
        card => {
            const article =
                document.createElement("div");

            article.className =
                "analysis-card";

            article.innerHTML = `
                <span>
                    ${escapeHtml(card.number)}
                </span>

                <h3>
                    ${escapeHtml(card.title)}
                </h3>

                <p>
                    ${escapeHtml(card.text)}
                </p>
            `;

            container.appendChild(article);
        }
    );
}

function getSite() {
    if (PUBLIC_CONTENT?.site) {
        return PUBLIC_CONTENT.site;
    }

    return loadJSON(
        SITE_KEY,
        DEFAULT_SITE
    );
}


function getCourses() {
    if (PUBLIC_CONTENT?.courses) {
        return PUBLIC_CONTENT.courses;
    }

    return loadJSON(
        COURSES_KEY,
        DEFAULT_COURSES
    );
}


function getLearn() {
    if (PUBLIC_CONTENT?.learn) {
        return PUBLIC_CONTENT.learn;
    }

    return loadJSON(
        LEARN_KEY,
        DEFAULT_LEARN
    );
}


function getTestimonials() {
    if (PUBLIC_CONTENT?.testimonials) {
        return PUBLIC_CONTENT.testimonials;
    }

    return loadJSON(
        TESTIMONIALS_KEY,
        DEFAULT_TESTIMONIALS
    );
}


function getFAQ() {
    if (PUBLIC_CONTENT?.faq) {
        return PUBLIC_CONTENT.faq;
    }

    return loadJSON(
        FAQ_KEY,
        DEFAULT_FAQ
    );
}


function getLeads() {

    return loadJSON(
        LEADS_KEY,
        []
    );

}


/* =========================================================
   TOAST
========================================================= */

function toast(message) {

    const element =
        $("#toast");

    if (!element) {

        alert(message);

        return;

    }

    element.textContent =
        message;

    element.classList.add(
        "show"
    );

    clearTimeout(
        window.alphaQ7ToastTimer
    );

    window.alphaQ7ToastTimer =
        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   RENDER WEBSITE SETTINGS
========================================================= */

function renderSite() {

    renderEditableContent();

    // ENROLL NOW is a fixed public-facing label. Do not let legacy
    // CMS values such as "FREE MASTERCLASS" overwrite it after load.
    const enrollmentTitle = document.querySelector("#masterclass .masterclass-heading h2");
    const enrollmentSubtitle = document.querySelector("#masterclass .masterclass-heading p");
    if (enrollmentTitle) enrollmentTitle.textContent = "ENROLL NOW";
    if (enrollmentSubtitle) enrollmentSubtitle.textContent = "Start your trading journey with Alpha Q7.";

    const site =
        getSite();


    const hero =
        $("#heroDescription");

    if (hero) {

        hero.textContent = site.hero?.description ?? site.heroDescription ?? "";

    }


    const about =
        $("#aboutDescription");

    if (about) {

        about.textContent = site.about?.description ?? site.aboutDescription ?? "";

    }


    const publicWhatsapp =
        $("#publicWhatsapp");

    if (publicWhatsapp) {

        const contact = site.footer?.contact || site;
        const whatsappNumber = contact.whatsapp || site.whatsapp || DEFAULT_WHATSAPP;
        publicWhatsapp.textContent = contact.phone || site.phoneDisplay || `+${whatsappNumber}`;

        publicWhatsapp.href =
            `https://wa.me/${whatsappNumber}`;

    }


    const contactWhatsapp =
        $("#contactWhatsappButton");

    if (contactWhatsapp) {

        contactWhatsapp.href =
            `https://wa.me/${site.footer?.contact?.whatsapp || site.whatsapp || DEFAULT_WHATSAPP}`;

    }


    const publicAddress =
        $("#publicAddress");

    if (publicAddress) {

        publicAddress.textContent =
            site.footer?.contact?.address || site.address || "";

    }


    const statStudents =
        $("#statStudents");

    if (statStudents) {
        statStudents.textContent = site.stats?.students?.value ?? site.students;
        const label = statStudents.parentElement?.querySelector("span");
        if (label) label.textContent = site.stats?.students?.label ?? label.textContent;

    }


    const statMentors =
        $("#statMentors");

    if (statMentors) {
        statMentors.textContent = site.stats?.mentors?.value ?? site.mentors;
        const label = statMentors.parentElement?.querySelector("span");
        if (label) label.textContent = site.stats?.mentors?.label ?? label.textContent;

    }


    const statHours =
        $("#statHours");

    if (statHours) {
        statHours.textContent = site.stats?.hours?.value ?? site.hours;
        const label = statHours.parentElement?.querySelector("span");
        if (label) label.textContent = site.stats?.hours?.label ?? label.textContent;

    }


    const statSatisfaction =
        $("#statSatisfaction");

    if (statSatisfaction) {
        statSatisfaction.textContent = site.stats?.satisfaction?.value ?? site.satisfaction;
        const label = statSatisfaction.parentElement?.querySelector("span");
        if (label) label.textContent = site.stats?.satisfaction?.label ?? label.textContent;

    }


    renderCourses();

    renderLearn();

    renderTestimonials();

    renderFAQ();

}


/* =========================================================
   RENDER COURSES
========================================================= */

function renderCourses() {

    const container =
        $("#courseAccordion");

    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    getCourses()
        .forEach(
            course => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "course-card";


                card.innerHTML = `

                    <div class="course-summary">

                        <div class="course-icon">

                            ${escapeHtml(
                                course.icon
                            )}

                        </div>


                        <div>

                            <h3 class="course-title">

                                ${escapeHtml(
                                    course.title
                                )}

                            </h3>


                            <p class="course-subtitle">

                                ${escapeHtml(
                                    course.subtitle
                                )}

                            </p>

                        </div>


                        <button
                            type="button"
                            class="course-toggle"
                            aria-label="Open course"
                        >
                            ↓
                        </button>

                    </div>


                    <div class="course-details">

                        <div class="course-details-inner">

                            <div class="course-detail-block">

                                <h4>
                                    WHAT IS
                                    ${escapeHtml(
                                        course.title
                                    ).toUpperCase()}?
                                </h4>

                                <p>
                                    ${escapeHtml(
                                        course.whatIs
                                    )}
                                </p>

                            </div>


                            <div class="course-detail-block">

                                <h4>
                                    WHAT YOU WILL LEARN?
                                </h4>

                                <p>
                                    ${escapeHtml(
                                        course.howWorks
                                    )}
                                </p>

                            </div>


                            <div class="course-detail-block">

                                <h4>
                                    WHY IT'S BENEFICIAL
                                </h4>

                                <div class="course-benefits-grid">

                                    ${
                                        (
                                            course.benefits ||
                                            []
                                        )
                                        .map(
                                            benefit => `

                                                <div class="course-benefit">

                                                    ${escapeHtml(
                                                        benefit
                                                    )}

                                                </div>

                                            `
                                        )
                                        .join("")
                                    }

                                </div>

                            </div>


                            <div class="course-detail-block">

                                <h4>
                                    WHO CAN DO IT?
                                </h4>

                                <p>

                                    ${
                                        (
                                            course.whoCan ||
                                            []
                                        )
                                        .map(
                                            person =>
                                                escapeHtml(
                                                    person
                                                )
                                        )
                                        .join(
                                            " • "
                                        )
                                    }

                                </p>

                            </div>

                        </div>

                    </div>

                `;


                container.appendChild(
                    card
                );


                const summary =
                    card.querySelector(
                        ".course-summary"
                    );


                summary?.addEventListener(
                    "click",
                    () => {

                        const alreadyOpen =
                            card.classList.contains(
                                "open"
                            );


                        $$(".course-card")
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "open"
                                    );

                                }
                            );


                        if (
                            !alreadyOpen
                        ) {

                            card.classList.add(
                                "open"
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   RENDER WHAT YOU'LL LEARN
========================================================= */

function renderLearn() {

    const container =
        $("#learnGrid");

    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    getLearn()
        .forEach(
            item => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "learn-item";


                element.innerHTML = `

                    <span>
                        ✓
                    </span>

                    <div>

                        <strong>
                            ${escapeHtml(
                                item.title
                            )}
                        </strong>

                        <p>
                            ${escapeHtml(
                                item.text
                            )}
                        </p>

                    </div>

                `;


                container.appendChild(
                    element
                );

            }
        );

}


/* =========================================================
   RENDER TESTIMONIALS
========================================================= */

function renderTestimonials() {

    const container =
        $("#testimonialGrid");

    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    getTestimonials()
        .forEach(
            item => {

                const element =
                    document.createElement(
                        "article"
                    );


                element.className =
                    "testimonial-card";


                element.innerHTML = `

                    <div class="stars">
                        ${escapeHtml(
                            item.stars
                        )}
                    </div>

                    <p>
                        ${escapeHtml(
                            item.text
                        )}
                    </p>

                    <strong>
                        ${escapeHtml(
                            item.name
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            item.role
                        )}
                    </small>

                `;


                container.appendChild(
                    element
                );

            }
        );

}


/* =========================================================
   RENDER FAQ
========================================================= */

function renderFAQ() {

    const container =
        $("#faqList");

    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    getFAQ()
        .forEach(
            item => {

                const element =
                    document.createElement(
                        "details"
                    );


                element.innerHTML = `

                    <summary>
                        ${escapeHtml(
                            item.question
                        )}
                    </summary>

                    <p>
                        ${escapeHtml(
                            item.answer
                        )}
                    </p>

                `;


                container.appendChild(
                    element
                );

            }
        );

}


/* =========================================================
   MAIN ENQUIRY FORM
========================================================= */

const leadForm =
    $("#leadForm");

function normalizeMobile(value) {
    return String(value || "").replace(/\D/g, "").slice(-10);
}

function validateLeadPayload(lead) {
    if (lead.fullName.length < 2) return "Please enter your full name.";
    if (!/^\d{10}$/.test(lead.mobile)) return "Please enter a valid 10-digit mobile number.";
    if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "Please enter a valid email address.";
    if (!lead.experience) return "Please select your experience level.";
    return "";
}

function wireMobileField(selector) {
    const input = $(selector);
    if (!input || input.dataset.mobileWired) return;
    input.dataset.mobileWired = "1";
    input.addEventListener("input", () => {
        const digits = input.value.replace(/\D/g, "").slice(0, 10);
        if (input.value !== digits) input.value = digits;
    });
}

wireMobileField("#mobile");
wireMobileField("#brochureMobile");

leadForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const formData = new FormData(leadForm);

        const lead = {
            id: `lead-${Date.now()}`,
            fullName: String(formData.get("fullName") || "").trim(),
            mobile: normalizeMobile(formData.get("mobile")),
            email: String(formData.get("email") || "").trim(),
            experience: String(formData.get("experience") || "").trim(),
            source: "Masterclass Registration",
            status: "New",
            createdAt: new Date().toISOString()
        };

        const validationError = validateLeadPayload(lead);
        if (validationError) {
            toast(validationError);
            return;
        }

        const submitButton = leadForm.querySelector('button[type="submit"]');
        const previousLabel = submitButton?.textContent?.trim() || "RESERVE MY SEAT";

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "SAVING…";
        }

        try {
            const response = await fetch("/api/leads", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                cache: "no-store",
                body: JSON.stringify(lead)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.message || `Unable to save your registration (${response.status}).`);
            }

            const savedLead = result?.id ? result : lead;

            const message = [
                "Hello Alpha Q7 Trading Institute,",
                "",
                "I have enrolled for the Alpha Q7 program.",
                "",
                `Name: ${savedLead.fullName}`,
                `Mobile: ${savedLead.mobile}`,
                `Email: ${savedLead.email || "Not provided"}`,
                `Experience: ${savedLead.experience}`,
                "",
                "I would like to know more about the program."
            ].join("\n");

            const whatsappURL =
                `https://wa.me/${getSite().footer?.contact?.whatsapp || getSite().whatsapp || DEFAULT_WHATSAPP}` +
                `?text=${encodeURIComponent(message)}`;

            const successWhatsapp = $("#successWhatsapp");
            if (successWhatsapp) successWhatsapp.href = whatsappURL;

            leadForm.hidden = true;

            const formSuccess = $("#formSuccess");
            if (formSuccess) formSuccess.hidden = false;

            // Opening WhatsApp is optional; the saved lead must never depend on it.
            try {
                window.open(whatsappURL, "_blank", "noopener,noreferrer");
            } catch {}

            toast("Registration saved successfully.");

        } catch (error) {
            const offline = /failed to fetch|networkerror|load failed/i.test(String(error?.message || ""));
            toast(
                offline
                    ? "Unable to reach the server. Start the local backend (npm run dev) and try again."
                    : (error.message || "Unable to save your registration. Please try again.")
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = previousLabel;
            }
        }
    }
);

/* =========================================================
   RESET MAIN FORM
========================================================= */

$("#resetForm")
    ?.addEventListener(
        "click",
        () => {

            if (leadForm) {

                leadForm.reset();

                leadForm.hidden =
                    false;

            }


            const formSuccess =
                $("#formSuccess");


            if (formSuccess) {

                formSuccess.hidden =
                    true;

            }

        }
    );


/* =========================================================
   BROCHURE ENQUIRY
========================================================= */

const brochureModal = $("#brochureModal");
const brochureEnquiryForm = $("#brochureEnquiryForm");
const brochureSuccess = $("#brochureSuccess");
const brochureDownloadLink = $("#brochureDownloadLink");
const brochureWhatsapp = $("#brochureWhatsapp");

const BROCHURE_URL = "/assets/alpha-q7-brochure.pdf";

function openBrochureModal() {
    if (!brochureModal) return;
    brochureModal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => $("#brochureName")?.focus(), 50);
}

function closeBrochureModal() {
    if (!brochureModal) return;
    brochureModal.hidden = true;
    document.body.classList.remove("modal-open");
}

$("#downloadBrochure")?.addEventListener("click", event => {
    event.preventDefault();
    openBrochureModal();
});

$("#closeBrochureModal")?.addEventListener("click", closeBrochureModal);
$("#brochureModalOverlay")?.addEventListener("click", closeBrochureModal);

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && brochureModal && !brochureModal.hidden) {
        closeBrochureModal();
    }
});

brochureEnquiryForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const data = new FormData(brochureEnquiryForm);
    const lead = {
        fullName: String(data.get("fullName") || "").trim(),
        mobile: normalizeMobile(data.get("mobile")),
        email: String(data.get("email") || "").trim(),
        experience: String(data.get("experience") || "").trim(),
        source: "Brochure",
        status: "New",
        createdAt: new Date().toISOString()
    };

    const validationError = validateLeadPayload(lead);
    if (validationError) {
        toast(validationError);
        return;
    }

    const submitButton = brochureEnquiryForm.querySelector('button[type="submit"]');
    const previousLabel = submitButton?.textContent?.trim() || "GET BROCHURE";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "SAVING…";
    }

    try {
        const response = await fetch("/api/leads", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            cache: "no-store",
            body: JSON.stringify(lead)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.message || `Unable to save your enquiry (${response.status}).`);
        }

        const savedLead = result?.id ? result : lead;

        const site = getSite();
        const message = [
            "Hello Alpha Q7 Trading Institute,",
            "",
            "I requested the Alpha Q7 brochure.",
            "",
            `Name: ${savedLead.fullName}`,
            `Mobile: ${savedLead.mobile}`,
            `Email: ${savedLead.email || "Not provided"}`,
            `Experience: ${savedLead.experience}`
        ].join("\n");

        const whatsappURL =
            `https://wa.me/${site.footer?.contact?.whatsapp || site.whatsapp || DEFAULT_WHATSAPP}` +
            `?text=${encodeURIComponent(message)}`;

        if (brochureWhatsapp) brochureWhatsapp.href = whatsappURL;

        if (brochureDownloadLink) {
            brochureDownloadLink.href = BROCHURE_URL;
            brochureDownloadLink.download = "Alpha-Q7-Trading-Institute-Brochure.pdf";
        }

        brochureEnquiryForm.hidden = true;
        if (brochureSuccess) brochureSuccess.hidden = false;

        // Keep the download available as a normal user-initiated link.
        // Also try an automatic download; browsers may block async downloads,
        // in which case the visible button remains fully functional.
        const download = document.createElement("a");
        download.href = BROCHURE_URL;
        download.download = "Alpha-Q7-Trading-Institute-Brochure.pdf";
        download.rel = "noopener";
        download.style.display = "none";
        document.body.appendChild(download);
        try { download.click(); } catch {}
        download.remove();

        toast("Brochure enquiry saved successfully.");

    } catch (error) {
        const offline = /failed to fetch|networkerror|load failed/i.test(String(error?.message || ""));
        toast(
            offline
                ? "Unable to reach the server. Start the local backend (npm run dev) and try again."
                : (error.message || "Unable to save your enquiry. Please try again.")
        );
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = previousLabel;
        }
    }
});

/* =========================================================
   MOBILE MENU
========================================================= */

const menuToggle =
    $("#menuToggle");

const mainNav =
    $("#mainNav");

function setMobileMenu(open) {
    if (!mainNav || !menuToggle) {
        return;
    }

    mainNav.classList.toggle("open", open);

    menuToggle.setAttribute(
        "aria-expanded",
        String(open)
    );
}

menuToggle?.addEventListener(
    "click",
    () => {
        setMobileMenu(
            !mainNav?.classList.contains("open")
        );
    }
);

$$(".main-nav a")
    .forEach(
        link => {
            link.addEventListener(
                "click",
                () => setMobileMenu(false)
            );
        }
    );

document.addEventListener(
    "keydown",
    event => {
        if (event.key === "Escape") {
            setMobileMenu(false);
        }
    }
);


/* =========================================================
   BACKGROUND CANDLE GRAPH
========================================================= */

const backgroundCanvas =
    $("#marketBackground");

const backgroundContext =
    backgroundCanvas
        ? backgroundCanvas.getContext(
            "2d"
        )
        : null;


let backgroundWidth =
    window.innerWidth;

let backgroundHeight =
    window.innerHeight;

let backgroundCandles =
    [];

let backgroundOffset =
    0;

let backgroundPreviousTime =
    performance.now();

let backgroundAnimationFrame =
    null;

const backgroundReducedMotion =
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

let backgroundPaused =
    document.hidden ||
    backgroundReducedMotion.matches;


const GREEN_CANDLE =
    "#143A34";

const GREEN_WICK =
    "#2EC38D";

const RED_CANDLE =
    "#3A1E1E";

const RED_WICK =
    "#E15757";


/* =========================================================
   RESIZE BACKGROUND
========================================================= */

function resizeBackgroundCanvas() {

    if (
        !backgroundCanvas ||
        !backgroundContext
    ) {

        return;

    }


    const dpr =
        Math.min(
            window.devicePixelRatio ||
            1,
            2
        );


    backgroundWidth =
        window.innerWidth;


    backgroundHeight =
        window.innerHeight;


    backgroundCanvas.width =
        backgroundWidth *
        dpr;


    backgroundCanvas.height =
        backgroundHeight *
        dpr;


    backgroundCanvas.style.width =
        `${backgroundWidth}px`;


    backgroundCanvas.style.height =
        `${backgroundHeight}px`;


    backgroundContext.setTransform(

        dpr,

        0,

        0,

        dpr,

        0,

        0

    );


    createBackgroundCandles();

}


/* =========================================================
   CREATE BACKGROUND CANDLES
========================================================= */

function createBackgroundCandles() {

    backgroundCandles =
        [];


    const spacing =
        35;


    for (

        let x = -200;

        x <
            backgroundWidth +
            400;

        x +=
            spacing

    ) {

        const bullish =
            Math.random() >
            0.5;


        backgroundCandles.push({

            x:

                x,

            base:

                backgroundHeight *
                (
                    0.45 +
                    Math.random() *
                    0.30
                ),

            height:

                backgroundHeight *
                (
                    0.05 +
                    Math.random() *
                    0.18
                ),

            targetHeight:

                backgroundHeight *
                (
                    0.06 +
                    Math.random() *
                    0.24
                ),

            bullish:

                bullish,

            targetBullish:

                bullish,

            transition:

                0

        });

    }

}


/* =========================================================
   DRAW BACKGROUND GRID
========================================================= */

function drawBackgroundGrid() {

    if (
        !backgroundContext
    ) {

        return;

    }


    backgroundContext.strokeStyle =
        "rgba(255,255,255,0.02)";


    backgroundContext.lineWidth =
        1;


    for (

        let x =
            -backgroundOffset;

        x <
            backgroundWidth +
            100;

        x +=
            90

    ) {

        backgroundContext.beginPath();


        backgroundContext.moveTo(
            x,
            0
        );


        backgroundContext.lineTo(
            x,
            backgroundHeight
        );


        backgroundContext.stroke();

    }


    for (

        let y = 60;

        y <
            backgroundHeight;

        y +=
            90

    ) {

        backgroundContext.beginPath();


        backgroundContext.moveTo(
            0,
            y
        );


        backgroundContext.lineTo(
            backgroundWidth,
            y
        );


        backgroundContext.stroke();

    }

}


/* =========================================================
   DRAW BACKGROUND CANDLES
========================================================= */

function drawBackgroundCandles() {

    if (
        !backgroundContext
    ) {

        return;

    }


    const candleWidth =
        Math.max(
            6,
            Math.min(
                12,
                backgroundWidth *
                0.007
            )
        );


    backgroundCandles
        .forEach(
            candle => {

                const x =
                    candle.x -
                    backgroundOffset;


                if (
                    x <
                        -30 ||
                    x >
                        backgroundWidth +
                        30
                ) {

                    return;

                }


                candle.height +=

                    (
                        candle.targetHeight -
                        candle.height
                    ) *
                    0.025;


                if (
                    Math.abs(
                        candle.targetHeight -
                        candle.height
                    ) < 2
                ) {

                    candle.targetHeight =

                        backgroundHeight *
                        (
                            0.05 +
                            Math.random() *
                            0.24
                        );

                }


                if (
                    Math.random() <
                    0.0018
                ) {

                    candle.targetBullish =
                        !candle.targetBullish;

                    candle.transition =
                        0;

                }


                if (
                    candle.bullish !==
                    candle.targetBullish
                ) {

                    candle.transition +=
                        0.04;


                    if (
                        candle.transition >=
                        1
                    ) {

                        candle.bullish =
                            candle.targetBullish;

                        candle.transition =
                            0;

                    }

                }


                const top =
                    candle.base -
                    candle.height;


                const wickTop =
                    top -
                    15;


                const wickBottom =
                    candle.base +
                    15;


                /*
                 * WICK
                 */

                backgroundContext.strokeStyle =

                    candle.bullish
                        ? GREEN_WICK
                        : RED_WICK;


                backgroundContext.lineWidth =
                    2;


                backgroundContext.beginPath();


                backgroundContext.moveTo(

                    x +
                    candleWidth / 2,

                    wickTop

                );


                backgroundContext.lineTo(

                    x +
                    candleWidth / 2,

                    wickBottom

                );


                backgroundContext.stroke();


                /*
                 * BODY
                 */

                backgroundContext.fillStyle =

                    candle.bullish
                        ? GREEN_CANDLE
                        : RED_CANDLE;


                backgroundContext.fillRect(

                    x,

                    top,

                    candleWidth,

                    candle.height

                );


                /*
                 * EDGE
                 */

                backgroundContext.fillStyle =

                    candle.bullish
                        ? GREEN_WICK
                        : RED_WICK;


                backgroundContext.fillRect(

                    x,

                    top,

                    2,

                    candle.height

                );

            }
        );

}


/* =========================================================
   BACKGROUND ANIMATION
========================================================= */

function animateBackground(
    timestamp
) {

    if (
        !backgroundContext
    ) {

        return;

    }


    const elapsed =
        Math.min(
            50,
            timestamp -
            backgroundPreviousTime
        );


    backgroundPreviousTime =
        timestamp;


    backgroundOffset +=
        elapsed *
        0.045;


    if (
        backgroundOffset >=
        35
    ) {

        backgroundOffset =
            0;


        backgroundCandles
            .forEach(
                candle => {

                    candle.x -=
                        35;

                }
            );


        const lastCandle =
            backgroundCandles[
                backgroundCandles.length - 1
            ];


        backgroundCandles.push({

            x:
                lastCandle
                    ? lastCandle.x +
                      35
                    : backgroundWidth,

            base:

                backgroundHeight *
                (
                    0.45 +
                    Math.random() *
                    0.30
                ),

            height:

                backgroundHeight *
                (
                    0.05 +
                    Math.random() *
                    0.18
                ),

            targetHeight:

                backgroundHeight *
                (
                    0.06 +
                    Math.random() *
                    0.24
                ),

            bullish:
                Math.random() >
                0.5,

            targetBullish:
                Math.random() >
                0.5,

            transition:
                0

        });


        backgroundCandles =
            backgroundCandles.filter(
                candle =>
                    candle.x >
                    -200
            );

    }


    /*
     * WHITE BACKGROUND
     */

    backgroundContext.fillStyle =
        "#0B1220";


    backgroundContext.fillRect(

        0,

        0,

        backgroundWidth,

        backgroundHeight

    );


    drawBackgroundGrid();

    drawBackgroundCandles();


    if (!backgroundPaused) {
        backgroundAnimationFrame =
            requestAnimationFrame(
                animateBackground
            );
    }

}


function updateBackgroundMotionState() {
    backgroundPaused =
        document.hidden ||
        backgroundReducedMotion.matches;

    if (backgroundPaused) {
        if (backgroundAnimationFrame) {
            cancelAnimationFrame(
                backgroundAnimationFrame
            );
            backgroundAnimationFrame =
                null;
        }
        return;
    }

    backgroundPreviousTime =
        performance.now();

    if (!backgroundAnimationFrame) {
        backgroundAnimationFrame =
            requestAnimationFrame(
                animateBackground
            );
    }
}

document.addEventListener(
    "visibilitychange",
    updateBackgroundMotionState
);

if (backgroundReducedMotion.addEventListener) {
    backgroundReducedMotion.addEventListener(
        "change",
        updateBackgroundMotionState
    );
}


/* =========================================================
   START BACKGROUND
========================================================= */

function initializeBackground() {

    if (
        !backgroundCanvas ||
        !backgroundContext
    ) {

        return;

    }


    resizeBackgroundCanvas();


    window.addEventListener(
        "resize",
        resizeBackgroundCanvas
    );


    if (!backgroundPaused) {
        backgroundAnimationFrame =
            requestAnimationFrame(
                animateBackground
            );
    }

}


/* =========================================================
   BACK TO TOP
========================================================= */

window.addEventListener(
    "scroll",
    () => {

        const button =
            $("#backTop");


        if (!button) {

            return;

        }


        button.classList.toggle(

            "show",

            window.scrollY >
            500

        );

    }
);


$("#backTop")
    ?.addEventListener(
        "click",
        () => {

            window.scrollTo({

                top:
                    0,

                behavior:
                    "smooth"

            });

        }
    );


/* =========================================================
   ADMIN → WEBSITE SYNC
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            !SYNC_KEYS.includes(
                event.key
            )
        ) {

            return;

        }


        fetchPublicContent()
            .then(() => {
                renderSite();
                renderFooter();
            });

    }
);


alphaQ7Channel?.addEventListener(
    "message",
    event => {

        if (
            event.data?.type !==
            "ALPHA_Q7_DATA_UPDATED"
        ) {

            return;

        }


        fetchPublicContent()
            .then(() => {
                renderSite();
                refreshFooter();
            });

    }
);


/* =========================================================
   INITIALIZE WEBSITE
========================================================= */

async function initializeAlphaQ7() {

    await fetchPublicContent();

    renderSite();

    refreshFooter();

    initializeBackground();

}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAlphaQ7
    );

} else {

    initializeAlphaQ7();

}

/* =========================================================
   ALPHA Q7 FOOTER MANAGEMENT
========================================================= */

const FOOTER_STORAGE_KEY = "alphaQ7FooterSettings";

const DEFAULT_FOOTER_SETTINGS = {
    description: "Alpha Q7 Trading Institute provides structured market education focused on analysis, discipline and responsible risk management.",
    logoSrc: "assets/alpha-q7-logo.png",
    logoAlt: "Alpha Q7 Trading Institute",
    contactTitle: "Contact",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=22%201st%20Floor%201st%20Cross%20Bannerghatta%20Rd%20Bilekahalli%20Bengaluru%20Karnataka%20560076",
    contact: {
        whatsapp: DEFAULT_WHATSAPP,
        phone: "+91 73532 28777",
        email: "",
        address: "22, 1st Floor, 1st Cross, Bannerghatta Rd, Bilekahalli, Bengaluru, Karnataka 560076",
        mapUrl: "https://www.google.com/maps/search/?api=1&query=22%201st%20Floor%201st%20Cross%20Bannerghatta%20Rd%20Bilekahalli%20Bengaluru%20Karnataka%20560076"
    },
    columns: [
        { id: "explore", title: "Explore", links: [
            { id: "home", label: "Home", url: "#home", target: "_self" },
            { id: "about", label: "About", url: "#about", target: "_self" },
            { id: "courses", label: "Courses", url: "#courses", target: "_self" },
            { id: "market", label: "Market Analysis", url: "#market-analysis", target: "_self" }
        ]},
        { id: "resources", title: "Resources", links: [
            { id: "learn", label: "What You'll Learn", url: "#learn", target: "_self" },
            { id: "brochure", label: "Brochure", url: "#brochure", target: "_self" },
            { id: "testimonials", label: "Testimonials", url: "#testimonials", target: "_self" },
            { id: "faq", label: "FAQ", url: "#faq", target: "_self" }
        ]}
    ],
    socials: [
        { id: "whatsapp", type: "whatsapp", label: "WhatsApp", url: "https://wa.me/917353228777" },
        { id: "instagram", type: "instagram", label: "Instagram", url: "https://www.instagram.com/alpha_q7_trading_institute" },
        { id: "linkedin", type: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/" }
    ],
    qrImage: "assets/alpha-q7-qr.png",
    bottom: {
        copyright: "© 2026 Alpha Q7 Trading Institute.",
        disclaimer: "Educational purposes only.",
        legalLinks: [
            { id: "privacy", label: "Privacy", url: "privacy.html", target: "_self" },
            { id: "terms", label: "Terms", url: "terms.html", target: "_self" },
            { id: "risk", label: "Risk & Course Policy", url: "risk-refund.html", target: "_self" }
        ]
    }
};


/* =========================================================
   LOAD FOOTER DATA
========================================================= */

function getFooterSettings() {
    try {
        const saved = localStorage.getItem(
            FOOTER_STORAGE_KEY
        );

        const parsed = saved
            ? JSON.parse(saved)
            : {};

        const site = getSite();

        const socials = (
            Array.isArray(parsed.socials)
                ? parsed.socials
                : DEFAULT_FOOTER_SETTINGS.socials
        ).filter(
            social =>
                social &&
                social.url &&
                social.url !== "https://www.linkedin.com/"
        );

        return {
            ...DEFAULT_FOOTER_SETTINGS,
            ...parsed,
            socials
        };
    } catch (error) {
        console.error(
            "Unable to load footer settings:",
            error
        );

        return {
            ...DEFAULT_FOOTER_SETTINGS,
            socials: DEFAULT_FOOTER_SETTINGS.socials
        };
    }
}


/* =========================================================
   SAVE FOOTER DATA
========================================================= */

function saveFooterSettings(settings) {
    saveJSON(
        FOOTER_STORAGE_KEY,
        settings
    );
}


/* =========================================================
   SOCIAL ICONS
========================================================= */

function getSocialIcon(type) {

    switch (type) {

        case "instagram":

            return `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="5"
                        ry="5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    />

                    <circle
                        cx="12"
                        cy="12"
                        r="4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    />

                    <circle
                        cx="17.5"
                        cy="6.5"
                        r="1.2"
                    />
                </svg>
            `;


        case "whatsapp":

            return `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.5 0 .1 5.4.1 12c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7a12 12 0 0 0 5.8 1.5h.1c6.6 0 12-5.4 12-12 0-3.2-1.3-6.1-3.7-8.3ZM12.1 21.8h-.1a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 0 1-1.5-5.2c0-5.4 4.4-9.8 9.8-9.8 2.6 0 5.1 1 6.9 2.9 1.9 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.7 9.8Zm5.4-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7.2-.2.3-.4.5-.6.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.4 4.7.8.3 1.4.5 1.9.6.8.3 1.5.2 2 .1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"
                    />
                </svg>
            `;


        case "linkedin":

            return `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M4.5 3A2.5 2.5 0 1 0 4.5 8 2.5 2.5 0 0 0 4.5 3ZM2.3 9.5h4.4V22H2.3V9.5ZM9.3 9.5h4.2v1.7h.1c.6-1.1 2-2.2 4.1-2.2 4.4 0 5.2 2.9 5.2 6.7V22h-4.4v-5.6c0-1.3 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V22H9.3V9.5Z"
                    />
                </svg>
            `;


        default:

            return `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    />
                </svg>
            `;
    }

}


/* =========================================================
   RENDER FOOTER FROM SERVER
========================================================= */

async function fetchPublicFooter() {
    try {
        const response =
            await fetch(
                "/api/footer/public",
                {
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                `Footer API returned ${response.status}`
            );
        }

        return await response.json();
    } catch (error) {
        console.warn(
            "Using local footer fallback:",
            error
        );

        const local =
            getFooterSettings();

        const site =
            getSite();

        return {
            ...DEFAULT_FOOTER_SETTINGS,
            ...local,
            logoSrc: local.logoSrc || DEFAULT_FOOTER_SETTINGS.logoSrc,
            contact: {
                ...DEFAULT_FOOTER_SETTINGS.contact,
                ...(local.contact || {}),
                whatsapp: site.whatsapp || DEFAULT_FOOTER_SETTINGS.contact.whatsapp,
                phone: site.phoneDisplay || DEFAULT_FOOTER_SETTINGS.contact.phone,
                address: site.address || DEFAULT_FOOTER_SETTINGS.contact.address,
                mapUrl: local.mapUrl || DEFAULT_FOOTER_SETTINGS.contact.mapUrl
            },
            columns: Array.isArray(local.columns) && local.columns.length ? local.columns : DEFAULT_FOOTER_SETTINGS.columns,
            socials: Array.isArray(local.socials) && local.socials.length ? local.socials : DEFAULT_FOOTER_SETTINGS.socials,
            qrImage: local.qrImage || DEFAULT_FOOTER_SETTINGS.qrImage,
            bottom: DEFAULT_FOOTER_SETTINGS.bottom
        };
    }
}

function renderFooter(settings) {
    if (!settings) {
        return;
    }

    const logo =
        document.getElementById(
            "footerLogo"
        );

    if (logo) {
        logo.src =
            settings.logoSrc ||
            "assets/alpha-q7-logo.png";
        logo.alt =
            settings.logoAlt ||
            "Alpha Q7 Trading Institute";
    }

    const description =
        document.getElementById(
            "footerDescription"
        );

    if (description) {
        description.textContent =
            settings.description || "";
    }

    const contact =
        settings.contact || {};

    const contactTitle =
        document.getElementById(
            "footerContactTitle"
        );

    if (contactTitle) {
        contactTitle.textContent =
            settings.contactTitle ||
            "Contact";
    }

    const whatsapp =
        document.getElementById(
            "footerWhatsapp"
        );

    if (whatsapp) {
        const cleanNumber =
            String(
                contact.whatsapp ||
                DEFAULT_WHATSAPP
            ).replace(/\D/g, "");

        whatsapp.href =
            `https://wa.me/${cleanNumber}`;

        whatsapp.textContent =
            contact.phone ||
            `+${cleanNumber}`;
    }

    const email =
        document.getElementById(
            "footerEmail"
        );

    if (email) {
        if (contact.email) {
            email.hidden = false;
            email.href =
                `mailto:${contact.email}`;
            email.textContent =
                contact.email;
        } else {
            email.hidden = true;
        }
    }

    const address =
        document.getElementById(
            "footerAddress"
        );

    if (address) {
        const mapUrl = String(contact.mapUrl || "").trim();
        const addressText = String(contact.address || "").trim();
        address.hidden = !addressText;
        address.textContent = addressText;
        if (mapUrl) {
            address.href = mapUrl;
            address.target = "_blank";
            address.rel = "noopener noreferrer";
        } else {
            address.removeAttribute("href");
            address.removeAttribute("target");
            address.removeAttribute("rel");
        }
    }

    const columns =
        document.getElementById(
            "footerColumns"
        );

    if (columns) {
        columns.innerHTML = "";

        (settings.columns || [])
            .forEach(column => {
                const wrapper =
                    document.createElement(
                        "div"
                    );

                wrapper.className =
                    "footer-column";

                const heading =
                    document.createElement(
                        "h4"
                    );

                heading.textContent =
                    column.title || "";

                wrapper.appendChild(
                    heading
                );

                (column.links || [])
                    .forEach(item => {
                        const link =
                            document.createElement(
                                "a"
                            );

                        link.href =
                            item.url || "#";

                        link.textContent =
                            item.label || "";

                        link.target =
                            item.target ===
                            "_blank"
                                ? "_blank"
                                : "_self";

                        if (
                            link.target ===
                            "_blank"
                        ) {
                            link.rel =
                                "noopener noreferrer";
                        }

                        wrapper.appendChild(
                            link
                        );
                    });

                columns.appendChild(
                    wrapper
                );
            });
    }

    const socialsContainer =
        document.getElementById(
            "footerSocials"
        );

    if (socialsContainer) {
        socialsContainer.innerHTML = "";

        (settings.socials || [])
            .filter(
                social =>
                    social &&
                    social.url
            )
            .forEach(social => {
                const link =
                    document.createElement(
                        "a"
                    );

                link.className =
                    "footer-social-link";
                link.href =
                    social.url;
                link.target = "_blank";
                link.rel =
                    "noopener noreferrer";
                link.title =
                    social.label ||
                    social.type;
                link.setAttribute(
                    "aria-label",
                    social.label ||
                    social.type
                );
                link.innerHTML =
                    getSocialIcon(
                        social.type
                    );

                socialsContainer.appendChild(
                    link
                );
            });
    }

    const qr =
        document.getElementById(
            "footerQr"
        );
    const qrLink =
        document.getElementById(
            "footerQrLink"
        );

    if (qr) {
        if (settings.qrImage) {
            qr.src = settings.qrImage;
            qr.hidden = false;
            if (qrLink) {
                const qrNumber = String(
                    contact.whatsapp ||
                    DEFAULT_WHATSAPP
                ).replace(/\D/g, "");
                qrLink.href = qrNumber
                    ? `https://wa.me/${qrNumber}`
                    : "#";
                qrLink.hidden = false;
            }
        } else {
            qr.removeAttribute("src");
            qr.hidden = true;
            if (qrLink) qrLink.hidden = true;
        }
    }

    const bottom =
        settings.bottom || {};

    const copyright =
        document.getElementById(
            "footerCopyright"
        );

    if (copyright) {
        copyright.textContent =
            bottom.copyright || "";
    }

    const disclaimer =
        document.getElementById(
            "footerDisclaimer"
        );

    if (disclaimer) {
        disclaimer.textContent =
            bottom.disclaimer || "";
    }

    const legal =
        document.getElementById(
            "footerLegalLinks"
        );

    if (legal) {
        legal.innerHTML = "";

        (bottom.legalLinks || [])
            .forEach(item => {
                const link =
                    document.createElement(
                        "a"
                    );
                link.href =
                    item.url || "#";
                link.textContent =
                    item.label || "";
                link.target =
                    item.target ===
                    "_blank"
                        ? "_blank"
                        : "_self";
                if (
                    link.target ===
                    "_blank"
                ) {
                    link.rel =
                        "noopener noreferrer";
                }
                legal.appendChild(link);
            });
    }
}

async function refreshFooter() {
    const settings =
        await fetchPublicFooter();
    renderFooter(settings);
    return settings;
}

/* =========================================================
   CUSTOM SECTIONS
========================================================= */

async function fetchCustomSections() {
    try {
        const response = await fetch('/api/sections/public');
        if (!response.ok) {
            console.warn('Custom sections API returned status:', response.status);
            return [];
        }
        return await response.json();
    } catch (e) {
        console.error('Failed to fetch custom sections:', e);
        return [];
    }
}

function renderCustomSections(sections) {
    const container = document.getElementById('customSectionsContainer');
    if (!container) return;
    container.innerHTML = '';
    if (!sections || sections.length === 0) return;
    sections.forEach(section => {
        const sectionEl = document.createElement('section');
        sectionEl.className = 'section custom-section';
        sectionEl.style.setProperty('--custom-section-background', section.backgroundColor || '#11100d');
        sectionEl.style.setProperty('--custom-section-text', section.textColor || '#ffffff');
        
        const containerEl = document.createElement('div');
        containerEl.className = 'container';
        
        const headingEl = document.createElement('div');
        headingEl.className = 'section-heading';
        
        const titleEl = document.createElement('h2');
        titleEl.textContent = section.title;
        headingEl.appendChild(titleEl);
        
        if (section.description) {
            const descEl = document.createElement('p');
            descEl.textContent = section.description;
            headingEl.appendChild(descEl);
        }
        
        containerEl.appendChild(headingEl);
        
        if (section.items && section.items.length > 0) {
            const itemsGridEl = document.createElement('div');
            itemsGridEl.className = 'custom-section-items';
            itemsGridEl.dataset.itemCount = String(section.items.length);
            
            section.items.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'custom-item';
                
                if (item.image) {
                    const imageEl = document.createElement('img');
                    imageEl.src = item.image;
                    imageEl.alt = item.heading || section.title || 'Alpha Q7';
                    imageEl.loading = 'lazy';
                    imageEl.className = 'custom-item-image';
                    itemEl.appendChild(imageEl);
                }

                if (item.heading) {
                    const itemHeadingEl = document.createElement('h3');
                    itemHeadingEl.textContent = item.heading;
                    itemEl.appendChild(itemHeadingEl);
                }
                
                if (item.content) {
                    const itemContentEl = document.createElement('p');
                    itemContentEl.textContent = item.content;
                    itemEl.appendChild(itemContentEl);
                }
                
                itemsGridEl.appendChild(itemEl);
            });
            
            containerEl.appendChild(itemsGridEl);
        }
        
        sectionEl.appendChild(containerEl);
        container.appendChild(sectionEl);
    });
}

async function refreshCustomSections() {
    const sections = await fetchCustomSections();
    renderCustomSections(sections);
}

document.addEventListener('DOMContentLoaded', async () => {
    await refreshCustomSections();
});

