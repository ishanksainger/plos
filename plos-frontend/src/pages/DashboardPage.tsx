import { Container, Grid, Stack, Title } from "@mantine/core";
import ResponsibilityCard from "../components/dashboard/ResponsibilityCard";
import SummaryCard from "../components/dashboard/SummaryCard";
import useDashboard from "../hooks/useDashboard";

const DashboardPage = () => {
  const { data, loading, error } = useDashboard(2);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  return (
    <Container size="xl" py="md">
      <h1>Dashboard</h1>
      <h2>Summary</h2>
      <Grid>
        <Grid.Col span={2}>
          <SummaryCard title="Total" value={data?.summary.total ?? 0} />
        </Grid.Col>

        <Grid.Col span={2}>
          <SummaryCard title="Completed" value={data?.summary.completed ?? 0} />
        </Grid.Col>

        <Grid.Col span={2}>
          <SummaryCard title="Due" value={data?.summary.due ?? 0} />
        </Grid.Col>

        <Grid.Col span={2}>
          <SummaryCard title="Overdue" value={data?.summary.overdue ?? 0} />
        </Grid.Col>

        <Grid.Col span={2}>
          <SummaryCard title="Upcoming" value={data?.summary.upcoming ?? 0} />
        </Grid.Col>
      </Grid>
      <Grid mt="lg">
        <Grid.Col span={6}>
          <Title order={3}>Overdue</Title>

          <Stack mt="sm">
            {data?.overdue.map((item) => (
              <ResponsibilityCard
                key={item.id}
                title={item.title}
                category={item.category}
                dueDate={item.dueDate}
              />
            ))}
          </Stack>
        </Grid.Col>

        <Grid.Col span={6}>
          <Title order={3}>Due Today</Title>

          <Stack mt="sm">
            {data?.dueToday.map((item) => (
              <ResponsibilityCard
                key={item.id}
                title={item.title}
                category={item.category}
                dueDate={item.dueDate}
              />
            ))}
          </Stack>
        </Grid.Col>
      </Grid>

      <Title order={3} mt="lg">
        Upcoming
      </Title>

      <Stack mt="sm">
        {data?.upcoming.map((item) => (
          <ResponsibilityCard
            key={item.id}
            title={item.title}
            category={item.category}
            dueDate={item.dueDate}
          />
        ))}
      </Stack>
      <Title order={3} mt="lg">
        Recently Completed
      </Title>

      <Stack mt="sm">
        {data?.recentlyCompleted.map((item) => (
          <ResponsibilityCard
            key={item.id}
            title={item.title}
            category={item.category}
            dueDate={item.dueDate}
          />
        ))}
      </Stack>
    </Container>
  );
};

export default DashboardPage;
