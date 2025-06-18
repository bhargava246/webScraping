document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const status = document.getElementById('status');
    const dataPreview = document.getElementById('dataPreview');
    const previewContent = document.getElementById('previewContent');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    let extractedData = null;
    
    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
    
    // Extract button click handler
    extractBtn.addEventListener('click', async () => {
        try {
            updateStatus('Analyzing current tab...', 'loading');
            extractBtn.disabled = true;
            extractBtn.textContent = '🔍 Extracting...';
            
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }
            
            // Execute content script to extract data
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractWebSeriesData
            });
            
            if (results && results[0] && results[0].result) {
                extractedData = results[0].result;
                
                // Show preview
                showDataPreview(extractedData);
                downloadBtn.style.display = 'block';
                
                const aiStatus = extractedData.aiEnhanced ? ' (AI Enhanced)' : '';
                updateStatus(`Successfully extracted data from: ${tab.title}${aiStatus}`, 'success');
            } else {
                throw new Error('No data extracted');
            }
            
        } catch (error) {
            console.error('Extraction error:', error);
            updateStatus(`Error: ${error.message}`, 'error');
        } finally {
            extractBtn.disabled = false;
            extractBtn.textContent = '🔍 Extract Series Data';
        }
    });
    
    // Download button click handler
    downloadBtn.addEventListener('click', () => {
        if (extractedData) {
            downloadData(extractedData);
        }
    });
    
    function updateStatus(message, type = 'success') {
        status.textContent = message;
        status.className = `status ${type}`;
    }
    
    function showDataPreview(data) {
        // Create a cleaner preview
        const previewData = {
            url: data.url,
            title: data.title,
            description: data.description,
            rating: data.rating,
            genres: data.genres,
            cast: data.cast,
            episodes: data.episodes,
            images: data.images,
            platform: data.platform,
            pageType: data.pageType,
            aiEnhanced: data.aiEnhanced,
            extractedAt: data.extractedAt
        };
        
        const preview = JSON.stringify(previewData, null, 2);
        previewContent.textContent = preview;
        dataPreview.style.display = 'block';
    }
    
    function downloadData(data) {
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
                updateStatus(`Download failed: ${chrome.runtime.lastError.message}`, 'error');
            } else {
                updateStatus('Data downloaded successfully!', 'success');
            }
            URL.revokeObjectURL(url);
        });
    }
});

// Function to extract web series data (will be injected into the page)
async function extractWebSeriesData() {
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
        platform: detectPlatform(),
        pageType: detectPageType(),
        aiEnhanced: false
    };
    
    // Extract basic data first
    data.title = extractTitle();
    data.description = extractDescription();
    data.rating = extractRating();
    data.genres = extractGenres();
    data.cast = extractCast();
    data.episodes = extractEpisodes();
    data.images = extractImages();
    data.metadata = extractMetadata();
    
    // Use AI to enhance and clean the data
    try {
        const enhancedData = await enhanceDataWithAI(data);
        return { ...data, ...enhancedData, aiEnhanced: true };
    } catch (error) {
        console.log('AI enhancement failed, using basic extraction:', error);
        return data;
    }
    
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
        if (hostname.includes('commonsensemedia')) return 'Common Sense Media';
        
        return 'Unknown';
    }
    
    function detectPageType() {
        const url = window.location.href.toLowerCase();
        const path = window.location.pathname.toLowerCase();
        
        if (path.includes('/movie/') || path.includes('/film/')) return 'movie';
        if (path.includes('/tv/') || path.includes('/series/') || path.includes('/show/')) return 'series';
        if (path.includes('/episode/')) return 'episode';
        if (path.includes('/season/')) return 'season';
        if (path.includes('/reviews') || path.includes('/review')) return 'reviews';
        if (path.includes('/search') || path.includes('/browse')) return 'listing';
        
        return 'unknown';
    }
    
    async function enhanceDataWithAI(data) {
        try {
            const GEMINI_API_KEY = 'AIzaSyD17CcI5RqhMhrQr0HUPMN27K0jwnupfR4';
            
            const prompt = `Analyze this web series/movie data and provide enhanced, clean information:

Current Data:
${JSON.stringify(data, null, 2)}

Please provide:
1. Clean title (remove extra text, formatting)
2. Better description (if current is generic)
3. Proper rating (extract from text if needed)
4. Organized genres (remove duplicates, standardize names)
5. Clean cast list (remove duplicates, format names)
6. Episode information (if available)
7. Best quality image URLs
8. Additional metadata that might be useful

Return as JSON with these fields:
{
  "title": "clean title",
  "description": "better description",
  "rating": "numeric rating",
  "genres": ["genre1", "genre2"],
  "cast": ["actor1", "actor2"],
  "episodes": [{"title": "episode title", "number": "S01E01", "description": "episode description"}],
  "images": ["best image urls"],
  "additionalInfo": {"year": "2024", "runtime": "120 min", "director": "name"}
}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`AI API error: ${response.status}`);
            }

            const result = await response.json();
            const aiResponse = result.candidates[0].content.parts[0].text;
            
            // Extract JSON from AI response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return {};
        } catch (error) {
            console.error('AI enhancement failed:', error);
            return {};
        }
    }
    
    function extractTitle() {
        const selectors = [
            'h1',
            '.title',
            '.series-title',
            '.show-title',
            '.movie-title',
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
            '.overview',
            '.movie-description',
            '.series-description',
            '[data-testid="description"]',
            'meta[property="og:description"]',
            'meta[name="description"]',
            '.plot-summary',
            '.content-description'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                if (selector.startsWith('meta')) {
                    return element.getAttribute('content') || '';
                }
                const text = element.textContent.trim();
                if (text && text.length > 20) {
                    return text;
                }
            }
        }
        
        return '';
    }
    
    function extractRating() {
        const selectors = [
            '.rating',
            '.score',
            '.stars',
            '.user-rating',
            '.critic-rating',
            '.audience-rating',
            '.tomatometer',
            '.audience-score',
            '[data-testid="rating"]',
            '.imdb-rating',
            '.rating-value',
            '.score-value'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                const ratingMatch = text.match(/(\d+(?:\.\d+)?)/);
                if (ratingMatch) {
                    const rating = parseFloat(ratingMatch[1]);
                    if (rating >= 0 && rating <= 10) {
                        return rating.toString();
                    }
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
            '.categories',
            '[data-testid="genre"]',
            '.tag',
            '.genre-list',
            '.movie-genres',
            '.series-genres'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const genre = element.textContent.trim();
                if (genre && !genres.includes(genre) && genre.length < 50) {
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
            '.actor',
            '[data-testid="cast"]',
            '.character',
            '.cast-list',
            '.actor-list',
            '.movie-cast',
            '.series-cast'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const actor = element.textContent.trim();
                if (actor && !cast.includes(actor) && actor.length < 100) {
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
            '.episode-item',
            '[data-testid="episode"]',
            '.season-episode',
            '.episode-list li',
            '.episode-card'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const episode = {
                    title: element.querySelector('.episode-title')?.textContent.trim() || 
                           element.querySelector('.title')?.textContent.trim() || '',
                    number: element.querySelector('.episode-number')?.textContent.trim() || 
                           element.querySelector('.number')?.textContent.trim() || '',
                    description: element.querySelector('.episode-description')?.textContent.trim() || 
                               element.querySelector('.description')?.textContent.trim() || ''
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
            'img[src*="backdrop"]',
            '.poster img',
            '.cover img',
            '.banner img',
            '.hero-image img',
            '.featured-image img',
            '.movie-poster img',
            '.series-poster img'
        ];
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const src = element.getAttribute('src');
                if (src && !images.includes(src)) {
                    const absoluteUrl = new URL(src, window.location.href).href;
                    images.push(absoluteUrl);
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
                if (data['@type'] === 'TVSeries' || data['@type'] === 'Movie' || data['@type'] === 'CreativeWork') {
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