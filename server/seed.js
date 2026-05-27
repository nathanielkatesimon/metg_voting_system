require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Election = require('./models/Election');
const Position = require('./models/Position');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');

// All 74 registered members from seed.csv
const VOTERS = [
  { voterId: 'CCF-001', fullName: 'Aberilla, Raymund' },
  { voterId: 'CCF-002', fullName: 'Amarille, Ricardo' },
  { voterId: 'CCF-003', fullName: 'Amistad, Dioscoro' },
  { voterId: 'CCF-004', fullName: 'Antonio, Blenda Elena' },
  { voterId: 'CCF-005', fullName: 'Atufo, Rodrigo' },
  { voterId: 'CCF-006', fullName: 'Banguerra, Luciano' },
  { voterId: 'CCF-007', fullName: 'Barabad, Jocelyn' },
  { voterId: 'CCF-008', fullName: 'Belacho, Marta' },
  { voterId: 'CCF-009', fullName: 'Berido, Alfredo' },
  { voterId: 'CCF-010', fullName: 'Cableros, Rafael' },
  { voterId: 'CCF-011', fullName: 'Campas, Nerissa' },
  { voterId: 'CCF-012', fullName: 'Carungay, Alice' },
  { voterId: 'CCF-013', fullName: 'Cartota, Osma' },
  { voterId: 'CCF-014', fullName: 'Casero, Jimary' },
  { voterId: 'CCF-015', fullName: 'Dagalea, Juana' },
  { voterId: 'CCF-016', fullName: 'Dajab, Teodoro' },
  { voterId: 'CCF-017', fullName: 'Daming, Marina' },
  { voterId: 'CCF-018', fullName: 'Delos Santos, Victoria' },
  { voterId: 'CCF-019', fullName: 'Entino, Mary Grace' },
  { voterId: 'CCF-020', fullName: 'Galvez, Rey' },
  { voterId: 'CCF-021', fullName: 'Garciano, Roweno' },
  { voterId: 'CCF-022', fullName: 'Jumao-As, Imelda' },
  { voterId: 'CCF-023', fullName: 'Kardante, Nilo' },
  { voterId: 'CCF-024', fullName: 'Laude, Benifredo' },
  { voterId: 'CCF-025', fullName: 'Ligutan, Marissa' },
  { voterId: 'CCF-026', fullName: 'Lyons, Marivic' },
  { voterId: 'CCF-027', fullName: 'Manzano, Christopher' },
  { voterId: 'CCF-028', fullName: 'Matuguina, Lorena' },
  { voterId: 'CCF-029', fullName: 'Montezo, Cherry Fe' },
  { voterId: 'CCF-030', fullName: 'Noval, Michaela' },
  { voterId: 'CCF-031', fullName: 'Patalinghug, Samuel' },
  { voterId: 'CCF-032', fullName: 'Peligro, Jennifer' },
  { voterId: 'CCF-033', fullName: 'Pinote, Marichell' },
  { voterId: 'CCF-034', fullName: 'Puso, Cipriano Jr.' },
  { voterId: 'CCF-035', fullName: 'Romero, Calixto' },
  { voterId: 'CCF-036', fullName: 'Saban, Renato' },
  { voterId: 'CCF-037', fullName: 'Seguido, Oenia' },
  { voterId: 'CCF-038', fullName: 'Seguido, Radulfo' },
  { voterId: 'CCF-039', fullName: 'Silod, Nilo' },
  { voterId: 'CCF-040', fullName: 'Sortones, Nila' },
  { voterId: 'CCF-041', fullName: 'Suralta, Rene' },
  { voterId: 'CCF-042', fullName: 'Taba, Jaime' },
  { voterId: 'CCF-043', fullName: 'Tampus, Felix Jr.' },
  { voterId: 'CCF-044', fullName: 'Tocal, Epipania' },
  { voterId: 'CCF-045', fullName: 'Tolo, Ester' },
  { voterId: 'CCF-046', fullName: 'Tugonon, Alberto' },
  { voterId: 'CCF-047', fullName: 'Tumulak, Alberto' },
  { voterId: 'CCF-048', fullName: 'Villamor, Mary Jane' },
  { voterId: 'CCF-049', fullName: 'Villamor, Virgilio' },
  { voterId: 'CCF-050', fullName: 'Yarzo, Dominador Jr.' },
  { voterId: 'CCF-051', fullName: 'Yarzo, Raul' },
  { voterId: 'CCF-052', fullName: 'Ygonia, Roberto' },
  { voterId: 'CCF-053', fullName: 'Carmen, Panta' },
  { voterId: 'CCF-054', fullName: 'Casitillo, Alejandro' },
  { voterId: 'CCF-055', fullName: 'Castillo, Diosdado' },
  { voterId: 'CCF-056', fullName: 'Aseo, Jun-Mar' },
  { voterId: 'CCF-057', fullName: 'Montesclaros, Orincio' },
  { voterId: 'CCF-058', fullName: 'Montesclaros, Ceonio' },
  { voterId: 'CCF-059', fullName: 'Montesclaros, Maricel' },
  { voterId: 'CCF-060', fullName: 'Castillo, Margie' },
  { voterId: 'CCF-061', fullName: 'Manulat, Marites' },
  { voterId: 'CCF-062', fullName: 'Ramos, Tiroy' },
  { voterId: 'CCF-063', fullName: 'Payod, Elsie' },
  { voterId: 'CCF-064', fullName: 'Catingub, Conching' },
  { voterId: 'CCF-065', fullName: 'Bostillo, Jolie' },
  { voterId: 'CCF-066', fullName: 'Delapena, Eyay' },
  { voterId: 'CCF-067', fullName: 'Jumao-As, Pilo' },
  { voterId: 'CCF-068', fullName: 'Colonia, Precy' },
  { voterId: 'CCF-069', fullName: 'Colon, Megue' },
  { voterId: 'CCF-070', fullName: 'Daffon, Nelson' },
  { voterId: 'CCF-071', fullName: 'Cesal, Tonio' },
  { voterId: 'CCF-072', fullName: 'Atillano, Jessie' },
  { voterId: 'CCF-073', fullName: 'Garciano, Rodrigo' },
  { voterId: 'CCF-074', fullName: 'Arcillas, Juvan' },
];

const POSITIONS = [
  { name: 'President',      order: 1, seats: 1 },
  { name: 'Vice President', order: 2, seats: 1 },
  { name: 'Secretary',      order: 3, seats: 1 },
  { name: 'Treasurer',      order: 4, seats: 1 },
  { name: 'OIC Chairman',   order: 5, seats: 1 },
  { name: 'Members',        order: 6, seats: 2 },
];

// Keyed by position name → array of { name, party, imagePath }
const CANDIDATES = {
  'President': [
    { name: 'Berido, Alfredo',    party: 'Party List A', imagePath: '/uploads/candidates/berido_alfredo.png' },
    { name: 'Entino, Mary Grace', party: 'Party List B', imagePath: '/uploads/candidates/entino_mary_grace.png' },
  ],
  'Vice President': [
    { name: 'Daming, Marina',  party: 'Party List A', imagePath: '/uploads/candidates/daming_marina.png' },
    { name: 'Kardante, Nilo',  party: 'Party List B', imagePath: '/uploads/candidates/kardante_nilo.png' },
  ],
  'Secretary': [
    { name: 'Galvez, Rey',      party: 'Party List A', imagePath: '/uploads/candidates/galvez_rey.png' },
    { name: 'Jumao-As, Imelda', party: 'Party List B', imagePath: '/uploads/candidates/jumao_as_imelda.png' },
  ],
  'Treasurer': [
    { name: 'Casero, Jimary',   party: 'Party List A', imagePath: '/uploads/candidates/casero_jimary.png' },
    { name: 'Ligutan, Marissa', party: 'Party List B', imagePath: '/uploads/candidates/ligutan_marissa.png' },
  ],
  'OIC Chairman': [
    { name: 'Tugonon, Albert',  party: 'Party List A', imagePath: '/uploads/candidates/tugonon_albert.png' },
    { name: 'Barabad, Jocelyn', party: 'Party List B', imagePath: '/uploads/candidates/barabad_jocelyn.png' },
  ],
  'Members': [
    { name: 'Manzano, Christopher', party: 'Party List A', imagePath: '/uploads/candidates/manzano_christopher.png' },
    { name: 'Laude, Benifredo',     party: 'Party List A', imagePath: '/uploads/candidates/laude_benifredo.png' },
    { name: 'Montezo, Cherry Fe',   party: 'Party List B', imagePath: '/uploads/candidates/montezo_cherry_fe.png' },
    { name: 'Silod, Nilo',          party: 'Party List B', imagePath: '/uploads/candidates/silod_nilo.png' },
  ],
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    await Promise.all([
      Vote.deleteMany({}),
      Candidate.deleteMany({}),
      Position.deleteMany({}),
      Election.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Admin
    const admin = await User.create({
      voterId: 'ADMIN-001',
      fullName: 'System Administrator',
      password: 'Admin1234!',
      role: 'admin',
    });
    console.log(`Created admin: ${admin.voterId}`);

    // Voters — default password is the voterId lowercased + "!" (e.g. "ccf-001!")
    await Promise.all(
      VOTERS.map(v => User.create({ ...v, password: v.voterId.toLowerCase() + '!', role: 'voter' }))
    );
    console.log(`Created ${VOTERS.length} voters`);

    // Election
    const election = await Election.create({
      title: 'CCF Purok Officers Election',
      description: 'Election of officers for the CCF Purok community organization.',
      status: 'upcoming',
      createdBy: admin._id,
    });
    console.log(`Created election: "${election.title}"`);

    // Positions
    const positions = await Position.insertMany(
      POSITIONS.map(p => ({ ...p, electionId: election._id }))
    );
    console.log(`Created ${positions.length} positions`);

    const positionByName = Object.fromEntries(positions.map(p => [p.name, p]));

    // Candidates
    const candidateDocs = [];
    for (const [posName, list] of Object.entries(CANDIDATES)) {
      const pos = positionByName[posName];
      for (const c of list) {
        candidateDocs.push({ ...c, positionId: pos._id, electionId: election._id });
      }
    }
    await Candidate.insertMany(candidateDocs);
    console.log(`Created ${candidateDocs.length} candidates`);

    console.log('\nSeed complete. Credentials:');
    console.log('  Admin  — voterId: ADMIN-001   password: Admin1234!');
    console.log('  Voters — voterId: CCF-001…CCF-074   password: ccf-001!…ccf-074!');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
