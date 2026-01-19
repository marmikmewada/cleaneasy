import { NextResponse } from "next/server";
import { connectToDatabase, dbmodels } from "@/db";

export async function GET(req) {
  try {
    // 🔹 Read ownerId from query
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "ownerId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { userTable, propertyTable } = dbmodels();

    // 1️⃣ Fetch owner
    const owner = await userTable.findOne({
      _id: ownerId,
      role: "owner",
    }).lean();

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Fetch employees created by owner
    const employees = await userTable.find({
      ownerId: owner._id,
      role: "employee",
    }).lean();

    // 3️⃣ Fetch properties owned by owner
    const properties = await propertyTable.find({
      ownerId: owner._id,
    }).lean();

    // 4️⃣ Get pending task counts for all properties
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

    return NextResponse.json(
      {
        success: true,
        data: {
          owner: {
            _id: owner._id,
            name: owner.name,
            email: owner.email,
            companyName: owner.companyName,
            subscription: owner.subscription,
            createdAt: owner.createdAt,
          },
          employees,
          properties,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get owner profile error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch owner profile" },
      { status: 500 }
    );
  }
}
