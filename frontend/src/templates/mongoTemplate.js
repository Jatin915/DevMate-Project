export const mongoTemplate = {
  'package.json': `{
  "name": "mongoose-app",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "mongoose": "^8.0.0"
  }
}
`,

  'index.js': `const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devmate';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Run your queries here
  await mongoose.disconnect();
}

main().catch(console.error);
`,

  'models/User.js': `const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role:  { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
`,

  'seed.js': `const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/devmate');

  await User.deleteMany({});
  await User.insertMany([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob',   email: 'bob@example.com'   },
  ]);

  console.log('Seeded users');
  await mongoose.disconnect();
}

seed().catch(console.error);
`,
}
