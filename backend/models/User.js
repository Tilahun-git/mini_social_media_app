import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  username:  { type: String, required: true, unique: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  gender:    { type: String, enum: ["male", "female"], required: true },
  birthDate: {
    day:   { type: Number, required: true },
    month: { type: Number, required: true },
    year:  { type: Number, required: true },
  },
  profileImage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
