import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase, dbmodels } from "@/db";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "365d";

export async function POST(req) {
  try {
    const { email, name, password, loginType } = await req.json();

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required" },
        { status: 400 }
      );
    }

    // If loginType is 'employee', allow name+password login
    if (loginType === 'employee') {
      if (!name) {
        return NextResponse.json(
          { success: false, message: "Name is required for employee login" },
          { status: 400 }
        );
      }

      await connectToDatabase();
      const { userTable } = dbmodels();

      // Find employee by name and password
      const user = await userTable.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') }, // Case-insensitive name match
        password,
        role: 'employee'
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      // Create token
      const token = jwt.sign(
        {
          id: user._id,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return NextResponse.json(
        {
          success: true,
          message: "Login successful",
          token,
          role: user.role,
          data: {
            userId: user._id,
            name: user.name,
            email: user.email,
            companyName: user.companyName,
            role: user.role,
            ownerId: user.ownerId,
            subscription: user.subscription,
          },
        },
        { status: 200 }
      );
    }

    // Regular email+password login for owners/admins
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { userTable } = dbmodels();

    // Find user (owner / employee / admin) by email
    const user = await userTable.findOne({
      email: email.toLowerCase(),
      password,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if owner subscription has expired
    if (user.role === 'owner' && user.subscription?.expiresAt) {
      const expiryDate = new Date(user.subscription.expiresAt);
      const now = new Date();
      if (expiryDate < now) {
        return NextResponse.json(
          { 
            success: false, 
            message: "SUBSCRIPTION_EXPIRED",
            expiresAt: user.subscription.expiresAt
          },
          { status: 403 }
        );
      }
    }

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        token,
        role: user.role,
        data: {
          userId: user._id,
          name: user.name,
          email: user.email,
          companyName: user.companyName,
          role: user.role,
          ownerId: user.ownerId,
          subscription: user.subscription,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
