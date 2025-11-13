import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Paper,
  SimpleGrid,
  Group,
  Button,
  ThemeIcon,
  rem,
} from "@mantine/core";
import {
  IconShield,
} from "@tabler/icons-react";
import type { FC } from "react";

const WaitlistPage: FC = () => {
  return (
    <Container size="md" py="xl" id="waitlist">
      <Stack align="center" gap="xl">
        <Title order={2} ta="center">
          Ready to Sell Without Fear?
        </Title>
        <Text size="xl" c="dimmed" ta="center" maw={700}>
          Join the waitlist now. Be among the first to experience marketplace
          selling the way it should be: safe, simple, and scam-free.
        </Text>

        <Card p="xl" radius="md" withBorder shadow="lg" maw={600} w="100%">
          <SimpleGrid cols={2} spacing="md" mb="xl">
            <Paper p="lg" radius="md" bg="green.0" withBorder>
              <Text size="xl" fw={700} c="green">
                2,847
              </Text>
              <Text size="sm" c="green.9">
                Scams Blocked
              </Text>
            </Paper>
            <Paper p="lg" radius="md" bg="blue.0" withBorder>
              <Text size="xl" fw={700} c="blue">
                $427K
              </Text>
              <Text size="sm" c="blue.9">
                Money Saved
              </Text>
            </Paper>
          </SimpleGrid>

          <Stack align="center" gap="md">
            <Title order={3} size="h3" ta="center">
              Join the Waitlist
            </Title>
            <Text c="dimmed" ta="center">
              Get early access when we launch
            </Text>
            <Button
              size="xl"
              fullWidth
              component="a"
              href="https://tally.so/r/mJ5Rkz"
              target="_blank"
            >
              Join Now →
            </Button>
            <Text size="sm" c="dimmed" ta="center">
              2,847 people already signed up
            </Text>
          </Stack>
        </Card>

        <Group gap="xs" c="dimmed">
          <IconShield size={16} />
          <Text size="sm">
            Your information is protected. We'll never sell your data or spam you.
          </Text>
        </Group>
      </Stack>
    </Container>
  );
};

export default WaitlistPage;