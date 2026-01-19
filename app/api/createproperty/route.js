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
    const { propertyTable, userTable } = dbmodels();

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

    // Count current properties owned by this owner
    const currentPropertyCount = await propertyTable.countDocuments({ ownerId });

    // Check if owner has reached their property limit
    const maxProperties = owner.subscription?.maxProperties || 2;
    if (currentPropertyCount >= maxProperties) {
      return NextResponse.json(
        { success: false, message: `You have reached your property limit (${maxProperties}). Please contact admin to increase your limit.` },
        { status: 403 }
      );
    }

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
