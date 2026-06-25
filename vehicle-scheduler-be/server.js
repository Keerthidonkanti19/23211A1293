const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const apiUrl = 'http://4.224.186.213/evaluation-service';

const getOptimalTasks = (maxHours, items) => {
    const len = items.length;
    const matrix = Array(len + 1).fill(0).map(() => Array(maxHours + 1).fill(0));

    for (let i = 1; i <= len; i++) {
        const time = items[i - 1].Duration;
        const val = items[i - 1].Impact;

        for (let w = 1; w <= maxHours; w++) {
            if (time <= w) {
                matrix[i][w] = Math.max(matrix[i - 1][w], matrix[i - 1][w - time] + val);
            } else {
                matrix[i][w] = matrix[i - 1][w];
            }
        }
    }

    let currentVal = matrix[len][maxHours];
    let hoursLeft = maxHours;
    const chosenIds = [];

    for (let i = len; i > 0 && currentVal > 0; i--) {
        if (currentVal !== matrix[i - 1][hoursLeft]) {
            chosenIds.push(items[i - 1].TaskID);
            currentVal -= items[i - 1].Impact;
            hoursLeft -= items[i - 1].Duration;
        }
    }

    return {
        totalImpact: matrix[len][maxHours],
        timeUsed: maxHours - hoursLeft,
        tasks: chosenIds
    };
};

app.get('/api/schedule', async (req, res) => {
    try {
        const token = process.env.AUTH_TOKEN || 'ahXjvp';
        const config = { headers: { 'Authorization': token.trim() } };

        const [depotsReq, vehiclesReq] = await Promise.all([
            axios.get(`${apiUrl}/depots`, config),
            axios.get(`${apiUrl}/vehicles`, config)
        ]);

        const depots = depotsReq.data.depots;
        const vehicles = vehiclesReq.data.vehicles;
        const output = [];

        for (const d of depots) {
            const limit = d.MechanicHours;
            const result = getOptimalTasks(limit, vehicles);

            output.push({
                depotID: d.ID,
                allocatedBudget: limit,
                optimizationResult: result
            });
        }

        return res.status(200).json({
            success: true,
            data: output
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.response ? err.response.data : err.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});