import { ActionIcon, Group, Text, useMantineColorScheme } from '@mantine/core';
import { IconMenu2, IconMoonStars, IconSun } from '@tabler/icons-react';

const AppHeader = ({opened, setOpened} : {opened : boolean; setOpened: (v: boolean) => void}) => {
    const  {colorScheme, toggleColorScheme} = useMantineColorScheme()

    return (
        <Group h="100%" px="md" justify='space-between'>
            <Group>
                <ActionIcon variant='subtle' size="lg" onClick={()=> setOpened(!opened)}>
                    <IconMenu2 size={18} />
                </ActionIcon>
                <Text fw={700}>PLOS</Text>
            </Group>
            <ActionIcon variant='outline' size="lg" onClick={()=> toggleColorScheme()}>
                {colorScheme === "dark" ? (
                    <IconSun size={18} />) : (<IconMoonStars size={18}/>) 
                }
                </ActionIcon>
        </Group>
  )
}

export default AppHeader
