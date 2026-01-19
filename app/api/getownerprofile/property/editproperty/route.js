import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { propertyId, name, status, employeeIds } = await req.json();

    console.log("Backend - Received propertyId:", propertyId);
    console.log("Backend - Received employeeIds:", employeeIds);

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid property ID" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { propertyTable, userTable } = dbmodels();

    const property = await propertyTable.findById(propertyId);
    if (!property) {
      return new Response(
        JSON.stringify({ success: false, message: "Property not found" }),
        { status: 404 }
      );
    }

    if (name) property.name = name;
    if (status) property.status = status;

    if (Array.isArray(employeeIds)) {
      const validEmployees = await userTable.find({
        _id: { $in: employeeIds },
        ownerId: property.ownerId,
      }).select("_id");

      property.employees = validEmployees.map(emp => emp._id);
    }

    await property.save();

    console.log("Backend - Updated property saved:", property);

    return new Response(
      JSON.stringify({ success: true, data: property }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Backend - Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}
