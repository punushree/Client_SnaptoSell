/**
 * UserDetections Component
 * Displays all product detections for the currently logged-in user in a list view
 * Navigates to individual detection detail page instead of showing modal
 */

import { useState } from "react";
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
  Badge,
  Loader,
  Center,
  Card,
  Grid,
  ActionIcon,
  Divider,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconX,
  IconClock,
  IconArrowRight,
  IconRefresh,
  IconPackage,
  IconCalendar,
} from "@tabler/icons-react";
import { useNavigate, useRevalidator } from "react-router";

interface Detection {
  uuid: string;
  status: 'pending' | 'processing' | 'completed' | 'verified' | 'failed' | 'identified';
  category?: string;
  inputDescription: string;
  identified_product?: string;
  brand?: string;
  model?: string;
  color_variants?: string;
  condition_rating?: string;
  estimated_year?: string;
  short_description?: string;
  categoryConfidence?: number;
  confidence_score?: number;
  createdAt: string;
  updatedAt: string;
  inputImages: string[];
  imageCount: number;
}

interface UserDetectionsProps {
  detections: Detection[];
}

const UserDetections = ({ detections }: UserDetectionsProps) => {
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'verified':
        return 'cyan';
      case 'identified':
        return 'blue';
      case 'processing':
        return 'yellow';
      case 'pending':
        return 'gray';
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
      case 'verified':
      case 'identified':
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

  const getCategoryIcon = (category?: string) => {
    return <IconPackage size={18} />;
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>My Detections</Title>
            <Text c="dimmed" mt="xs">
              View and manage all your product analyses
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<IconRefresh size={18} />}
              variant="light"
              onClick={() => revalidator.revalidate()}
              loading={revalidator.state === 'loading'}
            >
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/detect')}
              variant="filled"
            >
              New Detection
            </Button>
          </Group>
        </Group>

        {/* Stats */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md">
              <Text size="sm" c="dimmed" mb="xs">Total Detections</Text>
              <Text size="xl" fw={700}>{detections.length}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md">
              <Text size="sm" c="dimmed" mb="xs">Completed</Text>
              <Text size="xl" fw={700} c="green">
                {detections.filter(d => d.status === 'completed').length}
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md">
              <Text size="sm" c="dimmed" mb="xs">In Progress</Text>
              <Text size="xl" fw={700} c="blue">
                {detections.filter(d => ['processing', 'verified', 'identified'].includes(d.status)).length}
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder p="md">
              <Text size="sm" c="dimmed" mb="xs">Failed</Text>
              <Text size="xl" fw={700} c="red">
                {detections.filter(d => d.status === 'failed').length}
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Detections List */}
        {detections.length === 0 ? (
          <Paper shadow="sm" p="xl" withBorder>
            <Center>
              <Stack align="center" gap="md">
                <IconPackage size={64} stroke={1.5} color="var(--mantine-color-gray-5)" />
                <div style={{ textAlign: 'center' }}>
                  <Text fw={600} size="lg">No detections yet</Text>
                  <Text c="dimmed" size="sm" mt="xs">
                    Start by analyzing your first product
                  </Text>
                </div>
                <Button onClick={() => navigate('/detect')} mt="md">
                  Start Detection
                </Button>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Stack gap="md">
            {detections.map((detection) => (
              <Card
                key={detection.uuid}
                shadow="sm"
                padding="lg"
                withBorder
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                onClick={() => navigate(`/detection/${detection.uuid}`)}
              >
                <Grid align="center">
                  {/* Image Preview */}
                  <Grid.Col span={{ base: 12, sm: 3, md: 2 }}>
                    <Box
                      style={{
                        width: '100%',
                        height: 120,
                        borderRadius: 8,
                        overflow: 'hidden',
                        backgroundColor: 'var(--mantine-color-gray-1)',
                      }}
                    >
                      {detection.inputImages && detection.inputImages.length > 0 ? (
                        <Image
                          src={detection.inputImages[0]}
                          alt="Product"
                          fit="cover"
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Center h="100%">
                          <IconPackage size={48} stroke={1} color="var(--mantine-color-gray-4)" />
                        </Center>
                      )}
                    </Box>
                    {detection.inputImages && detection.inputImages.length > 1 && (
                      <Text size="xs" c="dimmed" mt="xs" ta="center">
                        +{detection.inputImages.length - 1} more
                      </Text>
                    )}
                  </Grid.Col>

                  {/* Product Info */}
                  <Grid.Col span={{ base: 12, sm: 6, md: 7 }}>
                    <Stack gap="xs">
                      <div>
                        <Group gap="xs" mb="xs">
                          <Badge
                            color={getStatusColor(detection.status)}
                            leftSection={getStatusIcon(detection.status)}
                            size="sm"
                          >
                            {detection.status}
                          </Badge>
                          {detection.category && (
                            <Badge variant="light" leftSection={getCategoryIcon(detection.category)} size="sm">
                              {detection.category}
                            </Badge>
                          )}
                        </Group>
                        <Text fw={600} size="lg" lineClamp={1}>
                          {detection.identified_product || detection.inputDescription || 'Untitled Detection'}
                        </Text>
                      </div>

                      <Group gap="lg">
                        {detection.brand && (
                          <div>
                            <Text size="xs" c="dimmed">Brand</Text>
                            <Text size="sm" fw={500}>{detection.brand}</Text>
                          </div>
                        )}
                        {detection.model && (
                          <div>
                            <Text size="xs" c="dimmed">Model</Text>
                            <Text size="sm" fw={500}>{detection.model}</Text>
                          </div>
                        )}
                        {detection.condition_rating && (
                          <div>
                            <Text size="xs" c="dimmed">Condition</Text>
                            <Text size="sm" fw={500}>{detection.condition_rating}</Text>
                          </div>
                        )}
                      </Group>

                      {detection.short_description && (
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {detection.short_description}
                        </Text>
                      )}
                    </Stack>
                  </Grid.Col>

                  {/* Meta Info */}
                  <Grid.Col span={{ base: 12, sm: 3, md: 3 }}>
                    <Stack gap="xs" align="flex-end">
                      <Group gap="xs">
                        <IconCalendar size={14} />
                        <Text size="xs" c="dimmed">
                          {formatDate(detection.createdAt)}
                        </Text>
                      </Group>
                      {detection.confidence_score !== undefined && (
                        <Badge color="blue" variant="light" size="sm">
                          {detection.confidence_score}% confidence
                        </Badge>
                      )}
                      <ActionIcon
                        variant="light"
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/detection/${detection.uuid}`);
                        }}
                      >
                        <IconArrowRight size={18} />
                      </ActionIcon>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};

export default UserDetections;

