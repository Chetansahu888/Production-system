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
}

interface MasterData {
  machineName: string
  specifications: string
  material: string
  remarks?: string
}

export default function DataEntry() {
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split("T")[0])
  const [machines, setMachines] = useState<MachineData[]>([])
  const [availableSpecifications, setAvailableSpecifications] = useState<string[]>([])
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([])
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [submittingRows, setSubmittingRows] = useState<Set<number>>(new Set())

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzNtDzl7Epk4_R7Vnklnry2Muwd5gTb-EXV60g-sEchodL8BIQMOwz4P_nK0wPCr5wt/exec"

  // Fetch master data from your API route
  const fetchMasterData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching master data from API...')
      
      // Use your API route to fetch master data
      const response = await fetch('/api/sheets/master', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      console.log('📡 API Response status:', response.status)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      console.log('📊 API Response data:', result)

      if (result.success && result.data) {
        const masterData = result.data
        
        // Extract unique specifications and materials
        const specs = [...new Set(masterData.map((item: MasterData) => item.specifications).filter(Boolean))]
        const materials = [...new Set(masterData.map((item: MasterData) => item.material).filter(Boolean))]
        
      
        // Set optimum values based on machine types
        const optimumValues = {
          'Grinding': { workingTime: 20, output: 0.5, totalQuantity: 10 },
          'Mixing Mill 1': { workingTime: 15, output: 3, totalQuantity: 45 },
          'Mixing Mill 2': { workingTime: 15, output: 3, totalQuantity: 45 },
          'Mixing Mill 3': { workingTime: 15, output: 5, totalQuantity: 75 },
          'Impact Mill': { workingTime: 5, output: 15, totalQuantity: 75 },
          'Impact Mill23': { workingTime: 5, output: 15, totalQuantity: 75 }
        }
        
        // Create unique machines (remove duplicates)
        const uniqueMachines = masterData.reduce((acc: MasterData[], current: MasterData) => {
          const exists = acc.find(item => item.machineName === current.machineName)
          if (!exists) {
            acc.push(current)
          }
          return acc
        }, [])
        
        const initialMachines = uniqueMachines.map((item: MasterData, index: number) => {
          const optimum = optimumValues[item.machineName as keyof typeof optimumValues] || { workingTime: 8, output: 1, totalQuantity: 8 }
          
          return {
            sNo: index + 1,
            machineName: item.machineName,
            optimumWorkingTime: optimum.workingTime,
            optimumOutput: optimum.output,
            optimumTotalQuantity: optimum.totalQuantity,
            actualWorkingTime: 0,
            actualOutput: 0,
            actualTotalOutput: 0,
            material: "",
            manpower: 0,
            specifications: "",
            remarks: "",
          }
        })
        
        setMachines(initialMachines)
        setAlert({ 
          type: "success", 
          message: `✅ Successfully loaded ${uniqueMachines.length} machines from Master sheet!` 
        })
        setTimeout(() => setAlert(null), 3000)
        
      } else {
        throw new Error(result.error || 'Failed to fetch master data')
      }
      
    } catch (error) {
      console.error('❌ Error loading master data:', error)
      setAlert({ 
        type: "error", 
        message: `❌ Failed to load master data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
      setTimeout(() => setAlert(null), 5000)
      
      // Set minimal fallback data to keep the app working
      setAvailableSpecifications(['Labour issue', 'Machine work/maintenance', 'Electricity issue', 'Raw material issue'])
      setAvailableMaterials(['P14', 'Sand', 'Steel', 'Aluminum', 'Copper','test1'])
      setMachines([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMasterData()
  }, [])

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
        }]
      }

      // Submit to Google Sheets
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData)
      })
      
      setAlert({ type: "success", message: `✅ Record for ${machine.machineName} submitted successfully!` })
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
      
    } catch (error) {
      console.error('Error saving record:', error)
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

  const saveAllRecords = async () => {
    try {
      setLoading(true)

      // Check if there's any actual data to save
      const hasData = machines.some(machine => 
        machine.actualWorkingTime > 0 || 
        machine.actualOutput > 0 || 
        machine.actualTotalOutput > 0 ||
        machine.material || 
        machine.specifications || 
        machine.remarks
      )

      if (!hasData) {
        setAlert({ type: "error", message: "Please fill in some actual data before saving" })
        setTimeout(() => setAlert(null), 3000)
        return
      }

      const recordsData = {
        action: 'saveRecords',
        data: machines.map((machine) => ({
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
        }))
      }

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordsData)
      })

      setAlert({ type: "success", message: "✅ All records submitted successfully!" })
      setTimeout(() => setAlert(null), 3000)

      // Reset all actual values
      setMachines(machines.map(m => ({
        ...m,
        actualWorkingTime: 0,
        actualOutput: 0,
        actualTotalOutput: 0,
        material: "",
        manpower: 0,
        specifications: "",
        remarks: "",
      })))
      
    } catch (error) {
      console.error('Error saving all records:', error)
      setAlert({ type: "error", message: "❌ Error submitting all records" })
      setTimeout(() => setAlert(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  if (loading && machines.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading machine data from Master sheet...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8 rounded-xl shadow-lg mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Entry</h1>
        <p className="text-blue-100">Update production records</p>
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
        <div className="flex items-center gap-4">
          <label className="font-semibold text-gray-700">Update Date:</label>
          <input
            type="date"
            value={updateDate}
            onChange={(e) => setUpdateDate(e.target.value)}
            className="px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={fetchMasterData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Master Data"}
          </button>
          <span className="text-sm text-gray-600">
            ({machines.length} machines loaded from Master sheet)
          </span>
        </div>
      </div>

      {machines.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Machines Loaded</h3>
            <p className="text-gray-500 mb-4">Unable to load machine data from Master sheet.</p>
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
                      <select
                        value={machine.material}
                        onChange={(e) => updateMachine(index, "material", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select Material</option>
                        {availableMaterials.map((material) => (
                          <option key={material} value={material}>
                            {material}
                          </option>
                        ))}
                      </select>
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

          <div className="p-6 bg-gray-50 border-t flex gap-4">
            {/* <button
              onClick={saveAllRecords}
              disabled={loading || machines.length === 0}
              className={`px-8 py-3 font-semibold rounded-lg shadow-lg transition-all ${
                loading || machines.length === 0
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-xl hover:from-blue-700 hover:to-blue-600"
              }`}
            >
              {loading ? "Saving All..." : "Save All Records"}
            </button> */}
            
            <div className="text-sm text-gray-600 flex items-center">
              <span>📊 {machines.length} machines from Master sheet | ✅ Records save to Google Sheets</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
