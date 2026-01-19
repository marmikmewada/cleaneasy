import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { ownerId, maxProperties, maxEmployees, expiresAt } = await req.json();

    if (!ownerId) {
      return new Response(
        JSON.stringify({ success: false, message: "ownerId is required" }),
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid ownerId" }),
        { status: 400 }
      );
    }

    if (maxProperties === undefined && maxEmployees === undefined) {
      return new Response(
        JSON.stringify({ success: false, message: "At least one limit (maxProperties or maxEmployees) must be provided" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { userTable } = dbmodels();

    // Verify owner exists
    const owner = await userTable.findOne({
      _id: ownerId,
      role: 'owner'
    });

    if (!owner) {
      return new Response(
        JSON.stringify({ success: false, message: "Owner not found" }),
        { status: 404 }
      );
    }

    // Update subscription limits
    if (maxProperties !== undefined) {
      owner.subscription.maxProperties = maxProperties;
    }
    if (maxEmployees !== undefined) {
      owner.subscription.maxEmployees = maxEmployees;
    }
    if (expiresAt !== undefined) {
      owner.subscription.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    await owner.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Owner limits updated successfully",
        data: {
          ownerId: owner._id,
          subscription: owner.subscription
        }
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error", error: error.message }),
      { status: 500 }
    );
  }
}
