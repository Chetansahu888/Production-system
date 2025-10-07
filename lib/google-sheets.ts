import { google } from "googleapis"

const SPREADSHEET_ID = "1fgNyNCO6Jtcxm3gzqr1byjgpz-pqxmyGKYhcuog7hlg"

// Initialize Google Sheets API
export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  const sheets = google.sheets({ version: "v4", auth })
  return sheets
}

// Get data from Main sheet
export async function getMainSheetData() {
  const sheets = await getGoogleSheetsClient()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Main!A1:L100",
  })
  return response.data.values || []
}

// Get data from Master sheet
export async function getMasterSheetData() {
  const sheets = await getGoogleSheetsClient()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Master!A1:C100",
  })
  return response.data.values || []
}

// Get data from Records sheet
export async function getRecordsSheetData() {
  const sheets = await getGoogleSheetsClient()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Records!A1:M1000",
  })
  return response.data.values || []
}

// Update Main sheet data
export async function updateMainSheetData(rowIndex: number, data: any[]) {
  const sheets = await getGoogleSheetsClient()
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Main!F${rowIndex}:L${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [data],
    },
  })
}

// Append to Records sheet
export async function appendToRecordsSheet(data: any[]) {
  const sheets = await getGoogleSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Records!A:M",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [data],
    },
  })
}

// Batch update Main sheet
export async function batchUpdateMainSheet(updates: { rowIndex: number; data: any[] }[]) {
  const sheets = await getGoogleSheetsClient()
  const data = updates.map((update) => ({
    range: `Main!F${update.rowIndex}:L${update.rowIndex}`,
    values: [update.data],
  }))

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  })
}
