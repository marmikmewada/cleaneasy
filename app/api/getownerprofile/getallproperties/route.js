import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { propertyId } = await req.json();

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid property ID" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { propertyTable } = dbmodels();

    const property = await propertyTable
      .findById(propertyId)
      .populate("employees", "name email"); // populate employee info

    if (!property) {
      return new Response(
        JSON.stringify({ success: false, message: "Property not found" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: property }),
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
