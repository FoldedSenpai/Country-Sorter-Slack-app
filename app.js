const axios = require('axios');

async function fetchAllCountries() {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
}

module.exports = { fetchAllCountries };
