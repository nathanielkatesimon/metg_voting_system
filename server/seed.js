require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Election = require('./models/Election');
const Position = require('./models/Position');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await Promise.all([
      User.deleteMany({}),
      Election.deleteMany({}),
      Position.deleteMany({}),
      Candidate.deleteMany({}),
      Vote.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Users
    const admin = await User.create({
      voterId: 'ADMIN-001',
      fullName: 'System Administrator',
      password: 'Admin1234!',
      role: 'admin',
    });
    console.log(`Created admin:  ${admin.voterId}  (_id: ${admin._id})`);

    const voter1 = await User.create({
      voterId: 'VTR-2024-001',
      fullName: 'Juan dela Cruz',
      password: 'Voter1234!',
      role: 'voter',
    });
    console.log(`Created voter:  ${voter1.voterId}  (_id: ${voter1._id})`);

    const voter2 = await User.create({
      voterId: 'VTR-2024-002',
      fullName: 'Maria Santos',
      password: 'Voter1234!',
      role: 'voter',
    });
    console.log(`Created voter:  ${voter2.voterId}  (_id: ${voter2._id})`);

    // Election
    const election = await Election.create({
      title: 'Purok 7 Officers Election 2024',
      description: 'Annual election for Purok 7 community officers.',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-11-30'),
      status: 'upcoming',
      createdBy: admin._id,
    });
    console.log(`Created election: "${election.title}"  (_id: ${election._id})`);

    // Positions
    const chairmanPos = await Position.create({
      electionId: election._id,
      name: 'Purok Chairman',
      order: 1,
    });
    console.log(`Created position: "${chairmanPos.name}"  (_id: ${chairmanPos._id})`);

    const secretaryPos = await Position.create({
      electionId: election._id,
      name: 'Purok Secretary',
      order: 2,
    });
    console.log(`Created position: "${secretaryPos.name}"  (_id: ${secretaryPos._id})`);

    // Candidates — Chairman
    const c1 = await Candidate.create({
      electionId: election._id,
      positionId: chairmanPos._id,
      name: 'Pedro Reyes',
      party: 'Independent',
      platform: 'Better roads and cleaner community for everyone.',
    });
    console.log(`Created candidate: "${c1.name}"  (_id: ${c1._id})`);

    const c2 = await Candidate.create({
      electionId: election._id,
      positionId: chairmanPos._id,
      name: 'Rosa Lim',
      party: 'Community First',
      platform: 'Stronger community programs and livelihood support.',
    });
    console.log(`Created candidate: "${c2.name}"  (_id: ${c2._id})`);

    // Candidates — Secretary
    const c3 = await Candidate.create({
      electionId: election._id,
      positionId: secretaryPos._id,
      name: 'Carlos Bautista',
      party: 'Independent',
      platform: 'Transparent record-keeping and open communication.',
    });
    console.log(`Created candidate: "${c3.name}"  (_id: ${c3._id})`);

    const c4 = await Candidate.create({
      electionId: election._id,
      positionId: secretaryPos._id,
      name: 'Ana Villanueva',
      party: 'Community First',
      platform: 'Efficient administration and quick community response.',
    });
    console.log(`Created candidate: "${c4.name}"  (_id: ${c4._id})`);

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
