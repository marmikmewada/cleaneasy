import { connectToDatabase, dbmodels } from "@/db";

export async function GET(req) {
  try {
    await connectToDatabase();
    const { userTable } = dbmodels();

    // Get all owners
    const owners = await userTable
      .find({ role: 'owner' })
      .select('name email companyName subscription createdAt')
      .sort({ createdAt: -1 });

    return new Response(
      JSON.stringify({
        success: true,
        data: owners
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
