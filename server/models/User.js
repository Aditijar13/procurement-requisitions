const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["requester", "approver"],
      required: true,
    },
    approval_limit: {
      type: mongoose.Decimal128,
      default: null,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set("toJSON", {
  transform(doc, ret) {
    if (ret.approval_limit) {
      ret.approval_limit = parseFloat(ret.approval_limit.toString());
    }
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);