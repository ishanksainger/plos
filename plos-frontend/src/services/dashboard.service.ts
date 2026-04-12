import type { DashboardData } from "../types/dashboard";

const API_BASE="http://localhost:3001";

export async function getDashboard(userId: number) : Promise<DashboardData>{
    const response= await fetch(`${API_BASE}/users/${userId}/dashboard`);

    if(!response.ok){
        throw new Error("Failed to fetch dashboard data");
    }

    const data: DashboardData = await response.json()
    return data
}