import { NextResponse } from "next/server";
import { connectToDatabase, dbmodels } from "@/db";

export async function POST(req) {
  try {
    const { name, ownerId } = await req.json();

    if (!name || !ownerId) {
      return NextResponse.json(
        { success: false, message: "Property name and ownerId are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { propertyTable } = dbmodels();

    const property = await propertyTable.create({
      name,
      ownerId,
      employees: [], // initially no employees
    });

    return NextResponse.json({
      success: true,
      message: "Property created successfully",
      data: property,
    }, { status: 201 });

  } catch (error) {
    console.error("Create property error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create property" },
      { status: 500 }
    );
  }
}
