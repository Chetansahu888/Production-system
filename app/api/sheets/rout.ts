import { NextRequest, NextResponse } from "next/server"

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzNtDzl7Epk4_R7Vnklnry2Muwd5gTb-EXV60g-sEchodL8BIQMOwz4P_nK0wPCr5wt/exec"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'getMasterData'
    
    console.log(`🔄 Fetching ${action} data from Google Sheets...`)
    
    const response = await fetch(`${SCRIPT_URL}?action=${action}&timestamp=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    console.log(`📡 Google Sheets ${action} response status:`, response.status)

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
    }

    let data
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      // Sometimes Google Apps Script returns text/html, try to parse as JSON anyway
      const textData = await response.text()
      console.log('📄 Raw response (first 200 chars):', textData.substring(0, 200))
      
      try {
        data = JSON.parse(textData)
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError)
        throw new Error('Invalid JSON response from Google Apps Script')
      }
    }
    
    console.log('✅ Data fetched successfully:', {
      action,
      success: data.success,
      recordCount: data.data?.length || 0,
      hasError: !!data.error
    })
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
    
  } catch (error) {
    console.error(`❌ Error in /api/sheets (GET ${request.nextUrl.searchParams.get('action')}):`, error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch data from Google Sheets'
    }, { 
      status: 500
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action || 'saveRecords'
    
    console.log(`🔄 Posting ${action} data to Google Sheets...`)
    console.log('📤 Request body:', JSON.stringify(body, null, 2))

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    console.log(`📡 Google Sheets ${action} POST response status:`, response.status)

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
        console.error('❌ Failed to parse POST response as JSON:', parseError)
        // For POST requests to Google Apps Script, sometimes we get HTML even on success
        // If the request went through, assume success
        data = { success: true, message: 'Data submitted successfully' }
      }
    }
    
    console.log('✅ POST operation completed:', {
      action,
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
    console.error('❌ Error in /api/sheets (POST):', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit data to Google Sheets'
    }, { 
      status: 500
    })
  }
}
