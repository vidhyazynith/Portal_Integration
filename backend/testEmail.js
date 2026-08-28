import dotenv from 'dotenv';
import { sendPasswordResetEmail, testEmailConfig } from './services/emailService.js';
import mongoose from 'mongoose';

dotenv.config();

console.log('--- Email Diagnostic Test (Testing Environment Config) ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('AWS_REGION:', process.env.AWS_REGION);

async function runTest() {
  console.log('\n1. Testing Transporter Configuration...');
  const verifyResult = await testEmailConfig();
  console.log('Verify Result:', verifyResult);

  console.log('\n2. Testing Send Password Reset Email...');
  const fakeUser = {
    email: process.env.EMAIL_USER || 'test@example.com',
    personId: 'TEST001'
  };
  const fakeToken = 'test-token-1234567890abcdef';

  const sendResult = await sendPasswordResetEmail(fakeUser, fakeToken);
  console.log('Send Result:', sendResult);
}

runTest();
