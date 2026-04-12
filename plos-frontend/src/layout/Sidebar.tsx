import { NavLink, Stack } from '@mantine/core'
import { IconChartBar, IconChecklist, IconLayoutDashboard, IconSettings, IconTimeline } from '@tabler/icons-react'


const AppSidebar = () => {
  return (
    <Stack p="md">
        <NavLink label="Dashboard" leftSection = {<IconLayoutDashboard size={18}/>}/>
        <NavLink label="Responsibilities" leftSection = {<IconChecklist size={18}/>}/>
        <NavLink label="Timeline" leftSection = {<IconTimeline size={18}/>}/>
        <NavLink label="Insights" leftSection = {<IconChartBar size={18}/>}/>
        <NavLink label="Settings" leftSection = {<IconSettings size={18}/>}/>
    </Stack>
  )
}

export default AppSidebar
