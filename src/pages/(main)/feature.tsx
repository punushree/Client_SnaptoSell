import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  SimpleGrid,
  ThemeIcon,
  rem,
} from "@mantine/core";
import {
  IconShield,
  IconCamera,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import type { FC } from "react";

const FeaturesPage: FC = () => {
  const features = [
    {
      icon: IconShield,
      title: "AI-Powered Scam Detection",
      description:
        "Our advanced AI analyzes listings in real-time, flagging suspicious patterns before you ever see them.",
      color: "blue",
    },
    {
      icon: IconCamera,
      title: "Instant Item Identification",
      description:
        "Snap a photo and our AI identifies your item, suggests pricing, and creates your listing in seconds.",
      color: "orange",
    },
    {
      icon: IconCurrencyDollar,
      title: "Best Platform Recommendations",
      description:
        "Get data-driven suggestions for which marketplace will sell your item fastest at the best price.",
      color: "green",
    },
  ];

  return (
    <Container size="lg" py="xl" id="features">
      <Stack align="center" mb={60}>
        <Title order={2} ta="center">
          Three Revolutionary Features
        </Title>
        <Text size="xl" c="dimmed" ta="center" maw={700}>
          We're not just another marketplace. We're the anti-scam marketplace.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section inheritPadding py="xs">
                <ThemeIcon
                  size={60}
                  radius="md"
                  variant="light"
                  color={feature.color}
                >
                  <Icon style={{ width: rem(32), height: rem(32) }} />
                </ThemeIcon>
              </Card.Section>

              <Title order={3} size="h4" mt="md" mb="xs">
                {feature.title}
              </Title>

              <Text size="sm" c="dimmed">
                {feature.description}
              </Text>
            </Card>
          );
        })}
      </SimpleGrid>
    </Container>
  );
};

export default FeaturesPage;

