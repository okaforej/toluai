// ToluAI Application JavaScript

// Global application object
const ToluAI = {
    // Configuration
    config: {
        debounceDelay: 300,
        animationDuration: 600
    },

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.setupFormValidation();
        this.initializeTooltips();
        this.setupSearchFunctionality();
    },

    // Setup global event listeners
    setupEventListeners() {
        // Mobile menu handling
        document.addEventListener('DOMContentLoaded', () => {
            const navbarToggler = document.querySelector('.navbar-toggler');
            const navbarCollapse = document.querySelector('.navbar-collapse');
            
            if (navbarToggler && navbarCollapse) {
                navbarToggler.addEventListener('click', () => {
                    navbarCollapse.classList.toggle('show');
                });
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const navbar = document.querySelector('.navbar');
            const navbarToggler = document.querySelector('.navbar-toggler');
            const navbarCollapse = document.querySelector('.navbar-collapse');
            
            if (navbar && !navbar.contains(e.target) && navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
        });

        // Auto-dismiss alerts after 5 seconds
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
            alerts.forEach(alert => {
                const closeBtn = alert.querySelector('.btn-close');
                if (closeBtn) {
                    closeBtn.click();
                }
            });
        }, 5000);

        // Handle loading states for forms
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const submitBtn = form.querySelector('button[type="submit"]');
            
            if (submitBtn) {
                this.setLoadingState(submitBtn, true);
                
                // Reset loading state if form submission fails
                setTimeout(() => {
                    this.setLoadingState(submitBtn, false);
                }, 5000);
            }
        });
    },

    // Initialize scroll animations
    initializeAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
        animatedElements.forEach(el => observer.observe(el));
    },

    // Setup form validation
    setupFormValidation() {
        const forms = document.querySelectorAll('.needs-validation');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!form.checkValidity()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                form.classList.add('was-validated');
            });

            // Real-time validation feedback
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            });
        });
    },

    // Validate individual field
    validateField(field) {
        const isValid = field.checkValidity();
        field.classList.toggle('is-valid', isValid);
        field.classList.toggle('is-invalid', !isValid);

        // Show/hide custom error messages
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('invalid-feedback')) {
            errorElement.style.display = isValid ? 'none' : 'block';
        }
    },

    // Initialize Bootstrap tooltips
    initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    },

    // Setup search functionality with debouncing
    setupSearchFunctionality() {
        const searchInputs = document.querySelectorAll('.search-input');
        
        searchInputs.forEach(input => {
            let debounceTimer;
            
            input.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.performSearch(input, e.target.value);
                }, this.config.debounceDelay);
            });
        });
    },

    // Perform search operation
    performSearch(input, query) {
        const searchContainer = input.closest('.search-container');
        const resultsContainer = searchContainer?.querySelector('.search-results');
        
        if (!resultsContainer) return;

        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        // Show loading state
        resultsContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm" role="status"></div></div>';

        // Simulate API call (replace with actual search endpoint)
        setTimeout(() => {
            resultsContainer.innerHTML = `<div class="text-muted py-3">Search results for "${query}" would appear here</div>`;
        }, 500);
    },

    // Utility function to set loading state
    setLoadingState(element, isLoading) {
        if (isLoading) {
            element.disabled = true;
            element.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading...`;
        } else {
            element.disabled = false;
            element.innerHTML = element.dataset.originalText || 'Submit';
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        const alertClass = type === 'error' ? 'danger' : type;
        const iconClass = type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle';
        
        const alertHtml = `
            <div class="alert alert-${alertClass} alert-dismissible fade show" role="alert">
                <i class="bi bi-${iconClass} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.querySelector('.notification-container') || document.body;
        const alertElement = document.createElement('div');
        alertElement.innerHTML = alertHtml;
        container.appendChild(alertElement.firstElementChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = container.querySelector('.alert');
            if (alert) {
                const closeBtn = alert.querySelector('.btn-close');
                if (closeBtn) closeBtn.click();
            }
        }, 5000);
    },

    // Format currency
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    // Format date
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date));
    },

    // Format percentage
    formatPercentage(value, decimals = 1) {
        return `${(value * 100).toFixed(decimals)}%`;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // API helper functions
    api: {
        // Generic API call
        async call(endpoint, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            try {
                const response = await fetch(endpoint, { ...defaultOptions, ...options });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('API call failed:', error);
                ToluAI.showNotification('An error occurred. Please try again.', 'error');
                throw error;
            }
        },

        // Get request
        get(endpoint) {
            return this.call(endpoint, { method: 'GET' });
        },

        // Post request
        post(endpoint, data) {
            return this.call(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        // Put request
        put(endpoint, data) {
            return this.call(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        // Delete request
        delete(endpoint) {
            return this.call(endpoint, { method: 'DELETE' });
        }
    },

    // Chart utilities
    chart: {
        // Default chart options
        defaultOptions: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        },

        // Create risk distribution chart
        createRiskDistributionChart(canvasId, data) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            return new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: [
                            '#28a745', // Low
                            '#ffc107', // Medium
                            '#dc3545', // High
                            '#343a40'  // Critical
                        ],
                        borderWidth: 0
                    }]
                },
                options: this.defaultOptions
            });
        }
    }
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ToluAI.init();
});

// Export for use in other modules
window.ToluAI = ToluAI;