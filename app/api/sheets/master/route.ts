import { NextResponse } from "next/server"

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzNtDzl7Epk4_R7Vnklnry2Muwd5gTb-EXV60g-sEchodL8BIQMOwz4P_nK0wPCr5wt/exec"

export async function GET() {
  try {
    console.log('🔄 Fetching master data from Google Sheets...')
    
    const response = await fetch(`${SCRIPT_URL}?action=getMasterData&timestamp=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    console.log('📡 Google Sheets Master response status:', response.status)

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Master data fetched successfully:', data.data?.length || 0, 'records')
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('❌ Error in /api/sheets/master:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch master data'
    }, { 
      status: 500 
    })
  }
}
