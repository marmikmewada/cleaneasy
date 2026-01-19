import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { title, propertyId, createdBy } = await req.json();

    if (!title || !propertyId || !createdBy) {
      return new Response(
        JSON.stringify({ success: false, message: "Title, propertyId, and createdBy are required" }),
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(createdBy)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid propertyId or createdBy" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { taskTable, propertyTable, userTable } = dbmodels();

    // Verify property exists
    const property = await propertyTable.findById(propertyId);
    if (!property) {
      return new Response(
        JSON.stringify({ success: false, message: "Property not found" }),
        { status: 404 }
      );
    }

    // Verify user exists
    const user = await userTable.findById(createdBy);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { status: 404 }
      );
    }

    // Create task
    const task = await taskTable.create({
      title,
      propertyId,
      createdBy,
      completedBy: null,
      completedAt: null,
    });

    // Populate references
    const populatedTask = await taskTable
      .findById(task._id)
      .populate("propertyId", "name")
      .populate("createdBy", "name email")
      .populate("completedBy", "name email");

    return new Response(
      JSON.stringify({ success: true, data: populatedTask }),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error", error: error.message }),
      { status: 500 }
    );
  }
}
