const STORAGE_KEY = 'pinYT_timestamps';

// Function to load all bookmarks from storage
async function loadBookmarks() {
    const result = await browser.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
}

// Function to save bookmarks to storage
async function saveBookmarks(bookmarks) {
    await browser.storage.local.set({ [STORAGE_KEY]: bookmarks });
}

// Message listener to handle requests from the popup script
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "GET_BOOKMARKS") {
        const bookmarks = await loadBookmarks();
        return { bookmarks }; // Return a Promise with the response
    }

    if (message.action === "SAVE_BOOKMARK") {
        const bookmarks = await loadBookmarks();
        
        // Add the new bookmark to the beginning of the array (most recent first)
        bookmarks.unshift(message.bookmark); 
        
        // Limit the total number of bookmarks to prevent excessive storage use (e.g., 50)
        const MAX_BOOKMARKS = 50;
        if (bookmarks.length > MAX_BOOKMARKS) {
            bookmarks.length = MAX_BOOKMARKS;
        }

        await saveBookmarks(bookmarks);
        return { success: true, bookmarks };
    }

    if (message.action === "DELETE_BOOKMARK") {
        const bookmarks = await loadBookmarks();
        if (message.index >= 0 && message.index < bookmarks.length) {
            bookmarks.splice(message.index, 1);
            await saveBookmarks(bookmarks);
        }
        return { success: true, bookmarks };
    }
});

// Initial startup or install logic (optional)
browser.runtime.onInstalled.addListener(() => {
    console.log("PinYT Timestamp extension installed.");
});