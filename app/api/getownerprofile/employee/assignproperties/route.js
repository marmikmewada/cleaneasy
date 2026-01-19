import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { employeeId, propertyIds } = await req.json();

    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid employee ID" }),
        { status: 400 }
      );
    }

    if (!Array.isArray(propertyIds)) {
      return new Response(
        JSON.stringify({ success: false, message: "propertyIds must be an array" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { userTable, propertyTable } = dbmodels();

    // Verify employee exists
    const employee = await userTable.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return new Response(
        JSON.stringify({ success: false, message: "Employee not found" }),
        { status: 404 }
      );
    }

    // Verify all properties exist and belong to the same owner
    const ownerId = employee.ownerId;
    const validProperties = await propertyTable.find({
      _id: { $in: propertyIds },
      ownerId: ownerId,
    });

    if (validProperties.length !== propertyIds.length) {
      return new Response(
        JSON.stringify({ success: false, message: "Some properties are invalid or don't belong to this owner" }),
        { status: 400 }
      );
    }

    // Update all properties: remove employee from all properties first, then add to selected ones
    await propertyTable.updateMany(
      { ownerId: ownerId },
      { $pull: { employees: employeeId } }
    );

    // Add employee to selected properties
    if (propertyIds.length > 0) {
      await propertyTable.updateMany(
        { _id: { $in: propertyIds } },
        { $addToSet: { employees: employeeId } }
      );
    }

    // Fetch updated properties
    const updatedProperties = await propertyTable
      .find({ ownerId: ownerId })
      .populate("employees", "name email");

    return new Response(
      JSON.stringify({ success: true, data: updatedProperties }),
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
