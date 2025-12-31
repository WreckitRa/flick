import bcrypt from 'bcryptjs';

// Run this script to generate a password hash for your .env file
// Usage: tsx scripts/generate-password-hash.ts <your-password>

const password = process.argv[2];

if (!password) {
  console.error('Usage: tsx scripts/generate-password-hash.ts <your-password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\n✅ Password hash generated:');
console.log(hash);
console.log('\n📝 Add this to your .env file:');
console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
console.log(`JWT_SECRET="your-secret-key-here"`);

