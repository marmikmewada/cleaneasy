import { connectToDatabase, dbmodels } from "@/db";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const body = await req.json();
    const { ownerId } = body;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid owner ID" }),
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { userTable } = dbmodels();

    const employees = await userTable
      .find({ ownerId })
      .select("name email role"); // Only return needed fields

    return new Response(
      JSON.stringify({ success: true, data: employees }),
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
