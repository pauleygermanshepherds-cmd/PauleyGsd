/* ==========================================================================
   GLOBAL NAVIGATION RESPONSIVE HAMBURGER MENU INTERACTIVITY CONTROLLER
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    const toggleBtn = document.getElementById("mobile-nav-toggle");
    const navMenu = document.getElementById("primary-navigation");
    
    if (toggleBtn && navMenu) {
        toggleBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            toggleBtn.classList.toggle("active");
            navMenu.classList.toggle("open");
        });
        
        // Close navigation automatically on clicking anywhere outside the container
        document.addEventListener("click", function(e) {
            if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
                toggleBtn.classList.remove("active");
                navMenu.classList.remove("open");
            }
        });
    }
});


/* ==========================================================================
   HOMEPAGE LITTERS FAN-OUT ANIMATION OBSERVER LOGIC
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    const galleryTarget = document.getElementById("litter-fan-gallery");
    const observerOpts = {
        root: null,
        threshold: 0.15
    };
    const scrollObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add a clean 1-second (1000ms) delay before starting the cards expansion sequence
                setTimeout(() => {
                    galleryTarget.classList.add("visible");
                    
                    // Wait another 800ms for the fan-out transition to settle before enabling mouse hovers
                    setTimeout(() => {
                        galleryTarget.classList.add("interactive-ready");
                    }, 800);
                }, 1000);
                
                scrollObserver.unobserve(galleryTarget);
            }
        });
    }, observerOpts);
    if (galleryTarget) {
        scrollObserver.observe(galleryTarget);
    }
});


/* ==========================================================================
   PHOTO GALLERY SLIDESHOW CAROUSEL CONTROLLER LOGIC 
   (MOBILE TOUCH-SWIPE, MOUSE-DRAG, & DESKTOP TRACKPAD SWIPE SENSITIVE)
   ========================================================================== */
function initSlider(sliderWindowId) {
    const windowEl = document.getElementById(sliderWindowId);
    if (!windowEl) return;
    
    const track = windowEl.querySelector('.slides-track');
    const slides = Array.from(windowEl.querySelectorAll('.slide-item'));
    const prevBtn = windowEl.querySelector('.prev-left');
    const nextBtn = windowEl.querySelector('.next-right');
    const dotContainer = windowEl.querySelector('.dots-indicator-container');
    
    let currentIndex = 0;
    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;
    
    // Trackpad debounce safety lock variable properties
    let isWheelLocked = false;
    let wheelAccumulatorX = 0;
    
    // Generate dot indicator assets dynamically relative to slide volume
    if (dotContainer && dotContainer.children.length === 0) {
        slides.forEach((_, idx) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (idx === 0) dot.classList.add('active');
            dot.addEventListener('click', () => moveToSlide(idx));
            dotContainer.appendChild(dot);
        });
    }
    
    const dots = dotContainer ? Array.from(dotContainer.querySelectorAll('.dot')) : [];
    
    function updateSliderPosition() {
        currentTranslate = currentIndex * -100;
        track.style.transform = `translateX(${currentTranslate}%)`;
        prevTranslate = currentTranslate;
        
        // Toggle active dot classes
        dots.forEach((d, idx) => {
            if (idx === currentIndex) d.classList.add('active');
            else d.classList.remove('active');
        });
    }
    
    function moveToSlide(index) {
        if (index < 0) currentIndex = 0;
        else if (index >= slides.length) currentIndex = slides.length - 1;
        else currentIndex = index;
        
        track.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        updateSliderPosition();
    }
    
    // Click Arrow Controls hooks
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < slides.length - 1) moveToSlide(currentIndex + 1);
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) moveToSlide(currentIndex - 1);
        });
    }
    
    // Touch & Drag Gesture Setup Mapping
    windowEl.addEventListener('touchstart', touchStart, { passive: true });
    windowEl.addEventListener('touchend', touchEnd);
    windowEl.addEventListener('touchmove', touchMove);
    
    windowEl.addEventListener('mousedown', dragStart);
    windowEl.addEventListener('mouseup', dragEnd);
    windowEl.addEventListener('mouseleave', dragEnd);
    windowEl.addEventListener('mousemove', dragMove);
    
    function getPositionX(e) {
        return e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    }
    
    function touchStart(e) {
        startX = getPositionX(e);
        isDragging = true;
        track.style.transition = 'none';
    }
    
    function dragStart(e) {
        if (e.target.tagName === 'BUTTON' || e.target.classList.contains('dot')) return;
        e.preventDefault();
        startX = getPositionX(e);
        isDragging = true;
        track.style.transition = 'none';
    }
    
    function touchMove(e) { if (isDragging) moveDrag(getPositionX(e)); }
    function dragMove(e) { if (isDragging) moveDrag(getPositionX(e)); }
    
    function moveDrag(x) {
        const currentX = x;
        const diffX = currentX - startX;
        const windowWidth = windowEl.offsetWidth;
        const percentageMove = (diffX / windowWidth) * 100;
        
        const totalTranslate = prevTranslate + percentageMove;
        track.style.transform = `translateX(${totalTranslate}%)`;
    }
    
    function touchEnd() { endDrag(); }
    function dragEnd() { endDrag(); }
    
    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        track.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        
        const currentTransformStr = track.style.transform;
        const currentPercentage = parseFloat(currentTransformStr.replace('translateX(', '').replace('%)', '')) || 0;
        
        const theoreticalIndex = Math.round(currentPercentage / -100);
        
        // Snap behavior limit check
        if (theoreticalIndex === currentIndex) {
            const diffX = (currentPercentage / -100) - currentIndex;
            if (diffX > 0.12 && currentIndex < slides.length - 1) {
                moveToSlide(currentIndex + 1);
            } else if (diffX < -0.12 && currentIndex > 0) {
                moveToSlide(currentIndex - 1);
            } else {
                moveToSlide(currentIndex);
            }
        } else {
            moveToSlide(theoreticalIndex);
        }
    }

    /* ==========================================================================
       NEW ADDITION: DESKTOP TRACKPAD SWIPE INTERACTION LISTENER ENGINE
       ========================================================================== */
    windowEl.addEventListener('wheel', function(e) {
        // Only track horizontal swiping inputs
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            // Prevent browser back/forward history navigation swipes
            e.preventDefault();
            
            if (isWheelLocked) return;
            
            wheelAccumulatorX += e.deltaX;
            
            // Swipe trigger threshold sensitivity requirement
            const swipeThreshold = 40; 
            
            if (wheelAccumulatorX > swipeThreshold) {
                // Swiped right/next gesture detected
                if (currentIndex < slides.length - 1) {
                    moveToSlide(currentIndex + 1);
                    lockWheelInput();
                } else {
                    wheelAccumulatorX = 0; // Reset threshold if at boundaries
                }
            } else if (wheelAccumulatorX < -swipeThreshold) {
                // Swiped left/prev gesture detected
                if (currentIndex > 0) {
                    moveToSlide(currentIndex - 1);
                    lockWheelInput();
                } else {
                    wheelAccumulatorX = 0; // Reset threshold if at boundaries
                }
            }
        }
    }, { passive: false });
    
    function lockWheelInput() {
        isWheelLocked = true;
        wheelAccumulatorX = 0;
        // Release lock after animation finishes (600ms debounce protection)
        setTimeout(() => {
            isWheelLocked = false;
        }, 600);
    }
}

// Launch all slideshow engines on window initialisation execution
document.addEventListener("DOMContentLoaded", () => {
    initSlider('slider-available');
    initSlider('slider-past');
    initSlider('slider-home');
});

    document.addEventListener("DOMContentLoaded", function() {
        const toggleBtn = document.getElementById("mobile-nav-toggle");
        const navMenu = document.getElementById("primary-navigation");
        
        if (toggleBtn && navMenu) {
            toggleBtn.addEventListener("click", function(e) {
                e.stopPropagation();
                toggleBtn.classList.toggle("active");
                navMenu.classList.toggle("open");
            });
            
            // Close navigation on clicking anywhere outside
            document.addEventListener("click", function(e) {
                if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
                    toggleBtn.classList.remove("active");
                    navMenu.classList.remove("open");
                }
            });
        }
    });