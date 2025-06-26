import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apikey = process.env.GEMINI_API!; // Replace with your actual API Key
const genAI = new GoogleGenerativeAI(apikey);

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image") as Blob | null;

  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const imageParts = await fileToGenerativePart(image);
    const result = await model.generateContent([
      `Extract the following structured data from this receipt/invoice:

1. Vendor/Store name  
2. Transaction date (MANDATORY, formatted as DD/MM/YYYY or MM/DD/YYYY, if unclear return "Unknown")  
3. List of items with:
   - name  
   - price  
   - category (one of: Groceries, Electronics, Clothing, Food, Other - The model should be also able to detect wide number of categories to0)  
4. Subtotal amount  
5. Tax amount  
6. Total amount  
7. Payment method - if it is upper case letters convert into all lower case

Return ONLY the raw JSON data in this exact format without any additional text or markdown:

{
  "vendorName": string,
  "date": string,
  "items": [{ "name": string, "price": string, "category": string }],
  "subtotal": string,
  "tax": string,
  "total": string,
  "paymentMethod": string
}`,
      imageParts,
    ]);

    const response = await result.response;
    let text = response.text();

    // Clean the response to extract just the JSON
    text = text.trim();

    // Remove markdown block if present
    if (text.startsWith("```json")) {
      text = text.slice(7, -3).trim();
    } else if (text.startsWith("```")) {
      text = text.slice(3, -3).trim();
    }

    // Parse the JSON
    const data = JSON.parse(text);

    // Keep all fields, convert numeric strings, preserve categories
    const processedData = {
      ...data,
      items: data.items.map((item: any) => ({
        name: item.name,
        price: parseFloat(item.price) || 0,
        category: item.category || "Uncategorized",
      })),
      subtotal: parseFloat(data.subtotal) || 0,
      tax: parseFloat(data.tax) || 0,
      total: parseFloat(data.total) || 0,
    };

    return NextResponse.json({ data: processedData });

  } catch (error) {
    console.error("Error processing receipt:", error);
    return NextResponse.json(
      {
        error: "Failed to process receipt",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function fileToGenerativePart(file: Blob) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: file.type,
    },
  };
}
