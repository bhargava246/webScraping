# Quick Installation Guide

## Install the Chrome Extension

### Step 1: Download the Extension
1. Download or clone this repository to your computer
2. Extract the files if downloaded as a ZIP

### Step 2: Load in Chrome
1. Open Google Chrome
2. Type `chrome://extensions/` in the address bar and press Enter
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" button
5. Select the folder containing the extension files (the folder with `manifest.json`)
6. The extension should now appear in your extensions list

### Step 3: Add Icons (Optional but Recommended)
Before using the extension, you should add proper icons:
1. Create or download 16x16, 48x48, and 128x128 PNG icons
2. Replace the placeholder files in the `icons/` folder:
   - `icons/icon16.png`
   - `icons/icon48.png` 
   - `icons/icon128.png`
3. Go back to `chrome://extensions/` and click the refresh icon on your extension

### Step 4: Test the Extension
1. Navigate to a web series page (e.g., IMDb, Netflix, etc.)
2. Click the extension icon in your Chrome toolbar
3. Click "🔍 Extract Series Data"
4. Review the extracted data and download if needed

## Troubleshooting

### Extension Not Appearing
- Make sure you selected the correct folder (the one containing `manifest.json`)
- Check that all required files are present
- Try refreshing the extensions page

### Extension Not Working
- Ensure the page is fully loaded before clicking extract
- Check the browser console for error messages
- Try on different web series websites

### Icons Not Showing
- Make sure the icon files are actual PNG images
- Check that the file names match exactly: `icon16.png`, `icon48.png`, `icon128.png`
- Refresh the extension after adding icons

## Supported Websites

The extension works best on:
- **Netflix** (netflix.com)
- **IMDb** (imdb.com)
- **Amazon Prime Video** (amazon.com/primevideo)
- **Hulu** (hulu.com)
- **Disney+** (disneyplus.com)
- **HBO Max** (hbomax.com)
- **Rotten Tomatoes** (rottentomatoes.com)
- **Metacritic** (metacritic.com)
- And many other entertainment websites

## Next Steps

After installation:
1. Read the full README.md for detailed usage instructions
2. Explore the settings tab in the extension popup
3. Try extracting data from different websites
4. Customize your extraction preferences

## Need Help?

- Check the main README.md file for comprehensive documentation
- Look at the troubleshooting section
- Create an issue on GitHub if you encounter problems 