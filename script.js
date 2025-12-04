const App = {
    init() {
        this.theme.init();
        this.typing.init();
        this.dock.init();
        this.imageChanger.init();
        this.scrollAnimations.init();
        this.scrollEffects.init();
        this.stagger.init();
        this.collapsible.init();
        this.lightbox.init();
        this.viewMore.init();
    },

    theme: {
        init() {
            const themeToggle = document.getElementById('theme-toggle');
            const docElement = document.documentElement;

            const applyTheme = (theme) => {
                docElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
            };

            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

            applyTheme(initialTheme);

            themeToggle?.addEventListener('click', () => {
                const currentTheme = docElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                applyTheme(newTheme);
            });
        }
    },

    typing: {
        phrases: ["Jan Marc Coloma", "a Cloud Engineer"],
        phraseIndex: 0,
        charIndex: 0,
        isDeleting: false,
        typeSpeed: 100,
        deleteSpeed: 50,
        delayBetweenPhrases: 2000,
        typingTextElement: document.getElementById('typing-text'),

        init() {
            if (this.typingTextElement) {
                setTimeout(() => this.typeAnimation(), 500);
            }
        },

        typeAnimation() {
            const currentPhrase = this.phrases[this.phraseIndex];

            if (this.isDeleting) {
                this.typingTextElement.textContent = currentPhrase.substring(0, this.charIndex - 1);
                this.charIndex--;

                if (this.charIndex === 0) {
                    this.isDeleting = false;
                    this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
                    setTimeout(() => this.typeAnimation(), 500);
                } else {
                    setTimeout(() => this.typeAnimation(), this.deleteSpeed);
                }
            } else {
                this.typingTextElement.textContent = currentPhrase.substring(0, this.charIndex + 1);
                this.charIndex++;

                if (this.charIndex === currentPhrase.length) {
                    this.isDeleting = true;
                    setTimeout(() => this.typeAnimation(), this.delayBetweenPhrases);
                } else {
                    setTimeout(() => this.typeAnimation(), this.typeSpeed);
                }
            }
        }
    },

    dock: {
        init() {
            const dock = document.querySelector('.floating-dock');
            const dockIcons = document.querySelectorAll('.dock-icon');
            if (!dock || dockIcons.length === 0) return;

            this.createTooltip();
           
            this.addTooltipEvents(dockIcons);
        },

        createTooltip() {
            const tooltip = document.createElement('div');
            tooltip.className = 'dock-tooltip';
            document.body.appendChild(tooltip);
            this.tooltip = tooltip;
        },

        addMagnification(dock, dockIcons) {
            const MAX_SCALE = 2;
            const AFFECT_DISTANCE = 80;
            const baseIconSize = 44;
            const iconInitialPositions = Array.from(dockIcons).map(icon => icon.offsetLeft + icon.offsetWidth / 2);
            
            let mouseX = -1;
            let isAnimating = false;

            const updateMagnification = () => {
                if (mouseX === -1) {
                    isAnimating = false;
                    return;
                };

                const scales = iconInitialPositions.map(iconCenterX => {
                    const distance = Math.abs(mouseX - iconCenterX);
                    return distance < AFFECT_DISTANCE ? 1 + (MAX_SCALE - 1) * Math.cos((distance / AFFECT_DISTANCE) * (Math.PI / 2)) : 1;
                });

                dockIcons.forEach((icon, index) => {
                    const scale = scales[index];
                    const totalGrowth = scales.reduce((acc, s) => acc + (s - 1) * baseIconSize, 0);
                    const centerOffset = -totalGrowth / 2;
                    const leftDisplacement = scales.slice(0, index).reduce((acc, s) => acc + (s - 1) * baseIconSize, 0);
                    const selfDisplacement = (scale - 1) * baseIconSize / 2;
                    const translationX = centerOffset + leftDisplacement + selfDisplacement;
                    const translationY = (scale - 1) * -12;
                    icon.style.transform = `translateX(${translationX}px) translateY(${translationY}px) scale(${scale})`;
                });

                requestAnimationFrame(updateMagnification);
            };
            
            dock.addEventListener('mousemove', (e) => {
                const dockRect = dock.getBoundingClientRect();
                mouseX = e.clientX - dockRect.left;
                if (!isAnimating) {
                    isAnimating = true;
                    requestAnimationFrame(updateMagnification);
                }
            });

            dock.addEventListener('mouseleave', () => {
                mouseX = -1;
                dockIcons.forEach(icon => { 
                    icon.style.transition = 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)';
                    icon.style.transform = 'translateX(0) translateY(0) scale(1)';
                   
                    icon.addEventListener('transitionend', () => icon.style.transition = '', { once: true });
                });
            });
        },

        addTooltipEvents(dockIcons) {
            dockIcons.forEach(icon => {
                icon.addEventListener('mouseover', () => {
                    const tooltipText = icon.getAttribute('data-tooltip');
                    const iconRect = icon.getBoundingClientRect();
                    this.tooltip.textContent = tooltipText;
                    this.tooltip.style.opacity = '1';
                    this.tooltip.style.transform = 'translateY(0)';
                    this.tooltip.style.left = `${iconRect.left + (iconRect.width / 2) - (this.tooltip.offsetWidth / 2)}px`;
                    this.tooltip.style.top = `${iconRect.top - this.tooltip.offsetHeight - 8}px`;
                });
                icon.addEventListener('mouseleave', () => {
                    this.tooltip.style.opacity = '0';
                    this.tooltip.style.transform = 'translateY(5px)';
                });
            });
        }
    },

    viewMore: {
        init() {
            const viewMoreBtn = document.getElementById('view-more-certs-btn');
            const certificateList = document.getElementById('certificate-list');

            if (!viewMoreBtn || !certificateList) return;

            viewMoreBtn.addEventListener('click', function() {
                certificateList.classList.toggle('show-all');
                const isShowingAll = certificateList.classList.contains('show-all');
                // Use 'this' which refers to the button
                this.textContent = isShowingAll ? 'View less' : 'View more';
                // Optional: Update ARIA attribute for accessibility
                this.setAttribute('aria-expanded', isShowingAll);
            });
        }
    },

    lightbox: {
        init() {
            const modal = document.getElementById('lightbox-modal');
            const modalImg = document.getElementById('lightbox-image');
            const closeBtn = document.querySelector('.lightbox-close');
            const projectImages = document.querySelectorAll('.project-card:not(.project-wip) .project-cover-image');

            if (!modal || !modalImg || !closeBtn || projectImages.length === 0) return;

            projectImages.forEach(img => {
                img.addEventListener('click', () => {
                    modal.classList.add('visible');
                    modalImg.src = img.src;
                });
            });

            const closeModal = () => {
                modal.classList.remove('visible');
            };

            closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
              
                if (e.target === modal) closeModal();
            });
        }
    },

    imageChanger: {
        init() {
            const clickableImage = document.getElementById('clickable-image');
            if (!clickableImage) return;

            const imageSources = [ 
                "images/me-1.JPG",
                "images/me-2.jpg",
                "images/me-3.jpg"
            ];
            let currentImageIndex = 0;

            clickableImage.addEventListener('click', () => {
                currentImageIndex = (currentImageIndex + 1) % imageSources.length;
                clickableImage.classList.add('is-changing');
                clickableImage.addEventListener('transitionend', () => {
                    clickableImage.src = imageSources[currentImageIndex];
                    clickableImage.classList.remove('is-changing');
                }, { once: true });
            });
        }
    },

    scrollAnimations: {
        init() {
            const animatedElements = document.querySelectorAll('[data-animate]');
            if (animatedElements.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            animatedElements.forEach(el => observer.observe(el));
        }
    },

    scrollEffects: {
        init() {
            this.initDockScroll();
            this.initHorizontalScrollHint();
            this.initProjectScrollbar();
        },

        initDockScroll() {
            const floatingDock = document.querySelector('.floating-dock');
            if (floatingDock) {
                window.addEventListener('scroll', () => {
                    floatingDock.classList.toggle('is-scrolled', window.scrollY > 20);
                }, { passive: true });
            }
        },

        initHorizontalScrollHint() {
            const scrollWrappers = document.querySelectorAll('.horizontal-scroll-wrapper');
            scrollWrappers.forEach(wrapper => {
                const list = wrapper.querySelector('.list');
                if (list) {
                    const checkScroll = () => {
                        const maxScrollLeft = list.scrollWidth - list.clientWidth;
                        wrapper.classList.toggle('is-scrolled-to-end', list.scrollLeft >= maxScrollLeft - 5);
                    };
                    list.addEventListener('scroll', checkScroll, { passive: true });
                    checkScroll();
                }
            });
        },

        initProjectScrollbar() {
            const projectsList = document.querySelector('.projects-list');
            if (!projectsList) return;

            let scrollTimer = null;

            projectsList.addEventListener('scroll', () => {
                projectsList.classList.add('is-scrolling');
                clearTimeout(scrollTimer);
                scrollTimer = setTimeout(() => {
                    projectsList.classList.remove('is-scrolling');
                }, 1000); // Keep scrollbar visible for 1 second after scroll stops
            }, { passive: true });
        }
    },

    stagger: {
        init() {
            const staggerParents = document.querySelectorAll('[data-stagger-children]');
            if (staggerParents.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const children = entry.target.children;
                        for (let i = 0; i < children.length; i++) {
                            children[i].style.transitionDelay = `${i * 50}ms`;
                        }
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            staggerParents.forEach(parent => observer.observe(parent));
        }
    },

    collapsible: {
        init() {
            const collapsibleTriggers = document.querySelectorAll('.experience-item.collapsible .arrow-icon');

            collapsibleTriggers.forEach(trigger => {
                const collapsibleItem = trigger.closest('.experience-item');
                const itemHeader = collapsibleItem.querySelector('.item-header'); // Get the item-header
                
                if (itemHeader) {
                    itemHeader.addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        collapsibleItem.classList.toggle('expanded');
                    });
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());