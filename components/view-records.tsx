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
  const [machineSearch, setMachineSearch] = useState<string>("")
  const [specificationsSearch, setSpecificationsSearch] = useState<string>("")
  const [filterDate, setFilterDate] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [alert, setAlert] = useState<AlertState | null>(null)

  useEffect(() => {
    loadRecords()
  }, [userFirmName, isAdmin])

  useEffect(() => {
    // Live filter as search criteria changes
    let filtered = [...records]
    
    if (machineSearch.trim()) {
      const searchLower = machineSearch.toLowerCase().trim()
      filtered = filtered.filter((r) =>
        r.machineName?.toLowerCase().includes(searchLower)
      )
    }
    
    if (specificationsSearch.trim()) {
      const searchLower = specificationsSearch.toLowerCase().trim()
      filtered = filtered.filter((r) =>
        r.specifications?.toLowerCase().includes(searchLower)
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
  }, [machineSearch, specificationsSearch, filterDate, records])

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
        
        // Filter records based on user role and firm name
        if (!isAdmin && userFirmName && userFirmName !== 'All') {
          recordsData = recordsData.filter((record: Record) => {
            const recordFirm = record.firmName?.toString().trim()
            const userFirm = userFirmName.toString().trim()
            return recordFirm === userFirm
          })
        }
        
        setRecords(recordsData)
        setFilteredRecords(recordsData)
        
        // Show appropriate success message based on user role
        let successMessage = `✅ Successfully loaded ${recordsData.length} records`
        if (!isAdmin) {
          successMessage += ` for ${userFirmName}`
        } else {
          successMessage += ' from all firms'
        }
        
        setAlert({ 
          type: "success", 
          message: successMessage
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
    setMachineSearch("")
    setSpecificationsSearch("")
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

  // FIXED: Performance calculation with proper number handling
  const getPerformanceClass = (actual: number, optimum: number): string => {
    // Convert to numbers to ensure proper comparison
    const actualNum = Number(actual)
    const optimumNum = Number(optimum)
    
    // Debug logging (remove in production)
    console.log(`Actual: ${actualNum}, Optimum: ${optimumNum}, Ratio: ${actualNum / optimumNum}`)
    
    if (optimumNum === 0 || isNaN(actualNum) || isNaN(optimumNum)) {
      return "bg-white text-gray-800"
    }
    
    const ratio = actualNum / optimumNum
    
    // Green: Actual = Optimum (exact match or very close due to floating point)
    if (Math.abs(actualNum - optimumNum) < 0.01) {
      return "bg-green-50 text-green-700 border-l-4 border-green-500 font-medium"
    }
    // Orange: 75% – 90% of optimum
    else if (ratio >= 0.75 && ratio < 0.90) {
      return "bg-orange-50 text-orange-700 border-l-4 border-orange-500 font-medium"
    }
    // Red: Below 75% of optimum
    else if (ratio < 0.75) {
      return "bg-red-50 text-red-700 border-l-4 border-red-500 font-medium"
    }
    // Better than optimum - show as green (achieved more than optimum)
    else {
      return "bg-green-50 text-green-700 border-l-4 border-green-500 font-medium"
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Loading records{!isAdmin ? ` for ${userFirmName}` : ' from all firms'}...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* SEPARATE HEADER SECTION */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-lg mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="text-xl font-bold mb-1">
              View Records
            </h1>
            <p className="text-indigo-100 text-xs">
              {isAdmin 
                ? 'Production records from all firms' 
                : `Production records for ${userFirmName}`
              }
            </p>
          </div>
          
          {/* User Info Badge */}
          <div className="bg-indigo-700 px-3 py-1 rounded-lg text-xs">
            <div className="font-medium">
              {isAdmin ? '👑 Admin User' : `🏢 ${userFirmName}`}
            </div>
            <div className="text-indigo-200 text-xs">
              {isAdmin ? 'Viewing all firms' : 'Viewing your firm only'}
            </div>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
          {/* Machine Name Search */}
          <div>
            <label className="block text-xs font-medium text-indigo-100 mb-1">
              🔍 Machine Name
            </label>
            <input
              type="text"
              value={machineSearch}
              onChange={(e) => setMachineSearch(e.target.value)}
              placeholder="Search machine names..."
              className="w-full px-3 py-2 bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Specifications Search */}
          <div>
            <label className="block text-xs font-medium text-indigo-100 mb-1">
              📋 Specifications
            </label>
            <input
              type="text"
              value={specificationsSearch}
              onChange={(e) => setSpecificationsSearch(e.target.value)}
              placeholder="Search specifications..."
              className="w-full px-3 py-2 bg-white text-gray-800 placeholder-gray-500 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-medium text-indigo-100 mb-1">
              📅 Date Filter
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-end">
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              Clear All
            </button>
            <button
              onClick={loadRecords}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? "..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div
            className={`mt-2 p-3 rounded-lg text-sm ${
              alert.type === "success"
                ? "bg-emerald-500 bg-opacity-20 text-emerald-100 border border-emerald-400"
                : "bg-red-500 bg-opacity-20 text-red-100 border border-red-400"
            }`}
          >
            {alert.message}
          </div>
        )}
      </div>

      {/* SEPARATE TABLE SECTION */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <div className="max-h-100 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Date/Time</th>
                  {isAdmin && (
                    <th className="px-3 py-3 text-left font-semibold text-sm">Firm Name</th>
                  )}
                  <th className="px-3 py-3 text-left font-semibold text-sm">Machine Name</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Optimum Working Time (Hr/Day)</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Optimum Output (Mt/Hr)</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Optimum Total Quantity (Mt/Day)</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Actual Working Time (Hr/Day)</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Actual Output (Mt/Hr)</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Actual Total Output (Mt/Day)</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Material</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Manpower</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Specifications</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={isAdmin ? 13 : 12} 
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      {records.length === 0 ? 
                        `No records found${!isAdmin ? ` for ${userFirmName}` : ' in the system'}` : 
                        "No records match filter criteria"
                      }
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => {
                    // Debug each record
                    console.log(`Record ${index}:`, {
                      optimumWorkingTime: record.optimumWorkingTime,
                      actualWorkingTime: record.actualWorkingTime,
                      optimumOutput: record.optimumOutput,
                      actualOutput: record.actualOutput,
                      optimumTotalQuantity: record.optimumTotalQuantity,
                      actualTotalOutput: record.actualTotalOutput
                    })
                    
                    return (
                      <tr 
                        key={index} 
                        className={`border-b hover:bg-indigo-50 transition-colors duration-150 ${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        }`}
                      >
                        <td className="px-3 py-3 font-medium text-gray-700">
                          {formatDateToDDMMYY(record.dateTime)}
                        </td>
                        {isAdmin && (
                          <td className="px-3 py-3">
                            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                              {record.firmName}
                            </span>
                          </td>
                        )}
                        <td className="px-3 py-3 font-semibold text-gray-800">
                          {record.machineName}
                        </td>
                        <td className="px-3 py-3 text-gray-600">{record.optimumWorkingTime}</td>
                        <td className="px-3 py-3 text-gray-600">{record.optimumOutput}</td>
                        <td className="px-3 py-3 text-gray-600">{record.optimumTotalQuantity}</td>
                        
                        {/* Actual Working Time with performance coloring */}
                        <td className={`px-3 py-3 ${getPerformanceClass(record.actualWorkingTime, record.optimumWorkingTime)}`}>
                          {record.actualWorkingTime}
                        </td>
                        
                        {/* Actual Output with performance coloring */}
                        <td className={`px-3 py-3 ${getPerformanceClass(record.actualOutput, record.optimumOutput)}`}>
                          {record.actualOutput}
                        </td>
                        
                        {/* Actual Total Output with performance coloring */}
                        <td className={`px-3 py-3 ${getPerformanceClass(record.actualTotalOutput, record.optimumTotalQuantity)}`}>
                          {record.actualTotalOutput}
                        </td>
                        
                        <td className="px-3 py-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {record.material || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                            {record.manpower || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-600 max-w-xs truncate">
                          {record.specifications || '-'}
                        </td>
                        <td className="px-3 py-3 text-gray-600 max-w-xs truncate">
                          {record.remarks || '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Records Summary Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-t border-gray-200 text-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <span className="font-semibold text-gray-700">Showing:</span>
                <span className="ml-2 text-indigo-600 font-bold">
                  {filteredRecords.length} record(s)
                </span>
                {filteredRecords.length !== records.length && (
                  <span className="text-gray-500 ml-2">
                    (filtered from {records.length} total)
                  </span>
                )}
              </div>
              
              {/* Performance Indicators Legend */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Optimum (100%+)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-1000 rounded"></div>
                  <span className="text-gray-600">75% - 90%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">Below 75%</span>
                </div>
              </div>
            </div>
            
            <div className="text-gray-600 font-medium">
              {isAdmin ? '👑 All firms data' : `🏢 Firm: ${userFirmName}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}