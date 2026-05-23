const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'closed'],
    default: 'upcoming',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Election', electionSchema);
