require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');

const users = [
  {
    voterId: 'ADMIN-001',
    fullName: 'System Administrator',
    password: 'Admin1234!',
    role: 'admin',
  },
  {
    voterId: 'VTR-2024-001',
    fullName: 'Juan dela Cruz',
    password: 'Voter1234!',
    role: 'voter',
  },
  {
    voterId: 'VTR-2024-002',
    fullName: 'Maria Santos',
    password: 'Voter1234!',
    role: 'voter',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await User.deleteMany({});
    console.log('Cleared existing users');

    for (const data of users) {
      const user = new User(data);
      await user.save();
      console.log(`Created ${user.role}: ${user.voterId} (${user.fullName})`);
    }

    console.log('\nSeed complete. Credentials:');
    console.log('  Admin  — voterId: ADMIN-001      password: Admin1234!');
    console.log('  Voter  — voterId: VTR-2024-001   password: Voter1234!');
    console.log('  Voter  — voterId: VTR-2024-002   password: Voter1234!');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
