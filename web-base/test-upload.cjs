const axios = require('axios');
const FormData = require('form-data');

async function testReturnToPort() {
  console.log("Simulating Android App Return-to-Port...");
  const form = new FormData();
  form.append('type', 'text');
  form.append('content', '这是一条测试归档的胶囊内容。系统回响。');
  form.append('timestamp', Date.now().toString());

  try {
    const response = await axios.post('http://localhost:3000/api/capsules', form, {
      headers: form.getHeaders(),
    });
    console.log("Response:", response.data);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  }
}

testReturnToPort();
