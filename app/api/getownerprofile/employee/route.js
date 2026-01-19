import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const body = await req.json(); // ✅ read body
    const { id } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid employee ID" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { userTable } = dbmodels();

    const employee = await userTable.findById(id).select("-password"); // hide password

    if (!employee) {
      return new Response(
        JSON.stringify({ success: false, message: "Employee not found" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, data: employee }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}
