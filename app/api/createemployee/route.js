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
