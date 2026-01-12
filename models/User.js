import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
});

export default mongoose.model("User", UserSchema);
