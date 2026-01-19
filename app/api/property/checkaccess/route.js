import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { propertyId, userId, role } = await req.json();

    if (!propertyId || !userId || !role) {
      return new Response(
        JSON.stringify({ success: false, message: "propertyId, userId, and role are required" }),
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid propertyId or userId" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { propertyTable, userTable } = dbmodels();

    // Get property
    const property = await propertyTable.findById(propertyId);
    if (!property) {
      return new Response(
        JSON.stringify({ success: false, message: "Property not found" }),
        { status: 404 }
      );
    }

    // Owners always have access to their properties
    if (role === 'owner') {
      if (property.ownerId.toString() === userId) {
        return new Response(
          JSON.stringify({ success: true, hasAccess: true }),
          { status: 200 }
        );
      }
    }

    // Employees can only access properties they're assigned to
    if (role === 'employee') {
      const isAssigned = property.employees.some(empId => empId.toString() === userId);
      return new Response(
        JSON.stringify({ success: true, hasAccess: isAssigned }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: false, hasAccess: false, message: "Access denied" }),
      { status: 403 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}
