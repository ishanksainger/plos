export type Responsibility={
    id: number;
    title: string;
    category: string;
    dueDate: string;
    completedAt: string | null
}

export type DashboardData = {
    summary:{
        total: number;
        completed:number;
        due: number;
        overdue:number;
        upcoming:number;
    };
    overdue: Responsibility[];
    dueToday: Responsibility[];
    upcoming: Responsibility[];
    recentlyCompleted: Responsibility[]
}