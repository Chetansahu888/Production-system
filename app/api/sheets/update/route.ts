import { NextResponse } from "next/server"
import { batchUpdateMainSheet, appendToRecordsSheet } from "@/lib/google-sheets"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { updates, date } = body

    // Update Main sheet
    await batchUpdateMainSheet(updates)

    // Append each update to Records sheet with timestamp
    for (const update of updates) {
      const recordData = [date || new Date().toISOString(), ...update.data]
      await appendToRecordsSheet(recordData)
    }

    return NextResponse.json({ success: true, message: "Data updated successfully!" })
  } catch (error) {
    console.error("Error updating sheets:", error)
    return NextResponse.json({ success: false, error: "Failed to update data" }, { status: 500 })
  }
}
