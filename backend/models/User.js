const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'patient'], required: true },
}, { timestamps: true });

// Method to set password
UserSchema.methods.setPassword = async function(password) {
  const saltRounds = 10;
  this.passwordHash = await bcrypt.hash(password, saltRounds);
};

// Method to validate password
UserSchema.methods.validatePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
