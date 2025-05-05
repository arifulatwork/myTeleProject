

    // Enhanced channel data with both M3U8 and YouTube streams
    const channels = [
        {
            id: 1,
            name: "Peace TV",
            category: "movies",
            logo: "https://play-lh.googleusercontent.com/r51x9GW3hp9T9H_cECjj667c3GLNymIxAgtSwnKFsUB8TCcyQaSY3TSijD0_tNfXsFc",
            stream: "https://dzkyvlfyge.erbvr.com/PeaceTvUrdu/index.m3u8", // Replaced with working test stream
            type: "m3u8",
            isHD: true
        },
        {
            id: 2,
            name: "Peace TV",
            category: "movies",
            logo: "https://www.jagobd.com/wp-content/uploads/2024/08/logo_50.png",
            stream: "https://dzkyvlfyge.erbvr.com/PeaceTvBangla/index.m3u8", // Replaced with working test stream
            type: "m3u8",
            isHD: true
        },
        {
            id: 3,
            name: "Peace TV",
            category: "movies",
            logo: "https://play-lh.googleusercontent.com/r51x9GW3hp9T9H_cECjj667c3GLNymIxAgtSwnKFsUB8TCcyQaSY3TSijD0_tNfXsFc",
            stream: "https://dzkyvlfyge.erbvr.com/PeaceTvEnglish/index.m3u8", // Replaced with working test stream
            type: "m3u8",
            isHD: true
        },
        {
            id: 4,
            name: "Deen TV",
            category: "movies",
            logo: "https://yt3.googleusercontent.com/ytc/AIdro_kCghRDd9v_kjUUTQv7tay9lgq6JsR_Gbv6vHaTJ9h23A=s900-c-k-c0x00ffffff-no-rj",
            stream: "https://ap02.iqplay.tv:8082/iqb8002/d33ntv/playlist.m3u8", // Replaced with working test stream
            type: "m3u8",
            isHD: true
        },
        {
            id: 5,
            name: "ETV",
            category: "news",
            logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d9/Ekushey_Television_Logo.svg/1200px-Ekushey_Television_Logo.svg.png",
            stream: "https://ekusheyserver.com/etvlivesn.m3u8", // Replaced with working test stream
            type: "m3u8",
            isHD: true
        }
        // {
        //     id: 4,
        //     name: "Republic TV",
        //     category: "news",
        //     logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Republic_TV.svg/1200px-Republic_TV.svg.png",
        //     stream: "https://www.youtube.com/embed/UoQ4GO38F8U?autoplay=1",
        //     type: "youtube",
        //     isHD: true
        // }
    ];
    
    // DOM Elements
    const channelsGrid = document.getElementById('channels-grid');
    const sportsGrid = document.getElementById('sports-grid');
    const newsGrid = document.getElementById('news-grid');
    const playerSection = document.getElementById('player-section');
    const videoPlayer = document.getElementById('video-player');
    const youtubePlayer = document.getElementById('youtube-player');
    const currentChannel = document.getElementById('current-channel').querySelector('span');
    const closePlayerBtn = document.getElementById('close-player');
    const playerSpinner = document.getElementById('player-spinner');
    const playerError = document.getElementById('player-error');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    const searchInput = document.getElementById('search-input');
    
    // App State
    const appState = {
        currentStream: null,
        currentChannelId: null,
        favorites: JSON.parse(localStorage.getItem('iptv-favorites')) || [],
        volume: localStorage.getItem('iptv-volume') || 1,
        isMuted: localStorage.getItem('iptv-muted') === 'true' || false,
        lastError: null,
        hls: null // To store HLS instance
    };
    
    // Initialize the app
    function init() {
        renderChannels();
        setupEventListeners();
        restorePlayerSettings();
        
        // Debug info
        console.log("HLS supported:", Hls.isSupported());
        console.log("Native HLS support:", videoPlayer.canPlayType('application/vnd.apple.mpegurl'));
    }
    
    // Restore player settings from localStorage
    function restorePlayerSettings() {
        videoPlayer.volume = parseFloat(appState.volume);
        videoPlayer.muted = appState.isMuted;
    }
    
    // Render channels to the grid
    function renderChannels(filter = '') {
        channelsGrid.innerHTML = '';
        sportsGrid.innerHTML = '';
        newsGrid.innerHTML = '';
        
        // Filter channels by search term if provided
        const filteredChannels = filter ? 
            channels.filter(channel => 
                channel.name.toLowerCase().includes(filter.toLowerCase()) || 
                channel.category.toLowerCase().includes(filter.toLowerCase())
            ) : 
            [...channels];
        
        // Sort favorites first, then shuffle the rest
        const sortedChannels = filteredChannels.sort((a, b) => {
            const aIsFavorite = appState.favorites.includes(a.id);
            const bIsFavorite = appState.favorites.includes(b.id);
            return bIsFavorite - aIsFavorite;
        });
        
        // Shuffle non-favorite channels for variety
        const nonFavorites = sortedChannels.filter(c => !appState.favorites.includes(c.id));
        const shuffledNonFavorites = [...nonFavorites].sort(() => 0.5 - Math.random());
        const finalChannelList = [
            ...sortedChannels.filter(c => appState.favorites.includes(c.id)),
            ...shuffledNonFavorites
        ];
        
        finalChannelList.forEach(channel => {
            const channelCard = createChannelCard(channel);
            
            // Add to main grid
            channelsGrid.appendChild(channelCard.cloneNode(true));
            
            // Add to category-specific grids
            if (channel.category === 'sports') {
                sportsGrid.appendChild(channelCard.cloneNode(true));
            } else if (channel.category === 'news') {
                newsGrid.appendChild(channelCard.cloneNode(true));
            }
        });
        
        // Show/hide sections based on content
        document.getElementById('sports-grid').style.display = 
            sportsGrid.querySelector('.channel-card') ? 'grid' : 'none';
        document.getElementById('news-grid').style.display = 
            newsGrid.querySelector('.channel-card') ? 'grid' : 'none';
        
        // Update section titles visibility
        document.querySelectorAll('.section-title').forEach(title => {
            const gridId = title.nextElementSibling.id;
            title.style.display = 
                document.getElementById(gridId).style.display === 'none' ? 
                'none' : 'inline-block';
        });
    }
    
    // Create a channel card element
    function createChannelCard(channel) {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.dataset.id = channel.id;
        card.dataset.category = channel.category;
        card.dataset.name = channel.name.toLowerCase();
        
        const isFavorite = appState.favorites.includes(channel.id);
        
        card.innerHTML = `
            ${channel.isHD ? '<span class="channel-badge">HD</span>' : ''}
            ${channel.type === 'youtube' ? '<span class="youtube-badge">YT</span>' : ''}
            ${isFavorite ? '<span class="favorite-badge"><i class="fas fa-heart"></i></span>' : ''}
            <img src="${channel.logo}" alt="${channel.name}" class="channel-logo" onerror="this.src='https://via.placeholder.com/180x120?text=Channel+Logo'">
            <div class="channel-info">
                <h3>${channel.name}</h3>
                <p>${getCategoryName(channel.category)}</p>
            </div>
        `;
        
        return card;
    }
    
    // Get formatted category name
    function getCategoryName(category) {
        const names = {
            'entertainment': 'Entertainment',
            'news': 'News',
            'sports': 'Sports',
            'movies': 'Islamic',
            'kids': 'Kids',
            'music': 'Music'
        };
        return names[category] || 'General';
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Channel card click
        document.addEventListener('click', function(e) {
            const channelCard = e.target.closest('.channel-card');
            if (channelCard) {
                const channelId = parseInt(channelCard.dataset.id);
                playChannel(channelId);
            }
            
            // Favorite button click
            const favoriteBtn = e.target.closest('.favorite-badge, .fa-heart');
            if (favoriteBtn) {
                e.stopPropagation();
                const channelCard = favoriteBtn.closest('.channel-card');
                const channelId = parseInt(channelCard.dataset.id);
                toggleFavorite(channelId);
            }
        });
        
        // Close player
        closePlayerBtn.addEventListener('click', closePlayer);
        
        // Category filter
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                categoryBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const category = this.dataset.category;
                filterChannels(category);
            });
        });
        
        // Player events
        videoPlayer.addEventListener('volumechange', function() {
            appState.volume = videoPlayer.volume;
            appState.isMuted = videoPlayer.muted;
            localStorage.setItem('iptv-volume', appState.volume);
            localStorage.setItem('iptv-muted', appState.isMuted);
        });
        
        // Fullscreen button
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        
        // Favorite button in player
        favoriteBtn.addEventListener('click', function() {
            if (appState.currentChannelId) {
                toggleFavorite(appState.currentChannelId);
                updateFavoriteButton();
            }
        });
        
        // Retry button
        retryBtn.addEventListener('click', function() {
            if (appState.currentChannelId) {
                playChannel(appState.currentChannelId);
            }
        });
        
        // Search input
        searchInput.addEventListener('input', debounce(function() {
            renderChannels(this.value);
        }, 300));
        
        // Handle key events
        document.addEventListener('keydown', function(e) {
            // Space to play/pause
            if (e.code === 'Space' && playerSection.classList.contains('active')) {
                e.preventDefault();
                if (videoPlayer.style.display !== 'none') {
                    if (videoPlayer.paused) {
                        videoPlayer.play().catch(e => console.error('Play failed:', e));
                    } else {
                        videoPlayer.pause();
                    }
                }
            }
            
            // Escape to exit fullscreen or close player
            if (e.code === 'Escape') {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else if (playerSection.classList.contains('active')) {
                    closePlayer();
                }
            }
            
            // F to toggle fullscreen
            if (e.code === 'KeyF' && playerSection.classList.contains('active')) {
                toggleFullscreen();
            }
            
            // M to toggle mute
            if (e.code === 'KeyM' && playerSection.classList.contains('active')) {
                videoPlayer.muted = !videoPlayer.muted;
            }
        });
        
        // Handle fullscreen change
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
        document.addEventListener('mozfullscreenchange', updateFullscreenButton);
        document.addEventListener('MSFullscreenChange', updateFullscreenButton);
    }
    
    // Debounce function for search input
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Toggle favorite status
    function toggleFavorite(channelId) {
        const index = appState.favorites.indexOf(channelId);
        if (index === -1) {
            appState.favorites.push(channelId);
        } else {
            appState.favorites.splice(index, 1);
        }
        localStorage.setItem('iptv-favorites', JSON.stringify(appState.favorites));
        renderChannels(searchInput.value);
        updateFavoriteButton();
    }
    
    // Update favorite button in player
    function updateFavoriteButton() {
        if (!appState.currentChannelId) return;
        
        const isFavorite = appState.favorites.includes(appState.currentChannelId);
        favoriteBtn.innerHTML = isFavorite ? 
            '<i class="fas fa-heart"></i>' : 
            '<i class="far fa-heart"></i>';
        favoriteBtn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
    }
    
    // Play a channel
    function playChannel(channelId) {
        const channel = channels.find(c => c.id === channelId);
        if (!channel) return;
        
        // Hide error and show loading spinner
        playerError.style.display = 'none';
        playerSpinner.style.display = 'block';
        videoPlayer.style.display = 'none';
        youtubePlayer.style.display = 'none';
        
        // Update UI
        currentChannel.textContent = channel.name;
        playerSection.classList.add('active');
        appState.currentChannelId = channelId;
        appState.currentStream = channel.stream;
        
        // Update favorite button
        updateFavoriteButton();
        
        // Scroll to player
        playerSection.scrollIntoView({ behavior: 'smooth' });
        
        // Reset player
        videoPlayer.src = '';
        videoPlayer.load();
        youtubePlayer.src = '';
        
        // Clean up previous HLS instance if exists
        if (appState.hls) {
            appState.hls.destroy();
            appState.hls = null;
        }
        
        // Play based on stream type
        if (channel.type === 'youtube') {
            playYoutubeStream(channel);
        } else {
            playM3U8Stream(channel);
        }
    }
    
    // Play YouTube stream
    function playYoutubeStream(channel) {
        youtubePlayer.style.display = 'block';
        videoPlayer.style.display = 'none';
        
        // Enable autoplay for YouTube
        youtubePlayer.src = `${channel.stream}&autoplay=1&mute=0`;
        
        // Hide spinner when YouTube player is ready
        const checkReady = setInterval(() => {
            if (youtubePlayer.src && youtubePlayer.src !== 'about:blank') {
                clearInterval(checkReady);
                playerSpinner.style.display = 'none';
            }
        }, 100);
    }
    
    // Play M3U8 stream with HLS.js
    function playM3U8Stream(channel) {
        youtubePlayer.style.display = 'none';
        videoPlayer.style.display = 'block';
        
        const errorTimeout = setTimeout(() => {
            if (videoPlayer.readyState === 0) {
                showPlayerError('Stream is taking longer than expected to load...');
            }
        }, 10000); // Increased timeout to 10 seconds

        if (Hls.isSupported()) {
            appState.hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 600,
                maxBufferSize: 60 * 1000 * 1000,
                maxBufferHole: 0.5,
                lowLatencyMode: false,
                enableWorker: true,
                startLevel: -1, // Auto quality selection
                debug: true // Enable debug logging
            });
            
            appState.hls.loadSource(channel.stream);
            appState.hls.attachMedia(videoPlayer);
            
            appState.hls.on(Hls.Events.MANIFEST_PARSED, function() {
                clearTimeout(errorTimeout);
                playerSpinner.style.display = 'none';
                currentChannel.textContent = channel.name;
                
                videoPlayer.play().catch(e => {
                    console.error('Autoplay prevented:', e);
                    currentChannel.textContent = `${channel.name} - Click to play`;
                    videoPlayer.controls = true;
                    
                    // Add click handler to start playback
                    videoPlayer.addEventListener('click', function playOnClick() {
                        videoPlayer.play().then(() => {
                            videoPlayer.removeEventListener('click', playOnClick);
                            videoPlayer.controls = false;
                        }).catch(e => console.error('Play failed:', e));
                    }, { once: true });
                });
            });
            
            appState.hls.on(Hls.Events.ERROR, function(event, data) {
                clearTimeout(errorTimeout);
                console.error('HLS Error:', data);
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            showPlayerError('Network error - trying to recover');
                            appState.hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            showPlayerError('Media error - trying to recover');
                            appState.hls.recoverMediaError();
                            break;
                        default:
                            showPlayerError('Fatal error - cannot recover');
                            appState.hls.destroy();
                            break;
                    }
                }
            });
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            videoPlayer.src = channel.stream;
            videoPlayer.addEventListener('loadedmetadata', function() {
                clearTimeout(errorTimeout);
                playerSpinner.style.display = 'none';
                currentChannel.textContent = channel.name;
                
                videoPlayer.play().catch(e => {
                    console.error('Autoplay prevented:', e);
                    currentChannel.textContent = `${channel.name} - Click to play`;
                    videoPlayer.controls = true;
                });
            }, { once: true });
            
            videoPlayer.addEventListener('error', function() {
                clearTimeout(errorTimeout);
                showPlayerError('Error loading stream. The server might be down or the stream is unavailable.');
            }, { once: true });
        } else {
            showPlayerError('HLS is not supported in this browser without HLS.js');
        }
    }
    
    // Show player error
    function showPlayerError(message) {
        playerSpinner.style.display = 'none';
        videoPlayer.style.display = 'none';
        youtubePlayer.style.display = 'none';
        errorMessage.textContent = message;
        playerError.style.display = 'flex';
        appState.lastError = message;
    }
    
    // Close the player
    function closePlayer() {
        playerSection.classList.remove('active');
        
        // Clean up HLS instance if it exists
        if (appState.hls) {
            appState.hls.destroy();
            appState.hls = null;
        }
        
        videoPlayer.pause();
        videoPlayer.src = '';
        youtubePlayer.src = '';
        appState.currentStream = null;
        appState.currentChannelId = null;
        playerError.style.display = 'none';
    }
    
    // Filter channels by category
    function filterChannels(category) {
        const allCards = document.querySelectorAll('.channel-card');
        
        allCards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        // Show/hide sections based on filtered content
        document.getElementById('sports-grid').style.display = 
            [...sportsGrid.querySelectorAll('.channel-card')].some(card => card.style.display !== 'none') ? 
            'grid' : 'none';
        document.getElementById('news-grid').style.display = 
            [...newsGrid.querySelectorAll('.channel-card')].some(card => card.style.display !== 'none') ? 
            'grid' : 'none';
        
        // Update section titles visibility
        document.querySelectorAll('.section-title').forEach(title => {
            const gridId = title.nextElementSibling.id;
            title.style.display = 
                document.getElementById(gridId).style.display === 'none' ? 
                'none' : 'inline-block';
        });
    }
    
    // Toggle fullscreen
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            playerSection.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    // Update fullscreen button icon
    function updateFullscreenButton() {
        fullscreenBtn.innerHTML = document.fullscreenElement ? 
            '<i class="fas fa-compress"></i>' : 
            '<i class="fas fa-expand"></i>';
        fullscreenBtn.title = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
    }
    
    // Initialize the app when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
