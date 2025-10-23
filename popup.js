const bookmarkBtn = document.getElementById('bookmark-btn');
const bookmarksList = document.getElementById('bookmarks-list');

// Utility function to format seconds into HH:MM:SS
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    // Add leading zeros if necessary
    const parts = [
        hours > 0 ? String(hours).padStart(2, '0') : null,
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
    ].filter(p => p !== null || hours === 0); // Include minutes/seconds even if hours is 0
    
    return parts.join(':');
}

// Function to render the list of bookmarks
function renderBookmarks(bookmarks) {
    bookmarksList.innerHTML = '';
    if (!bookmarks || bookmarks.length === 0) {
        bookmarksList.innerHTML = '<p style="text-align: center; color: #777;">No timestamps saved yet.</p>';
        return;
    }

    bookmarks.forEach((bookmark, index) => {
        const item = document.createElement('li');
        item.className = 'bookmark-item';
        item.setAttribute('data-index', index);

        // Display text: Video Title | [Timestamp]
        const displayTime = formatTime(bookmark.time);
        const titleSpan = document.createElement('span');
        titleSpan.textContent = `${bookmark.title} | [${displayTime}]`;
        
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '❌';
        deleteBtn.title = 'Delete Bookmark';

        item.appendChild(titleSpan);
        item.appendChild(deleteBtn);
        bookmarksList.appendChild(item);
    });
}

// Handler for the "Pin Current Time" button
bookmarkBtn.addEventListener('click', async () => {
    // 1. Get the current active YouTube tab
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url.includes('youtube.com/watch')) {
        alert('Please open a YouTube video to pin a timestamp.');
        return;
    }
    
    // 2. Execute the content script to get video details and time
    try {
        const response = await browser.tabs.sendMessage(tab.id, { action: "GET_CURRENT_TIME" });

        if (!response || !response.videoID || typeof response.currentTime === 'undefined') {
            alert('Could not retrieve video time. Make sure the video is playing.');
            return;
        }

        // 3. Construct the new bookmark object
        const newBookmark = {
            title: tab.title.replace(' - YouTube', '').trim(),
            url: tab.url.split('&t=')[0], // Clean URL
            videoID: response.videoID,
            time: Math.floor(response.currentTime), // Use integer seconds
            date: new Date().toISOString()
        };

        // 4. Send a message to the background script to save the bookmark
        const saved = await browser.runtime.sendMessage({ action: "SAVE_BOOKMARK", bookmark: newBookmark });
        
        // 5. Update the UI
        renderBookmarks(saved.bookmarks);
    } catch (error) {
        console.error("Error pinning time:", error);
        alert('An error occurred. Make sure the content script is loaded (try refreshing the YouTube page).');
    }
});

// Handler for clicking a saved bookmark or the delete button
bookmarksList.addEventListener('click', async (event) => {
    const item = event.target.closest('.bookmark-item');
    if (!item) return;

    const index = parseInt(item.getAttribute('data-index'), 10);
    
    if (event.target.classList.contains('delete-btn')) {
        // Handle deletion
        const confirmed = confirm('Are you sure you want to delete this bookmark?');
        if (confirmed) {
             const updated = await browser.runtime.sendMessage({ action: "DELETE_BOOKMARK", index: index });
             renderBookmarks(updated.bookmarks);
        }
    } else {
        // Handle navigation
        const bookmarks = await browser.runtime.sendMessage({ action: "GET_BOOKMARKS" });
        const bookmark = bookmarks.bookmarks[index];

        if (bookmark) {
            const urlWithTime = `${bookmark.url}&t=${bookmark.time}s`;
            
            // Open the URL in a new tab or update the current tab
            browser.tabs.create({ url: urlWithTime });
        }
    }
});

// Load bookmarks when the popup opens
async function init() {
    const bookmarks = await browser.runtime.sendMessage({ action: "GET_BOOKMARKS" });
    renderBookmarks(bookmarks.bookmarks);
}

init();