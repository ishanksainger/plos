import { Badge, Card, Group, Text } from "@mantine/core";

type ResponsibilityCardProps={

  title: string;
  category: string;
  dueDate: string;
}

const ResponsibilityCard = ({title, category, dueDate} : ResponsibilityCardProps) => {
    const formattedDate = new Date(dueDate).toLocaleDateString()

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={600}>{title}</Text>

      <Group justify="space-between" mt="sm">
        <Badge>{category}</Badge>
        <Text size="sm" c="dimmed">
          {formattedDate}
        </Text>
      </Group>
    </Card>
  );
};

export default ResponsibilityCard
