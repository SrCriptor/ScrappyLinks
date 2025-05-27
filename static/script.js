// Initialize Bootstrap components and event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // URL validation
    const urlInput = document.getElementById('url');
    const urlValidation = document.getElementById('urlValidation');
    const submitBtn = document.getElementById('submitBtn');

    if (urlInput) {
        urlInput.addEventListener('input', debounce(validateUrl, 500));
        urlInput.addEventListener('paste', function() {
            setTimeout(validateUrl, 100);
        });
    }

    // Form submission handling
    const scrapeForm = document.getElementById('scrapeForm');
    if (scrapeForm) {
        scrapeForm.addEventListener('submit', function(e) {
            showLoadingState();
        });
    }
});

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// URL validation function
function validateUrl() {
    const urlInput = document.getElementById('url');
    const urlValidation = document.getElementById('urlValidation');
    const url = urlInput.value.trim();

    if (!url) {
        urlValidation.innerHTML = '';
        return;
    }

    // Basic URL pattern validation
    const urlPattern = /^https?:\/\/.+\..+/;
    
    if (urlPattern.test(url)) {
        urlValidation.innerHTML = `
            <div class="text-success">
                <i class="fas fa-check-circle me-1"></i>
                URL válida
            </div>
        `;
    } else {
        urlValidation.innerHTML = `
            <div class="text-danger">
                <i class="fas fa-exclamation-circle me-1"></i>
                Formato de URL inválido. Use http:// ou https://
            </div>
        `;
    }
}

// Show loading state during form submission
function showLoadingState() {
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const loadingText = document.getElementById('loadingText');

    if (submitBtn && submitText && loadingText) {
        submitBtn.disabled = true;
        submitText.classList.add('d-none');
        loadingText.classList.remove('d-none');
    }
}

// Open image in modal
function openImageModal(imageUrl) {
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    const modalImage = document.getElementById('modalImage');
    const modalDownload = document.getElementById('modalDownload');
    
    modalImage.src = imageUrl;
    modalDownload.href = imageUrl;
    
    modal.show();
}

// Copy URL to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showCopyToast();
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopyToast();
        } catch (err) {
            console.error('Falha ao copiar texto: ', err);
            alert('Não foi possível copiar o link. Tente selecionar e copiar manualmente.');
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

// Show copy confirmation toast
function showCopyToast() {
    const toastElement = document.getElementById('copyToast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// Lazy loading for images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Initialize lazy loading when DOM is ready
document.addEventListener('DOMContentLoaded', setupLazyLoading);

// Error handling for broken images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.parentElement.innerHTML = `
                <div class="placeholder-image d-flex align-items-center justify-content-center">
                    <div class="text-center">
                        <i class="fas fa-image-slash fa-2x text-muted mb-2"></i>
                        <p class="text-muted small mb-0">Imagem não disponível</p>
                    </div>
                </div>
            `;
        });
    });
});

// Video error handling
document.addEventListener('DOMContentLoaded', function() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.addEventListener('error', function() {
            this.parentElement.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-video-slash fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Não foi possível carregar o vídeo</p>
                    <a href="${this.src}" target="_blank" class="btn btn-outline-primary btn-sm">
                        <i class="fas fa-external-link-alt me-2"></i>
                        Abrir Link Original
                    </a>
                </div>
            `;
        });
    });
});

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        if (!alert.querySelector('.btn-close')) return;
        
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});

// Smooth scrolling for internal links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('scrapeForm');
        if (form) {
            form.submit();
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        });
    }
});

// Progress bar for form submission (visual feedback)
function updateProgress(percent) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = percent + '%';
        progressBar.setAttribute('aria-valuenow', percent);
    }
}

// Simulate progress during scraping
function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
            progress = 90;
            clearInterval(interval);
        }
        updateProgress(progress);
    }, 500);
}
