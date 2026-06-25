const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Base URL for the Affordmed Evaluation APIs
const BASE_API_URL = 'http://4.224.186.213/evaluation-service';

// TODO: Replace with your actual authorization token if required by the middleware
const AUTH_HEADERS = {
    'Authorization': 'Bearer YOUR_AUTH_TOKEN_HERE' 
};

/**
 * Core Algorithm: 0/1 Knapsack using Dynamic Programming
 * @param {number} budget - The mechanic-hours available (capacity)
 * @param {Array} vehicles - Array of vehicle objects { TaskID, Duration, Impact }
 * @returns {Object} { maxImpact, selectedTaskIDs }
 */
function optimizeMaintenanceSchedule(budget, vehicles) {
    const n = vehicles.length;
    
    // Initialize a 2D DP array with 0s
    // dp[i][w] will store the maximum impact using the first 'i' vehicles and 'w' hours
    const dp = Array(n + 1).fill(0).map(() => Array(budget + 1).fill(0));

    // Build the DP table
    for (let i = 1; i <= n; i++) {
        const duration = vehicles[i - 1].Duration;
        const impact = vehicles[i - 1].Impact;

        for (let w = 1; w <= budget; w++) {
            if (duration <= w) {
                // Maximize by either including the current task or excluding it
                dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - duration] + impact);
            } else {
                // Task duration exceeds current budget, exclude it
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    // Reconstruct the selected subset of vehicles (Backtracking)
    let maxImpact = dp[n][budget];
    let remainingBudget = budget;
    const selectedTaskIDs = [];

    for (let i = n; i > 0 && maxImpact > 0; i--) {
        // If the value came from the row above, the item was not included
        if (maxImpact !== dp[i - 1][remainingBudget]) {
            selectedTaskIDs.push(vehicles[i - 1].TaskID);
            maxImpact -= vehicles[i - 1].Impact;
            remainingBudget -= vehicles[i - 1].Duration;
        }
    }

    return {
        totalImpact: dp[n][budget],
        totalDurationUsed: budget - remainingBudget,
        selectedTasks: selectedTaskIDs
    };
}

/**
 * Route: Calculate optimal schedules for all depots
 */
app.get('/api/schedule', async (req, res) => {
    try {
        // 1. Fetch Depots and Vehicles concurrently
        const [depotsResponse, vehiclesResponse] = await Promise.all([
            axios.get(`${BASE_API_URL}/depots`, { headers: AUTH_HEADERS }),
            axios.get(`${BASE_API_URL}/vehicles`, { headers: AUTH_HEADERS })
        ]);

        const depots = depotsResponse.data.depots;
        const vehicles = vehiclesResponse.data.vehicles;

        const results = [];

        // 2. Process optimal schedule for each depot
        for (const depot of depots) {
            const budget = depot.MechanicHours;
            
            // Execute DP algorithm
            const schedule = optimizeMaintenanceSchedule(budget, vehicles);

            results.push({
                depotID: depot.ID,
                allocatedBudget: budget,
                optimizationResult: schedule
            });
        }

        // 3. Return the consolidated schedule mapping
        return res.status(200).json({
            success: true,
            message: "Successfully generated optimal vehicle maintenance schedules.",
            data: results
        });

    } catch (error) {
        console.error("Error fetching data or processing schedule:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate schedule. Ensure APIs are reachable and token is valid.",
            error: error.response ? error.response.data : error.message
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Vehicle Maintenance Scheduler running on port ${PORT}`);
});