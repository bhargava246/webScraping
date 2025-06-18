# Web Series Data Extractor Chrome Extension

A powerful Chrome extension that analyzes active tabs and extracts comprehensive web series data from popular streaming platforms and entertainment websites.

## Features

- **Multi-Platform Support**: Works with Netflix, Amazon Prime, Hulu, Disney+, HBO Max, IMDb, Rotten Tomatoes, and more
- **Comprehensive Data Extraction**: Extracts titles, descriptions, ratings, genres, cast, episodes, images, and metadata
- **Smart Detection**: Automatically detects the platform and uses optimized selectors
- **Data Export**: Save extracted data as JSON files with timestamps
- **Modern UI**: Beautiful, responsive popup interface with tabbed navigation
- **Auto-Extraction**: Optional automatic data extraction when visiting supported sites
- **Settings Management**: Customizable extraction preferences

## Supported Platforms

- **Streaming Services**: Netflix, Amazon Prime Video, Hulu, Disney+, HBO Max
- **Review Sites**: IMDb, Rotten Tomatoes, Metacritic
- **Database Sites**: TheTVDB, Trakt
- **General Sites**: Any website with web series information

## Data Extracted

- **Basic Info**: Title, description, rating, platform detection
- **Content Details**: Genres, cast members, episode information
- **Media**: Poster images, cover art, banners
- **Metadata**: Structured data (JSON-LD), meta tags, platform-specific data
- **Timestamps**: Extraction date and time

## Installation

### Method 1: Load Unpacked Extension (Development)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your Chrome toolbar

### Method 2: Install from Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store (link will be provided when published)
2. Click "Add to Chrome"
3. Confirm the installation

## Usage

### Basic Usage

1. Navigate to any web series page (Netflix, IMDb, etc.)
2. Click the extension icon in your Chrome toolbar
3. Click "🔍 Extract Series Data" button
4. Review the extracted data in the preview
5. Click "💾 Download Data File" to save as JSON

### Advanced Features

#### Settings Tab
- Configure which data types to extract
- Enable/disable auto-extraction
- Set automatic file saving preferences

#### Auto-Extraction
- Enable in settings to automatically extract data when visiting supported sites
- Data is automatically saved to files if enabled

## File Structure

```
web-series-data-extractor/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── content.js            # Content script for data extraction
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Data Format

The extension exports data in the following JSON format:

```json
{
  "url": "https://example.com/series",
  "title": "Series Title",
  "description": "Series description...",
  "rating": "8.5",
  "genres": ["Drama", "Thriller"],
  "cast": ["Actor 1", "Actor 2"],
  "episodes": [
    {
      "title": "Episode Title",
      "number": "S01E01",
      "description": "Episode description"
    }
  ],
  "images": ["https://example.com/poster.jpg"],
  "metadata": {
    "og:title": "Open Graph Title",
    "structuredData": { /* JSON-LD data */ }
  },
  "platform": "Netflix",
  "extractedAt": "2024-01-01T12:00:00.000Z"
}
```

## Technical Details

### Permissions Used

- `activeTab`: Access to the currently active tab
- `storage`: Save settings and extracted data
- `downloads`: Download extracted data as files
- `scripting`: Execute content scripts for data extraction
- `host_permissions`: Access to all URLs for broad compatibility

### Content Script Features

- Platform-specific selectors for optimal data extraction
- Fallback selectors for general websites
- Structured data (JSON-LD) extraction
- Meta tag parsing
- Image URL normalization

### Background Service Worker

- Handles extension installation and setup
- Manages settings storage and retrieval
- Processes auto-extraction requests
- Handles file downloads

## Development

### Prerequisites

- Google Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development

1. Clone the repository
2. Make your changes to the source files
3. Go to `chrome://extensions/`
4. Click the refresh icon on your extension
5. Test your changes

### Building for Production

1. Create a `dist` folder
2. Copy all source files to `dist`
3. Add production icons to `dist/icons/`
4. Update `manifest.json` if needed
5. Zip the `dist` folder for distribution

## Troubleshooting

### Common Issues

1. **Extension not working on a site**
   - Check if the site is supported
   - Try refreshing the page
   - Check browser console for errors

2. **No data extracted**
   - Ensure the page is fully loaded
   - Check if the site has the expected HTML structure
   - Try different web series pages

3. **Download not working**
   - Check Chrome download settings
   - Ensure you have permission to save files
   - Check if antivirus is blocking downloads

### Debug Mode

1. Open Chrome DevTools
2. Go to the Console tab
3. Look for messages starting with "Web Series Data Extractor"
4. Check for any error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or feature requests:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the technical documentation

## Changelog

### Version 1.0.0
- Initial release
- Basic data extraction functionality
- Support for major streaming platforms
- JSON export capability
- Modern UI with settings management

## Future Enhancements

- CSV export option
- Batch extraction from multiple pages
- Data visualization features
- Integration with external APIs
- Enhanced platform support
- Data comparison tools 