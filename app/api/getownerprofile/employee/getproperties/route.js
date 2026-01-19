import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { employeeId } = await req.json();

    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid employee ID" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { userTable, propertyTable } = dbmodels();

    // Get employee and ownerId
    const employee = await userTable.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return new Response(
        JSON.stringify({ success: false, message: "Employee not found" }),
        { status: 404 }
      );
    }

    const ownerId = employee.ownerId;

    // Get all properties for this owner
    const allProperties = await propertyTable
      .find({ ownerId })
      .populate("employees", "name email");

    // Find which properties this employee is assigned to
    const employeeProperties = allProperties.filter(prop =>
      prop.employees.some(emp => emp._id.toString() === employeeId)
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          allProperties,
          employeeProperties: employeeProperties.map(p => p._id.toString()),
        },
      }),
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
