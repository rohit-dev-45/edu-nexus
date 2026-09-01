import { createBrowserRouter, RouterProvider } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { PrivateRoutes } from "./components/PrivateRoutes";
import Dashboard from "./pages/Dashboard";
import AcademicYear from "./pages/settings/academic-year";
import UserManagementPage from "./pages/users";
import Classes from "./pages/academics/Classes";
import { Subjects } from "./pages/academics/Subjects";
import Timetable from "./pages/academics/Timetable";
import Exams from "./pages/lms/Exams";
import Exam from "./pages/lms/Exam";

const router = createBrowserRouter([
    {
        children: [
            // Public routes
            {
                index: true,
                element: <Home />,
            },
            {
                path: "login",
                element: <Login />,
            },

            // Protected routes
            {
                element: <PrivateRoutes />,
                children: [
                    {
                        path: "dashboard",
                        element: <Dashboard />,
                    },
                    {
                        path: "activities-log",
                        element: <Dashboard />,
                    },
                    {
                        path: "settings/academic-years",
                        element: <AcademicYear />,
                    },
                    {
                        path: "users/students",
                        element: (
                            <UserManagementPage
                                role="student"
                                title="Students"
                                description="Manage student directory and class assignments."
                            />
                        ),
                    },
                    {
                        path: "users/teachers",
                        element: (
                            <UserManagementPage
                                role="teacher"
                                title="Teachers"
                                description="Manage teaching staff."
                            />
                        ),
                    },
                    {
                        path: "users/parents",
                        element: (
                            <UserManagementPage
                                role="parent"
                                title="Parents"
                                description="Manage Parents."
                            />
                        ),
                    },
                    {
                        path: "users/admins",
                        element: (
                            <UserManagementPage
                                role="admin"
                                title="Admins"
                                description="Manage Admins."
                            />
                        ),
                    },
                    {
                        path: "classes",
                        element: <Classes />,
                    },
                    {
                        path: "subjects",
                        element: <Subjects />,
                    },
                    {
                        path: "timetable",
                        element: <Timetable />,
                    },
                    {
                        path: "lms/exams",
                        element: <Exams />,
                    },
                    {
                        path: "lms/exams/:id",
                        element: <Exam />,
                    },
                ],
            },
        ],
    },
]);

const App = () => {
    return <RouterProvider router={router} />;
};

export default App;
