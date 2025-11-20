import { NextRequest, NextResponse } from "next/server"

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzNtDzl7Epk4_R7Vnklnry2Muwd5gTb-EXV60g-sEchodL8BIQMOwz4P_nK0wPCr5wt/exec"

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Route: Fetching records data from Google Sheets...')
    
    const response = await fetch(`${SCRIPT_URL}?action=getRecords&timestamp=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    console.log('📡 Google Sheets Records GET response status:', response.status)

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
    }

    let data
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const textData = await response.text()
      console.log('📄 Raw Records response (first 200 chars):', textData.substring(0, 200))
      
      try {
        data = JSON.parse(textData)
      } catch (parseError) {
        console.error('❌ Failed to parse Records response as JSON:', parseError)
        throw new Error('Invalid JSON response from Google Apps Script')
      }
    }
    
    console.log('✅ Records data fetched successfully:', {
      success: data.success,
      recordCount: data.data?.length || 0,
      hasError: !!data.error
    })

    // Log first record for debugging
    if (data.data && data.data.length > 0) {
      console.log('📋 Sample Records record:', JSON.stringify(data.data[0], null, 2))
    }
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
    
  } catch (error) {
    console.error('❌ Error in /api/sheets/records (GET):', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch records data'
    }, { 
      status: 500 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 API Route: Posting records data to Google Sheets...')
    console.log('📤 Request body:', JSON.stringify(body, null, 2))

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    console.log('📡 Google Sheets POST response status:', response.status)

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
    }

    let data
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const textData = await response.text()
      console.log('📄 Raw POST response (first 200 chars):', textData.substring(0, 200))
      
      try {
        data = JSON.parse(textData)
      } catch (parseError) {
        console.log('⚠️ Could not parse response as JSON, assuming success')
        data = { success: true, message: 'Data submitted successfully' }
      }
    }
    
    console.log('✅ API Route: Records POST operation completed:', {
      success: data.success,
      message: data.message || 'No message'
    })

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })

  } catch (error) {
    console.error('❌ API Route Error (POST records):', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit records'
    }, { 
      status: 500
    })
  }
}
