import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase, dbmodels } from "@/db";

export async function POST(req) {
  try {
    // 1️⃣ Parse request body
    const { name, email, password, companyName } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "name, email and password are required",
        },
        { status: 400 }
      );
    }

    // 2️⃣ Connect to database
    await connectToDatabase();
    const { userTable } = dbmodels();

    // 3️⃣ Prevent duplicate email signup
    const existingUser = await userTable.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already registered",
        },
        { status: 409 }
      );
    }

    // 4️⃣ Create OWNER (default role)
    const user = new userTable({
      name,
      email,
      password,       // ❗ plain text (as requested)
      companyName,    // optional
      role: "owner",
      ownerId: null,  // owner has no owner
      subscription: {
        expiresAt: null, // free tier
        maxProperties: 2,
        maxEmployees: 1,
      },
    });

    await user.save();

    // 5️⃣ Success response
    return NextResponse.json(
      {
        success: true,
        message: "Signup successful",
        data: {
          userId: user._id,
          name: user.name,
          email: user.email,
          companyName: user.companyName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Signup failed",
      },
      { status: 500 }
    );
  }
}
