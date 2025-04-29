import mongoose from "mongoose";

const VaccinationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  dateAdministered: {
    type: Date,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  lotNumber: {
    type: String
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
VaccinationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if the model already exists to prevent overwriting during hot reloads
export default mongoose.models.Vaccination || mongoose.model('Vaccination', VaccinationSchema);
