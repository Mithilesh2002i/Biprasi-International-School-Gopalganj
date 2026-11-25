import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole, StaffLayout, StudentLayout, ParentLayout } from './components/Layouts';
import { Empty } from './components/Common';
import { useAuth } from './context/AuthContext';

import Landing from './pages/Public/Landing';
import Login, { AdminLogin } from './pages/Public/Login';
import StudentHome from './pages/student/StudentHome';
import ParentHome from './pages/parent/ParentHome';
import DailyReport from './pages/parent/DailyReport';
import SubjectReport from './pages/parent/SubjectReport';
import ProgressReport from './pages/parent/ProgressReport';
import PtmView from './pages/parent/PtmView';
import TeacherHome from './pages/teacher/TeacherHome';
import { ClassesPage, ClassPage, SubjectPage, BookPage, LearnPage } from './pages/shared/Browse';
import DoubtsPage from './pages/shared/Doubts';
import { StudentTests, TestRunner, TestsManage } from './pages/shared/Tests';
import { NoticesView, ExamsView, ResultsView, CollegeView, NotesView, LivePage, SupportPage, ProfilePage } from './pages/shared/Misc';
import { NoticesManage, ExamsManage, ResultsManage, MarksheetsManage, CollegeManage, NotesManage, PtmManage } from './pages/shared/Records';
import DiaryManage from './pages/shared/Diary';
import Dashboard from './pages/admin/Dashboard';
import Activity, { UserActivity } from './pages/admin/Activity';
import { StudentsAdmin, TeachersAdmin } from './pages/admin/People';
import { CourseManager, BookManager } from './pages/admin/Courses';
import { LiveAdmin, SupportAdmin, SettingsAdmin } from './pages/admin/Controls';

// Teacher ke liye permission guard (Admin > Teachers mein on/off hota hai)
function Perm({ k, children }) {
  const { user } = useAuth();
  if (user?.perms?.[k]) return children;
  return <Empty icon="lock" title="Ye feature aapke liye band hai" text="School admin se ise on karwane ko kahein." />;
}

// Content browse routes (student, teacher aur admin preview teeno mein same)
const browse = (
  <>
    <Route path="classes" element={<ClassesPage />} />
    <Route path="class/:classNo" element={<ClassPage />} />
    <Route path="class/:classNo/:subjectId" element={<SubjectPage />} />
    <Route path="book/:bookId" element={<BookPage />} />
    <Route path="learn/:chapterId" element={<LearnPage />} />
  </>
);

function TeacherShell() {
  const { user } = useAuth();
  const p = user.perms || {};
  const groups = [
    { items: [['/teacher', 'Dashboard', 'home', true], ['/teacher/classes', 'Class content', 'layers']] },
    { title: 'Teaching', items: [p.diary && ['/teacher/diary', 'Class diary', 'book'], p.tests && ['/teacher/tests', 'Tests', 'test'], p.doubts && ['/teacher/doubts', 'Doubts', 'doubt'], p.notes && ['/teacher/notes', 'Notes & PDFs', 'file']].filter(Boolean) },
    { title: 'School work', items: [p.notices && ['/teacher/notices', 'Notices', 'bell'], p.ptm && ['/teacher/ptm', 'PTM', 'users'], p.exams && ['/teacher/exams', 'Exam details', 'calendar'], p.results && ['/teacher/results', 'Results', 'award'], p.marksheets && ['/teacher/marksheets', 'Marksheets', 'upload'], p.college && ['/teacher/college', 'College courses', 'grad']].filter(Boolean) },
    { items: [['/teacher/live', 'Live class', 'live'], ['/teacher/support', 'Support', 'support'], ['/teacher/profile', 'My profile', 'user']] },
  ].filter((g) => g.items.length);
  return <StaffLayout theme="teacher" groups={groups} subtitle="Teacher panel" />;
}

const adminGroups = [
  { items: [['/admin', 'Overview', 'home', true], ['/admin/activity', 'Activity', 'chart']] },
  { title: 'People', items: [['/admin/students', 'Students', 'users'], ['/admin/teachers', 'Teachers', 'user']] },
  { title: 'Content', items: [['/admin/courses', 'Courses', 'layers'], ['/admin/tests', 'Tests', 'test'], ['/admin/notes', 'Notes & PDFs', 'file'], ['/admin/diary', 'Class diary', 'book'], ['/admin/classes', 'Preview classes', 'eye']] },
  { title: 'School', items: [['/admin/notices', 'Notices', 'bell'], ['/admin/ptm', 'PTM meetings', 'users'], ['/admin/exams', 'Exam details', 'calendar'], ['/admin/results', 'Results', 'award'], ['/admin/marksheets', 'Marksheets', 'upload'], ['/admin/college', 'College courses', 'grad']] },
  { title: 'Inbox', items: [['/admin/doubts', 'Doubts', 'doubt'], ['/admin/support', 'Support', 'support']] },
  { title: 'Controls', items: [['/admin/live', 'Live class', 'live'], ['/admin/settings', 'Settings', 'settings']] },
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/student/login" element={<Login role="student" />} />
      <Route path="/parent/login" element={<Login role="parent" />} />
      <Route path="/teacher/login" element={<Login role="teacher" />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ---------------- STUDENT ---------------- */}
      <Route path="/student" element={<RequireRole role="student"><StudentLayout /></RequireRole>}>
        <Route index element={<StudentHome />} />
        {browse}
        <Route path="tests" element={<StudentTests />} />
        <Route path="tests/:testId" element={<TestRunner />} />
        <Route path="doubts" element={<DoubtsPage />} />
        <Route path="notices" element={<NoticesView />} />
        <Route path="exams" element={<ExamsView />} />
        <Route path="results" element={<ResultsView />} />
        <Route path="notes" element={<NotesView />} />
        <Route path="college" element={<CollegeView />} />
        <Route path="live" element={<LivePage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ---------------- PARENT (sirf bachche ki progress dekhne ke liye) ---------------- */}
      <Route path="/parent" element={<RequireRole role="parent"><ParentLayout /></RequireRole>}>
        <Route index element={<ParentHome />} />
        <Route path="daily" element={<DailyReport />} />
        <Route path="subjects" element={<SubjectReport />} />
        <Route path="progress" element={<ProgressReport />} />
        <Route path="ptm" element={<PtmView />} />
        <Route path="results" element={<ResultsView />} />
        <Route path="exams" element={<ExamsView />} />
        <Route path="notices" element={<NoticesView />} />
        <Route path="live" element={<LivePage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ---------------- TEACHER ---------------- */}
      <Route path="/teacher" element={<RequireRole role="teacher"><TeacherShell /></RequireRole>}>
        <Route index element={<TeacherHome />} />
        {browse}
        <Route path="diary" element={<Perm k="diary"><DiaryManage /></Perm>} />
        <Route path="ptm" element={<Perm k="ptm"><PtmManage /></Perm>} />
        <Route path="tests" element={<Perm k="tests"><TestsManage /></Perm>} />
        <Route path="doubts" element={<Perm k="doubts"><DoubtsPage /></Perm>} />
        <Route path="notes" element={<Perm k="notes"><NotesManage /></Perm>} />
        <Route path="notices" element={<Perm k="notices"><NoticesManage /></Perm>} />
        <Route path="exams" element={<Perm k="exams"><ExamsManage /></Perm>} />
        <Route path="results" element={<Perm k="results"><ResultsManage /></Perm>} />
        <Route path="marksheets" element={<Perm k="marksheets"><MarksheetsManage /></Perm>} />
        <Route path="college" element={<Perm k="college"><CollegeManage /></Perm>} />
        <Route path="live" element={<LivePage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* ---------------- ADMIN (backend panel) ---------------- */}
      <Route path="/admin" element={<RequireRole role="admin"><StaffLayout theme="admin" groups={adminGroups} subtitle="Admin panel" /></RequireRole>}>
        <Route index element={<Dashboard />} />
        <Route path="activity" element={<Activity />} />
        <Route path="activity/:uid" element={<UserActivity />} />
        <Route path="students" element={<StudentsAdmin />} />
        <Route path="teachers" element={<TeachersAdmin />} />
        <Route path="courses" element={<CourseManager />} />
        <Route path="courses/:bookId" element={<BookManager />} />
        {browse}
        <Route path="tests" element={<TestsManage />} />
        <Route path="diary" element={<DiaryManage />} />
        <Route path="ptm" element={<PtmManage />} />
        <Route path="notes" element={<NotesManage />} />
        <Route path="notices" element={<NoticesManage />} />
        <Route path="exams" element={<ExamsManage />} />
        <Route path="results" element={<ResultsManage />} />
        <Route path="marksheets" element={<MarksheetsManage />} />
        <Route path="college" element={<CollegeManage />} />
        <Route path="doubts" element={<DoubtsPage />} />
        <Route path="support" element={<SupportAdmin />} />
        <Route path="live" element={<LiveAdmin />} />
        <Route path="settings" element={<SettingsAdmin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}