import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { taskId, completedBy } = await req.json();

    if (!taskId || !completedBy) {
      return new Response(
        JSON.stringify({ success: false, message: "taskId and completedBy are required" }),
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(completedBy)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid taskId or completedBy" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { taskTable, userTable } = dbmodels();

    // Verify task exists
    const task = await taskTable.findById(taskId);
    if (!task) {
      return new Response(
        JSON.stringify({ success: false, message: "Task not found" }),
        { status: 404 }
      );
    }

    // Verify user exists
    const user = await userTable.findById(completedBy);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { status: 404 }
      );
    }

    // Check if task is already completed
    if (task.completedAt) {
      return new Response(
        JSON.stringify({ success: false, message: "Task is already completed" }),
        { status: 400 }
      );
    }

    // Mark task as completed
    task.completedBy = completedBy;
    task.completedAt = new Date();
    await task.save();

    // Populate references
    const populatedTask = await taskTable
      .findById(task._id)
      .populate("propertyId", "name")
      .populate("createdBy", "name email")
      .populate("completedBy", "name email");

    return new Response(
      JSON.stringify({ success: true, data: populatedTask }),
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
