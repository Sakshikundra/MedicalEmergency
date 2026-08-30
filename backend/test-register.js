const axios = require('axios');

async function testRegister() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Test User',
            email: 'test' + Date.now() + '@example.com',
            password: 'password123',
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            bloodGroup: 'O+',
            emergencyContact: {
                name: 'Emergency Contact',
                relationship: 'Friend',
                phone: '1234567890'
            }
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testRegister();
