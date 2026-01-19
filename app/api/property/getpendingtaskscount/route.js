import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { propertyIds } = await req.json();

    if (!Array.isArray(propertyIds)) {
      return new Response(
        JSON.stringify({ success: false, message: "propertyIds must be an array" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { taskTable } = dbmodels();

    // Get pending task counts for all properties
    const taskCounts = await taskTable.aggregate([
      {
        $match: {
          propertyId: { $in: propertyIds.map(id => new mongoose.Types.ObjectId(id)) },
          completedAt: null,
          completedBy: null
        }
      },
      {
        $group: {
          _id: "$propertyId",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object for easy lookup
    const countsMap = {};
    taskCounts.forEach(item => {
      countsMap[item._id.toString()] = item.count;
    });

    // Return counts for all requested properties (0 if no pending tasks)
    const result = {};
    propertyIds.forEach(id => {
      result[id] = countsMap[id] || 0;
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}
