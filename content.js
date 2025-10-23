// Function to safely retrieve the current video time and ID
function getCurrentVideoDetails() {
    try {
        // YouTube's player element usually has the ID 'movie_player' or 'player'
        const player = document.getElementById('movie_player');
        
        if (player && typeof player.getCurrentTime === 'function' && typeof player.getVideoData === 'function') {
            const currentTime = player.getCurrentTime();
            const videoData = player.getVideoData(); // Contains 'video_id'
            
            return { 
                currentTime: currentTime, 
                videoID: videoData.video_id 
            };
        }
    } catch (e) {
        console.error("Could not access YouTube player API:", e);
    }
    return null;
}

// Listen for messages from the popup script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_CURRENT_TIME") {
        const details = getCurrentVideoDetails();
        
        // Send the response back to the popup
        if (details) {
            sendResponse(details);
        } else {
            sendResponse({ error: "Player not found or not ready." });
        }
        
        // Return true to indicate that sendResponse will be called asynchronously
        return true; 
    }
});