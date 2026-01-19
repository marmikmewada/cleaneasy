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

    // Get employee info
    const employee = await userTable.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return new Response(
        JSON.stringify({ success: false, message: "Employee not found" }),
        { status: 404 }
      );
    }

    // Get owner info (for company name)
    const owner = await userTable.findById(employee.ownerId);
    if (!owner) {
      return new Response(
        JSON.stringify({ success: false, message: "Owner not found" }),
        { status: 404 }
      );
    }

    // Get properties assigned to this employee
    const properties = await propertyTable
      .find({ employees: employeeId })
      .populate("ownerId", "name companyName")
      .select("name status ownerId createdAt");

    // Get pending task counts for properties
    const { taskTable } = dbmodels();
    const propertyIds = properties.map(p => p._id);
    const taskCounts = await taskTable.aggregate([
      {
        $match: {
          propertyId: { $in: propertyIds },
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

    // Add task counts to properties
    const countsMap = {};
    taskCounts.forEach(item => {
      countsMap[item._id.toString()] = item.count;
    });
    
    properties.forEach(prop => {
      prop.pendingTasksCount = countsMap[prop._id.toString()] || 0;
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          employee: {
            _id: employee._id,
            name: employee.name,
            email: employee.email,
            ownerId: employee.ownerId,
          },
          owner: {
            _id: owner._id,
            name: owner.name,
            companyName: owner.companyName,
          },
          properties,
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
