import { NextResponse } from "next/server"
import { getMainSheetData } from "@/lib/google-sheets"

export async function GET() {
  try {
    const data = await getMainSheetData()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching main sheet data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 })
  }
}
