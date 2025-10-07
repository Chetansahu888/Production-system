"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Dashboard from "@/components/dashboard"
import DataEntry from "@/components/data-entry"
import ViewRecords from "@/components/view-records"

export default function Home() {
  const [currentPage, setCurrentPage] = useState("dashboard")

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "entry" && <DataEntry />}
        {currentPage === "records" && <ViewRecords />}
      </main>
    </div>
  )
}
