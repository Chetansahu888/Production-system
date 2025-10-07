"use client"

import { useState, useEffect, JSX } from "react"

interface Record {
  sNo: number
  machineName: string
  optimumWorkingTime: number
  optimumOutput: number
  optimumTotalQuantity: number
  actualWorkingTime: number
  actualOutput: number
  actualTotalOutput: number
  material: string
  manpower: number
  specifications: string
  remarks: string
  dateTime: string
  timestamp: string
}

interface AlertState {
  type: "success" | "error"
  message: string
}

export default function ViewRecords(): JSX.Element {
  const [records, setRecords] = useState<Record[]>([])
  const [filteredRecords, setFilteredRecords] = useState<Record[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [alert, setAlert] = useState<AlertState | null>(null)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async (): Promise<void> => {
    try {
      setLoading(true)
      console.log('Loading records from Google Sheets via API...')

      // Using your folder structure: /api/sheets/records
      const response = await fetch('/api/sheets/records', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      console.log('API Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch records`)
      }

      const data = await response.json()
      console.log('API Response data:', data)

      if (data.success) {
        setRecords(data.data || [])
        setFilteredRecords(data.data || [])
        setAlert({ 
          type: "success", 
          message: `Successfully loaded ${data.count || 0} records from Google Sheets!` 
        })
        setTimeout(() => setAlert(null), 3000)
      } else {
        throw new Error(data.error || 'Failed to load records')
      }
    } catch (error) {
      console.error('Error loading records:', error)
      setAlert({ 
        type: "error", 
        message: `Failed to load records: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
      setTimeout(() => setAlert(null), 5000)
      setRecords([])
      setFilteredRecords([])
    } finally {
      setLoading(false)
    }
  }

  const filterRecords = (): void => {
    let filtered = [...records]

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((r) =>
        r.machineName.toLowerCase().includes(searchLower) ||
        r.material.toLowerCase().includes(searchLower) ||
        r.specifications.toLowerCase().includes(searchLower) ||
        r.remarks.toLowerCase().includes(searchLower)
      )
    }

    if (startDate && endDate) {
      filtered = filtered.filter((r) => r.dateTime >= startDate && r.dateTime <= endDate)
    } else if (startDate) {
      filtered = filtered.filter((r) => r.dateTime >= startDate)
    } else if (endDate) {
      filtered = filtered.filter((r) => r.dateTime <= endDate)
    }

    setFilteredRecords(filtered)
  }

  const clearFilters = (): void => {
    setSearchTerm("")
    setStartDate("")
    setEndDate("")
    setFilteredRecords(records)
  }
  const formatDateToDDMMYY = (dateString: string): string => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString // Return original if invalid date
  
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2) // Get last 2 digits of year
  
  return `${day}/${month}/${year}`
}


  const getPerformanceClass = (actual: number, optimum: number): string => {
    if (optimum === 0) return "bg-gray-100 text-gray-800"
    const percentage = (actual / optimum) * 100
    if (percentage >= 95) return "bg-green-100 text-green-800"
    if (percentage >= 80) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const calculatePercentage = (actual: number, optimum: number): number => {
    if (optimum === 0) return 0
    return Math.round((actual / optimum) * 100)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading records from Google Sheets...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8 rounded-xl shadow-lg mb-8">
        <h1 className="text-3xl font-bold mb-2">View Records</h1>
        <p className="text-blue-100">Production records from Google Sheets Records</p>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            alert.type === "success"
              ? "bg-green-100 text-green-800 border-l-4 border-green-500"
              : "bg-red-100 text-red-800 border-l-4 border-red-500"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by machine, material, specifications..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={filterRecords}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>

          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>

          <button
            onClick={loadRecords}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <span>📊 Total Records: {records.length} | Filtered: {filteredRecords.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">S.No</th>
                 <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Machine</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Working Time (Opt/Act/%)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Output (Opt/Act/%)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Total Quantity (Opt/Act/%)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Material</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Manpower</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Specifications</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    {records.length === 0 ? "No records found in Google Sheets" : "No records match filter"}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={index} className="border-b hover:bg-blue-50">
                  <td className="px-4 py-3 text-sm">{record.sNo}</td>

                    <td className="px-4 py-3 text-sm">{formatDateToDDMMYY(record.dateTime)}</td>
                    <td className="px-4 py-3 font-semibold">{record.machineName}</td>
                    <td className={`px-4 py-3 text-sm ${getPerformanceClass(record.actualWorkingTime, record.optimumWorkingTime)}`}>
                      <div>Opt: {record.optimumWorkingTime}</div>
                      <div>Act: {record.actualWorkingTime}</div>
                      <div>{calculatePercentage(record.actualWorkingTime, record.optimumWorkingTime)}%</div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${getPerformanceClass(record.actualOutput, record.optimumOutput)}`}>
                      <div>Opt: {record.optimumOutput}</div>
                      <div>Act: {record.actualOutput}</div>
                      <div>{calculatePercentage(record.actualOutput, record.optimumOutput)}%</div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${getPerformanceClass(record.actualTotalOutput, record.optimumTotalQuantity)}`}>
                      <div>Opt: {record.optimumTotalQuantity}</div>
                      <div>Act: {record.actualTotalOutput}</div>
                      <div>{calculatePercentage(record.actualTotalOutput, record.optimumTotalQuantity)}%</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{record.material}</td>
                    <td className="px-4 py-3 text-sm">{record.manpower}</td>
                    <td className="px-4 py-3 text-sm">{record.specifications}</td>
                    <td className="px-4 py-3 text-sm">{record.remarks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
