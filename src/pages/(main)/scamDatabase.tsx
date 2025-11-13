import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  SimpleGrid,
  ThemeIcon,
  Badge,
  Group,
  Divider,
  rem,
} from "@mantine/core";
import {
  IconShield,
} from "@tabler/icons-react";
import { Button } from "@mantine/core";
import type { FC } from "react";

const ScamDatabasePage: FC = () => {
  const scamExamples = [
    {
      title: "Fake Payment Confirmation",
      price: "$850",
      description:
        '"Send the item first, here\'s my payment screenshot" - Screenshot was photoshopped',
      blocked: "2,341 times",
      severity: "high",
    },
    {
      title: "Too Good To Be True Pricing",
      price: "$299",
      description:
        "iPhone 15 Pro Max listed at 75% below market value - Classic bait listing",
      blocked: "1,892 times",
      severity: "high",
    },
    {
      title: "Shipping Scam",
      price: "$1,200",
      description:
        '"Use this specific shipping company" - Fake tracking, item never existed',
      blocked: "1,547 times",
      severity: "high",
    },
    {
      title: "Overpayment Scam",
      price: "$650",
      description:
        '"I\'ll pay extra, just refund the difference" - Check bounces after you send money',
      blocked: "987 times",
      severity: "medium",
    },
    {
      title: "Identity Theft",
      price: "$0",
      description:
        '"Verify your account with this link" - Phishing site stealing login credentials',
      blocked: "3,421 times",
      severity: "high",
    },
    {
      title: "Bait and Switch",
      price: "$450",
      description:
        "Photos show authentic item, ships counterfeit - AI detected image theft",
      blocked: "1,203 times",
      severity: "medium",
    },
  ];

  return (
    <Container size="lg" py="xl" id="scam-database">
      <Stack align="center" mb={60}>
        <Title order={2} ta="center">
          Real Scams We've Blocked
        </Title>
        <Text size="xl" c="dimmed" ta="center" maw={700}>
          Our AI learns from every attempted scam to protect you better
        </Text>

        {/* Report Scam CTA */}
        <Card p="xl" radius="md" withBorder shadow="md" maw={500} w="100%" mt="xl">
          <Stack align="center" gap="md">
            <Title order={3} size="h3">
              Report a Scam
            </Title>
            <Text c="dimmed" ta="center">
              Help protect the community by reporting marketplace fraud.
            </Text>
            <Button
              size="lg"
              fullWidth
              component="a"
              href="https://tally.so/r/mJ5Rkz"
              target="_blank"
            >
              Report Now →
            </Button>
          </Stack>
        </Card>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {scamExamples.map((scam, index) => (
          <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Badge color={scam.severity === "high" ? "red" : "yellow"} size="lg">
                {scam.severity === "high" ? "High Risk" : "Medium Risk"}
              </Badge>
              <Text fw={700} size="lg">
                {scam.price}
              </Text>
            </Group>
            <Title order={4} size="h5" mb="xs">
              {scam.title}
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              {scam.description}
            </Text>
            <Divider my="sm" />
            <Group gap="xs">
              <ThemeIcon size="sm" color="green" variant="light" radius="xl">
                <IconShield style={{ width: rem(12), height: rem(12) }} />
              </ThemeIcon>
              <Text size="sm" c="green" fw={500}>
                Blocked {scam.blocked}
              </Text>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default ScamDatabasePage;

