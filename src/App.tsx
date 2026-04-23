import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import { DashboardPage } from './ui/pages/DashboardPage'
import { ReportInputPage } from './ui/pages/ReportInputPage'
import { TaskAssignmentPage } from './ui/pages/TaskAssignmentPage'
import { VolunteerTaskPage } from './ui/pages/VolunteerTaskPage'

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/report" element={<ReportInputPage />} />
        <Route path="/assignment/:reportId" element={<TaskAssignmentPage />} />
        <Route path="/volunteer/:assignmentId" element={<VolunteerTaskPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default App
