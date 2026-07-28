document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // Mobile Menu — Full-screen Overlay Drawer
    // =========================================
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenuLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
    const menuIcon = menuToggle ? menuToggle.querySelector('.material-symbols-outlined') : null;

    function openMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (menuIcon) menuIcon.textContent = 'close';
    }

    function closeMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
        if (menuIcon) menuIcon.textContent = 'menu';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
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
    const joinButtons = document.querySelectorAll('a[href="#join"], a[href="#register"]');
    if (joinButtons.length > 0) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 p-4 md:p-8';
        modalOverlay.innerHTML = `
            <div class="relative w-full max-w-4xl h-[90vh] glass-panel rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,207,255,0.3)] transform scale-95 transition-transform duration-300 flex flex-col">
                <div class="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
                    <h3 class="font-display text-xl text-white font-bold tracking-tight">Join Sphere Coding Club</h3>
                    <button class="modal-close text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                        <span class="material-symbols-outlined">close</span>
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

        const modalContent = modalOverlay.querySelector('.glass-panel');
        const closeBtn = modalOverlay.querySelector('.modal-close');

        const openModal = (e) => {
            e.preventDefault();
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

        joinButtons.forEach(btn => btn.addEventListener('click', openModal));
        closeBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
});
