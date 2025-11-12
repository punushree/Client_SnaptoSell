import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Badge,
  Group,
  Stack,
  Box,
  List,
  ThemeIcon,
  Paper,
  Avatar,
  SimpleGrid,
  Divider,
  rem,
} from "@mantine/core";
import {
  IconShield,
  IconCamera,
  IconCurrencyDollar,
  IconEye,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconTarget,
  IconStar,
} from "@tabler/icons-react";
import HeroSection from "~/components/HeroSection";
import type { FC } from "react";

const Page: FC = () => {
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
      <Box bg="gray.0" py="xl">
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

            <Paper p="lg" radius="md" bg="gray.0" withBorder mt="xl">
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

      {/* Features Section */}
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

      {/* How It Works Section */}
      <Box bg="gray.0" py="xl" id="how-it-works">
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

          <Paper p="xl" radius="md" withBorder shadow="sm" bg="green.0">
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

      {/* Scam Database Section */}
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

      {/* Testimonials Section */}
      <Box bg="gray.0" py="xl">
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

      {/* Final CTA Section */}
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
    </>
  );
}

export default Page
