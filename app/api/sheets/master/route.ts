import { NextRequest, NextResponse } from "next/server"

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzNtDzl7Epk4_R7Vnklnry2Muwd5gTb-EXV60g-sEchodL8BIQMOwz4P_nK0wPCr5wt/exec"

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Route: Fetching Master sheet data from Google Sheets...')
    
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

    let data
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const textData = await response.text()
      console.log('📄 Raw Master response (first 200 chars):', textData.substring(0, 200))
      
      try {
        data = JSON.parse(textData)
      } catch (parseError) {
        console.error('❌ Failed to parse Master response as JSON:', parseError)
        throw new Error('Invalid JSON response from Google Apps Script')
      }
    }
    
    console.log('✅ Master data fetched successfully:', {
      success: data.success,
      recordCount: data.data?.length || 0,
      hasError: !!data.error
    })

    // Log first record for debugging
    if (data.data && data.data.length > 0) {
      console.log('📋 Sample Master record:', JSON.stringify(data.data[0], null, 2))
    }
    
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
      error: error instanceof Error ? error.message : 'Failed to fetch master sheet data'
    }, { 
      status: 500 
    })
  }
}
