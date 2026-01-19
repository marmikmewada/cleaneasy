import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;
let isConnected = false;

/* =========================
   DATABASE CONNECTION
========================= */
export async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      isConnected = true;
      console.log("✅ Database connected");
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw new Error("Could not connect to database");
    }
  }
}

/* =========================
   MODELS
========================= */
export function dbmodels() {
  /* ---------- USER (Admin / Owner / Employee) ---------- */
  const userSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
      },

      password: {
        type: String,
        required: true,
      },

      companyName: {
        type: String,
        trim: true,
        default: null, // optional, usually for owners
      },

      role: {
        type: String,
        enum: ["admin", "owner", "employee"],
        default: "owner",
      },

      // 🔑 Owner reference (for employees only)
      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null, // owners & admins have null
      },

      subscription: {
        expiresAt: { type: Date, default: null },
        maxProperties: { type: Number, default: 2 },
        maxEmployees: { type: Number, default: 1 },
      },
    },
    { timestamps: true }
  );

  /* ---------- PROPERTY ---------- */
  const propertySchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      // 🔑 Property always belongs to owner
      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      // Assigned later
      employees: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
      },
    },
    { timestamps: true }
  );

  /* ---------- TASK ---------- */
  const taskSchema = new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      completedAt: {
        type: Date,
        default: null,
      },
    },
    { timestamps: true }
  );

  /* =========================
     RETURN MODELS
  ========================== */
  return {
    userTable: mongoose.models.User || mongoose.model("User", userSchema),
    propertyTable:
      mongoose.models.Property || mongoose.model("Property", propertySchema),
    taskTable: mongoose.models.Task || mongoose.model("Task", taskSchema),
  };
}
