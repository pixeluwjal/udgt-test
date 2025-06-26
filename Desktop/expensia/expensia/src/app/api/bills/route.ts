import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || "";

export async function POST(request: Request) {
  try {
    const { clerkId, vendorName, date, items, subtotal, tax, total, paymentMethod } = await request.json();

    if (!clerkId || !vendorName || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    const newBill = {
      clerkId,
      vendorName,
      date,
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      createdAt: new Date(),
    };

    await db.collection("bills").insertOne(newBill);
    await client.close();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error saving bill:", error);
    return NextResponse.json({ error: "Failed to save bill" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json({ error: "clerkId is required" }, { status: 400 });
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    const bills = await db.collection("bills")
      .find({ clerkId })
      .sort({ createdAt: -1 })
      .toArray();

    await client.close();

    return NextResponse.json({ bills }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: { billId: string } }
) {
  try {
    const { billId } = params;

    if (!billId) {
      return NextResponse.json(
        { error: "Bill ID required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(billId)) {
      return NextResponse.json(
        { error: "Invalid Bill ID format" },
        { status: 400 }
      );
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    const result = await db.collection("bills").deleteOne({
      _id: new ObjectId(billId),
    });

    await client.close();

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting bill:", error);
    return NextResponse.json(
      { error: "Failed to delete bill" },
      { status: 500 }
    );
  }
}