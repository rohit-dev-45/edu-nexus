import {
    AlertCircle,
    BookOpen,
    CalendarDays,
    Clock,
    GraduationCap,
    Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface StatsProps {
    role: string;
    data: any; // In real app, define a strict interface
}

export function DashboardStats({ role, data }: StatsProps) {
    // --- ADMIN VIEW ---
    if (role === "admin") {
        return (
            <>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Students
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.totalStudents || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +12% From Last Year
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Teachers
                        </CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.totalTeachers || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active Staff
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Avg Attendance
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.avgAttendance || "0%"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Today's Metrics
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Exams
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.activeExams || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Currently Ongoing
                        </p>
                    </CardContent>
                </Card>
            </>
        );
    }

    // --- TEACHER VIEW ---
    if (role === "teacher") {
        return (
            <>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            My Classes
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.myClassesCount || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Assigned Sections
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Grading
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.pendingGrading || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Submissions To Review
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Next Class
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold truncate">
                            {data.nextClass || "No Classes"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data.nextClassTime || "Enjoy Your Day!"}
                        </p>
                    </CardContent>
                </Card>
            </>
        );
    }

    // --- STUDENT VIEW ---
    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Attendance
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {data.myAttendance || "0%"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        This Semester
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Assignments
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {data.pendingAssignments || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Due This Week
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Next Exam
                    </CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold truncate">
                        {data.nextExam || "None"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {data.nextExamDate || "Keep Studying!"}
                    </p>
                </CardContent>
            </Card>
        </>
    );
}
