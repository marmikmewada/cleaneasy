import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { employeeId, ownerId } = await req.json();

    if (!employeeId || !ownerId) {
      return new Response(
        JSON.stringify({ success: false, message: "employeeId and ownerId are required" }),
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid employeeId or ownerId" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { userTable, propertyTable } = dbmodels();

    // Verify employee exists and belongs to owner
    const employee = await userTable.findOne({
      _id: employeeId,
      ownerId: ownerId,
      role: 'employee'
    });

    if (!employee) {
      return new Response(
        JSON.stringify({ success: false, message: "Employee not found or you don't have permission" }),
        { status: 404 }
      );
    }

    // Remove employee from all properties
    await propertyTable.updateMany(
      { employees: employeeId },
      { $pull: { employees: employeeId } }
    );

    // Delete the employee completely from database
    await userTable.findByIdAndDelete(employeeId);

    return new Response(
      JSON.stringify({ success: true, message: "Employee deleted successfully" }),
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
