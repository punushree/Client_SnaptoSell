import { useState, useEffect, useRef } from "react";
import {
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Badge,
  Loader,
  Alert,
  Card,
  Grid,
  Divider,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCurrencyDollar,
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";

interface PricingData {
  uuid: string;
  average_price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  price_currency?: string;
  ebay_items_count?: number | null;
  pricing_updated_at?: string | null;
  has_pricing?: boolean;
}

interface ProductPricingProps {
  uuid: string;
  onPricingUpdated?: (data: PricingData) => void;
}

const ProductPricing = ({ uuid, onPricingUpdated }: ProductPricingProps) => {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoCalculated = useRef(false);

  // Fetch pricing data
  const fetchPricing = async (): Promise<boolean> => {
    if (!uuid) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pricing/${uuid}`);
      const result = await response.json();

      if (!response.ok) {
        // If 404, pricing doesn't exist yet - this is okay, we'll calculate it
        if (response.status === 404) {
          setPricingData({ uuid, has_pricing: false });
          setIsLoading(false);
          return false; // Pricing doesn't exist
        }
        throw new Error(result.error || "Failed to fetch pricing data");
      }

      if (result.success) {
        setPricingData(result.data);
        if (onPricingUpdated) {
          onPricingUpdated(result.data);
        }
        setIsLoading(false);
        return result.data.has_pricing || false;
      } else {
        throw new Error(result.error || "Failed to fetch pricing data");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching pricing:", err);
      setIsLoading(false);
      return false;
    }
  };

  // Process pricing (call eBay API and calculate)
  const processPricing = async () => {
    if (!uuid) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/pricing/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uuid }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process pricing");
      }

      if (result.success) {
        // notifications.show({
        //   title: "Pricing Calculated",
        //   message: `Average price: ${result.data.price_statistics.currency} ${result.data.price_statistics.average_price.toFixed(2)}`,
        //   color: "green",
        //   icon: <IconCheck size={16} />,
        // });

        // Update local state with new pricing data
        setPricingData({
          uuid: result.data.uuid,
          average_price: result.data.average_price,
          min_price: result.data.min_price,
          max_price: result.data.max_price,
          price_currency: result.data.price_currency,
          ebay_items_count: result.data.ebay_items_count,
          pricing_updated_at: result.data.pricing_updated_at,
          has_pricing: true,
        });

        if (onPricingUpdated) {
          onPricingUpdated({
            uuid: result.data.uuid,
            average_price: result.data.average_price,
            min_price: result.data.min_price,
            max_price: result.data.max_price,
            price_currency: result.data.price_currency,
            ebay_items_count: result.data.ebay_items_count,
            pricing_updated_at: result.data.pricing_updated_at,
            has_pricing: true,
          });
        }
      } else {
        throw new Error(result.error || "Failed to process pricing");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
      console.error("Error processing pricing:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch pricing on mount, and auto-calculate if not available
  useEffect(() => {
    if (!uuid) return;

    hasAutoCalculated.current = false;

    const loadPricing = async () => {
      // First, try to fetch existing pricing
      const hasPricing = await fetchPricing();

      // If pricing doesn't exist, automatically calculate it
      if (!hasPricing && !hasAutoCalculated.current) {
        hasAutoCalculated.current = true;
        processPricing();
      }
    };

    loadPricing();
  }, [uuid]);

  const formatPrice = (price: number | null | undefined, currency: string = "USD") => {
    if (price === null || price === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "N/A";
    }
  };

  if (isLoading || isProcessing) {
    return (
      <Paper p="md" withBorder>
        <Group justify="center" gap="xs">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            {isProcessing ? "Calculating pricing..." : "Loading pricing data..."}
          </Text>
        </Group>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder radius="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={4} mb="xs">
              Product Pricing
            </Title>
            <Text size="sx" >
              Market value based on eBay listings
            </Text>
          </div>
          {pricingData?.has_pricing && (
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={processPricing}
              loading={isProcessing}
              variant="light"
              size="sm"
            >
              Refresh
            </Button>
          )}
        </Group>

        {/* {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )} */}
        {error && (
          <Box
            style={{
              width: "100%",
              backgroundColor: "#ffe6e6",
              border: "1px solid #ff4d4d",
              padding: "10px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <IconAlertCircle size={16} color="red" />
            <Text c="red" size="sm">{error}</Text>
          </Box>
        )}

        {pricingData?.has_pricing ? (
          <>
            <Card withBorder p="md" radius="md" bg="gray.0">
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Text size="sm" fw={500} c="dimmed">
                    Average Price
                  </Text>
                  <Badge
                    size="lg"
                    variant="light"
                    color="blue"
                    leftSection={<IconCurrencyDollar size={14} />}
                  >
                    {formatPrice(
                      pricingData.average_price,
                      pricingData.price_currency
                    )}
                  </Badge>
                </Group>
                <Divider />
                <Grid>
                  <Grid.Col span={6}>
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed">
                        Min Price
                      </Text>
                      <Group gap={4}>
                        <IconTrendingDown size={14} color="green" />
                        <Text size="sm" fw={500}>
                          {formatPrice(
                            pricingData.min_price,
                            pricingData.price_currency
                          )}
                        </Text>
                      </Group>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed">
                        Max Price
                      </Text>
                      <Group gap={4}>
                        <IconTrendingUp size={14} color="red" />
                        <Text size="sm" fw={500}>
                          {formatPrice(
                            pricingData.max_price,
                            pricingData.price_currency
                          )}
                        </Text>
                      </Group>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>

            <Group justify="space-between" gap="xs">
              <Text size="xs" c="dimmed">
                Based on {pricingData.ebay_items_count || 0} eBay listing
                {pricingData.ebay_items_count !== 1 ? "s" : ""}
              </Text>
              <Text size="xs" c="dimmed">
                Updated: {formatDate(pricingData.pricing_updated_at)}
              </Text>
            </Group>
          </>
        ) : (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Calculating Pricing"
            color="blue"
            variant="light"
          >
            <Text size="sm">
              Fetching current market prices from eBay. Please wait...
            </Text>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export default ProductPricing;

