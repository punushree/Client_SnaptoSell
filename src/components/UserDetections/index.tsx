/**
 * UserDetections Component
 * Displays all product detections for the currently logged-in user
 * Only shows detections that belong to the authenticated user
 */

import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Alert,
  Box,
  Image,
  SimpleGrid,
  Card,
  Badge,
  Loader,
  Center,
  Modal,
  Divider,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconX,
  IconClock,
  IconPhoto,
} from "@tabler/icons-react";
import { authClient } from "@/lib/client/auth";
import { useNavigate } from "react-router";

interface Detection {
  uuid: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inputDescription: string;
  identified_product?: string;
  brand?: string;
  color_variants?: string;
  size?: string;
  condition_rating?: string;
  estimated_year?: string;
  short_description?: string;
  storage?: string;
  model?: string;
  model_variant?: string;
  carrier?: string;
  connectivity?: string;
  ram?: string;
  processor?: string;
  gpu?: string;
  userConfirmed: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
  inputImages: string[];
  imageCount: number;
}

const UserDetections = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const navigate = useNavigate();

  // Check if user is logged in
  const isLoggedIn = !sessionPending && session?.user;

  useEffect(() => {
    if (sessionPending) return; // Wait for session to load

    if (!isLoggedIn) {
      setError("Please sign in to view your detections.");
      setLoading(false);
      return;
    }

    fetchDetections();
  }, [isLoggedIn, sessionPending]);

  const fetchDetections = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/detect/list');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch detections');
      }

      if (result.success) {
        setDetections(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch detections');
      }
    } catch (err) {
      console.error('Error fetching detections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load detections');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'processing':
        return 'blue';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <IconCheck size={16} />;
      case 'processing':
        return <IconClock size={16} />;
      case 'failed':
        return <IconX size={16} />;
      default:
        return <IconClock size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (sessionPending) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!isLoggedIn) {
    return (
      <Container size="md" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Authentication Required"
          color="yellow"
          mb="md"
        >
          Please sign in to view your product detections.
        </Alert>
        <Group justify="center">
          <Button component="a" href="/sign-in">
            Sign In
          </Button>
        </Group>
      </Container>
    );
  }

  if (loading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading your detections...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="md" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          mb="md"
        >
          {error}
        </Alert>
        <Group justify="center">
          <Button onClick={fetchDetections}>Retry</Button>
        </Group>
      </Container>
    );
  }

  if (detections.length === 0) {
    return (
      <Container size="md" py="xl">
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <IconPhoto size={48} color="var(--mantine-color-gray-5)" />
            <Title order={3}>No Detections Yet</Title>
            <Text c="dimmed" ta="center">
              You haven't uploaded any product detections yet. Start by uploading images
              to detect and analyze products.
            </Text>
            <Button onClick={() => navigate('/detect')}>
              Start Detection
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    // <Container size="xl" py="xl">
    <Container size="auto" style={{ maxWidth: "1420px" }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>My Product Detections</Title>
          <Text c="dimmed" size="sm" mt="xs">
            {detections.length} {detections.length === 1 ? 'detection' : 'detections'} found
          </Text>
        </div>
        <Button onClick={() => navigate('/detect')}>
          New Detection
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {detections.map((detection) => (
          <Card
            key={detection.uuid}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedDetection(detection)}
          >
            <Stack gap="sm">
              {/* Status Badge */}
              <Group justify="space-between" align="flex-start">
                <Badge
                  color={getStatusColor(detection.status)}
                  leftSection={getStatusIcon(detection.status)}
                  variant="light"
                >
                  {detection.status}
                </Badge>
                {detection.userConfirmed && (
                  <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
                    Confirmed
                  </Badge>
                )}
              </Group>

              {/* Product Image Preview */}
              {detection.inputImages && detection.inputImages.length > 0 && (
                <Box
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: 'var(--mantine-color-gray-1)',
                  }}
                >
                  <Image
                    src={detection.inputImages[0]}
                    alt={detection.identified_product || 'Product image'}
                    fit="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </Box>
              )}

              {/* Product Info */}
              <div>
                <Text fw={600} size="lg" lineClamp={1}>
                  {detection.identified_product || detection.inputDescription || 'Unidentified Product'}
                </Text>
                {detection.brand && (
                  <Text size="sm" c="dimmed" mt={4}>
                    {detection.brand}
                  </Text>
                )}
                {detection.model && (
                  <Text size="sm" c="dimmed">
                    {detection.model}
                  </Text>
                )}
              </div>

              {/* Additional Info */}
              <Group gap="xs" mt="auto">
                <Text size="xs" c="dimmed">
                  <IconPhoto size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {detection.imageCount} {detection.imageCount === 1 ? 'image' : 'images'}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatDate(detection.createdAt)}
                </Text>
              </Group>

              {/* Quick Details */}
              {(detection.storage || detection.color_variants || detection.condition_rating) && (
                <Group gap="xs" mt="xs">
                  {/* {detection.storage && (
                    <Badge size="sm" variant="outline">
                      {detection.storage}
                    </Badge>
                  )}
                  {detection.color_variants && (
                    <Badge size="sm" variant="outline">
                      {detection.color_variants}
                    </Badge>
                  )} */}
                  {detection.condition_rating && (
                    <Badge size="sm" variant="outline" color="orange">
                      Condition: {detection.condition_rating}
                    </Badge>
                  )}
                </Group>
              )}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* Detail Modal */}
      <Modal
        opened={!!selectedDetection}
        onClose={() => setSelectedDetection(null)}
        title={
          <Text fw={600} size="lg">
            {selectedDetection?.identified_product || 'Product Details'}
          </Text>
        }
        size="lg"
        centered
      >
        {selectedDetection && (
          <Stack gap="md">
            {/* Status */}
            <Group>
              <Badge
                color={getStatusColor(selectedDetection.status)}
                leftSection={getStatusIcon(selectedDetection.status)}
                size="lg"
              >
                {selectedDetection.status}
              </Badge>
              {selectedDetection.userConfirmed && (
                <Badge color="green" size="lg" leftSection={<IconCheck size={14} />}>
                  User Confirmed
                </Badge>
              )}
            </Group>

            {/* Images */}
            {selectedDetection.inputImages && selectedDetection.inputImages.length > 0 && (
              <div>
                <Text fw={600} mb="sm">
                  Uploaded Images ({selectedDetection.inputImages.length})
                </Text>
                <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                  {selectedDetection.inputImages.map((img, idx) => (
                    <Box
                      key={idx}
                      style={{
                        width: '100%',
                        height: 120,
                        borderRadius: 8,
                        overflow: 'hidden',
                        backgroundColor: 'var(--mantine-color-gray-1)',
                      }}
                    >
                      <Image
                        src={img}
                        alt={`Image ${idx + 1}`}
                        fit="cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </div>
            )}

            <Divider />

            {/* Product Details */}
            <div>
              <Text fw={600} mb="sm">
                Product Information
              </Text>
              <SimpleGrid cols={2} spacing="xs">
                {selectedDetection.brand && (
                  <div>
                    <Text size="sm" c="dimmed">Brand</Text>
                    <Text fw={500}>{selectedDetection.brand}</Text>
                  </div>
                )}
                {selectedDetection.model && (
                  <div>
                    <Text size="sm" c="dimmed">Model</Text>
                    <Text fw={500}>{selectedDetection.model}</Text>
                  </div>
                )}
                {selectedDetection.storage && (
                  <div>
                    <Text size="sm" c="dimmed">Storage</Text>
                    <Text fw={500}>{selectedDetection.storage}</Text>
                  </div>
                )}
                {selectedDetection.color_variants && (
                  <div>
                    <Text size="sm" c="dimmed">Color</Text>
                    <Text fw={500}>{selectedDetection.color_variants}</Text>
                  </div>
                )}
                {selectedDetection.size && (
                  <div>
                    <Text size="sm" c="dimmed">Size</Text>
                    <Text fw={500}>{selectedDetection.size}</Text>
                  </div>
                )}
                {selectedDetection.condition_rating && (
                  <div>
                    <Text size="sm" c="dimmed">Condition</Text>
                    <Text fw={500}>{selectedDetection.condition_rating}</Text>
                  </div>
                )}
                {selectedDetection.estimated_year && (
                  <div>
                    <Text size="sm" c="dimmed">Year</Text>
                    <Text fw={500}>{selectedDetection.estimated_year}</Text>
                  </div>
                )}
                {selectedDetection.carrier && (
                  <div>
                    <Text size="sm" c="dimmed">Carrier</Text>
                    <Text fw={500}>{selectedDetection.carrier}</Text>
                  </div>
                )}
              </SimpleGrid>
            </div>

            {selectedDetection.short_description && (
              <div>
                <Text fw={600} mb="sm">
                  Description
                </Text>
                <Text size="sm">{selectedDetection.short_description}</Text>
              </div>
            )}

            {selectedDetection.inputDescription && (
              <div>
                <Text fw={600} mb="sm">
                  User Description
                </Text>
                <Text size="sm" c="dimmed">{selectedDetection.inputDescription}</Text>
              </div>
            )}

            <Divider />

            {/* Timestamps */}
            <Group gap="md">
              <div>
                <Text size="xs" c="dimmed">Created</Text>
                <Text size="sm">{formatDate(selectedDetection.createdAt)}</Text>
              </div>
              {selectedDetection.confirmedAt && (
                <div>
                  <Text size="xs" c="dimmed">Confirmed</Text>
                  <Text size="sm">{formatDate(selectedDetection.confirmedAt)}</Text>
                </div>
              )}
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default UserDetections;

