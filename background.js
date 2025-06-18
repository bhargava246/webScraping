// Background service worker for Web Series Data Extractor
console.log('Web Series Data Extractor: Background service worker loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Web Series Data Extractor installed');
        
        // Set default settings
        chrome.storage.local.set({
            settings: {
                extractTitle: true,
                extractDescription: true,
                extractRating: true,
                extractGenres: true,
                extractCast: true,
                extractEpisodes: true,
                extractImages: true,
                autoExtract: false,
                saveToFile: true
            }
        });
    }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSettings') {
        chrome.storage.local.get(['settings'], (result) => {
            sendResponse({ settings: result.settings || {} });
        });
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'saveSettings') {
        chrome.storage.local.set({ settings: request.settings }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
    
    if (request.action === 'getLastExtractedData') {
        chrome.storage.local.get(['lastExtractedData'], (result) => {
            sendResponse({ data: result.lastExtractedData });
        });
        return true;
    }
    
    if (request.action === 'saveData') {
        saveDataToFile(request.data);
        sendResponse({ success: true });
    }
});

// Function to save data to a file
function saveDataToFile(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `web-series-data-${timestamp}.json`;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
    }, (downloadId) => {
        if (chrome.runtime.lastError) {
            console.error('Download failed:', chrome.runtime.lastError);
        } else {
            console.log('Data saved successfully:', filename);
        }
        URL.revokeObjectURL(url);
    });
}

// Handle tab updates to auto-extract data if enabled
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Check if auto-extract is enabled
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            if (settings.autoExtract && isWebSeriesSite(tab.url)) {
                // Wait a bit for the page to fully load
                setTimeout(() => {
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        function: extractWebSeriesData
                    }, (results) => {
                        if (results && results[0] && results[0].result) {
                            const data = results[0].result;
                            chrome.storage.local.set({ 'lastExtractedData': data });
                            
                            if (settings.saveToFile) {
                                saveDataToFile(data);
                            }
                        }
                    });
                }, 3000);
            }
        });
    }
});

// Function to check if the URL is a web series site
function isWebSeriesSite(url) {
    const hostname = new URL(url).hostname.toLowerCase();
    const webSeriesSites = [
        'netflix.com',
        'amazon.com',
        'primevideo.com',
        'hulu.com',
        'disneyplus.com',
        'hbomax.com',
        'imdb.com',
        'rottentomatoes.com',
        'metacritic.com',
        'thetvdb.com',
        'trakt.tv'
    ];
    
    return webSeriesSites.some(site => hostname.includes(site));
}

// Function to extract web series data (same as in content script)
function extractWebSeriesData() {
    const data = {
        url: window.location.href,
        title: '',
        description: '',
        rating: '',
        genres: [],
        cast: [],
        episodes: [],
        images: [],
        metadata: {},
        extractedAt: new Date().toISOString(),
        platform: detectPlatform()
    };
    
    // Extract all data types
    data.title = extractTitle();
    data.description = extractDescription();
    data.rating = extractRating();
    data.genres = extractGenres();
    data.cast = extractCast();
    data.episodes = extractEpisodes();
    data.images = extractImages();
    data.metadata = extractMetadata();
    
    return data;
    
    function detectPlatform() {
        const hostname = window.location.hostname.toLowerCase();
        
        if (hostname.includes('netflix')) return 'Netflix';
        if (hostname.includes('amazon') || hostname.includes('primevideo')) return 'Amazon Prime';
        if (hostname.includes('hulu')) return 'Hulu';
        if (hostname.includes('disney')) return 'Disney+';
        if (hostname.includes('hbo')) return 'HBO Max';
        if (hostname.includes('imdb')) return 'IMDb';
        if (hostname.includes('rottentomatoes')) return 'Rotten Tomatoes';
        if (hostname.includes('metacritic')) return 'Metacritic';
        if (hostname.includes('tvdb')) return 'TheTVDB';
        if (hostname.includes('trakt')) return 'Trakt';
        
        return 'Unknown';
    }
    
    function extractTitle() {
        const selectors = [
            'h1',
            '.title',
            '.series-title',
            '.show-title',
            '[data-testid="title"]',
            'meta[property="og:title"]',
            'meta[name="title"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                if (selector.startsWith('meta')) {
                    return element.getAttribute('content') || '';
                }
                return element.textContent.trim();
            }
        }
        
        return document.title;
    }
    
    function extractDescription() {
        const selectors = [
            '.description',
            '.synopsis',
            '.summary',
            '.plot',
            '[data-testid="description"]',
            'meta[property="og:description"]',
            'meta[name="description"]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                if (selector.startsWith('meta')) {
                    return element.getAttribute('content') || '';
                }
                return element.textContent.trim();
            }
        }
        
        return '';
    }
    
    function extractRating() {
        const selectors = [
            '.rating',
            '.score',
            '.stars',
            '[data-testid="rating"]',
            '.imdb-rating',
            '.user-rating'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                const ratingMatch = text.match(/(\d+(?:\.\d+)?)/);
                if (ratingMatch) {
                    return ratingMatch[1];
                }
            }
        }
        
        return '';
    }
    
    function extractGenres() {
        const genres = [];
        const selectors = [
            '.genre',
            '.genres',
            '.category',
            '[data-testid="genre"]',
            '.tag'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const genre = element.textContent.trim();
                if (genre && !genres.includes(genre)) {
                    genres.push(genre);
                }
            });
        }
        
        return genres;
    }
    
    function extractCast() {
        const cast = [];
        const selectors = [
            '.cast',
            '.actors',
            '.cast-member',
            '[data-testid="cast"]',
            '.character'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const actor = element.textContent.trim();
                if (actor && !cast.includes(actor)) {
                    cast.push(actor);
                }
            });
        }
        
        return cast;
    }
    
    function extractEpisodes() {
        const episodes = [];
        const selectors = [
            '.episode',
            '.episodes li',
            '[data-testid="episode"]',
            '.season-episode'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const episode = {
                    title: element.querySelector('.episode-title')?.textContent.trim() || '',
                    number: element.querySelector('.episode-number')?.textContent.trim() || '',
                    description: element.querySelector('.episode-description')?.textContent.trim() || ''
                };
                
                if (episode.title || episode.number) {
                    episodes.push(episode);
                }
            });
        }
        
        return episodes;
    }
    
    function extractImages() {
        const images = [];
        const selectors = [
            'img[src*="poster"]',
            'img[src*="cover"]',
            'img[src*="banner"]',
            '.poster img',
            '.cover img',
            '.banner img'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const src = element.getAttribute('src');
                if (src && !images.includes(src)) {
                    images.push(src);
                }
            });
        }
        
        return images;
    }
    
    function extractMetadata() {
        const metadata = {};
        
        // Extract structured data
        const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
        structuredData.forEach(script => {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@type'] === 'TVSeries' || data['@type'] === 'Movie') {
                    metadata.structuredData = data;
                }
            } catch (e) {
                // Ignore invalid JSON
            }
        });
        
        // Extract meta tags
        const metaTags = document.querySelectorAll('meta');
        metaTags.forEach(meta => {
            const name = meta.getAttribute('name') || meta.getAttribute('property');
            const content = meta.getAttribute('content');
            if (name && content) {
                metadata[name] = content;
            }
        });
        
        return metadata;
    }
} 