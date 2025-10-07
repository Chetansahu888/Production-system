import { NextResponse } from 'next/server'

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzNtDzl7Epk4_R7Vnklnry2Muwd5gTb-EXV60g-sEchodL8BIQMOwz4P_nK0wPCr5wt/exec"

export async function GET() {
  try {
    console.log('🔄 Fetching records from Google Sheets...')
    
    const response = await fetch(`${SCRIPT_URL}?action=getRecords&timestamp=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    console.log('📡 Google Sheets response status:', response.status)

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Records fetched successfully:', data.count || 0, 'records')
    console.log('📊 Sample data:', data.data?.slice(0, 2)) // Log first 2 records for debugging
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('❌ Error in /api/sheets/records:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch records from Google Sheets'
    }, { 
      status: 500 
    })
  }
}
