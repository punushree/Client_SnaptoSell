import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Stack,
  Box,
  List,
  ThemeIcon,
  Paper,
  Avatar,
  SimpleGrid,
  rem,
} from "@mantine/core";
import {
  IconShield,
  IconCurrencyDollar,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconTarget,
  IconStar,
} from "@tabler/icons-react";
import HeroSection from "@/components/HeroSection";
import type { FC } from "react";

const Page: FC = () => {

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Frequent Seller",
      text: "SnapToSell saved me from a $600 iPhone scam. The AI flagged the buyer's payment screenshot as fake before I shipped anything.",
      avatar: "SM",
    },
    {
      name: "Mike T.",
      role: "Collector",
      text: "I've been scammed twice on other platforms. SnapToSell's verification actually works - haven't had a single issue here.",
      avatar: "MT",
    },
    {
      name: "Jessica L.",
      role: "Small Business Owner",
      text: "The instant pricing feature alone is worth it. But knowing every buyer is verified gives me total peace of mind.",
      avatar: "JL",
    },
  ];

  const stats = [
    { number: "2,847", label: "Scams Blocked", icon: IconShield },
    { number: "$427K", label: "Money Saved", icon: IconCurrencyDollar },
    { number: "15K+", label: "Safe Transactions", icon: IconCheck },
    { number: "98%", label: "Scam Detection Rate", icon: IconTarget },
  ];

  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <Container size="lg" py="xl">
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Paper key={index} p="md" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <ThemeIcon size="xl" radius="md" variant="light">
                    <Icon style={{ width: rem(28), height: rem(28) }} />
                  </ThemeIcon>
                  <Text size="xl" fw={700}>
                    {stat.number}
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    {stat.label}
                  </Text>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      </Container>

      {/* The Problem Section */}
      <Box py="xl">
        <Container size="md" py="xl">
          <Paper p="xl" radius="lg" withBorder shadow="sm">
            <Group align="flex-start" mb="xl">
              <ThemeIcon size={48} radius="md" color="red" variant="light">
                <IconAlertTriangle style={{ width: rem(28), height: rem(28) }} />
              </ThemeIcon>
              <Stack gap="md" style={{ flex: 1 }}>
                <Title order={2}>The $600 iPhone That Never Arrived</Title>
                <Text size="lg">
                  You found the perfect deal on Facebook Marketplace. iPhone 15 Pro,
                  "like new," $600. The seller seemed legit - good profile, quick
                  responses. You sent the money. They said they shipped it. Then...
                  silence.
                </Text>
                <Text size="lg">
                  The tracking number was fake. The profile disappeared. Your $600?
                  Gone. And Facebook? They said it's "not their responsibility."
                </Text>
                <Text size="xl" fw={600}>
                  This happens 2,000+ times every single day on popular marketplaces.
                </Text>
              </Stack>
            </Group>

            <Paper p="lg" radius="md" withBorder mt="xl">
              <Title order={3} size="h4" mb="md">
                Other Platforms Don't Care
              </Title>
              <List
                spacing="sm"
                icon={
                  <ThemeIcon color="red" size={24} radius="xl">
                    <IconX style={{ width: rem(14), height: rem(14) }} />
                  </ThemeIcon>
                }
              >
                <List.Item>
                  <Text component="span" fw={500}>
                    Facebook Marketplace:
                  </Text>{" "}
                  No fraud protection, no buyer verification, no seller screening
                </List.Item>
                <List.Item>
                  <Text component="span" fw={500}>
                    OfferUp:
                  </Text>{" "}
                  10%+ listing fees, minimal scam prevention, slow dispute resolution
                </List.Item>
                <List.Item>
                  <Text component="span" fw={500}>
                    Craigslist:
                  </Text>{" "}
                  Zero protection, anonymous scammers, no recourse when things go
                  wrong
                </List.Item>
              </List>
            </Paper>
          </Paper>
        </Container>
      </Box>


      {/* Testimonials Section */}
      <Box py="xl">
        <Container size="lg" py="xl">
          <Stack align="center" mb={60}>
            <Title order={2} ta="center">
              Real People, Real Protection
            </Title>
            <Text size="xl" c="dimmed" ta="center" maw={700}>
              Join thousands who've stopped worrying about marketplace scams
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {testimonials.map((testimonial, index) => (
              <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
                <Group mb="md">
                  <Avatar size="lg" radius="xl">
                    {testimonial.avatar}
                  </Avatar>
                  <div>
                    <Text fw={600}>{testimonial.name}</Text>
                    <Text size="sm" c="dimmed">
                      {testimonial.role}
                    </Text>
                  </div>
                </Group>
                <Text fs="italic" mb="sm">
                  "{testimonial.text}"
                </Text>
                <Group gap={2}>
                  {[...Array(5)].map((_, i) => (
                    <IconStar
                      key={i}
                      size={16}
                      fill="var(--mantine-color-yellow-6)"
                      color="var(--mantine-color-yellow-6)"
                    />
                  ))}
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

    </>
  );
}

export default Page
