import { useState, useEffect } from "react";
import {
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Loader,
  Alert,
  Card,
  Grid,
  Divider,
  Box,
  Badge,
} from "@mantine/core";
import {
  IconCurrencyDollar,
  IconAlertCircle,
  IconCheck,
  IconShoppingCart,
} from "@tabler/icons-react";

interface MarketplaceData {
  lowest: string;
  highest: string;
  average: string;
  sample_size: number;
}

interface PricingData {
  poshmark_market?: MarketplaceData;
  depop_market?: MarketplaceData;
  ebay_fashion_market?: MarketplaceData;
  thredup_market?: MarketplaceData;
  mercari_market?: MarketplaceData;
  facebook_market?: MarketplaceData;
  ebay_market?: MarketplaceData;
  SnaptoSell_suggestion?: {
    typical_resale_price: string;
    price_range: string;
    confidence: string;
    pricing_notes: string;
  };
  overall_recommendation?: string;
}

interface AIMarketplacePricingProps {
  uuid: string;
  category: string;
  onPricingComplete?: (data: PricingData) => void;
}

const AIMarketplacePricing = ({ uuid, category, onPricingComplete }: AIMarketplacePricingProps) => {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePrice = async () => {
    if (!uuid) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pricing/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uuid }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze pricing");
      }

      if (result.success) {
        setPricingData(result.data.pricing);
        if (onPricingComplete) {
          onPricingComplete(result.data.pricing);
        }
      } else {
        throw new Error(result.error || "Failed to analyze pricing");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error analyzing pricing:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-trigger pricing analysis on mount
  useEffect(() => {
    if (uuid && !pricingData && !isLoading) {
      analyzePrice();
    }
  }, [uuid]);

  const getMarketplaceName = (key: string): string => {
    const names: Record<string, string> = {
      poshmark_market: "Poshmark",
      depop_market: "Depop",
      ebay_fashion_market: "eBay Fashion",
      thredup_market: "ThredUp",
      mercari_market: "Mercari",
      facebook_market: "Facebook Marketplace",
      ebay_market: "eBay",
      craigslist_market: "Craigslist",
    };
    return names[key] || key;
  };

  const getMarketplaceIcon = (key: string): string => {
    const icons: Record<string, string> = {
      poshmark_market: "👗",
      depop_market: "🛍️",
      ebay_fashion_market: "🏷️",
      thredup_market: "♻️",
      mercari_market: "📦",
      facebook_market: "👥",
      ebay_market: "🛒",
      craigslist_market: "🛋️",
    };
    return icons[key] || "🏪";
  };

  if (isLoading) {
    return (
      <Paper shadow="sm" p="xl" withBorder>
        <Stack align="center" gap="md" py="xl">
          <Loader size="lg" />
          <Stack gap="xs" align="center">
            <Text fw={500}>Analyzing Market Prices...</Text>
            <Text size="sm" c="dimmed">
              🔍 Searching multiple resale marketplaces for pricing data...
            </Text>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle />} color="red" title="Pricing Analysis Error">
        <Text size="sm">{error}</Text>
        <Button onClick={analyzePrice} mt="md" size="xs" variant="light">
          Retry Analysis
        </Button>
      </Alert>
    );
  }

  if (!pricingData) {
    return (
      <Paper shadow="sm" p="md" withBorder>
        <Stack gap="md">
          <Text>Click below to analyze marketplace pricing using AI</Text>
          <Button onClick={analyzePrice} leftSection={<IconCurrencyDollar />}>
            Analyze Market Price
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* Fashion Market Pricing Header */}
      <Paper shadow="sm" p="md" withBorder>
        <Group gap="xs" mb="sm">
          <IconShoppingCart size={24} />
          <Title order={4}>
            {category === 'fashion' ? 'Fashion Market Pricing Analysis' : 'Market Pricing Analysis'}
          </Title>
        </Group>

        {/* Market Analysis Summary */}
        {pricingData.overall_recommendation && (
          <Alert color="green" icon={<IconCheck />} mb="md">
            <Text size="sm" fw={500} mb="xs">📊 Market Analysis Summary</Text>
            <Text size="sm">{pricingData.overall_recommendation}</Text>
          </Alert>
        )}

        {/* Marketplace Pricing Data */}
        <Box>
          <Text fw={600} size="lg" mb="md">
            📊 Marketplace Pricing Data
          </Text>
          <Grid>
            {Object.entries(pricingData)
              .filter(([key]) => key.endsWith('_market'))
              .map(([key, data]) => {
                const marketData = data as MarketplaceData;
                
                // Skip if no listings found
                if (!marketData.lowest || marketData.lowest === 'N/A' || marketData.sample_size === 0) {
                  return (
                    <Grid.Col key={key} span={{ base: 12, sm: 6, md: 4 }}>
                      <Card withBorder p="md">
                        <Text fw={600} mb="xs">
                          {getMarketplaceIcon(key)} {getMarketplaceName(key)}
                        </Text>
                        <Text size="sm" c="dimmed">No listings found</Text>
                      </Card>
                    </Grid.Col>
                  );
                }

                return (
                  <Grid.Col key={key} span={{ base: 12, sm: 6, md: 4 }}>
                    <Card withBorder p="md">
                      <Text fw={600} mb="xs">
                        {getMarketplaceIcon(key)} {getMarketplaceName(key)}
                      </Text>
                      <Stack gap="xs">
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">Lowest:</Text>
                          <Text fw={500}>{marketData.lowest}</Text>
                        </Group>
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">Highest:</Text>
                          <Text fw={500}>{marketData.highest}</Text>
                        </Group>
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">Average:</Text>
                          <Text fw={600} c="green">{marketData.average}</Text>
                        </Group>
                        <Group justify="apart">
                          <Text size="xs" c="dimmed">Based on {marketData.sample_size} listings</Text>
                        </Group>
                      </Stack>
                    </Card>
                  </Grid.Col>
                );
              })}
          </Grid>
        </Box>

        {/* SnaptoSell Suggestion (for electronics) */}
        {pricingData.SnaptoSell_suggestion && (
          <Box mt="md">
            <Divider my="md" />
            
            {/* Pricing Factors */}
            {(pricingData as any).pricing_factors && (pricingData as any).pricing_factors.length > 0 && (
              <Box mb="lg">
                <Text fw={600} size="md" mb="sm">📋 Pricing Factors</Text>
                <Stack gap="xs">
                  {(pricingData as any).pricing_factors.map((factor: string, index: number) => (
                    <Group key={index} gap="xs">
                      <Badge size="xs" color="blue">•</Badge>
                      <Text size="sm">{factor}</Text>
                    </Group>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Market Trends */}
            {(pricingData as any).market_trends && (
              <Alert color="blue" mb="md" icon="📈">
                <Text fw={600} size="sm" mb="xs">Market Trends</Text>
                <Text size="sm">{(pricingData as any).market_trends}</Text>
              </Alert>
            )}

            <Text fw={600} size="lg" mb="md">
              💡 SnaptoSell Recommendation
            </Text>
            <Card withBorder p="md" bg="blue.0">
              <Stack gap="sm">
                <Group justify="apart">
                  <Text fw={500}>Typical Resale Price:</Text>
                  <Text fw={700} size="lg" c="green">
                    {pricingData.SnaptoSell_suggestion.typical_resale_price}
                  </Text>
                </Group>
                <Group justify="apart">
                  <Text fw={500}>Price Range:</Text>
                  <Text fw={600}>{pricingData.SnaptoSell_suggestion.price_range}</Text>
                </Group>
                <Group justify="apart">
                  <Text fw={500}>Confidence:</Text>
                  <Badge
                    color={
                      pricingData.SnaptoSell_suggestion.confidence === 'high'
                        ? 'green'
                        : pricingData.SnaptoSell_suggestion.confidence === 'medium'
                        ? 'yellow'
                        : 'orange'
                    }
                  >
                    {pricingData.SnaptoSell_suggestion.confidence.toUpperCase()}
                  </Badge>
                </Group>
                {pricingData.SnaptoSell_suggestion.pricing_notes && (
                  <Text size="sm" c="dimmed" mt="xs">
                    {pricingData.SnaptoSell_suggestion.pricing_notes}
                  </Text>
                )}
              </Stack>
            </Card>
          </Box>
        )}
      </Paper>
    </Stack>
  );
};

export default AIMarketplacePricing;
