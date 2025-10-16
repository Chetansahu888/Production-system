"use client"

import { useState, useEffect } from "react"

interface DashboardStats {
  total: number
  excellent: number
  good: number
  poor: number
  todayRecords: number
  averageEfficiency: number
}

interface MachinePerformance {
  machineName: string
  totalRecords: number
  averageEfficiency: number
  status: 'excellent' | 'good' | 'poor'
  lastUpdate: string
  firmName: string
}

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

interface DashboardProps {
  userFirmName: string
  isAdmin: boolean
}

export default function Dashboard({ userFirmName, isAdmin }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    excellent: 0,
    good: 0,
    poor: 0,
    todayRecords: 0,
    averageEfficiency: 0,
  })
  
  const [machinePerformance, setMachinePerformance] = useState<MachinePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [lastRefresh, setLastRefresh] = useState<string>('')

  const calculateEfficiency = (record: Record): number => {
    const workingTimeEfficiency = record.optimumWorkingTime > 0 
      ? (record.actualWorkingTime / record.optimumWorkingTime) * 100 
      : 0
    
    const outputEfficiency = record.optimumOutput > 0 
      ? (record.actualOutput / record.optimumOutput) * 100 
      : 0
    
    const quantityEfficiency = record.optimumTotalQuantity > 0 
      ? (record.actualTotalOutput / record.optimumTotalQuantity) * 100 
      : 0

    const validEfficiencies = [workingTimeEfficiency, outputEfficiency, quantityEfficiency].filter(eff => eff > 0)
    
    if (validEfficiencies.length === 0) return 0
    
    return validEfficiencies.reduce((sum, eff) => sum + eff, 0) / validEfficiencies.length
  }

  const getPerformanceStatus = (efficiency: number): 'excellent' | 'good' | 'poor' => {
    if (efficiency >= 95) return 'excellent'
    if (efficiency >= 80) return 'good'
    return 'poor'
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading dashboard data for:', isAdmin ? 'Admin (All data)' : `Firm: ${userFirmName}`)

      // Use the records endpoint since dashboard might not exist
      const response = await fetch('/api/sheets/records', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        let records: Record[] = result.data
        console.log('📊 Total records fetched:', records.length)

        // Filter by firm name ONLY if user is not admin
        if (!isAdmin && userFirmName && userFirmName !== 'All') {
          const originalCount = records.length
          records = records.filter((record: Record) => {
            const recordFirm = record.firmName?.toString().trim()
            const userFirm = userFirmName.toString().trim()
            return recordFirm === userFirm
          })
          console.log(`🔍 Filtered ${records.length} records from ${originalCount} for firm: ${userFirmName}`)
        }
        
        // Calculate overall stats
        let excellent = 0, good = 0, poor = 0
        let totalEfficiency = 0
        let validRecords = 0

        const today = new Date().toISOString().split('T')[0]
        const todayRecords = records.filter(record => record.dateTime === today).length

        // Machine performance tracking
        const machineStats: { [key: string]: { records: Record[], efficiencies: number[], firmName: string } } = {}

        records.forEach((record: Record) => {
          const efficiency = calculateEfficiency(record)
          
          if (efficiency > 0) {
            const status = getPerformanceStatus(efficiency)
            if (status === 'excellent') excellent++
            else if (status === 'good') good++
            else poor++

            totalEfficiency += efficiency
            validRecords++

            // Track by machine
            if (!machineStats[record.machineName]) {
              machineStats[record.machineName] = { 
                records: [], 
                efficiencies: [], 
                firmName: record.firmName || 'Unknown' 
              }
            }
            machineStats[record.machineName].records.push(record)
            machineStats[record.machineName].efficiencies.push(efficiency)
          }
        })

        // Calculate machine performance
        const machinePerf: MachinePerformance[] = Object.entries(machineStats).map(([machineName, data]) => {
          const avgEfficiency = data.efficiencies.reduce((sum, eff) => sum + eff, 0) / data.efficiencies.length
          const latestRecord = data.records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
          
          return {
            machineName,
            totalRecords: data.records.length,
            averageEfficiency: Math.round(avgEfficiency),
            status: getPerformanceStatus(avgEfficiency),
            lastUpdate: latestRecord.dateTime,
            firmName: data.firmName
          }
        }).sort((a, b) => b.averageEfficiency - a.averageEfficiency)

        setStats({
          total: records.length,
          excellent,
          good,
          poor,
          todayRecords,
          averageEfficiency: validRecords > 0 ? Math.round(totalEfficiency / validRecords) : 0,
        })

        setMachinePerformance(machinePerf)
        setLastRefresh(new Date().toLocaleTimeString())
        
        setAlert({ 
          type: "success", 
          message: `✅ Dashboard updated! Loaded ${records.length} records${!isAdmin ? ` for ${userFirmName}` : ''}.` 
        })
        setTimeout(() => setAlert(null), 3000)

      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
      setAlert({ 
        type: "error", 
        message: `❌ Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
      setTimeout(() => setAlert(null), 5000)
      
      // Set fallback stats
      setStats({
        total: 0,
        excellent: 0,
        good: 0,
        poor: 0,
        todayRecords: 0,
        averageEfficiency: 0,
      })
      setMachinePerformance([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userFirmName) {
      loadDashboardData()
    }
  }, [userFirmName, isAdmin])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Loading dashboard data{!isAdmin ? ` for ${userFirmName}` : ' (All)'}...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-8 rounded-xl shadow-lg mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Machine Efficiency FMS
            </h1>
            <p className="text-blue-100">
              {isAdmin ? 'Real-time overview of all production performance' : 'Real-time overview of your production performance'}
            </p>
          </div>
          {/* <div className="text-right">
            <button
              onClick={loadDashboardData}
              className="px-6 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            {lastRefresh && (
              <p className="text-blue-200 text-sm mt-2">Last updated: {lastRefresh}</p>
            )}
          </div> */}
        </div>
      </div>

      {/* Alert */}
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

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 uppercase mb-2">Total Records</div>
          <div className="text-4xl font-bold text-gray-800">{stats.total}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 uppercase mb-2">Today's Records</div>
          <div className="text-4xl font-bold text-orange-600">{stats.todayRecords}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 uppercase mb-2">Avg Efficiency</div>
          <div className="text-4xl font-bold text-purple-600">{stats.averageEfficiency}%</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="text-sm text-gray-600 uppercase mb-2">Excellent</div>
          <div className="text-4xl font-bold text-green-600">{stats.excellent}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600 uppercase mb-2">Good</div>
          <div className="text-4xl font-bold text-yellow-600">{stats.good}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
          <div className="text-sm text-gray-600 uppercase mb-2">Needs Improvement</div>
          <div className="text-4xl font-bold text-red-600">{stats.poor}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Machine Performance */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Machine Performance{!isAdmin ? ` - ${userFirmName}` : ' (All Firms)'}
          </h2>
          {machinePerformance.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {machinePerformance.map((machine, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-800">{machine.machineName}</h3>
                    <p className="text-sm text-gray-600">
                      {isAdmin && <span className="text-blue-600 font-medium">{machine.firmName} • </span>}
                      {machine.totalRecords} records • Last: {machine.lastUpdate}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">{machine.averageEfficiency}%</div>
                    <div
                      className={`text-xs px-2 py-1 rounded-full ${
                        machine.status === 'excellent'
                          ? 'bg-green-100 text-green-800'
                          : machine.status === 'good'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No machine performance data available{!isAdmin ? ` for ${userFirmName}` : ''}</p>
            </div>
          )}
        </div>

        {/* Performance Legend */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Standards</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <h3 className="font-bold text-green-700 mb-2">🏆 Excellent Performance</h3>
              <p className="text-sm text-green-600">Efficiency ≥ 95% of Optimum Target</p>
            </div>
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <h3 className="font-bold text-yellow-700 mb-2">👍 Good Performance</h3>
              <p className="text-sm text-yellow-600">Efficiency 80-94% of Optimum Target</p>
            </div>
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <h3 className="font-bold text-red-700 mb-2">⚠️ Needs Improvement</h3>
              <p className="text-sm text-red-600">Efficiency &lt; 80% of Optimum Target</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Info */}
      {/* <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">📊 Data Source</h3>
            <p className="text-gray-600">
              Live data from Google Sheets Records{!isAdmin ? ` filtered for ${userFirmName}` : ' (All firms)'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Connected to Google Sheets</div>
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm">Live</span>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  )
}
