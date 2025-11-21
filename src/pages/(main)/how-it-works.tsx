import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  SimpleGrid,
  ThemeIcon,
  Paper,
  Group,
  Box,
  rem,
} from "@mantine/core";
import {
  IconShield,
  IconEye,
  IconCheck,
} from "@tabler/icons-react";
import type { FC } from "react";

const HowItWorksPage: FC = () => {
  const howItWorks = [
    {
      step: "1",
      icon: IconShield,
      title: "AI Verification",
      description:
        "Every listing runs through our proprietary scam detection algorithm checking 50+ fraud indicators.",
      color: "blue",
    },
    {
      step: "2",
      icon: IconEye,
      title: "Community Reporting",
      description:
        "Real users report suspicious activity, building the world's largest marketplace fraud database.",
      color: "orange",
    },
    {
      step: "3",
      icon: IconCheck,
      title: "Manual Review",
      description:
        "High-risk listings get reviewed by our safety team before being approved for the platform.",
      color: "green",
    },
  ];

  return (
    <Box py="xl" id="how-it-works">
      <Container size="lg" py="xl">
        <Stack align="center" mb={60}>
          <Title order={2} ta="center">
            Our 3-Layer Scam Shield
          </Title>
          <Text size="xl" c="dimmed" ta="center" maw={700}>
            Every listing goes through three levels of protection before it reaches
            you
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
          {howItWorks.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                shadow="sm"
                padding="xl"
                radius="md"
                withBorder
                style={{ textAlign: "center" }}
              >
                <ThemeIcon
                  size={80}
                  radius="xl"
                  variant="light"
                  color={item.color}
                  mb="md"
                  mx="auto"
                >
                  <Text size={rem(32)} fw={700}>
                    {item.step}
                  </Text>
                </ThemeIcon>
                <ThemeIcon
                  size={48}
                  radius="md"
                  variant="light"
                  color={item.color}
                  mb="md"
                  mx="auto"
                >
                  <Icon style={{ width: rem(24), height: rem(24) }} />
                </ThemeIcon>
                <Title order={3} size="h4" mb="xs">
                  {item.title}
                </Title>
                <Text size="sm" c="dimmed">
                  {item.description}
                </Text>
              </Card>
            );
          })}
        </SimpleGrid>

        <Paper p="xl" radius="md" withBorder shadow="sm">
          <Group align="flex-start">
            <ThemeIcon size={48} radius="md" color="green" variant="light">
              <IconCheck style={{ width: rem(28), height: rem(28) }} />
            </ThemeIcon>
            <Stack gap="xs" style={{ flex: 1 }}>
              <Title order={3} size="h3">
                100% Scam-Free Guarantee
              </Title>
              <Text size="lg">
                If you get scammed on SnapToSell, we'll refund your money. Period.
                Unlike other platforms, we actually protect our users.
              </Text>
            </Stack>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
};

export default HowItWorksPage;

