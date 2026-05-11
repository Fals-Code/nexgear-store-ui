/**
 * NEXGEAR Main Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navbar
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(5, 7, 10, 0.95)';
            nav.style.padding = '10px 5%';
            nav.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
        } else {
            nav.style.background = 'rgba(5, 7, 10, 0.8)';
            nav.style.padding = '0 5%';
            nav.style.boxShadow = 'none';
        }
    });

    // 2. Scroll Reveal Logic
    const revealElements = document.querySelectorAll('.reveal');
    const checkReveal = () => {
        const triggerBottom = window.innerHeight / 5 * 4;
        revealElements.forEach(el => {
            const elTop = el.getBoundingClientRect().top;
            if (elTop < triggerBottom) {
                el.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', checkReveal);
    checkReveal(); // Initial check

    // 3. Hero Parallax Effect
    const heroH1 = document.querySelector('.hero h1');
    if (heroH1) {
        window.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth / 2 - e.pageX) / 50;
            const y = (window.innerHeight / 2 - e.pageY) / 50;
            heroH1.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    // 4. Price Filter Update
    const priceRange = document.querySelector('.price-range');
    const priceDisplay = document.querySelector('.price-range + div span:last-child');
    if (priceRange && priceDisplay) {
        priceRange.addEventListener('input', () => {
            priceDisplay.innerText = `$${parseInt(priceRange.value).toLocaleString()}+`;
        });
    }

    // 5. Search Filtering Logic
    const searchBar = document.querySelector('.search-bar');
    const productCards = document.querySelectorAll('.product-card');
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            const term = searchBar.value.toLowerCase();
            productCards.forEach(card => {
                const title = card.querySelector('h4').innerText.toLowerCase();
                const desc = card.querySelector('p').innerText.toLowerCase();
                if (title.includes(term) || desc.includes(term)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // 6. Mobile Menu Toggle
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = `
        <div style="width: 25px; height: 2px; background: white; margin: 6px 0; transition: 0.3s;"></div>
        <div style="width: 20px; height: 2px; background: white; margin: 6px 0; transition: 0.3s; margin-left: 5px;"></div>
        <div style="width: 25px; height: 2px; background: white; margin: 6px 0; transition: 0.3s;"></div>
    `;
    hamburger.style.cursor = 'pointer';
    hamburger.style.display = 'none';
    nav.insertBefore(hamburger, navActions);

    const handleResize = () => {
        if (window.innerWidth <= 768) {
            hamburger.style.display = 'block';
        } else {
            hamburger.style.display = 'none';
            navLinks.style.display = 'flex';
            navLinks.style.position = 'static';
            navLinks.style.background = 'transparent';
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('mobile-active');
        if (isOpen) {
            navLinks.style.display = 'flex';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '80px';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.flexDirection = 'column';
            navLinks.style.background = 'var(--bg-surface)';
            navLinks.style.padding = '20px';
            navLinks.style.borderBottom = '1px solid var(--glass-border)';
            navLinks.style.textAlign = 'center';
            hamburger.children[1].style.width = '25px';
            hamburger.children[1].style.marginLeft = '0';
        } else {
            navLinks.style.display = 'none';
            hamburger.children[1].style.width = '20px';
            hamburger.children[1].style.marginLeft = '5px';
        }
    });

    // 7. Add to Cart Simulation
    const buyButtons = document.querySelectorAll('.btn-primary');
    buyButtons.forEach(btn => {
        if (btn.innerText.toLowerCase().includes('buy') || btn.innerText.toLowerCase().includes('add')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productName = btn.closest('.glass-card')?.querySelector('h4')?.innerText || 'Product';
                
                const toast = document.createElement('div');
                toast.className = 'toast-notification';
                toast.innerText = `${productName} added to cart!`;
                toast.style.cssText = `
                    position: fixed; bottom: 20px; right: 20px;
                    background: var(--success); color: var(--bg-deep);
                    padding: 12px 25px; border-radius: 4px;
                    font-family: 'Orbitron', sans-serif; font-weight: bold;
                    z-index: 2000; box-shadow: 0 0 20px rgba(0, 255, 135, 0.4);
                    animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                `;

                document.body.appendChild(toast);

                setTimeout(() => {
                    toast.style.animation = 'slideOut 0.3s forwards';
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            });
        }
    });

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    `;
    document.head.appendChild(style);
});
