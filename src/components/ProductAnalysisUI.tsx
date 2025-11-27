import {
  Card,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Progress,
  Divider,
  SimpleGrid,
  Box,
  ScrollArea,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconSearch,
  IconScale,
  IconUpload,
  IconHeart,
  IconStar,
  IconArrowRight,
  IconFileTypeCsv,
  IconTrash,
  IconDownload,
} from "@tabler/icons-react";

interface ProductAnalysis {
  identified_product?: string;
  brand?: string;
  color_variants?: string;
  model?: string;
  model_variant?: string;
  storage?: string;
  ram?: string;
  processor?: string;
  gpu?: string;
  carrier?: string;
  connectivity?: string;
  condition_rating?: string | number;
  estimated_year?: string;
  size?: string;
  short_description?: string;
  distinctive_features?: string;
  possible_confusion?: string;
  clarity_feedback?: string;
  estimated_price?: string;
}

interface PricingData {
  average_price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  price_currency?: string;
  ebay_items_count?: number | null;
}

interface ProductAnalysisUIProps {
  analysis: ProductAnalysis;
  pricing?: PricingData;
  onSearchMarketplace?: () => void;
  onComparePrices?: () => void;
  onWrongItem?: () => void;
  onAnalyzeAnother?: () => void;
}

export default function ProductAnalysisUI({
  analysis,
  pricing,
  onSearchMarketplace,
  onComparePrices,
  onWrongItem,
  onAnalyzeAnother,
}: ProductAnalysisUIProps) {
  if (!analysis) {
    return (
      <Card shadow="md" radius="md" p="lg">
        <Text size="sm" c="dimmed">No analysis data available</Text>
      </Card>
    );
  }

  const productName = analysis.identified_product || "Unknown Product";
  const confidenceScore = 50; // Could be calculated based on analysis completeness
  
  // Parse estimated_price from AI (e.g., "$400-$500" or "$250")
  const parsePrice = (priceStr?: string): { min: number; max: number; avg: number } => {
    if (!priceStr) return { min: 0, max: 0, avg: 0 };
    
    // Remove currency symbols and spaces
    const cleaned = priceStr.replace(/[$,\s]/g, '');
    
    // Check if it's a range (e.g., "400-500")
    if (cleaned.includes('-')) {
      const [minStr, maxStr] = cleaned.split('-');
      const min = parseFloat(minStr) || 0;
      const max = parseFloat(maxStr) || 0;
      return { min, max, avg: (min + max) / 2 };
    }
    
    // Single price value
    const price = parseFloat(cleaned) || 0;
    return { min: price, max: price, avg: price };
  };
  
  const priceData = parsePrice(analysis.estimated_price);
  const currentPrice = priceData.avg;
  const originalPrice = currentPrice > 0 ? currentPrice * 1.5 : 300; // Estimate original retail as 1.5x current
  const priceDifference = originalPrice > 0
    ? (100 - (currentPrice / originalPrice) * 100).toFixed(0)
    : 50;

  const formatPrice = (price: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(price);
  };

  const trustScore = 50; // Could be calculated based on various factors
  const trustLabel = trustScore >= 70 ? "Low Risk" : trustScore >= 40 ? "Medium Risk" : "High Risk";
  const trustColor = trustScore >= 70 ? "green" : trustScore >= 40 ? "yellow" : "red";

  const ebayFee = currentPrice * 0.1; // 10% fee
  const ebayEarnings = currentPrice - ebayFee;

  return (
    <Stack gap="lg">
      {/* PRODUCT SUMMARY CARD */}
      <Card shadow="md" radius="md" p="lg">
        <Group justify="space-between">
          <Text size="xl" fw={700}>{productName}</Text>
          <Badge color="green" size="lg">High Confidence</Badge>
        </Group>

        <Text mt="sm" c="dimmed" size="sm">
          {analysis.short_description ||
            `This ${productName} features modern specifications and is in good condition.`}
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} mt="lg" mb="md" spacing="lg">
          <div>
            <Text size="sm" fw={600}>Original Retail Price</Text>
            <Text size="xl" fw={700}>
              {formatPrice(originalPrice, pricing?.price_currency)}
            </Text>

            <Text mt="lg" size="sm" fw={600}>AI Estimated Market Value</Text>
            <Text size="xl" fw={700} c="green">
              {analysis.estimated_price || "Price not available"}
            </Text>
            {currentPrice > 0 && (
              <Text size="xs" c="red">{priceDifference}% below retail</Text>
            )}
          </div>

          <div>
            <Text size="sm" fw={600}>Confidence Score</Text>
            <Progress value={confidenceScore} color="green" size="lg" radius="md" mt="sm" />
            <Text size="sm" mt="xs">{confidenceScore}%</Text>

            <Group mt="lg" gap="xs">
              <Button
                variant="outline"
                leftSection={<IconSearch size={16} />}
                fullWidth
                onClick={onSearchMarketplace}
              >
                Search on Marketplace
              </Button>
              <Button
                variant="outline"
                leftSection={<IconScale size={16} />}
                fullWidth
                onClick={onComparePrices}
              >
                Compare Prices
              </Button>
            </Group>

            <Button
              fullWidth
              color="red"
              mt="sm"
              leftSection={<IconAlertTriangle size={16} />}
              onClick={onWrongItem}
            >
              Wrong Item?
            </Button>
          </div>
        </SimpleGrid>

        <Divider my="md" />

        <Group justify="space-between">
          <div>
            <Text size="sm" fw={600}>Category</Text>
            <Text size="sm">Electronics</Text>
          </div>
          <div>
            <Text size="sm" fw={600}>Data Source</Text>
            <Text size="sm">AI Analysis</Text>
          </div>
        </Group>

        {onAnalyzeAnother && (
          <Button fullWidth mt="lg" size="md" color="orange" onClick={onAnalyzeAnother}>
            Analyze Another Product
          </Button>
        )}
      </Card>

      {/* TRUST SCORE */}
      <Card shadow="sm" radius="md" p="lg">
        <Group justify="space-between">
          <div>
            <Text size="lg" fw={700}>Trust Score</Text>
            <Text size="xl" fw={700} c={trustColor}>{trustScore}/100</Text>
          </div>
          <Badge color={trustColor} size="lg">{trustLabel}</Badge>
        </Group>
      </Card>

      {/* SELL YOUR PRODUCT */}
      <Card radius="md" shadow="md" p="lg">
        <Group justify="space-between">
          <Text size="lg" fw={700}>Sell Your Product</Text>
          <Button variant="subtle" leftSection={<IconUpload size={16} />}>
            Download Photo
          </Button>
        </Group>

        <Text size="sm" mt="sm" c="dimmed">
          Select one or more platforms to list your <b>{productName}</b>
        </Text>

        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3 }}
          mt="lg"
          spacing="lg"
        >
          {/* SnapToSell */}
          <Card shadow="sm" radius="md" p="md" withBorder>
            <Text fw={700} size="md">SnapToSell Only</Text>
            <Text size="sm" mt="xs" c="dimmed">Audience: SnapToSell users</Text>

            <Divider my="md" />
            <Text size="sm">Sale Price: <b>{analysis.estimated_price || "N/A"}</b></Text>
            <Text size="sm">Platform Fee: <b>$0</b></Text>

            <Text fw={600} mt="md">Your Earnings: {analysis.estimated_price || "N/A"}</Text>
          </Card>

          {/* Facebook Marketplace */}
          <Card shadow="sm" radius="md" p="md" withBorder>
            <Text fw={700} size="md">Facebook Marketplace</Text>
            <Text size="sm" mt="xs" c="dimmed">Audience: Local</Text>

            <Divider my="md" />
            <Text size="sm">Sale Price: <b>{analysis.estimated_price || "N/A"}</b></Text>
            <Text size="sm">Platform Fee: <b>$0</b></Text>

            <Text fw={600} mt="md">Your Earnings: {analysis.estimated_price || "N/A"}</Text>
          </Card>

          {/* eBay */}
          <Card shadow="sm" radius="md" p="md" withBorder>
            <Text fw={700} size="md">eBay</Text>
            <Text size="sm" mt="xs" c="dimmed">Audience: Global</Text>

            <Divider my="md" />
            <Text size="sm">Sale Price: <b>{analysis.estimated_price || "N/A"}</b></Text>
            <Text size="sm">Platform Fee: <b>{currentPrice > 0 ? formatPrice(currentPrice * 0.1) : "N/A"}</b></Text>

            <Text fw={600} mt="md">Your Earnings: {currentPrice > 0 ? formatPrice(currentPrice * 0.9) : "N/A"}</Text>
          </Card>
        </SimpleGrid>
      </Card>

      {/*  DONATE TO CHARITY SECTION */}

      <Card shadow="md" radius="md" p="lg">
        <Group>
          <IconHeart size={20} color="red" />
          <Text size="xl" fw={700}>Donate to Charity</Text>
        </Group>

        <Text size="sm" mt="xs" c="dimmed">
          Consider donating your <b>{productName}</b> to help others in need.
        </Text>

        <Text size="sm" mt="md">We found 2 charities that accept electronics:</Text>

        <Stack gap="lg" mt="lg">

          {/* CHARITY 1 */}
          <Card withBorder radius="md" p="md" shadow="sm">
            <Group justify="space-between">
              <Group>
                <Text fw={700} size="md">Goodwill Industries</Text>
                <Group gap={2}>
                  <IconStar size={16} color="#FFD700" />
                  <IconStar size={16} color="#FFD700" />
                  <IconStar size={16} color="#FFD700" />
                  <IconStar size={16} color="#FFD700" />
                  <IconStar size={16} color="#FFD70090" />
                  <Text size="sm">(4.5)</Text>
                </Group>
              </Group>

              <Button color="red" leftSection={<IconHeart size={16} />}>
                Donate
              </Button>
            </Group>

            <Text size="sm" mt="xs" c="dimmed">
              Providing job training and employment opportunities through donations.
            </Text>

            <Group gap="xs" mt="sm">
              <Badge color="gray">Job Training</Badge>
              <Badge color="gray">Electronics</Badge>
              <Badge color="gray">Clothing</Badge>
              <Badge color="gray">Household Items</Badge>
            </Group>

            <Divider my="md" />

            <Group gap="xs">
              <Badge radius="sm">📍 Nationwide</Badge>
              <Badge radius="sm">📞 1-800-GOODWILL</Badge>
            </Group>

            <Button variant="subtle" mt="sm" rightSection={<IconArrowRight size={16} />}>
              Learn More
            </Button>
          </Card>

          {/* CHARITY 2 */}
          <Card withBorder radius="md" p="md" shadow="sm">
            <Group justify="space-between">
              <Group>
                <Text fw={700} size="md">Salvation Army</Text>
                <Group gap={2}>
                  <IconStar size={16} color="#FFD700" />
                  <IconStar size={16} color="#FFD700" />
                  <IconStar size={16} color="#FFD700" />
                  <IconStar size={16} color="#FFD700" />
                  <IconStar size={16} color="#FFD70080" />
                  <Text size="sm">(4.3)</Text>
                </Group>
              </Group>

              <Button color="red" leftSection={<IconHeart size={16} />}>
                Donate
              </Button>
            </Group>

            <Text size="sm" mt="xs" c="dimmed">
              Supporting families in need through community programs.
            </Text>

            <Group gap="xs" mt="sm">
              <Badge color="gray">Family Support</Badge>
              <Badge color="gray">Electronics</Badge>
              <Badge color="gray">Furniture</Badge>
              <Badge color="gray">Clothing</Badge>
            </Group>

            <Divider my="md" />

            <Group gap="xs">
              <Badge radius="sm">📍 Local Pickup Available</Badge>
              <Badge radius="sm">📞 1-800-SAL-ARMY</Badge>
            </Group>

            <Button variant="subtle" mt="sm" rightSection={<IconArrowRight size={16} />}>
              Learn More
            </Button>
          </Card>
        </Stack>

        <Text mt="md" size="xs" c="dimmed">
          Estimated tax deduction value: <b>$50</b>
        </Text>
      </Card>

     
      {/*  PRODUCT INVENTORY SECTION */}

      <Card shadow="md" radius="md" p="lg">
        <Group justify="space-between">
          <Group>
            <Text size="xl" fw={700}>Product Inventory</Text>
          </Group>

          <Group gap="xs">
            <Button variant="outline" leftSection={<IconFileTypeCsv size={16} />}>
              Export CSV
            </Button>
            <Button variant="outline" color="gray">
              Clear All
            </Button>
          </Group>
        </Group>

        <Text c="dimmed" size="sm" mt={5}>
          8 items • Total value: <b>$960</b>
        </Text>

        {/* INVENTORY LIST */}
        <ScrollArea h={300} mt="md">
          <Stack gap="sm">

            {/* ITEM ROW */}
            {[
              { name: "Tablet Device", value: "$150", confidence: 85, date: "Nov 26, 2025" },
              { name: "Slim Tablet Device", value: "$50", confidence: 30, date: "Nov 19, 2025" },
              { name: "Samsung Galaxy S23 FE", value: "$400", confidence: 80, date: "Nov 18, 2025" },
              { name: "Smartphone Dual Camera", value: "$150", confidence: 80, date: "Nov 12, 2025" },
              { name: "Webcam Adjustable", value: "$30", confidence: 80, date: "Nov 11, 2025" },
            ].map((item, index) => (
              <Card
                key={index}
                withBorder
                radius="md"
                p="sm"
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <div>
                  <Text fw={600}>{item.name}</Text>
                  <Group gap={5}>
                    <Badge color="gray" size="xs">
                      {item.confidence}% confidence
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">Electronics • Added {item.date}</Text>
                </div>

                <div style={{ textAlign: "right" }}>
                  <Text fw={700} size="lg" color="green">{item.value}</Text>
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    mt="xs"
                    leftSection={<IconTrash size={14} />}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}

          </Stack>
        </ScrollArea>

        <Button
          fullWidth
          mt="lg"
          size="md"
          color="orange"
          leftSection={<IconDownload size={18} />}
        >
          Download Inventory
        </Button>
      </Card>


    </Stack>
  );
}
