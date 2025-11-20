"use client"

import { useState, useEffect } from "react"

interface MachineData {
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
  firmName: string
}

interface DataEntryProps {
  userFirmName: string
}

export default function DataEntry({ userFirmName }: DataEntryProps) {
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split("T")[0])
  const [machines, setMachines] = useState<MachineData[]>([])
  const [availableSpecifications, setAvailableSpecifications] = useState<string[]>([])
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([])
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [submittingRows, setSubmittingRows] = useState<Set<number>>(new Set())

  // Fetch data from Main sheet via API route and filter by firm name
  const fetchMasterData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching data from Main sheet for firm:', userFirmName)
      
      // Fetch Main sheet data through your API route
      const mainResponse = await fetch('/api/sheets/main', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      console.log('📡 Main API response status:', mainResponse.status)

      if (!mainResponse.ok) {
        throw new Error(`Main API error: ${mainResponse.status}`)
      }

      const mainResult = await mainResponse.json()
      console.log('📊 Main Sheet Response:', mainResult)

      if (mainResult.success && mainResult.data && Array.isArray(mainResult.data)) {
        let mainData = mainResult.data
        
        // Filter data by user's firm name (only if not "All")
        if (userFirmName && userFirmName !== 'All') {
          mainData = mainData.filter((item: any) => 
            item.firmName === userFirmName
          )
          console.log(`🔍 Filtered ${mainData.length} machines for firm: ${userFirmName}`)
        }
        
        if (mainData.length === 0) {
          throw new Error(`No machines found for firm: ${userFirmName}`)
        }

        // Create machines from filtered Main sheet data
        const initialMachines = mainData.map((item: any, index: number) => {
          return {
            sNo: item.sNo || (index + 1),
            machineName: item.machineName || 'Unknown Machine',
            optimumWorkingTime: parseFloat(item.optimumWorkingTime) || 0,
            optimumOutput: parseFloat(item.optimumOutput) || 0,
            optimumTotalQuantity: parseFloat(item.optimumTotalQuantity) || 0,
            actualWorkingTime: 0,
            actualOutput: 0,
            actualTotalOutput: 0,
            material: "",
            manpower: 0,
            specifications: "",
            remarks: "",
            firmName: item.firmName || 'No Firm',
          }
        })
        
        setMachines(initialMachines)
        setAlert({ 
          type: "success", 
          message: `✅ Successfully loaded ${initialMachines.length} machines for ${userFirmName}!` 
        })
        setTimeout(() => setAlert(null), 3000)
        
      } else {
        throw new Error(mainResult.error || 'Failed to fetch main data or no data returned')
      }

      // Fetch Master data for specifications and materials (no filtering needed)
      try {
        const masterResponse = await fetch('/api/sheets/master', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        })

        if (masterResponse.ok) {
          const masterResult = await masterResponse.json()
          console.log('📊 Master Sheet Response:', masterResult)
          
          if (masterResult.success && masterResult.data) {
            const specs = Array.from(
  new Set(
    masterResult.data
      .map((item: any) => item.specifications)
      .filter((s: any): s is string => typeof s === 'string' && s.trim() !== "")
  )
) as string[]

const materials = Array.from(
  new Set(
    masterResult.data
      .map((item: any) => item.material)
      .filter((m: any): m is string => typeof m === 'string' && m.trim() !== "")
  )
) as string[]

            setAvailableSpecifications(specs)
            setAvailableMaterials(materials)
          } else {
            // Fallback specifications
            setAvailableSpecifications([
              'Labour issue', 
              'Machine work/maintenance', 
              'Electricity issue', 
              'Raw material issue', 
              'Space – Not available'
            ])
            setAvailableMaterials(['P14', 'Sand', 'Steel', 'Aluminum', 'Copper'])
          }
        } else {
          // Fallback specifications
          setAvailableSpecifications([
            'Labour issue', 
            'Machine work/maintenance', 
            'Electricity issue', 
            'Raw material issue', 
            'Space – Not available'
          ])
          setAvailableMaterials(['P14', 'Sand', 'Steel', 'Aluminum', 'Copper'])
        }
      } catch (masterError) {
        console.log('⚠️ Master data fetch failed, using fallback:', masterError)
        // Fallback specifications
        setAvailableSpecifications([
          'Labour issue', 
          'Machine work/maintenance', 
          'Electricity issue', 
          'Raw material issue', 
          'Space – Not available'
        ])
        setAvailableMaterials(['P14', 'Sand', 'Steel', 'Aluminum', 'Copper'])
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error)
      setAlert({ 
        type: "error", 
        message: `❌ Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
      setTimeout(() => setAlert(null), 5000)
      
      // Set fallback data with the required specifications
      setAvailableSpecifications([
        'Labour issue', 
        'Machine work/maintenance', 
        'Electricity issue', 
        'Raw material issue', 
        'Space – Not available'
      ])
      setAvailableMaterials(['P14', 'Sand', 'Steel', 'Aluminum', 'Copper'])
      setMachines([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userFirmName) {
      fetchMasterData()
    }
  }, [userFirmName])

  const updateMachine = (index: number, field: string, value: any) => {
    const updated = [...machines]
    updated[index] = { ...updated[index], [field]: value }
    setMachines(updated)
  }

  const submitSingleRecord = async (index: number) => {
    try {
      setSubmittingRows(prev => new Set(prev).add(index))
      
      const machine = machines[index]
      
      // Validate required fields
      if (!machine.actualWorkingTime && !machine.actualOutput && !machine.actualTotalOutput) {
        setAlert({ type: "error", message: "Please fill in at least one actual value before submitting" })
        setTimeout(() => setAlert(null), 3000)
        return
      }
      
      const recordData = {
        action: 'saveRecords',
        data: [{
          dateTime: updateDate,
          sNo: machine.sNo,
          machineName: machine.machineName,
          optimumWorkingTime: machine.optimumWorkingTime,
          optimumOutput: machine.optimumOutput,
          optimumTotalQuantity: machine.optimumTotalQuantity,
          actualWorkingTime: machine.actualWorkingTime,
          actualOutput: machine.actualOutput,
          actualTotalOutput: machine.actualTotalOutput,
          material: machine.material,
          manpower: machine.manpower,
          specifications: machine.specifications,
          remarks: machine.remarks,
          firmName: machine.firmName,
        }]
      }

      // Submit to Google Sheets through API route
      const response = await fetch('/api/sheets/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData)
      })

      console.log('📤 Submit response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Submit result:', result)
        
        setAlert({ type: "success", message: `✅ Record for ${machine.machineName} (${machine.firmName}) submitted successfully!` })
        setTimeout(() => setAlert(null), 3000)

        // Reset the row's actual values
        const updated = [...machines]
        updated[index] = {
          ...updated[index],
          actualWorkingTime: 0,
          actualOutput: 0,
          actualTotalOutput: 0,
          material: "",
          manpower: 0,
          specifications: "",
          remarks: "",
        }
        setMachines(updated)
      } else {
        throw new Error(`Submit failed with status: ${response.status}`)
      }
      
    } catch (error) {
      console.error('❌ Error saving record:', error)
      setAlert({ type: "error", message: `❌ Error submitting record for ${machines[index].machineName}` })
      setTimeout(() => setAlert(null), 5000)
    } finally {
      setSubmittingRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  if (loading && machines.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading machine data for {userFirmName}...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8 rounded-xl shadow-lg mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Entry - {userFirmName}</h1>
        <p className="text-blue-100">Update production records for your machines</p>
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

      {machines.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Machines Found</h3>
            <p className="text-gray-500 mb-4">No machines found for firm: {userFirmName}</p>
            <button
              onClick={fetchMasterData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? "Loading..." : "Try Again"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">S.No.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Machine Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Firm</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actual Working Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actual Output</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actual Total Output</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Material</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Manpower</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Specifications</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine, index) => (
                  <tr key={index} className="border-b hover:bg-blue-50">
                    <td className="px-4 py-3">{machine.sNo}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{machine.machineName}</td>
                    <td className="px-4 py-3 text-sm text-blue-600 font-medium">{machine.firmName}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={machine.actualWorkingTime || ""}
                        onChange={(e) =>
                          updateMachine(index, "actualWorkingTime", Number.parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={machine.actualOutput || ""}
                        onChange={(e) => updateMachine(index, "actualOutput", Number.parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={machine.actualTotalOutput || ""}
                        onChange={(e) =>
                          updateMachine(index, "actualTotalOutput", Number.parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={machine.material}
                        onChange={(e) => updateMachine(index, "material", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Enter material..."
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={machine.manpower || ""}
                        onChange={(e) => updateMachine(index, "manpower", Number.parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={machine.specifications}
                        onChange={(e) => updateMachine(index, "specifications", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select Specification</option>
                        {availableSpecifications.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={machine.remarks}
                        onChange={(e) => updateMachine(index, "remarks", e.target.value)}
                        placeholder="Enter remarks..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => submitSingleRecord(index)}
                        disabled={submittingRows.has(index)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          submittingRows.has(index)
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {submittingRows.has(index) ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </div>
                        ) : (
                          "Submit"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}