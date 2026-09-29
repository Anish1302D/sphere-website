document.addEventListener('DOMContentLoaded', () => {
    // Purge any lingering custom cursor elements or classes
    document.documentElement.classList.remove('sphere-cursor-active', 'sphere-cursor-enabled');
    const lingeringCursor = document.getElementById('sphere-cursor-container');
    if (lingeringCursor) lingeringCursor.remove();
    document.querySelectorAll('.sphere-cursor-ripple, .sphere-click-ripple').forEach(el => el.remove());

    // =========================================
    // Mobile Menu — Full-screen Overlay Drawer
    // =========================================
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
    const menuIcon = menuToggle ? menuToggle.querySelector('.material-symbols-outlined') : null;
    if (mobileMenu && !mobileMenu.classList.contains('active') && !mobileMenu.classList.contains('translate-x-0')) {
        mobileMenu.classList.add('pointer-events-none', 'opacity-0', 'invisible');
    }

    function openMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('active');
        mobileMenu.classList.remove('translate-x-full', 'pointer-events-none', 'opacity-0', 'invisible');
        mobileMenu.classList.add('translate-x-0');
        document.body.style.overflow = 'hidden';
        if (menuIcon) menuIcon.textContent = 'close';
    }

    function closeMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('active', 'translate-x-0');
        mobileMenu.classList.add('translate-x-full', 'pointer-events-none', 'opacity-0', 'invisible');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if (menuIcon) menuIcon.textContent = 'menu';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileMenu && (mobileMenu.classList.contains('active') || mobileMenu.classList.contains('translate-x-0'))) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closeMobileMenu();
        });
    }

    // Close menu when clicking outside or directly on the overlay background
    if (mobileMenu) {
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) closeMobileMenu();
        });
    }

    // Close menu when any link is clicked
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileMenu();
    });


    // =========================================
    // Google Form Modal Logic
    // =========================================
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'sphere-google-form-modal';
    modalOverlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 p-2 sm:p-4 md:p-8';
    modalOverlay.innerHTML = `
        <div class="relative w-full max-w-4xl h-[92dvh] sm:h-[88vh] bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-2xl transform scale-95 transition-transform duration-300 flex flex-col">
            <div class="flex items-center justify-between px-4 py-3 sm:p-4 border-b border-outline-variant bg-surface-container-low shrink-0">
                <h3 class="font-headline-md text-lg sm:text-xl text-on-surface font-bold tracking-tight">Join Sphere Community</h3>
                <button class="modal-close text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-surface-container-highest min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close dialog">
                    <span class="material-symbols-outlined text-[24px]">close</span>
                </button>
            </div>
            <div class="flex-1 w-full relative bg-white">
                <div class="absolute inset-0 flex items-center justify-center bg-black/10 z-0">
                    <span class="w-8 h-8 rounded-full bg-primary inline-block animate-pulse"></span>
                </div>
                <iframe src="https://docs.google.com/forms/d/e/1FAIpQLSfE64tcRic6_vQqcpif40T0oJbLrn1YLjwKidKTk8FzUGKTwg/viewform?embedded=true" class="absolute inset-0 w-full h-full z-10 border-0" marginheight="0" marginwidth="0">Loading...</iframe>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    const modalContent = modalOverlay.querySelector('.relative.w-full.max-w-4xl');
    const closeBtn = modalOverlay.querySelector('.modal-close');

    const openModal = (e) => {
        if (e) e.preventDefault();
        // Close mobile menu first if open
        closeMobileMenu();
        modalOverlay.classList.remove('opacity-0', 'pointer-events-none');
        modalContent.classList.remove('scale-95');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modalOverlay.classList.add('opacity-0', 'pointer-events-none');
        modalContent.classList.add('scale-95');
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // =========================================
    // Public Toast Notifications (Aerospace UI)
    // =========================================
    function showPublicToast(message, icon = 'forum') {
        let container = document.getElementById('public-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'public-toast-container';
            container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'px-4 py-3.5 rounded-2xl shadow-xl border border-secondary/40 bg-surface-container-lowest text-on-surface text-xs font-title-caps font-semibold tracking-wider uppercase flex items-center gap-3 transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto backdrop-blur-md shadow-[0_8px_30px_rgba(17,90,254,0.2)]';
        toast.innerHTML = `
            <div class="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[18px]">${icon}</span>
            </div>
            <div class="flex-1 font-body-sm text-xs font-medium text-on-surface normal-case leading-snug">
                <span class="font-bold text-secondary font-title-caps text-xs tracking-wider uppercase block mb-0.5">Discord Status</span>
                ${message}
            </div>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        });

        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 350);
        }, 4000);
    }
    window.showPublicToast = showPublicToast;

    // =========================================
    // Global Click Delegation:
    // 1. Google Form Modal (#join, #apply, data-form="google-join")
    // 2. Discord Workspaces & Nexus ("Discord will be live soon")
    // 3. GitHub Org Links (redirect to official org repo)
    // =========================================
    document.addEventListener('click', (e) => {
        // 1. Check for Discord buttons first
        const discordBtn = e.target.closest('a[data-discord-soon="true"], .discord-soon-btn, a[href="#discord"]');
        let isDiscordAction = !!discordBtn;

        const anchor = e.target.closest('a');
        if (anchor && !isDiscordAction) {
            const txt = (anchor.textContent || '').trim().toUpperCase();
            if (txt.includes('DISCORD WORKSPACE') || txt.includes('DISCORD NEXUS')) {
                isDiscordAction = true;
            }
        }

        if (isDiscordAction) {
            e.preventDefault();
            e.stopPropagation();
            showPublicToast("Discord will be live soon! Stay tuned.", "forum");
            return;
        }

        // 2. Check for GitHub Org button clicks to ensure accurate repo link
        if (anchor) {
            const txt = (anchor.textContent || '').trim().toUpperCase();
            if (txt.includes('GITHUB ORG') || txt.includes('EXPLORE GITHUB ORG')) {
                anchor.href = 'https://github.com/Sphere-Club/Sphere-Coding-Club';
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
            }
        }

        // 3. Check for Google Form modal triggers
        const formBtn = e.target.closest('a[href="#join"], a[href="#register"], a[href="#apply"], [data-form="google-join"]');
        if (formBtn) {
            openModal(e);
        }
    });
});

