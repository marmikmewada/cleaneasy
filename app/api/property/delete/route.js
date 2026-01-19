import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { propertyId, ownerId } = await req.json();

    if (!propertyId || !ownerId) {
      return new Response(
        JSON.stringify({ success: false, message: "propertyId and ownerId are required" }),
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid propertyId or ownerId" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { propertyTable, taskTable } = dbmodels();

    // Verify property exists and belongs to owner
    const property = await propertyTable.findOne({
      _id: propertyId,
      ownerId: ownerId
    });

    if (!property) {
      return new Response(
        JSON.stringify({ success: false, message: "Property not found or you don't have permission" }),
        { status: 404 }
      );
    }

    // Delete all tasks associated with this property
    await taskTable.deleteMany({ propertyId: propertyId });

    // Delete the property
    await propertyTable.findByIdAndDelete(propertyId);

    return new Response(
      JSON.stringify({ success: true, message: "Property and all associated tasks deleted successfully" }),
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
