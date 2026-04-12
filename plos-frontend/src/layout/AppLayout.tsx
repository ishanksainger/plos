import { AppShell } from '@mantine/core'
import { useState } from 'react'
import AppHeader from './Header'
import AppSidebar from './Sidebar'

const AppLayout = ({children} : {children : React.ReactNode}) => {

  const [opened,setOpened] = useState(true)

  return (
    <AppShell
    header={{height: 60}}
    navbar={{
        width:220,
        breakpoint: "sm",
        collapsed: {desktop : !opened},
    }}
    padding= "md" >
    
    <AppShell.Header>
        <AppHeader opened= {opened} setOpened={setOpened}/>
    </AppShell.Header>
    <AppShell.Navbar>
        <AppSidebar/>
    </AppShell.Navbar> 
    <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}

export default AppLayout
