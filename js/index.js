/**
 * ================================================================
 * SPHERE COMMUNITY — HOMEPAGE DYNAMIC FIRESTORE INTEGRATION
 * Real-time synchronization:
 * 1. Home Telemetry Stats (settings/home)
 * 2. Flagship & Sub-Projects (projects collection)
 * 3. Featured Showcase (settings/homepage_showcase: Events, Founders, Leads)
 * ================================================================
 */

import { db } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    onSnapshot,
    collection, 
    getDocs, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const escapeHTML = (str) => {
    return (str || '').toString().replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
};

const localImages = {
    "anish mogam": "anish.jpg",
    "madhura lakade": "madhura.jpg",
    "shreyash atre": "shreyash.jpg",
    "shreyas gore": "shreyasgore.jpg",
    "isha joshi": "isha.jpg",
    "mihir mendake": "mihir.jpg",
    "mihir mehendake": "mihir.jpg",
    "siddheshwar hinge": "siddheshwar.jpg",
    "vaibhav bandgar": "vaibhav.jpg",
    "om shinde": "sphere-logo.png",
    "ayush teli": "ayush.jpg"
};

function getMemberPhoto(data) {
    if (data.image && data.image.trim()) {
        return data.image.trim();
    }
    const nameLower = (data.name || '').toLowerCase().trim();
    for (const [key, filename] of Object.entries(localImages)) {
        if (nameLower.includes(key)) {
            return `assets/images/${filename}`;
        }
    }
    return 'assets/images/sphere-logo.png';
}

// ------------------------------------------------------------
// 1. HOME TELEMETRY STATS
// ------------------------------------------------------------
async function loadHomeStats() {
    try {
        const docRef = doc(db, 'settings', 'home');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            const elHackathon = document.getElementById('stat-hackathon');
            const elProjects = document.getElementById('stat-projects');
            const elMembers = document.getElementById('stat-members');
            const elMeetup = document.getElementById('stat-meetup');
            
            if (elHackathon && data.hackathon) elHackathon.textContent = data.hackathon;
            if (elProjects && data.projectsCount) elProjects.textContent = data.projectsCount;
            if (elMembers && data.membersCount) elMembers.textContent = data.membersCount;
            if (elMeetup && data.meetup) elMeetup.textContent = data.meetup;
        }
    } catch (error) {
        console.warn("[Index] Error fetching home stats:", error);
    }
}

// ------------------------------------------------------------
// 2. HOME PROJECTS (Top 3 Projects with Real-time Live Sync)
// ------------------------------------------------------------
let cachedShowcaseData = null;
let cachedProjects = [];

function renderHomeProjects() {
    const flagshipContainer = document.getElementById('home-flagship-container');
    const subprojectsContainer = document.getElementById('home-subprojects-container');
    if (!flagshipContainer) return;

    const isNoProjects = !!(cachedShowcaseData && cachedShowcaseData.noProjects);
    const activeProjects = (cachedProjects || []).filter(p => p && p.featuredOnHome !== false);

    if (isNoProjects || activeProjects.length === 0) {
        // Clean, tidy aerospace empty state card matching the existing design
        const empty = (cachedShowcaseData && cachedShowcaseData.emptyStateProjects) || {
            title: "Production Systems Under Active Architecture",
            desc: "Our student engineering squads are currently building the next generation of open-source systems, AI copilots, and distributed infrastructure. Check back soon or view our community repositories.",
            btnText: "EXPLORE GITHUB",
            btnLink: "https://github.com/Sphere-Club/Sphere-Coding-Club"
        };

        const emptyTitle = escapeHTML(empty.title || "Production Systems Under Active Architecture");
        const emptyDesc = escapeHTML(empty.desc || "Our student engineering squads are currently building the next generation of open-source systems. Stay tuned!");
        const emptyBtnText = escapeHTML(empty.btnText || "EXPLORE GITHUB");
        const emptyBtnLink = escapeHTML(empty.btnLink || "https://github.com/Sphere-Club/Sphere-Coding-Club");

        flagshipContainer.className = 'group rounded-3xl bg-surface-container-lowest shadow-md border border-surface-container hover:shadow-xl hover:border-secondary/40 transition-all duration-300 overflow-hidden mb-6 p-8 sm:p-10';
        flagshipContainer.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div class="flex items-start gap-5">
                <div class="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-surface-container text-center shrink-0 group-hover:bg-secondary-container group-hover:text-on-secondary transition-all duration-300">
                  <span class="material-symbols-outlined text-secondary group-hover:text-on-secondary text-[32px]">deployed_code</span>
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="px-2.5 py-0.5 rounded-full bg-secondary-container/15 text-secondary border border-secondary/20 font-label-caps text-[10px] tracking-wider uppercase font-semibold">
                      SYSTEM ARCHITECTURE SPRINT
                    </span>
                    <span class="font-telemetry-code text-xs text-on-surface-variant flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SQUADS ACTIVE
                    </span>
                  </div>
                  <h3 class="font-headline-md text-xl sm:text-2xl font-bold text-on-surface group-hover:text-secondary transition-colors">
                    ${emptyTitle}
                  </h3>
                  <p class="font-body-md text-xs sm:text-sm text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
                    ${emptyDesc}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-4 shrink-0">
                <div class="font-telemetry-code text-xs text-on-surface-variant text-right hidden sm:block">
                  OPEN SOURCE // GITHUB
                </div>
                <a href="${emptyBtnLink}" target="_blank" class="shimmer-btn px-6 py-3 rounded-full bg-secondary text-on-secondary font-title-caps text-xs uppercase tracking-wider hover:bg-secondary-container hover:scale-105 transition-all text-center block">
                  ${emptyBtnText}
                </a>
              </div>
            </div>
        `;

        if (subprojectsContainer) {
            subprojectsContainer.innerHTML = '';
            subprojectsContainer.classList.add('hidden');
        }
    } else {
        // Render top 3 projects from the projects tab:
        // 1 Flagship (either isFlagship: true or 1st project) + 2 Sub-Projects
        const flagshipIndex = activeProjects.findIndex(p => p.isFlagship === true);
        const flagship = flagshipIndex !== -1 ? activeProjects[flagshipIndex] : activeProjects[0];
        const subProjects = activeProjects.filter(p => p.id !== flagship.id).slice(0, 2);

        flagshipContainer.className = 'group rounded-3xl bg-surface-container-lowest shadow-md border border-surface-container hover:shadow-xl hover:border-secondary/40 transition-all duration-300 overflow-hidden mb-6 grid grid-cols-1 lg:grid-cols-12 items-center';

        const techStackArray = flagship.techStack ? flagship.techStack.split(',').map(t => t.trim()) : [];
        const imgHtml = flagship.image 
            ? `<img src="${flagship.image}" alt="${escapeHTML(flagship.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />`
            : `<div class="w-full h-full bg-gradient-to-br from-blue-900 via-slate-900 to-sky-950 p-6 flex flex-col justify-between text-white">
                 <div class="flex items-center justify-between">
                   <div class="flex items-center gap-2">
                     <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
                     <span class="font-telemetry-code text-xs text-slate-300">system-node://online</span>
                   </div>
                   <span class="font-telemetry-code text-xs px-2.5 py-1 rounded bg-secondary-container text-white">ACTIVE</span>
                 </div>
                 <div class="my-auto text-center font-headline-sm text-lg font-bold text-sky-200">${escapeHTML(flagship.title)}</div>
                 <div class="font-telemetry-code text-xs text-sky-300">STATUS: PRODUCTION READY</div>
               </div>`;

        flagshipContainer.innerHTML = `
            <div class="lg:col-span-7 p-8 space-y-4">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/10 text-secondary font-label-caps text-xs uppercase tracking-widest font-semibold border border-secondary/20">
                <span class="w-2 h-2 rounded-full bg-secondary animate-ping"></span> FLAGSHIP SYSTEM RELEASE
              </div>
              <h3 class="font-headline-md text-2xl font-bold text-on-surface group-hover:text-secondary transition-colors">
                ${escapeHTML(flagship.title)}
              </h3>
              <p class="font-body-md text-sm text-on-surface-variant leading-relaxed">
                ${escapeHTML(flagship.description || '')}
              </p>
              <div class="flex flex-wrap gap-2 pt-2">
                ${techStackArray.map(tech => `<span class="px-3 py-1 rounded-md bg-surface-container font-telemetry-code text-xs text-on-surface">${escapeHTML(tech)}</span>`).join('')}
              </div>
              <div class="flex items-center gap-4 pt-4">
                ${flagship.demo ? `
                  <a class="shimmer-btn group/btn inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-title-caps text-xs uppercase tracking-wider shadow-sm hover:bg-secondary-container hover:scale-105 transition-all"
                    href="${flagship.demo}" target="_blank">
                    <span>LIVE DEMO</span>
                    <span class="material-symbols-outlined text-[16px] group-hover/btn:translate-x-1 transition-transform">open_in_new</span>
                  </a>` : ''}
                ${flagship.github ? `
                  <a class="group/repo inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-surface-container text-on-surface font-title-caps text-xs uppercase tracking-wider hover:bg-surface-container-high hover:scale-105 transition-all border border-surface-container"
                    href="${flagship.github}" target="_blank">
                    <span>VIEW CODEBASE</span>
                    <span class="material-symbols-outlined text-[16px] group-hover/repo:rotate-45 transition-transform">code</span>
                  </a>` : ''}
              </div>
            </div>
            <div class="lg:col-span-5 h-72 lg:h-full min-h-[300px] relative overflow-hidden bg-surface-container">
              ${imgHtml}
            </div>
        `;

        if (subprojectsContainer) {
            if (subProjects.length === 0) {
                subprojectsContainer.innerHTML = '';
                subprojectsContainer.classList.add('hidden');
            } else {
                subprojectsContainer.classList.remove('hidden');
                subprojectsContainer.className = subProjects.length === 1 
                    ? 'grid grid-cols-1 gap-6' 
                    : 'grid grid-cols-1 md:grid-cols-2 gap-6';
                subprojectsContainer.innerHTML = '';

                subProjects.forEach(proj => {
                    const techStackArray = proj.techStack ? proj.techStack.split(',').map(t => t.trim()) : [];
                    const card = document.createElement('div');
                    card.className = 'card-hover-interactive group p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col justify-between cursor-pointer';
                    card.innerHTML = `
                        <div class="space-y-2">
                          <div class="flex items-center justify-between">
                            <span class="font-label-caps text-xs text-secondary font-semibold uppercase tracking-wider flex items-center gap-1.5">
                              <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> ${escapeHTML(proj.category ? proj.category.toUpperCase() : 'PROJECT')}
                            </span>
                            <span class="font-telemetry-code text-xs text-on-surface-variant">${escapeHTML(proj.status || 'ACTIVE')}</span>
                          </div>
                          <h4 class="font-headline-sm text-lg font-bold group-hover:text-secondary transition-colors">${escapeHTML(proj.title)}</h4>
                          <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                            ${escapeHTML(proj.description || '')}
                          </p>
                        </div>
                        <div class="flex items-center justify-between pt-4">
                          <div class="flex flex-wrap gap-1.5">
                            ${techStackArray.slice(0, 3).map(tech => `<span class="font-telemetry-code text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface">${escapeHTML(tech)}</span>`).join('')}
                          </div>
                          ${(proj.demo || proj.github) ? `
                            <a class="text-secondary hover:text-secondary-container transition-colors flex items-center gap-1 text-xs font-semibold"
                              href="${proj.demo || proj.github}" target="_blank">
                              <span>View</span>
                              <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                            </a>` : ''}
                        </div>
                    `;
                    subprojectsContainer.appendChild(card);
                });
            }
        }
    }
}

function loadHomeProjects() {
    try {
        const qProjects = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        onSnapshot(qProjects, (snapshot) => {
            cachedProjects = [];
            snapshot.forEach(d => cachedProjects.push({ id: d.id, ...d.data() }));
            renderHomeProjects();
        }, (err) => {
            console.warn("[Index] Projects snapshot with orderBy error, falling back to direct collection:", err);
            onSnapshot(collection(db, 'projects'), (snap) => {
                cachedProjects = [];
                snap.forEach(d => cachedProjects.push({ id: d.id, ...d.data() }));
                renderHomeProjects();
            });
        });
    } catch (error) {
        console.warn("[Index] Error setting up home projects listener:", error);
    }
}

// ------------------------------------------------------------
// 3. HOMEPAGE SHOWCASE & WORKSPACE (Real-time Live Sync)
// ------------------------------------------------------------
const BUILDING_IMAGE_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCg5EtFqdesM_k9uRXfOJDvg89DQ7nwP9XyRrkjA1bZN4BpZ3kVu91qOrAlaCIgf4D8-MOqjMRSuTEEMJAc2iAfyGHzBKQsVOoNdVNAovX_REjOMMWyhtqTJs79OhwBexym_tfMoNqenmOyOBoLVrj5M9NWxcvJ_7HLe8cLIfjakdJ5HLSSJmSVC4Bskxk1hWhZnubJgN3HqVthEgZx8raZ71z9DOV9fPvPce4rOQtGpE0LlP-LX4RkZI91YAYOeeeveg';

const workspacePresets = {
    digital: {
        preset: 'digital',
        name: 'Digital Workspace (Discord & GitHub Hub)',
        category: 'DIGITAL ECOSYSTEM & PLATFORMS',
        title: 'SPHERE DIGITAL WORKSPACE',
        desc: 'The 24/7 virtual engineering campus for distributed pair programming, open-source sprints, and asynchronous collaboration.',
        image: BUILDING_IMAGE_URL,
        badgeTop: 'PLATFORMS // DISCORD & GITHUB MONOREPO',
        badgeBottomLeft: 'STATUS: ONLINE BUILDER MESH // 24/7 CHANNELS',
        badgeBottomRight: 'OPEN ACCESS',
        cards: [
            {
                icon: 'forum',
                title: 'Discord Virtual Campus & Voice Lounges',
                desc: '24/7 lofi coding channels, pair-programming rooms, and live bug-triage sessions with peer engineers.'
            },
            {
                icon: 'terminal',
                title: 'GitHub Monorepo & Open Source Pipelines',
                desc: 'Shared organizational repositories, automated CI/CD checks, issue sprints, and public project showcases.'
            },
            {
                icon: 'auto_stories',
                title: 'Resource Vault & Knowledge Base',
                desc: 'Curated system design guides, interview cheat-sheets, roadmap trackers, and collegiate project templates.'
            }
        ],
        btn1Text: 'JOIN DISCORD WORKSPACE',
        btn1Link: '#join',
        btn2Text: 'EXPLORE GITHUB ORG',
        btn2Link: 'https://github.com/Sphere-Club/Sphere-Coding-Club'
    },
    campus: {
        preset: 'campus',
        name: 'Campus Labs & Hackathon Meetups',
        category: 'COLLEGIATE HUBS & GATHERINGS',
        title: 'SPHERE CAMPUS HUBS',
        desc: 'Where collegiate builders gather in real life for weekend sprints, hackathon takeovers, and architecture reviews.',
        image: BUILDING_IMAGE_URL,
        badgeTop: 'CAMPUS HUBS // LABS & SEMINAR ROOMS',
        badgeBottomLeft: 'STATUS: ACTIVE MEETUPS // COHORTS SYNCED',
        badgeBottomRight: 'CAMPUS COMMUNITY',
        cards: [
            {
                icon: 'computer',
                title: 'Campus Lab Sprints & Jam Sessions',
                desc: 'Bi-weekly in-person weekend hacking in computer labs, turning theoretical assignments into deployed products.'
            },
            {
                icon: 'emoji_events',
                title: 'Hackathon War Rooms & Squad Takeovers',
                desc: 'Dedicated tables and overnight squad coordination during major collegiate and national hackathons.'
            },
            {
                icon: 'co_present',
                title: 'Founder Circles & Tech Talks',
                desc: 'Informal project demos, lightning tech talks, and frank peer feedback on architecture and product design.'
            }
        ],
        btn1Text: 'FIND OUR SQUAD ON CAMPUS',
        btn1Link: '#events',
        btn2Text: 'VIEW UPCOMING MEETUPS',
        btn2Link: '#events'
    },
    perks: {
        preset: 'perks',
        name: 'Builder Perks & Member Support',
        category: 'ENGINEERING ACCELERATION & PERKS',
        title: 'SPHERE BUILDER PERKS',
        desc: 'Everything you need to ship production-grade software without hitting paywalls or getting stuck.',
        image: BUILDING_IMAGE_URL,
        badgeTop: 'RESOURCES // DEV CLOUDS & MENTORS',
        badgeBottomLeft: 'STATUS: COHORTS FUNDED // CREDITS POOLED',
        badgeBottomRight: 'MEMBER ACCESS',
        cards: [
            {
                icon: 'cloud_done',
                title: 'Cloud Sandboxes & Compute Credits',
                desc: 'Free cloud deployment environments, API tier access, shared databases, and hosting for approved squad projects.'
            },
            {
                icon: 'code_blocks',
                title: '1-on-1 Code & Architecture Reviews',
                desc: 'Direct feedback on your pull requests from senior core leads before deploying to real users.'
            },
            {
                icon: 'groups',
                title: 'Hackathon Teaming & Sponsorship',
                desc: 'Pair with skilled teammates, get pitch deck reviews, and receive travel support for prestigious competitions.'
            }
        ],
        btn1Text: 'APPLY FOR COHORT PERKS',
        btn1Link: '#join',
        btn2Text: 'VIEW MEMBER BENEFITS',
        btn2Link: '#about'
    },
    physical: {
        preset: 'physical',
        name: 'Physical Workspace (Original Building & Labs)',
        category: 'PHYSICAL INFRASTRUCTURE & HUBS',
        title: 'SPHERE WORKSPACE',
        desc: 'The physical epicenter for deep-tech research, high-throughput hackathons, and hardware-software co-engineering.',
        image: BUILDING_IMAGE_URL,
        badgeTop: 'LOCATION // SECTOR 04 - TECH CORRIDOR',
        badgeBottomLeft: 'STATUS: ACTIVE BUILDER HUB // CAPACITY 350+ SEATS',
        badgeBottomRight: '24/7 BADGE ACCESS',
        cards: [
            {
                icon: 'precision_manufacturing',
                title: 'Rapid Prototyping Lab',
                desc: '24/7 access to high-compute clusters, 3D printers, and edge hardware benches.'
            },
            {
                icon: 'co_present',
                title: 'Collaborative Amphitheatre',
                desc: 'Dedicated space for keynote livestreams, founder pitch decks, and internal demo days.'
            },
            {
                icon: 'workspaces',
                title: 'Open Hacker Commons',
                desc: 'Zero-distraction quiet pods, gigabit fiber mesh, and ergonomic pairing stations.'
            }
        ],
        btn1Text: 'EXPLORE VIRTUAL CAMPUS TOUR',
        btn1Link: '#workspace',
        btn2Text: 'REQUEST DESK PASS',
        btn2Link: '#join'
    }
};

function renderHomeWorkspace(showcaseData) {
    const wsSection = document.getElementById('workspace');
    if (!wsSection) return;

    const ws = (showcaseData && showcaseData.workspace) || workspacePresets.digital;
    if (ws.enabled === false) {
        wsSection.classList.add('hidden');
        return;
    }
    wsSection.classList.remove('hidden');

    const catEl = document.getElementById('home-ws-category');
    if (catEl) {
        catEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span> <span>${escapeHTML(ws.category || 'INFRASTRUCTURE & HUBS')}</span>`;
    }

    const titleEl = document.getElementById('home-ws-title');
    if (titleEl) titleEl.textContent = ws.title || 'SPHERE WORKSPACE';

    const descEl = document.getElementById('home-ws-desc');
    if (descEl) descEl.textContent = ws.desc || '';

    const imgEl = document.getElementById('home-ws-img');
    if (imgEl) {
        imgEl.src = ws.image || BUILDING_IMAGE_URL;
    }

    const badgeTop = document.getElementById('home-ws-badge-top');
    if (badgeTop) badgeTop.textContent = ws.badgeTop || '';

    const badgeBL = document.getElementById('home-ws-badge-bottom-left');
    if (badgeBL) badgeBL.textContent = ws.badgeBottomLeft || '';

    const badgeBR = document.getElementById('home-ws-badge-bottom-right');
    if (badgeBR) badgeBR.textContent = ws.badgeBottomRight || '';

    const cardsContainer = document.getElementById('home-ws-cards-container');
    if (cardsContainer) {
        cardsContainer.innerHTML = '';
        const fallbackCards = (workspacePresets[ws.preset] || workspacePresets.digital).cards;
        const cards = (Array.isArray(ws.cards) && ws.cards.length === 3) ? ws.cards : fallbackCards;
        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex items-start gap-4 hover:border-secondary/30 transition-all';
            cardEl.innerHTML = `
              <div class="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                <span class="material-symbols-outlined text-[22px]">${escapeHTML(card.icon || 'hub')}</span>
              </div>
              <div>
                <h4 class="font-headline-sm text-base font-bold text-on-surface">${escapeHTML(card.title || '')}</h4>
                <p class="font-body-sm text-xs text-on-surface-variant mt-1 leading-relaxed">${escapeHTML(card.desc || '')}</p>
              </div>
            `;
            cardsContainer.appendChild(cardEl);
        });
    }

    const buttonsContainer = document.getElementById('home-ws-buttons-container');
    if (buttonsContainer) {
        buttonsContainer.innerHTML = '';
        if (ws.btn1Text) {
            const a1 = document.createElement('a');
            const b1Upper = (ws.btn1Text || '').toUpperCase();
            if (b1Upper.includes('DISCORD')) {
                a1.href = '#discord';
                a1.setAttribute('data-discord-soon', 'true');
                a1.className = 'shimmer-btn discord-soon-btn px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-title-caps text-xs uppercase tracking-wider hover:bg-secondary-container transition-all cursor-pointer';
            } else if (b1Upper.includes('GITHUB')) {
                a1.href = (ws.btn1Link && ws.btn1Link.length > 5 && !ws.btn1Link.endsWith('github.com')) ? ws.btn1Link : 'https://github.com/Sphere-Club/Sphere-Coding-Club';
                a1.target = '_blank';
                a1.rel = 'noopener noreferrer';
                a1.className = 'shimmer-btn px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-title-caps text-xs uppercase tracking-wider hover:bg-secondary-container transition-all';
            } else {
                a1.href = ws.btn1Link || '#';
                a1.className = 'shimmer-btn px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-title-caps text-xs uppercase tracking-wider hover:bg-secondary-container transition-all';
            }
            a1.textContent = ws.btn1Text;
            buttonsContainer.appendChild(a1);
        }
        if (ws.btn2Text) {
            const a2 = document.createElement('a');
            const b2Upper = (ws.btn2Text || '').toUpperCase();
            if (b2Upper.includes('DISCORD')) {
                a2.href = '#discord';
                a2.setAttribute('data-discord-soon', 'true');
                a2.className = 'discord-soon-btn px-6 py-2.5 rounded-full bg-surface-container text-on-surface font-title-caps text-xs uppercase tracking-wider hover:bg-surface-container-high transition-all border border-surface-container cursor-pointer';
            } else if (b2Upper.includes('GITHUB')) {
                a2.href = (ws.btn2Link && ws.btn2Link.length > 5 && !ws.btn2Link.endsWith('github.com')) ? ws.btn2Link : 'https://github.com/Sphere-Club/Sphere-Coding-Club';
                a2.target = '_blank';
                a2.rel = 'noopener noreferrer';
                a2.className = 'px-6 py-2.5 rounded-full bg-surface-container text-on-surface font-title-caps text-xs uppercase tracking-wider hover:bg-surface-container-high transition-all border border-surface-container';
            } else {
                a2.href = ws.btn2Link || '#';
                a2.className = 'px-6 py-2.5 rounded-full bg-surface-container text-on-surface font-title-caps text-xs uppercase tracking-wider hover:bg-surface-container-high transition-all border border-surface-container';
            }
            a2.textContent = ws.btn2Text;
            buttonsContainer.appendChild(a2);
        }
    }
}

function loadHomepageShowcase() {
    try {
        const showcaseDocRef = doc(db, 'settings', 'homepage_showcase');

        // Real-time listener: updates homepage immediately when saved in admin
        onSnapshot(showcaseDocRef, (showcaseSnap) => {
            if (!showcaseSnap.exists()) return;
            const data = showcaseSnap.data();
            cachedShowcaseData = data;
            renderHomeProjects();
            renderHomeWorkspace(data);

            // Render Featured Events ("Where Builders Converge")
            const eventsContainer = document.getElementById('home-events-container');
            if (eventsContainer) {
                const isNoEvents = !!data.noEvents;
                const activeEvents = (Array.isArray(data.events) ? data.events : []).filter(ev => ev && ev.enabled !== false);

                if (isNoEvents || activeEvents.length === 0) {
                    // Render clean, tidy aerospace empty state card matching the existing design
                    const empty = data.emptyState || {
                        title: "No Live Gatherings Scheduled Right Now",
                        desc: "Our core leads are architecting the next cycle of collegiate hackathons, production workshops, and founder pitch sessions. Join our community Discord to be the first to receive invitations!",
                        btnText: "JOIN DISCORD",
                        btnLink: "#join"
                    };

                    const emptyTitle = escapeHTML(empty.title || "No Live Gatherings Scheduled Right Now");
                    const emptyDesc = escapeHTML(empty.desc || "Our core leads are architecting the next cycle of events. Stay tuned!");
                    const emptyBtnText = escapeHTML(empty.btnText || "JOIN DISCORD");
                    const emptyBtnLink = escapeHTML(empty.btnLink || "#join");

                    eventsContainer.innerHTML = `
                        <div class="card-hover-interactive group p-6 sm:p-8 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300">
                          <div class="flex items-start gap-5">
                            <div class="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-surface-container text-center shrink-0 group-hover:bg-secondary-container group-hover:text-on-secondary transition-all duration-300">
                              <span class="material-symbols-outlined text-secondary group-hover:text-on-secondary text-[28px]">event_upcoming</span>
                            </div>
                            <div>
                              <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span class="px-2.5 py-0.5 rounded-full bg-secondary-container/15 text-secondary border border-secondary/20 font-label-caps text-[10px] tracking-wider uppercase font-semibold">
                                  UPCOMING SPRINT IN PLANNING
                                </span>
                                <span class="font-telemetry-code text-xs text-on-surface-variant flex items-center gap-1.5">
                                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM ACTIVE
                                </span>
                              </div>
                              <h3 class="font-headline-sm text-lg md:text-xl font-bold text-on-surface group-hover:text-secondary transition-colors">
                                ${emptyTitle}
                              </h3>
                              <p class="font-body-sm text-xs text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
                                ${emptyDesc}
                              </p>
                            </div>
                          </div>
                          <div class="flex items-center gap-4 shrink-0">
                            <div class="font-telemetry-code text-xs text-on-surface-variant text-right hidden sm:block">
                              COMMUNITY HUB // DISCORD
                            </div>
                            <a href="${emptyBtnLink}" target="_blank" class="shimmer-btn px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-title-caps text-xs uppercase tracking-wider hover:bg-secondary-container hover:scale-105 transition-all text-center block">
                              ${emptyBtnText}
                            </a>
                          </div>
                        </div>
                    `;
                } else {
                    eventsContainer.innerHTML = '';
                    const categoryStyles = {
                        hackathon: {
                            badgeBg: 'bg-secondary-container text-on-secondary',
                            dateHover: 'group-hover:bg-secondary-container group-hover:text-on-secondary',
                            monthColor: 'text-secondary group-hover:text-on-secondary',
                            dayColor: 'text-on-surface group-hover:text-on-secondary',
                            pulseColor: 'bg-secondary',
                            defaultBtnStyle: 'shimmer'
                        },
                        workshop: {
                            badgeBg: 'bg-surface-container-high text-on-surface',
                            dateHover: 'group-hover:bg-surface-container-high',
                            monthColor: 'text-secondary',
                            dayColor: 'text-on-surface',
                            pulseColor: 'bg-secondary',
                            defaultBtnStyle: 'surface'
                        },
                        demoday: {
                            badgeBg: 'bg-secondary-container/15 text-secondary border border-secondary/20',
                            dateHover: 'group-hover:bg-surface-container-high',
                            monthColor: 'text-secondary',
                            dayColor: 'text-on-surface',
                            pulseColor: 'bg-secondary',
                            defaultBtnStyle: 'surface'
                        },
                        meetup: {
                            badgeBg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
                            dateHover: 'group-hover:bg-emerald-500/10',
                            monthColor: 'text-emerald-600',
                            dayColor: 'text-on-surface',
                            pulseColor: 'bg-emerald-500',
                            defaultBtnStyle: 'surface'
                        }
                    };

                    activeEvents.forEach((ev, idx) => {
                        const month = escapeHTML(ev.month || 'EVT');
                        const day = escapeHTML(ev.day || '•');
                        const badge = escapeHTML(ev.badge || 'UPCOMING');
                        const duration = escapeHTML(ev.duration || 'SESSION');
                        const title = escapeHTML(ev.title || 'Sphere Event');
                        const desc = escapeHTML(ev.desc || '');
                        const venue = escapeHTML(ev.venue || 'HYBRID / VIRTUAL');
                        const btnText = escapeHTML(ev.btnText || 'REGISTER');
                        const btnLink = escapeHTML(ev.btnLink || '#join');

                        const catKey = (ev.category || (idx === 0 ? 'hackathon' : (idx === 1 ? 'workshop' : 'demoday'))).toLowerCase();
                        const catStyle = categoryStyles[catKey] || categoryStyles.hackathon;

                        const badgeBg = catStyle.badgeBg;
                        const dateHover = catStyle.dateHover;
                        const monthColor = catStyle.monthColor;
                        const dayColor = catStyle.dayColor;
                        const pulseColor = catStyle.pulseColor;

                        const effectiveBtnStyle = ev.btnStyle || catStyle.defaultBtnStyle;
                        const isShimmer = effectiveBtnStyle === 'shimmer';

                        const btnClasses = isShimmer
                            ? 'shimmer-btn px-6 py-2 rounded-full bg-secondary text-on-secondary font-title-caps text-xs uppercase tracking-wider hover:bg-secondary-container hover:scale-105 transition-all text-center block'
                            : 'px-6 py-2 rounded-full bg-surface-container text-on-surface font-title-caps text-xs uppercase tracking-wider hover:bg-surface-container-high hover:scale-105 transition-all text-center block';

                        const card = document.createElement('div');
                        card.className = 'card-hover-interactive group p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer';
                        card.innerHTML = `
                            <div class="flex items-start gap-5">
                              <div class="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-surface-container text-center shrink-0 ${dateHover} transition-all duration-300">
                                <span class="font-title-caps text-xs ${monthColor} font-bold">${month}</span>
                                <span class="font-headline-sm text-xl ${dayColor} font-bold">${day}</span>
                              </div>
                              <div>
                                <div class="flex items-center gap-2 mb-1">
                                  <span class="px-2 py-0.5 rounded-full ${badgeBg} font-label-caps text-[10px] tracking-wider uppercase font-semibold">
                                    ${badge}
                                  </span>
                                  <span class="font-telemetry-code text-xs text-on-surface-variant flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 rounded-full ${pulseColor} animate-pulse"></span> ${duration}
                                  </span>
                                </div>
                                <h3 class="font-headline-sm text-lg font-bold text-on-surface group-hover:text-secondary transition-colors">
                                  ${title}
                                </h3>
                                <p class="font-body-sm text-xs text-on-surface-variant mt-1">
                                  ${desc}
                                </p>
                              </div>
                            </div>
                            <div class="flex items-center gap-4 shrink-0">
                              <div class="font-telemetry-code text-xs text-on-surface-variant text-right hidden sm:block">
                                ${venue}
                              </div>
                              <a href="${btnLink}" target="_blank" class="${btnClasses}">
                                ${btnText}
                              </a>
                            </div>
                        `;
                        eventsContainer.appendChild(card);
                    });
                }
            }

            // Render Founders Constellation ("The Minds Behind A Brighter Tomorrow" - Top Tier)
            if (data.founders && Array.isArray(data.founders) && data.founders.length > 0) {
                const foundersContainer = document.getElementById('home-founders-container');
                if (foundersContainer) {
                    foundersContainer.innerHTML = '';
                    data.founders.forEach((f, idx) => {
                        const name = escapeHTML(f.name || 'Sphere Leader');
                        const role = escapeHTML(f.role || 'FOUNDER');
                        const image = f.image ? f.image.trim() : getMemberPhoto(f);
                        const quote = escapeHTML(f.quote || 'Building a brighter tomorrow, together.');
                        const orb = escapeHTML(f.orbStyle || (idx === 0 ? 'globe-3d-deep' : (idx === 1 ? 'globe-3d-pearl' : 'globe-3d-azure')));

                        const interestsFormatted = (f.interests || 'Technology\nInnovation\nCommunities')
                            .split('\n')
                            .map(line => escapeHTML(line.trim()))
                            .filter(Boolean)
                            .join('<br/>');

                        const skillsFormatted = (f.skills || 'Leadership\nProduct Thinking\nProblem Solving')
                            .split('\n')
                            .map(line => escapeHTML(line.trim()))
                            .filter(Boolean)
                            .join('<br/>');

                        const funFactFormatted = escapeHTML(f.funFact || "Always curious what's next!");
                        const isSoloFounder = role.toUpperCase() === 'FOUNDER';

                        const card = document.createElement('div');
                        card.className = 'leadership-tilt-card group relative rounded-3xl bg-surface-container-lowest shadow-xl border border-secondary/20 p-6 flex flex-col items-center text-center overflow-hidden cursor-pointer';
                        card.innerHTML = `
                            <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-surface-container-high/50 rounded-full blur-2xl pointer-events-none animate-pulse-ring"></div>
                            <div class="relative w-40 h-40 sm:w-48 sm:h-48 mb-4 flex items-center justify-center">
                              <div class="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] pointer-events-none animate-orbit-slow">
                                <div class="w-full h-full rounded-full border-2 border-secondary-container/60 transform -rotate-[30deg] relative">
                                  <div class="w-5 h-5 rounded-full ${orb} absolute -top-2.5 left-1/2 -translate-x-1/2 shadow-[0_0_14px_rgba(56,189,248,0.85)]"></div>
                                </div>
                              </div>
                              <div class="relative z-10 w-full h-full rounded-full p-1 bg-surface-container shadow-[inset_0_0_0_2px_#ffffff,0_0_0_3px_#8EC5FF,0_8px_30px_rgba(59,130,255,0.35)] overflow-hidden group-hover:scale-105 transition-all duration-500">
                                <img alt="${name} - ${role}" class="w-full h-full object-cover rounded-full" src="${image}" onerror="this.onerror=null; this.src='assets/images/sphere-logo.png'"/>
                              </div>
                            </div>
                            <div class="inline-flex items-center px-4 py-1 rounded-full ${isSoloFounder ? 'bg-secondary-container' : 'bg-secondary'} text-on-secondary font-title-caps text-[11px] tracking-[0.22em] uppercase font-bold mb-2">
                              ${role}
                            </div>
                            <h3 class="font-headline-md text-xl font-bold uppercase tracking-[0.16em] mb-1 group-hover:text-secondary transition-colors">
                              ${name}
                            </h3>
                            <div class="w-full p-2.5 rounded-xl bg-surface-container-low/70 mb-4 border border-surface-container">
                              <span class="font-body-sm text-xs text-on-surface font-medium italic">“${quote}”</span>
                            </div>
                            <div class="w-full rounded-xl bg-surface-container-lowest shadow-sm p-3 grid grid-cols-3 gap-1 text-center border border-surface-container">
                              <div class="flex flex-col items-center px-1 py-1 hover:bg-surface-container-low/50 rounded transition-all">
                                <span class="material-symbols-outlined text-secondary text-[18px] mb-1">laptop_chromebook</span>
                                <span class="font-label-caps text-[9px] font-bold uppercase mb-1">INTERESTS</span>
                                <span class="font-body-sm text-[10px] leading-tight text-on-surface-variant">${interestsFormatted}</span>
                              </div>
                              <div class="flex flex-col items-center px-1 py-1 bg-surface-container-low/40 rounded">
                                <span class="material-symbols-outlined text-secondary text-[18px] mb-1">code</span>
                                <span class="font-label-caps text-[9px] font-bold uppercase mb-1">SKILLS</span>
                                <span class="font-body-sm text-[10px] leading-tight text-on-surface-variant">${skillsFormatted}</span>
                              </div>
                              <div class="flex flex-col items-center px-1 py-1 hover:bg-surface-container-low/50 rounded transition-all">
                                <span class="material-symbols-outlined text-secondary text-[18px] mb-1">lightbulb</span>
                                <span class="font-label-caps text-[9px] font-bold uppercase mb-1">FUN FACT</span>
                                <span class="font-body-sm text-[10px] leading-tight text-on-surface-variant">${funFactFormatted}</span>
                              </div>
                            </div>
                        `;
                        foundersContainer.appendChild(card);
                    });
                }
            }

            // Render Core Leads ("The Minds Behind A Brighter Tomorrow" - Bottom Tier)
            if (data.leads && Array.isArray(data.leads) && data.leads.length > 0) {
                const leadsContainer = document.getElementById('home-leads-container');
                if (leadsContainer) {
                    leadsContainer.innerHTML = '';
                    data.leads.forEach(l => {
                        const name = escapeHTML(l.name || 'Core Lead');
                        const role = escapeHTML(l.role || 'LEAD');
                        const image = l.image ? l.image.trim() : getMemberPhoto(l);
                        const quote = escapeHTML(l.quote || 'Driving ideas forward, together.');
                        const interests = escapeHTML(l.interests || 'Technology, Innovation');
                        const skills = escapeHTML(l.skills || 'Problem Solving');
                        const funFact = escapeHTML(l.funFact || 'Up for new challenges!');

                        const card = document.createElement('div');
                        card.className = 'card-hover-interactive group rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container p-6 flex flex-col items-center text-center cursor-pointer';
                        card.innerHTML = `
                            <div class="w-24 h-24 rounded-full p-1 bg-surface-container shadow-[0_0_0_2px_#3B82FF] overflow-hidden mb-4 group-hover:scale-110 transition-all duration-300">
                              <img alt="${name} - ${role}" class="w-full h-full object-cover rounded-full" src="${image}" onerror="this.onerror=null; this.src='assets/images/sphere-logo.png'"/>
                            </div>
                            <div class="inline-flex items-center px-3 py-0.5 rounded-full bg-surface-container-high font-label-caps text-[10px] text-secondary font-semibold uppercase tracking-widest mb-1.5">
                              <span class="w-1.5 h-1.5 rounded-full bg-secondary mr-1.5"></span> ${role}
                            </div>
                            <div class="font-headline-sm text-lg font-bold uppercase tracking-wide mb-1 group-hover:text-secondary transition-colors">
                              ${name}
                            </div>
                            <p class="font-body-sm text-xs text-on-surface-variant mb-3">“${quote}”</p>
                            <div class="w-full rounded-xl bg-surface-container-low/40 p-3 text-left border border-surface-container space-y-1">
                              <div class="font-telemetry-code text-[11px]"><span class="text-secondary font-semibold">Interests:</span> ${interests}</div>
                              <div class="font-telemetry-code text-[11px]"><span class="text-secondary font-semibold">Skills:</span> ${skills}</div>
                              <div class="font-telemetry-code text-[11px] text-on-surface-variant italic"><span class="text-secondary font-semibold not-italic">Fun Fact:</span> ${funFact}</div>
                            </div>
                        `;
                        leadsContainer.appendChild(card);
                    });
                }
            }
        }, (error) => {
            console.warn("[Index] Realtime showcase listener error:", error);
        });
    } catch (error) {
        console.warn("[Index] Error setting up homepage showcase listener:", error);
    }
}

// ------------------------------------------------------------
// LIFECYCLE INITIALIZATION
// Robust against already-loaded DOM / deferred module execution
// ------------------------------------------------------------
const initHomePage = () => {
    loadHomeStats();
    loadHomeProjects();
    loadHomepageShowcase();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}
