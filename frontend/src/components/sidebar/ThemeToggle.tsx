import { useTheme } from "@/components/provider/theme";
import { SidebarMenuItem, useSidebar } from "../ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Laptop, Moon, Sun } from "lucide-react";

export const ThemeToggle = () => {
    const { setTheme, theme } = useTheme();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    return (
        <div
            className={cn(
                "gap-2",
                isCollapsed ? "flex-row space-y-2" : "flex justify-end",
            )}
        >
            <SidebarMenuItem title={"Choose Light Theme"}>
                <Button
                    size={"icon-sm"}
                    variant={theme === "light" ? "outline" : "ghost"}
                    onClick={() => setTheme("light")}
                >
                    <Sun />
                </Button>
            </SidebarMenuItem>
            <SidebarMenuItem title={"Choose Dark Theme"}>
                <Button
                    size={"icon-sm"}
                    variant={theme === "dark" ? "outline" : "ghost"}
                    onClick={() => setTheme("dark")}
                >
                    <Moon />
                </Button>
            </SidebarMenuItem>
            <SidebarMenuItem title={"Choose System Theme"}>
                <Button
                    size={"icon-sm"}
                    variant={theme === "system" ? "outline" : "ghost"}
                    onClick={() => setTheme("system")}
                >
                    <Laptop />
                </Button>
            </SidebarMenuItem>
        </div>
    );
};
