const axios = require('axios');

const loggingMiddleware = async (req, res, next) => {
  try {
    await axios.post('http://4.224.186.213/evaluation-service/logs', {
      stack: 'backend',
      level: 'junior',
      package: 'basic'
    }, {
      headers: {
        Authorization: `Bearer ahXjvp`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Log sent successfully');
  } catch (error) {
    console.error('Error sending log:', error.message);
  }
  next();
};

module.exports = loggingMiddleware;