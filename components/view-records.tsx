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
  firmName: string
}

interface AlertState {
  type: "success" | "error"
  message: string
}

interface ViewRecordsProps {
  userFirmName: string
  isAdmin: boolean
}

export default function ViewRecords({ userFirmName, isAdmin }: ViewRecordsProps): JSX.Element {
  const [records, setRecords] = useState<Record[]>([])
  const [filteredRecords, setFilteredRecords] = useState<Record[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterDate, setFilterDate] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [alert, setAlert] = useState<AlertState | null>(null)

  useEffect(() => {
    loadRecords()
  }, [userFirmName, isAdmin])

  useEffect(() => {
    // Live filter as search date or searchTerm changes
    let filtered = [...records]
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((r) =>
        (r.machineName?.toLowerCase().includes(searchLower) ||
        r.material?.toLowerCase().includes(searchLower) ||
        r.specifications?.toLowerCase().includes(searchLower) ||
        r.remarks?.toLowerCase().includes(searchLower) ||
        r.firmName?.toLowerCase().includes(searchLower))
      )
    }
    
    if (filterDate) {
      filtered = filtered.filter((r) => {
        if (!r.dateTime) return false
        const recordDate = new Date(r.dateTime)
        const filterDateObj = new Date(filterDate)
        
        if (isNaN(recordDate.getTime()) || isNaN(filterDateObj.getTime())) {
          return r.dateTime.includes(filterDate)
        }
        
        return recordDate.toISOString().split('T')[0] === filterDateObj.toISOString().split('T')[0]
      })
    }
    
    setFilteredRecords(filtered)
  }, [searchTerm, filterDate, records])

  const loadRecords = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await fetch('/api/sheets/records', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch records`)
      }
      const data = await response.json()
      if (data.success) {
        let recordsData = data.data || []
        if (!isAdmin && userFirmName && userFirmName !== 'All') {
          recordsData = recordsData.filter((record: Record) => {
            const recordFirm = record.firmName?.toString().trim()
            const userFirm = userFirmName.toString().trim()
            return recordFirm === userFirm
          })
        }
        setRecords(recordsData)
        setFilteredRecords(recordsData)
        setAlert({ 
          type: "success", 
          message: `✅ Successfully loaded ${recordsData.length} records${!isAdmin ? ` for ${userFirmName}` : ''}!` 
        })
        setTimeout(() => setAlert(null), 2000)
      } else {
        throw new Error(data.error || 'Failed to load records')
      }
    } catch (error) {
      setAlert({ 
        type: "error", 
        message: `❌ Failed to load records: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
      setTimeout(() => setAlert(null), 3500)
      setRecords([])
      setFilteredRecords([])
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = (): void => {
    setSearchTerm("")
    setFilterDate("")
    setFilteredRecords(records)
  }

  const formatDateToDDMMYY = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  }

  const getWorkingTimePerformanceClass = (actualTime: number, optimumTime: number): string => {
    if (actualTime > optimumTime) {
      return "bg-red-100 text-red-800 border-l-4 border-red-500"
    }
    return "bg-white text-gray-800"
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Loading records{!isAdmin ? ` for ${userFirmName}` : ' (All)'}...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* SEPARATE HEADER SECTION */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-xl shadow-lg mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-xl font-bold mb-1">
              View Records
            </h1>
            <p className="text-blue-100 text-xs">
              {isAdmin ? 'Production records from all machines' : 'Production records for your machines'}
            </p>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="flex flex-wrap gap-2 items-end mb-2">
          <div className="flex-1 min-w-[50px]">
            <label className="block text-xs font-medium text-blue-100 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search machines, materials..."
              className="w-60 px-2 py-1 bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="min-w-[100px]">
            <label className="block text-xs font-medium text-blue-100 mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2 py-1 bg-white text-gray-800 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={clearFilters}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>

          <button
            onClick={loadRecords}
            disabled={loading}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Refresh"}
          </button>
        </div>

        

        {/* Alert */}
        {alert && (
          <div
            className={`mt-2 p-2 rounded text-xs ${
              alert.type === "success"
                ? "bg-green-500 bg-opacity-20 text-green-100 border border-green-400"
                : "bg-red-500 bg-opacity-20 text-red-100 border border-red-400"
            }`}
          >
            {alert.message}
          </div>
        )}
      </div>

      {/* SEPARATE TABLE SECTION */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-100 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-blue-900 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold">Date/Time</th>
                  {/* <th className="px-2 py-2 text-left font-semibold">S. No.</th> */}
                  <th className="px-2 py-2 text-left font-semibold">Firm Name</th>
                  <th className="px-2 py-2 text-left font-semibold">Machine Name</th>
                  <th className="px-2 py-2 text-left font-semibold">Optimum Working Time (Hr/Day)</th>
                  <th className="px-2 py-2 text-left font-semibold">Optimum Output (Mt/Hr)</th>
                  <th className="px-2 py-2 text-left font-semibold">Optimum Total Quantity (Mt/Day)</th>
                  <th className="px-2 py-2 text-left font-semibold">Actual Working Time (Hr/Day)</th>
                  <th className="px-2 py-2 text-left font-semibold">Actual Output (Mt/Hr)</th>
                  <th className="px-2 py-2 text-left font-semibold">Actual Total Output (Mt/Day)</th>
                  <th className="px-2 py-2 text-left font-semibold">Material</th>
                  <th className="px-2 py-2 text-left font-semibold">Manpower</th>
                  <th className="px-2 py-2 text-left font-semibold">Specifications</th>
                  <th className="px-2 py-2 text-left font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-2 py-6 text-center text-gray-500">
                      {records.length === 0 ? 
                        `No records found${!isAdmin ? ` for ${userFirmName}` : ''}` : 
                        "No records match filter criteria"
                      }
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <tr key={index} className="border-b hover:bg-blue-50">
                      <td className="px-2 py-2">{formatDateToDDMMYY(record.dateTime)}</td>
                      {/* <td className="px-2 py-2">{record.sNo}</td> */}
                     <td className="px-2 py-2 text-blue-600 font-medium">{record.firmName}</td>
                      <td className="px-2 py-2 font-medium">{record.machineName}</td>
                      <td className="px-2 py-2">{record.optimumWorkingTime}</td>
                      <td className="px-2 py-2">{record.optimumOutput}</td>
                      <td className="px-2 py-2">{record.optimumTotalQuantity}</td>
                      <td className={`px-2 py-2 ${getWorkingTimePerformanceClass(record.actualWorkingTime, record.optimumWorkingTime)}`}>
                        {record.actualWorkingTime}
                      </td>
                      <td className="px-2 py-2">{record.actualOutput}</td>
                      <td className="px-2 py-2">{record.actualTotalOutput}</td>
                      <td className="px-2 py-2">{record.material || '-'}</td>
                      <td className="px-2 py-2">{record.manpower || '-'}</td>
                      <td className="px-2 py-2">{record.specifications || '-'}</td>
                      <td className="px-2 py-2">{record.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Legend */}
        <div className="bg-gray-50 px-3 py-1 border-t text-xs">
          <span className="font-medium text-gray-700">Legend:</span>
          <span className="inline-flex items-center ml-2 mr-2">
            <span className="w-3 h-3 bg-red-100 border-l-2 border-red-500 rounded mr-1"></span>
            Working Time: Overtime
          </span>
          <span className="inline-flex items-center">
            <span className="w-3 h-3 bg-white border border-gray-300 rounded mr-1"></span>
            Normal
          </span>
        </div>
      </div>
    </div>
  )
}
