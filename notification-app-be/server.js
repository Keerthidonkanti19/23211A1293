require('dotenv').config();
const axios = require('axios');


const WEIGHTS = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
};


function compareNotifications(a, b) {
    const weightA = WEIGHTS[a.notificationType] || 0;
    const weightB = WEIGHTS[b.notificationType] || 0;

   
    if (weightA !== weightB) {
        return weightB - weightA; 
    }
    
    
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeB - timeA; 
}


async function fetchAndPrioritizeNotifications() {
    
    const AUTH_TOKEN = process.env.AUTH_TOKEN || 'YOUR_ACTUAL_JWT_TOKEN_HERE'; 

    if (AUTH_TOKEN === 'YOUR_ACTUAL_JWT_TOKEN_HERE') {
        console.warn("⚠️  WARNING: You are using the placeholder token. Please replace it with your valid Bearer token from the middleware stage.");
    }

    try {
        console.log("Fetching notifications from Affordmed API...");
        
        
        const response = await axios.get('http://4.224.186.213/evaluation-service/notifications', {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });
        
       
        const notifications = response.data.notifications || response.data; 

        if (!Array.isArray(notifications) || notifications.length === 0) {
            console.log("No notifications found or invalid response format.");
            return [];
        }

        
        const sortedNotifications = notifications.sort(compareNotifications);

        
        const top10 = sortedNotifications.slice(0, 10);

       
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


fetchAndPrioritizeNotifications();