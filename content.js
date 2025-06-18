// Content script that runs on web pages
console.log('Web Series Data Extractor: Content script loaded');

// Gemini AI API key
const GEMINI_API_KEY = 'AIzaSyD17CcI5RqhMhrQr0HUPMN27K0jwnupfR4';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractData') {
        extractWebSeriesData().then(data => {
            sendResponse({ success: true, data: data });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
    }
});

// Enhanced data extraction function with AI processing
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
}

function detectPageType() {
    const url = window.location.href.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    
    // Check for specific page types
    if (path.includes('/movie/') || path.includes('/film/')) return 'movie';
    if (path.includes('/tv/') || path.includes('/series/') || path.includes('/show/')) return 'series';
    if (path.includes('/episode/')) return 'episode';
    if (path.includes('/season/')) return 'season';
    if (path.includes('/reviews') || path.includes('/review')) return 'reviews';
    if (path.includes('/search') || path.includes('/browse')) return 'listing';
    if (path.includes('/cast/') || path.includes('/actor/')) return 'person';
    
    // Check URL patterns
    if (url.includes('imdb.com/title/')) return 'title';
    if (url.includes('netflix.com/watch/')) return 'watch';
    if (url.includes('amazon.com/dp/')) return 'product';
    
    return 'unknown';
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
    if (hostname.includes('letterboxd')) return 'Letterboxd';
    if (hostname.includes('tmdb')) return 'TMDb';
    
    return 'Unknown';
}

async function enhanceDataWithAI(data) {
    try {
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
    // Platform-specific selectors
    const platformSelectors = {
        'Netflix': [
            '[data-uia="title"]',
            '.title',
            'h1',
            '[data-testid="title"]'
        ],
        'Amazon Prime': [
            '.title',
            'h1',
            '[data-automation-id="title"]'
        ],
        'IMDb': [
            'h1[data-testid="hero-title-block__title"]',
            '.titleHeader__title',
            'h1'
        ],
        'Rotten Tomatoes': [
            '.title',
            'h1',
            '.movie-title'
        ],
        'Common Sense Media': [
            '.title',
            'h1',
            '.page-title',
            '.movie-title'
        ]
    };
    
    const platform = detectPlatform();
    const selectors = platformSelectors[platform] || [
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
        '.movie-description',
        '.content-description'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            if (selector.startsWith('meta')) {
                return element.getAttribute('content') || '';
            }
            const text = element.textContent.trim();
            if (text && text.length > 20) { // Avoid very short descriptions
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
            // Look for various rating patterns
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
                // Convert relative URLs to absolute
                const absoluteUrl = new URL(src, window.location.href).href;
                images.push(absoluteUrl);
            }
        });
    }
    
    return images;
}

function extractMetadata() {
    const metadata = {};
    
    // Extract structured data (JSON-LD)
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
    
    // Extract additional platform-specific data
    const platform = detectPlatform();
    if (platform === 'Netflix') {
        metadata.netflixData = extractNetflixSpecificData();
    } else if (platform === 'IMDb') {
        metadata.imdbData = extractIMDbSpecificData();
    } else if (platform === 'Common Sense Media') {
        metadata.csmData = extractCSMSpecificData();
    }
    
    return metadata;
}

function extractNetflixSpecificData() {
    const data = {};
    
    const maturityRating = document.querySelector('.maturity-rating');
    if (maturityRating) {
        data.maturityRating = maturityRating.textContent.trim();
    }
    
    const year = document.querySelector('.year');
    if (year) {
        data.year = year.textContent.trim();
    }
    
    return data;
}

function extractIMDbSpecificData() {
    const data = {};
    
    const year = document.querySelector('[data-testid="hero-title-block__title"] + ul li');
    if (year) {
        data.year = year.textContent.trim();
    }
    
    const runtime = document.querySelector('[data-testid="hero-title-block__metadata"] li');
    if (runtime) {
        data.runtime = runtime.textContent.trim();
    }
    
    return data;
}

function extractCSMSpecificData() {
    const data = {};
    
    // Extract Common Sense Media specific data
    const ageRating = document.querySelector('.age-rating');
    if (ageRating) {
        data.ageRating = ageRating.textContent.trim();
    }
    
    const educationalValue = document.querySelector('.educational-value');
    if (educationalValue) {
        data.educationalValue = educationalValue.textContent.trim();
    }
    
    return data;
}

// Auto-extract data when page loads (optional)
if (window.location.hostname.includes('netflix') || 
    window.location.hostname.includes('imdb') || 
    window.location.hostname.includes('amazon') ||
    window.location.hostname.includes('commonsensemedia')) {
    
    // Wait for page to fully load
    setTimeout(() => {
        extractWebSeriesData().then(data => {
            console.log('Auto-extracted web series data:', data);
            
            // Store in chrome storage for potential use
            chrome.storage.local.set({ 'lastExtractedData': data });
        }).catch(error => {
            console.error('Auto-extraction failed:', error);
        });
    }, 3000);
} 