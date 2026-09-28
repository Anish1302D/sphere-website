import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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

(async () => {
    const tier1Grid = document.getElementById('tier-1-grid');
    const tier2Grid = document.getElementById('tier-2-grid');
    if (!tier1Grid || !tier2Grid) return;

    try {
        tier1Grid.innerHTML = '<p class="text-on-surface-variant/50 text-center col-span-full py-12">Loading leadership...</p>';
        const q = query(collection(db, 'team'), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        
        tier1Grid.innerHTML = '';
        tier2Grid.innerHTML = '';

        // Exact 6 members the user requested
        const targetMembers = [
            "anish mogam",
            "madhura lakade",
            "shreyash atre",
            "shreyas gore",
            "isha joshi",
            "mihir mehendake", // They explicitly requested this spelling
            "mihir mendake",   // Fallback for Firestore spelling
            "shreyas atre"     // Fallback for Firestore spelling
        ];
        
        const renderedMembers = new Set();

        const getFallbackPhoto = (nameLower) => {
            if (nameLower.includes("anish")) return "assets/images/anish.jpg";
            if (nameLower.includes("madhura")) return "assets/images/madhura.jpg";
            if (nameLower.includes("shreyash") || nameLower.includes("shreyas atre")) return "assets/images/shreyash.jpg";
            if (nameLower.includes("shreyas gore")) return "assets/images/shreyasgore.jpg";
            if (nameLower.includes("isha")) return "assets/images/isha.jpg";
            if (nameLower.includes("mihir")) return "assets/images/mihir.jpg";
            return "assets/images/sphere-logo.png";
        };

        const createTier1Card = (data) => {
            const el = document.createElement('div');
            el.className = 'group relative flex flex-col bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden';
            
            const githubLink = data.github ? `<a href="${data.github}" target="_blank" class="text-on-surface-variant hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>` : '';
            const linkedinLink = data.linkedin ? `<a href="${data.linkedin}" target="_blank" class="text-on-surface-variant hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>` : '';
            
            let imgSrc = 'assets/images/sphere-logo.png';
            if (data.image && data.image.trim().length > 0 && data.image !== "No base64 provided") {
                if (data.image.includes('"') || data.image.includes('Name:')) {
                    imgSrc = getFallbackPhoto((data.name || "").toLowerCase());
                } else {
                    imgSrc = data.image.trim();
                }
            } else {
                imgSrc = getFallbackPhoto((data.name || "").toLowerCase());
            }
            if (imgSrc.startsWith('assets/images/')) {
                imgSrc += '?v=' + new Date().getTime();
            }

            el.innerHTML = `
            <div class="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
            <div class="flex items-center justify-between text-on-surface-variant mb-6">
                <span class="font-label-caps text-label-caps uppercase text-secondary">PEOPLE • IDEAS • IMPACT</span>
                <div class="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center">
                    <span class="material-symbols-outlined text-secondary text-[14px]">token</span>
                </div>
            </div>
            <div class="relative w-52 h-52 mx-auto my-4 flex items-center justify-center">
                <svg class="absolute inset-0 w-full h-full pointer-events-none -rotate-12 animate-pulse" fill="none" viewBox="0 0 200 200">
                    <ellipse class="text-secondary/40" cx="100" cy="100" rx="94" ry="42" stroke="currentColor" stroke-dasharray="4 4" stroke-width="1.5"></ellipse>
                </svg>
                <div class="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-secondary-container shadow-md"></div>
                <div class="absolute w-44 h-44 rounded-full bg-surface-container-highest/50 blur-sm"></div>
                <div class="relative w-40 h-40 rounded-full p-1 bg-surface-container-lowest shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#3B82FF,0_12px_28px_rgba(20,91,255,0.25)] overflow-hidden flex items-center justify-center">
                    <img class="w-full h-full rounded-full object-cover object-top" src="${imgSrc}" alt="${escapeHTML(data.name)}">
                </div>
            </div>
            <div class="flex justify-center mt-2 mb-4 relative z-10">
                <span class="bg-secondary-container text-on-secondary font-label-caps text-label-caps uppercase px-6 py-1 rounded-full shadow-sm">
                    ${data.role || 'Member'}
                </span>
            </div>
            <div class="text-center mb-4 relative z-10">
                <h3 class="font-headline-lg text-headline-lg text-on-surface uppercase tracking-wider">
                    ${escapeHTML(data.name)}
                </h3>
            </div>
            <div class="flex justify-center gap-3 relative z-10">
                ${githubLink}
                ${linkedinLink}
            </div>
            `;
            return el;
        };

        const createTier2Card = (data) => {
            const el = document.createElement('div');
            el.className = 'relative bg-surface-container-lowest rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center overflow-hidden';
            
            const githubLink = data.github ? `<a href="${data.github}" target="_blank" class="text-on-surface-variant hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>` : '';
            const linkedinLink = data.linkedin ? `<a href="${data.linkedin}" target="_blank" class="text-on-surface-variant hover:text-secondary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>` : '';
            
            let imgSrc = 'assets/images/sphere-logo.png';
            if (data.image && data.image.trim().length > 0 && data.image !== "No base64 provided") {
                if (data.image.includes('"') || data.image.includes('Name:')) {
                    imgSrc = getFallbackPhoto((data.name || "").toLowerCase());
                } else {
                    imgSrc = data.image.trim();
                }
            } else {
                imgSrc = getFallbackPhoto((data.name || "").toLowerCase());
            }
            if (imgSrc.startsWith('assets/images/')) {
                imgSrc += '?v=' + new Date().getTime();
            }

            el.innerHTML = `
            <div class="absolute top-0 right-0 w-32 h-32 bg-surface-container blur-2xl rounded-full pointer-events-none"></div>
            <span class="font-label-caps text-label-caps uppercase tracking-wider bg-surface-container text-secondary px-4 py-1 rounded-full mb-6 z-10">
                ${data.role || 'Member'}
            </span>
            <div class="relative w-44 h-56 rounded-xl overflow-hidden shadow-md mb-6 bg-surface-container-low flex items-center justify-center">
                <img alt="${escapeHTML(data.name)}" class="w-full h-full object-cover object-top" src="${imgSrc}">
                <div class="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent"></div>
            </div>
            <h3 class="font-headline-sm text-headline-sm text-on-surface uppercase mb-1 z-10">
                ${escapeHTML(data.name)}
            </h3>
            <div class="flex justify-center gap-3 mt-1 relative z-10">
                ${githubLink}
                ${linkedinLink}
            </div>
            `;
            return el;
        };

        const foundMembers = [];

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const nameLower = (data.name || '').trim().toLowerCase();
            if (targetMembers.includes(nameLower)) {
                foundMembers.push(data);
                renderedMembers.add(nameLower);
            }
        });

        // The user explicitly requested these names in this order:
        // 1. Anish Mogam
        // 2. Madhura Lakade
        // 3. Shreyash Atre
        // 4. Shreyas Gore
        // 5. Isha Joshi
        // 6. Mihir Mehendake
        const finalOrder = [
            { name: "Anish Mogam", role: "Founder", tier: 1 },
            { name: "Madhura Lakade", role: "Co-Founder", tier: 1 },
            { name: "Shreyash Atre", role: "Co-Founder", tier: 1 },
            { name: "Shreyas Gore", role: "Manager", tier: 2 },
            { name: "Isha Joshi", role: "Administrator", tier: 2 },
            { name: "Mihir Mehendake", role: "Core Team Lead", tier: 2 }
        ];

        const hardcodedLinks = {
            "Anish Mogam": {
                github: "https://github.com/Anish1302D",
                linkedin: "https://www.linkedin.com/in/anish-mogam/"
            },
            "Shreyash Atre": {
                github: "https://github.com/shreyash0216",
                linkedin: "https://www.linkedin.com/in/shreyash-atre-901340317/"
            },
            "Isha Joshi": {
                github: "https://github.com/ishaj306",
                linkedin: "https://www.linkedin.com/in/isha-joshi-4b1074319/"
            }
        };

        finalOrder.forEach(item => {
            let data = foundMembers.find(fm => (fm.name || "").toLowerCase().includes(item.name.toLowerCase().split(' ')[0]));
            if (!data) {
                // Not found in Firestore, use default fallback
                data = {
                    name: item.name,
                    role: item.role,
                    image: getFallbackPhoto(item.name.toLowerCase()),
                    github: null,
                    linkedin: null
                };
            }
            
            // Explicitly override role and links for specific users
            data.role = item.role;
            if (hardcodedLinks[item.name]) {
                data.github = hardcodedLinks[item.name].github;
                data.linkedin = hardcodedLinks[item.name].linkedin;
            }
            
            // Preserve the Firestore data if available, but correct the name visually if desired.
            if (item.tier === 1) {
                tier1Grid.appendChild(createTier1Card(data));
            } else {
                tier2Grid.appendChild(createTier2Card(data));
            }
        });

    } catch (error) {
        console.error("Error fetching leadership:", error);
        tier1Grid.innerHTML = '<p class="text-error text-center col-span-full py-12">Failed to load leadership.</p>';
        tier2Grid.innerHTML = '<p class="text-error text-center col-span-full py-12">Failed to load leadership.</p>';
    }
})();
