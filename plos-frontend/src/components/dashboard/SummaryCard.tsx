import { Card, Text } from "@mantine/core";

type SummaryCardProps = {
    title: string;
    value: number
}

const SummaryCard = ({title,value} : SummaryCardProps) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
       <Text size="sm" c="dimmed">
        {title}
       </Text>
       <Text size="xl" fw={700}>
        {value}
      </Text>
      </Card>
  )
}

export default SummaryCard
