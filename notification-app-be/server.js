require('dotenv').config();
const axios = require('axios');

// Priority weights mapping (Placement > Result > Event)
const WEIGHTS = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
};

/**
 * Calculates priority score: primarily by weight, tie-broken by time.
 */
function compareNotifications(a, b) {
    const weightA = WEIGHTS[a.notificationType] || 0;
    const weightB = WEIGHTS[b.notificationType] || 0;

    // 1. Sort by Priority Weight (Descending)
    if (weightA !== weightB) {
        return weightB - weightA; 
    }
    
    // 2. Tie-breaker: Sort by Recency (Descending)
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeB - timeA; 
}

/**
 * Fetches notifications from the protected API and prints the Top 10
 */
async function fetchAndPrioritizeNotifications() {
    // IMPORTANT: Insert your actual JWT token below, or create a .env file 
    // in the same directory with: AUTH_TOKEN=your_actual_token_string
    const AUTH_TOKEN = process.env.AUTH_TOKEN || 'YOUR_ACTUAL_JWT_TOKEN_HERE'; 

    if (AUTH_TOKEN === 'YOUR_ACTUAL_JWT_TOKEN_HERE') {
        console.warn("⚠️  WARNING: You are using the placeholder token. Please replace it with your valid Bearer token from the middleware stage.");
    }

    try {
        console.log("Fetching notifications from Affordmed API...");
        
        // Fetch from API with Authorization header
        const response = await axios.get('http://4.224.186.213/evaluation-service/notifications', {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });
        
        // Safely extract the array, handling potential variations in the JSON envelope
        const notifications = response.data.notifications || response.data; 

        if (!Array.isArray(notifications) || notifications.length === 0) {
            console.log("No notifications found or invalid response format.");
            return [];
        }

        // Sort all notifications using our comparator logic
        const sortedNotifications = notifications.sort(compareNotifications);

        // Extract the Top 10
        const top10 = sortedNotifications.slice(0, 10);

        // Format and print the output for the screenshot
        console.log("\n========================================================");
        console.log("              PRIORITY INBOX (TOP 10)                   ");
        console.log("========================================================\n");
        
        top10.forEach((n, index) => {
            const type = (n.notificationType || 'Unknown').padEnd(10, ' ');
            const date = new Date(n.createdAt).toLocaleString();
            
            console.log(`${(index + 1).toString().padStart(2, ' ')}. [${type}] - ${date}`);
            console.log(`    Title: ${n.title}`);
            console.log(`    ID:    ${n.id}\n`);
        });

        return top10;

    } catch (error) {
        console.error("\n❌ Error fetching notifications:");
        
        // Enhanced error handling to diagnose exact API failures
        if (error.response) {
            console.error(`   Status Code: ${error.response.status}`);
            console.error(`   Message:`, error.response.data);
            if (error.response.status === 401) {
                console.error("\n   Fix: Your token is invalid, expired, or missing. Ensure you pasted the exact token from your login/middleware stage.");
            }
        } else if (error.request) {
            console.error("   No response received from the server. Verify the API IP address is correct and reachable.");
        } else {
            console.error(`   ${error.message}`);
        }
    }
}

// Execute the script
fetchAndPrioritizeNotifications();