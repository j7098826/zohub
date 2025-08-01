class MobileVideoPlayer {
    constructor() {
        this.modal = null;
        this.iframe = null;
        this.allVideos = [];
        this.videoGrid = document.getElementById('videoGrid');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.isLoading = false;
        this.currentPage = 1;
        this.videosPerPage = 10;
        
        this.init();
    }

    init() {
        this.initModal();
        this.loadVideos();
        this.setupEventListeners();
        this.setupMobileOptimizations();
        this.addPullToRefresh();
    }

    setupMobileOptimizations() {
        // Prevent iOS bounce scroll
        document.body.addEventListener('touchmove', (e) => {
            if (e.target === document.body) {
                e.preventDefault();
            }
        }, { passive: false });

        // Optimize viewport for mobile
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }

        // Add mobile-specific classes
        document.body.classList.add('mobile-optimized');
        
        // Detect if it's a mobile device
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            document.body.classList.add('is-mobile');
        } else {
            // Desktop optimizations
            document.body.classList.add('is-desktop');
            this.setupDesktopOptimizations();
        }
    }

    setupDesktopOptimizations() {
        // Add keyboard shortcuts for desktop
        document.addEventListener('keydown', (e) => {
            // Space bar to play/pause video
            if (e.code === 'Space' && !this.modal.classList.contains('hidden')) {
                e.preventDefault();
                // Add video control logic here
            }
            
            // Escape to close modal
            if (e.code === 'Escape') {
                this.closeModal();
            }
            
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
        });
    }

    setupDesktopHoverEffects() {
        // Add desktop-specific hover effects to existing video cards
        const videoCards = document.querySelectorAll('.video-card');
        videoCards.forEach(card => {
            // Remove existing listeners to prevent duplicates
            card.removeEventListener('mouseenter', this.desktopHoverEnter);
            card.removeEventListener('mouseleave', this.desktopHoverLeave);
            
            // Add new listeners
            card.addEventListener('mouseenter', this.desktopHoverEnter);
            card.addEventListener('mouseleave', this.desktopHoverLeave);
        });
    }

    desktopHoverEnter(e) {
        e.target.style.transform = 'translateY(-6px) scale(1.02)';
    }

    desktopHoverLeave(e) {
        e.target.style.transform = '';
    }

    addPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        const pullThreshold = 80;
        
        const pullIndicator = document.createElement('div');
        pullIndicator.className = 'pull-to-refresh';
        pullIndicator.innerHTML = `
            <div class="pull-indicator">
                <i class="fas fa-arrow-down pull-icon"></i>
                <span class="pull-text">Pull to refresh</span>
            </div>
        `;
        pullIndicator.style.cssText = `
            position: fixed;
            top: -80px;
            left: 0;
            right: 0;
            height: 80px;
            background: linear-gradient(to bottom, rgba(255, 140, 0, 0.1), transparent);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 60;
            transition: transform 0.3s ease;
            color: #FF8C00;
        `;
        document.body.appendChild(pullIndicator);

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 0 && window.scrollY === 0) {
                e.preventDefault();
                const pullDistance = Math.min(diff, pullThreshold);
                pullIndicator.style.transform = `translateY(${pullDistance}px)`;
                
                if (pullDistance >= pullThreshold) {
                    pullIndicator.querySelector('.pull-text').textContent = 'Release to refresh';
                    pullIndicator.querySelector('.pull-icon').style.transform = 'rotate(180deg)';
                } else {
                    pullIndicator.querySelector('.pull-text').textContent = 'Pull to refresh';
                    pullIndicator.querySelector('.pull-icon').style.transform = 'rotate(0deg)';
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (!isPulling) return;
            
            const diff = currentY - startY;
            if (diff >= pullThreshold) {
                this.refreshContent();
            }
            
            pullIndicator.style.transform = 'translateY(-80px)';
            pullIndicator.querySelector('.pull-text').textContent = 'Pull to refresh';
            pullIndicator.querySelector('.pull-icon').style.transform = 'rotate(0deg)';
            isPulling = false;
        });
    }

    refreshContent() {
        // Add refresh animation
        this.loadingIndicator.style.display = 'block';
        this.loadingIndicator.innerHTML = `
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-lg font-medium">Refreshing videos...</p>
        `;
        
        // Simulate refresh (you can replace this with actual API call)
        setTimeout(() => {
            this.loadVideos();
        }, 1000);
    }

    initModal() {
        this.modal = document.getElementById('videoModal');
        this.iframe = document.getElementById('modalIframe');
        
        if (!this.modal || !this.iframe) {
            console.error('Modal elements not found');
            return;
        }
        
        // Close modal on tap outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
    }

    closeModal() {
        if (this.iframe) {
            this.iframe.src = '';
            this.iframe.removeAttribute('src');
        }
        this.modal.classList.add('hidden');
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    openModal(videoUrl, videoData = null) {
        if (!this.modal || !this.iframe) {
            console.error('Modal or iframe not found');
            return;
        }
        
        if (!videoUrl) {
            console.error('No video URL provided');
            return;
        }
        
        console.log('Opening modal with URL:', videoUrl);
        
        // Update video info header
        if (videoData) {
            const titleElement = document.getElementById('modalVideoTitle');
            const viewsElement = document.getElementById('modalVideoViews');
            
            if (titleElement) {
                titleElement.textContent = videoData.title;
            }
            
            if (viewsElement) {
                const views = this.formatViews(videoData.views);
                viewsElement.textContent = `${views} views • ${videoData.duration}`;
            }
        }
        
        // Set iframe source with enhanced parameters
        const enhancedUrl = videoUrl.includes('youtube.com') 
            ? `${videoUrl}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1&showinfo=0`
            : videoUrl;
            
        this.iframe.src = enhancedUrl;
        this.modal.classList.remove('hidden');
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Setup video controls
        this.setupVideoControls();
    }

    formatViews(views) {
        if (views >= 1000000000) {
            return (views / 1000000000).toFixed(1) + 'B';
        } else if (views >= 1000000) {
            return (views / 1000000).toFixed(1) + 'M';
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'K';
        }
        return views.toString();
    }

    setupVideoControls() {
        // Add click handlers for action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.textContent.trim().toLowerCase();
                
                switch(action) {
                    case 'like':
                        btn.classList.toggle('bg-red-500');
                        btn.classList.toggle('bg-orange-500');
                        const icon = btn.querySelector('i');
                        icon.classList.toggle('fas');
                        icon.classList.toggle('far');
                        break;
                    case 'share':
                        this.shareVideo();
                        break;
                    case 'download':
                        this.downloadVideo();
                        break;
                }
            });
        });
    }

    shareVideo() {
        if (navigator.share) {
            navigator.share({
                title: 'Check out this video on Zo Hub',
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    }

    downloadVideo() {
        alert('Download feature coming soon!');
    }

    searchVideos() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const cards = document.querySelectorAll('.video-card');
        
        let visibleCount = 0;
        cards.forEach(card => {
            const title = card.querySelector('.video-title').textContent.toLowerCase();
            const matches = title.includes(searchTerm);
            card.style.display = matches ? 'block' : 'none';
            if (matches) visibleCount++;
        });
        
        this.showNoResultsMessage(visibleCount, searchTerm);
        
        // Add haptic feedback on mobile
        if (this.isMobile && 'vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }

    showNoResultsMessage(visibleCount, searchTerm) {
        const noResults = document.getElementById('noResults');
        
        if (visibleCount === 0 && searchTerm.length > 0) {
            if (!noResults) {
                const message = document.createElement('div');
                message.id = 'noResults';
                message.className = 'text-center py-16';
                message.style.gridColumn = '1 / -1';
                message.innerHTML = `
                    <div class="max-w-sm mx-auto">
                        <i class="fas fa-search text-5xl text-[#FF8C00] mb-6 opacity-60"></i>
                        <h3 class="text-xl font-bold mb-3">No videos found</h3>
                        <p class="text-gray-400 mb-4 text-sm">We couldn't find any videos matching "${searchTerm}"</p>
                        <button onclick="document.getElementById('searchInput').value=''; searchVideos();" 
                                class="bg-gradient-to-r from-[#FF8C00] to-[#FF6B00] px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium">
                            Clear Search
                        </button>
                    </div>
                `;
                this.videoGrid.appendChild(message);
            }
        } else if (noResults) {
            noResults.remove();
        }
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Play ${video.title}`);
        
        const thumbnailUrl = video.thumbnail || 
            (video.id ? `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` : 'https://via.placeholder.com/320x180');
        
        card.innerHTML = `
            <div class="video-thumb">
                <img src="${thumbnailUrl}" 
                     alt="${video.title}"
                     loading="lazy"
                     class="w-full h-full object-cover"
                     onerror="this.src='https://via.placeholder.com/320x180/374151/9CA3AF?text=Video+Thumbnail'">
                <span class="duration text-white">${video.duration || 'N/A'}</span>
            </div>
            <div class="video-info p-3">
                <h3 class="video-title text-white font-medium mb-2">${video.title}</h3>
                <div class="video-stats flex justify-between text-xs text-gray-400">
                    <span><i class="fas fa-eye mr-1"></i>${this.formatViews(video.views)}</span>
                    <span><i class="fas fa-calendar-alt mr-1"></i>${this.formatDate(video.uploadDate)}</span>
                </div>
            </div>
        `;
        
        const playVideo = () => {
            const videoUrl = video.id 
                ? `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1` 
                : video.videoUrl;
            this.openModal(videoUrl, video);
            
            // Add haptic feedback
            if (this.isMobile && 'vibrate' in navigator) {
                navigator.vibrate(30);
            }
        };
        
        // Add touch feedback
        card.addEventListener('touchstart', () => {
            card.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('touchend', () => {
            card.style.transform = '';
        });
        
        card.addEventListener('click', playVideo);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playVideo();
            }
        });
        
        return card;
    }

    formatDate(dateString) {
        if (!dateString) return 'Recently';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}m ago`;
        return `${Math.floor(diffDays / 365)}y ago`;
    }

    async loadVideos() {
        try {
            this.isLoading = true;
            console.log('Loading videos...');
            
            const response = await fetch('./videos.json').catch(() => fetch('videos.json'));
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Videos data:', data);
            
            if (!data.videos) throw new Error('Invalid JSON format - missing videos array');
            
            this.allVideos = data.videos;
            console.log(`Loaded ${this.allVideos.length} videos`);
            this.loadingIndicator.style.display = 'none';
            
            // Clear existing videos
            this.videoGrid.innerHTML = '';
            
            // Add videos with staggered animation optimized for mobile
            this.allVideos.forEach((video, index) => {
                setTimeout(() => {
                    try {
                        const videoCard = this.createVideoCard(video);
                        if (videoCard) {
                            videoCard.style.opacity = '0';
                            videoCard.style.transform = 'translateY(20px)';
                            this.videoGrid.appendChild(videoCard);
                            
                            // Trigger animation
                            requestAnimationFrame(() => {
                                videoCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                                videoCard.style.opacity = '1';
                                videoCard.style.transform = 'translateY(0)';
                            });
                        }
                    } catch (error) {
                        console.error('Error creating video card:', error);
                    }
                }, index * 30); // Faster stagger for mobile
            });

            // Setup desktop hover effects after videos are loaded
            if (!this.isMobile) {
                setTimeout(() => {
                    this.setupDesktopHoverEffects();
                }, this.allVideos.length * 30 + 100);
            }
            
        } catch (error) {
            console.error('Error loading videos:', error);
            this.loadingIndicator.innerHTML = `
                <div class="text-center max-w-xs mx-auto">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <h3 class="text-lg font-bold mb-2">Failed to load videos</h3>
                    <p class="text-gray-400 mb-4 text-sm">${error.message}</p>
                    <button onclick="location.reload()" 
                            class="bg-gradient-to-r from-[#FF8C00] to-[#FF6B00] px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium">
                        Try Again
                    </button>
                </div>
            `;
        } finally {
            this.isLoading = false;
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        
        // Mobile-optimized search with longer debounce
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.searchVideos(), 500); // Longer delay for mobile
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchInput.blur(); // Hide keyboard on mobile
                this.searchVideos();
            }
        });
        
        // Global event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
        
        // Search button with mobile optimization
        const searchBtn = document.querySelector('.search-btn');
        searchBtn.addEventListener('click', () => {
            searchInput.blur(); // Hide keyboard
            this.searchVideos();
        });
        
        // Prevent double-tap zoom on buttons
        [searchBtn, ...document.querySelectorAll('.close-btn')].forEach(btn => {
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
            });
        });
        
        // Make functions available globally
        window.searchVideos = () => this.searchVideos();
        window.closeModal = () => this.closeModal();
        
        // Add orientation change listener
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                // Recalculate layout after orientation change
                if (this.modal && !this.modal.classList.contains('hidden')) {
                    const modalContent = this.modal.querySelector('.modal-content');
                    modalContent.style.height = 'auto';
                }
            }, 500);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MobileVideoPlayer();
    
    // Add service worker for offline support (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {
            // Silently fail if service worker doesn't exist
        });
    }
    
    // Add iOS PWA prompt
    let deferredPrompt;
    let showInstallPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (showInstallPrompt) showInstallPrompt();
    });
    
    showInstallPrompt = function() {
        const installBanner = document.createElement('div');
        installBanner.className = 'install-banner';
        installBanner.innerHTML = `
            <div class="install-content">
                <i class="fas fa-mobile-alt"></i>
                <span>Install Zo Hub for better experience</span>
                <button class="install-btn">Install</button>
                <button class="install-close">&times;</button>
            </div>
        `;
        installBanner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: linear-gradient(45deg, #FF8C00, #FF6B00);
            border-radius: 12px;
            padding: 16px;
            color: white;
            z-index: 1000;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(installBanner);
        
        installBanner.querySelector('.install-btn').addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(() => {
                    deferredPrompt = null;
                    installBanner.remove();
                });
            }
        });
        
        installBanner.querySelector('.install-close').addEventListener('click', () => {
            installBanner.remove();
        });
        
        // Auto hide after 10 seconds
        setTimeout(() => {
            if (installBanner.parentNode) {
                installBanner.remove();
            }
        }, 10000);
    }
});
