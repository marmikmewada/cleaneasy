import { NextResponse } from "next/server";
import { connectToDatabase, dbmodels } from "@/db";

export async function POST(req) {
  try {
    const { name, email, password, ownerId } = await req.json();

    if (!name || !email || !password || !ownerId) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { userTable } = dbmodels();

    // Check owner exists and get subscription limits
    const owner = await userTable.findById(ownerId);
    if (!owner || owner.role !== 'owner') {
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );
    }

    // Check subscription expiry
    if (owner.subscription?.expiresAt && new Date(owner.subscription.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, message: "Subscription has expired. Please contact Marmik to renew." },
        { status: 403 }
      );
    }

    // Count current employees created by this owner
    const currentEmployeeCount = await userTable.countDocuments({ 
      ownerId, 
      role: 'employee' 
    });

    // Check if owner has reached their employee limit
    const maxEmployees = owner.subscription?.maxEmployees || 1;
    if (currentEmployeeCount >= maxEmployees) {
      return NextResponse.json(
        { success: false, message: `You have reached your employee limit (${maxEmployees}). Please contact admin to increase your limit.` },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existing = await userTable.findOne({ email });
    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Employee with this email already exists",
      }, { status: 400 });
    }

    // Create employee linked to owner
    const employee = await userTable.create({
      name,
      email,
      password,
      role: "employee",
      ownerId,
    });

    return NextResponse.json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    }, { status: 201 });

  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create employee" },
      { status: 500 }
    );
  }
}
