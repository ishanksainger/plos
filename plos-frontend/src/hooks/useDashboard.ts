import { useEffect, useState } from 'react'
import { getDashboard } from '../services/dashboard.service'
import type { DashboardData } from '../types/dashboard';

const useDashboard = (userId: number) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

  useEffect(()=>{
    async function loadDashboard(){
        try {
            const result =  await getDashboard(userId);
            setData(result)
        } catch {
            setError("Failed to load dashboard");
        }
        finally{
            setLoading(false);
        }
    }
    loadDashboard()
  },[userId])  

    return { data, loading, error };
}

export default useDashboard
