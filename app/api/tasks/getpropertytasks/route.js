import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { propertyId, status, startDate, endDate } = await req.json();

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid property ID" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { taskTable, propertyTable } = dbmodels();

    // Verify property exists
    const property = await propertyTable.findById(propertyId);
    if (!property) {
      return new Response(
        JSON.stringify({ success: false, message: "Property not found" }),
        { status: 404 }
      );
    }

    // Build query
    let query = { propertyId };

    // Filter by status (pending or completed)
    if (status === 'pending') {
      query.completedAt = null;
      query.completedBy = null;
    } else if (status === 'completed') {
      query.completedBy = { $ne: null };
      
      // Add date range filter for completed tasks
      if (startDate || endDate) {
        query.completedAt = {};
        if (startDate) {
          query.completedAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          query.completedAt.$lte = end;
        }
      } else {
        // If no date filter, just check that completedAt exists
        query.completedAt = { $ne: null };
      }
    }

    // Fetch tasks
    const tasks = await taskTable
      .find(query)
      .populate("propertyId", "name")
      .populate("createdBy", "name email")
      .populate("completedBy", "name email")
      .sort({ createdAt: -1 });

    return new Response(
      JSON.stringify({ success: true, data: tasks }),
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
