/**
 * Individual Detection Detail Page
 * Displays complete analysis for a single product detection
 * Includes category, identification, verification, and pricing data
 */

import { useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router";
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
  Divider,
  List,
  ThemeIcon,
  SimpleGrid,
  ActionIcon,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconX,
  IconClock,
  IconArrowLeft,
  IconDownload,
  IconPackage,
  IconInfoCircle,
  IconCircleCheck,
  IconAlertTriangle,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconCalendar,
  IconShoppingCart,
} from "@tabler/icons-react";
import { authClient } from "@/lib/client/auth";
import jsPDF from "jspdf";
import { loader as apiLoader } from "@/pages/api/detect/[uuid]/page";

interface Detection {
  uuid: string;
  status: string;
  category?: string;
  inputDescription: string;
  categoryConfidence?: number;
  detected_product_type?: string;
  
  // Identification
  identified_product?: string;
  brand?: string;
  model?: string;
  color_variants?: string;
  condition_rating?: string;
  estimated_year?: string;
  short_description?: string;
  confidence_score?: number;
  
  // Product details - ALL fields from detection
  size?: string;
  material?: string;
  material_composition?: string;
  distinctive_features?: string | string[];
  condition_details?: string;
  possible_confusion?: string;
  clarity_feedback?: string;
  storage?: string;
  ram?: string;
  processor?: string;
  gpu?: string;
  carrier?: string;
  connectivity?: string;
  model_variant?: string;
  
  // Fashion-specific fields
  gender_category?: string;
  brand_tier?: string;
  category_type?: string;
  specific_category?: string;
  fit_style?: string;
  product_condition?: string;
  missing_details?: string[];
  
  // Electronics-specific fields
  os_version?: string;
  carrier_lock_status?: string;
  
  // General identification fields
  image_text_match?: boolean;
  preliminary_authenticity?: string;
  extraction_notes?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  inputImages: string[];
  
  // Verification data (from metadata) - ALL verification fields
  authenticity_status?: string; // For fashion category
  verification_status?: string; // For electronics/other categories
  verification_confidence?: number;
  summary?: string;
  authentication_summary?: string;
  verification_summary?: string;
  authenticity_details?: string;
  verification_details?: string;
  recommendations?: string;
  measurements?: string;
  measurements_source?: string;
  original_retail_price?: string;
  specs_match?: string | boolean;
  verified_features?: string[];
  authentication_notes?: string;
  
  // Pricing data (from metadata)
  SnaptoSell_suggestion?: {
    typical_resale_price?: string;
    price_range?: string;
    confidence?: string;
    pricing_notes?: string;
    min?: number;
    max?: number;
    notes?: string;
  };
  pricing_strategy?: string;
  platform_recommendations?: Array<{
    platform: string;
    reason: string;
  }>;
  seasonal_pricing_guidance?: string;
  
  // Marketplace pricing data
  ebay_market?: {
    lowest: string;
    highest: string;
    average: string;
    median?: string;
    sample_size: number;
  };
  facebook_market?: {
    lowest: string;
    highest: string;
    average: string;
    median?: string;
    sample_size: number;
  };
  craigslist_market?: {
    lowest: string;
    highest: string;
    average: string;
    median?: string;
    sample_size: number;
  };
  poshmark_market?: {
    lowest: string;
    highest: string;
    average: string;
    sample_size: number;
  };
  depop_market?: {
    lowest: string;
    highest: string;
    average: string;
    sample_size: number;
  };
  mercari_market?: {
    lowest: string;
    highest: string;
    average: string;
    sample_size: number;
  };
}

// Server-side loader function
export const loader = async (args: LoaderFunctionArgs) => {
  // Call the API loader directly instead of making an HTTP request
  const response = await apiLoader(args);
  
  // The API loader returns a Response object, extract the JSON data
  const result = await response.json();
  
  if (!result.success) {
    throw new Response(result.error || 'Failed to fetch detection', { 
      status: response.status 
    });
  }

//   console.log('Detection data loaded (server):', result.data);
  
  return result.data;
};

const DetectionDetailPage = () => {
  const detection = useLoaderData<Detection>();
  const navigate = useNavigate();

  const generatePDF = () => {
    if (!detection) return;

    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text("SnaptoSell Detection Report", 105, yPosition, { align: "center" });
    yPosition += 15;

    // Basic Info
    doc.setFontSize(12);
    doc.text(`Product: ${detection.identified_product || 'Unknown'}`, 20, yPosition);
    yPosition += 8;
    if (detection.brand) {
      doc.text(`Brand: ${detection.brand}`, 20, yPosition);
      yPosition += 8;
    }
    if (detection.model) {
      doc.text(`Model: ${detection.model}`, 20, yPosition);
      yPosition += 8;
    }
    if (detection.category) {
      doc.text(`Category: ${detection.category}`, 20, yPosition);
      yPosition += 8;
    }

    // Add more sections as needed
    if (detection.authenticity_status || detection.summary) {
      yPosition += 10;
      doc.setFontSize(14);
      doc.text("Verification Results", 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      
      if (detection.authenticity_status) {
        doc.text(`Authenticity: ${detection.authenticity_status}`, 20, yPosition);
        yPosition += 6;
      }
      if (detection.summary) {
        const summaryText = detection.summary.substring(0, 100);
        doc.text(`Summary: ${summaryText}`, 20, yPosition);
        yPosition += 6;
      }
    }
    
    // Pricing data
    if (detection.SnaptoSell_suggestion) {
      yPosition += 10;
      doc.setFontSize(14);
      doc.text("Pricing Analysis", 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      
      const pricing = detection.SnaptoSell_suggestion;
      doc.text(`Suggested Price: $${pricing.min || 0} - $${pricing.max || 0}`, 20, yPosition);
      yPosition += 6;
      
      if (pricing.notes) {
        const notesText = pricing.notes.substring(0, 100);
        doc.text(`Notes: ${notesText}`, 20, yPosition);
        yPosition += 6;
      }
    }

    doc.save(`detection-${detection.uuid}.pdf`);
  };

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

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Button
            leftSection={<IconArrowLeft size={18} />}
            variant="light"
            onClick={() => navigate('/my-detections')}
          >
            Back
          </Button>
          <Group>
            <Button
              leftSection={<IconDownload size={18} />}
              variant="outline"
              onClick={generatePDF}
            >
              Download PDF
            </Button>
          </Group>
        </Group>

        {/* Status & Category */}
        <Paper shadow="sm" p="xl" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Title order={2}>{detection.identified_product || detection.inputDescription}</Title>
                <Text c="dimmed" size="sm" mt="xs">
                  Created {new Date(detection.createdAt).toLocaleDateString()}
                </Text>
              </div>
              <Group>
                <Badge color={getStatusColor(detection.status)} size="lg">
                  {detection.status}
                </Badge>
                {detection.category && (
                  <Badge variant="light" size="lg">
                    {detection.category}
                  </Badge>
                )}
              </Group>
            </Group>

            {detection.categoryConfidence !== undefined && (
              <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                Category Detection Confidence: {detection.categoryConfidence}%
              </Alert>
            )}
          </Stack>
        </Paper>

        {/* Images */}
        {detection.inputImages && detection.inputImages.length > 0 && (
          <Paper shadow="sm" p="xl" withBorder>
            <Title order={3} mb="md">Product Images</Title>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
              {detection.inputImages.map((img, idx) => (
                <Box key={idx} style={{ borderRadius: 8, overflow: 'hidden' }}>
                  <Image src={img} alt={`Product ${idx + 1}`} fit="cover" h={200} />
                </Box>
              ))}
            </SimpleGrid>
          </Paper>
        )}

        {/* Product Details */}
        <Paper shadow="sm" p="xl" withBorder>
          <Title order={3} mb="md">Product Details</Title>
          
          {/* Main product info in grid */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {detection.identified_product && (
              <div>
                <Text size="sm" c="dimmed">Product</Text>
                <Text fw={500}>{detection.identified_product}</Text>
              </div>
            )}
            {detection.brand && (
              <div>
                <Text size="sm" c="dimmed">Brand</Text>
                <Text fw={500}>{detection.brand}</Text>
              </div>
            )}
            {detection.model && (
              <div>
                <Text size="sm" c="dimmed">Model</Text>
                <Text fw={500}>{detection.model}</Text>
              </div>
            )}
            {detection.model_variant && (
              <div>
                <Text size="sm" c="dimmed">Model Variant</Text>
                <Text fw={500}>{detection.model_variant}</Text>
              </div>
            )}
            {detection.color_variants && (
              <div>
                <Text size="sm" c="dimmed">Color</Text>
                <Text fw={500}>{detection.color_variants}</Text>
              </div>
            )}
            {detection.condition_rating && (
              <div>
                <Text size="sm" c="dimmed">Condition</Text>
                <Badge color="orange" size="md">{detection.condition_rating}</Badge>
              </div>
            )}
            {detection.confidence_score !== undefined && (
              <div>
                <Text size="sm" c="dimmed">Product Confidence</Text>
                <Badge color="blue" size="md">{detection.confidence_score}%</Badge>
              </div>
            )}
            {detection.estimated_year && (
              <div>
                <Text size="sm" c="dimmed">Estimated Year</Text>
                <Text fw={500}>{detection.estimated_year}</Text>
              </div>
            )}
            {detection.size && (
              <div>
                <Text size="sm" c="dimmed">Size</Text>
                <Text fw={500}>{detection.size}</Text>
              </div>
            )}
            {detection.material && (
              <div>
                <Text size="sm" c="dimmed">Material</Text>
                <Text fw={500}>{detection.material}</Text>
              </div>
            )}
            {detection.material_composition && detection.material_composition !== detection.material && (
              <div>
                <Text size="sm" c="dimmed">Material Composition</Text>
                <Text fw={500}>{detection.material_composition}</Text>
              </div>
            )}
            {detection.product_condition && (
              <div>
                <Text size="sm" c="dimmed">Product Condition</Text>
                <Badge color={detection.product_condition === 'new' ? 'green' : 'blue'} size="md">
                  {detection.product_condition}
                </Badge>
              </div>
            )}
            {detection.gender_category && (
              <div>
                <Text size="sm" c="dimmed">Gender Category</Text>
                <Text fw={500}>{detection.gender_category}</Text>
              </div>
            )}
            {detection.brand_tier && (
              <div>
                <Text size="sm" c="dimmed">Brand Tier</Text>
                <Text fw={500}>{detection.brand_tier}</Text>
              </div>
            )}
            {detection.category_type && (
              <div>
                <Text size="sm" c="dimmed">Category Type</Text>
                <Text fw={500}>{detection.category_type}</Text>
              </div>
            )}
            {detection.specific_category && (
              <div>
                <Text size="sm" c="dimmed">Specific Category</Text>
                <Text fw={500}>{detection.specific_category}</Text>
              </div>
            )}
            {detection.fit_style && (
              <div>
                <Text size="sm" c="dimmed">Fit Style</Text>
                <Text fw={500}>{detection.fit_style}</Text>
              </div>
            )}
            {detection.preliminary_authenticity && (
              <div>
                <Text size="sm" c="dimmed">Preliminary Authenticity</Text>
                <Badge 
                  color={detection.preliminary_authenticity.includes('Genuine') ? 'green' : 
                         detection.preliminary_authenticity.includes('Uncertain') ? 'yellow' : 'red'} 
                  size="md"
                >
                  {detection.preliminary_authenticity}
                </Badge>
              </div>
            )}
            {detection.image_text_match !== undefined && (
              <div>
                <Text size="sm" c="dimmed">Image-Text Match</Text>
                <Badge color={detection.image_text_match ? 'green' : 'red'} size="md">
                  {detection.image_text_match ? 'Match' : 'Mismatch'}
                </Badge>
              </div>
            )}
            {detection.storage && (
              <div>
                <Text size="sm" c="dimmed">Storage</Text>
                <Text fw={500}>{detection.storage}</Text>
              </div>
            )}
            {detection.ram && (
              <div>
                <Text size="sm" c="dimmed">RAM</Text>
                <Text fw={500}>{detection.ram}</Text>
              </div>
            )}
            {detection.processor && (
              <div>
                <Text size="sm" c="dimmed">Processor</Text>
                <Text fw={500}>{detection.processor}</Text>
              </div>
            )}
            {detection.gpu && (
              <div>
                <Text size="sm" c="dimmed">GPU</Text>
                <Text fw={500}>{detection.gpu}</Text>
              </div>
            )}
            {detection.carrier && (
              <div>
                <Text size="sm" c="dimmed">Carrier</Text>
                <Text fw={500}>{detection.carrier}</Text>
              </div>
            )}
            {detection.connectivity && (
              <div>
                <Text size="sm" c="dimmed">Connectivity</Text>
                <Text fw={500}>{detection.connectivity}</Text>
              </div>
            )}
            {detection.os_version && (
              <div>
                <Text size="sm" c="dimmed">OS Version</Text>
                <Text fw={500}>{detection.os_version}</Text>
              </div>
            )}
            {detection.carrier_lock_status && (
              <div>
                <Text size="sm" c="dimmed">Carrier Lock Status</Text>
                <Badge 
                  color={detection.carrier_lock_status === 'unlocked' ? 'green' : 
                         detection.carrier_lock_status === 'locked' ? 'red' : 'gray'} 
                  size="md"
                >
                  {detection.carrier_lock_status}
                </Badge>
              </div>
            )}
          </SimpleGrid>

          {/* Description sections */}
          {detection.short_description && (
            <>
              <Divider my="md" />
              <div>
                <Text size="sm" c="dimmed" mb="xs">Description</Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{detection.short_description}</Text>
              </div>
            </>
          )}

          {/* Show distinctive features and condition details */}
          {detection.distinctive_features && (
            <>
              <Divider my="md" />
              <div>
                <Text size="sm" c="dimmed" mb="xs">Distinctive Features</Text>
                {Array.isArray(detection.distinctive_features) ? (
                  <List spacing="xs">
                    {detection.distinctive_features.map((feature, idx) => (
                      <List.Item key={idx}>{feature}</List.Item>
                    ))}
                  </List>
                ) : (
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{detection.distinctive_features}</Text>
                )}
              </div>
            </>
          )}

          {detection.condition_details && (
            <>
              <Divider my="md" />
              <div>
                <Text size="sm" c="dimmed" mb="xs">Condition Details</Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{detection.condition_details}</Text>
              </div>
            </>
          )}

          {detection.possible_confusion && (
            <>
              <Divider my="md" />
              <div>
                <Text size="sm" c="dimmed" mb="xs">Possible Confusion</Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{detection.possible_confusion}</Text>
              </div>
            </>
          )}

          {detection.clarity_feedback && (
            <>
              <Divider my="md" />
              <div>
                <Text size="sm" c="dimmed" mb="xs">Clarity Feedback</Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{detection.clarity_feedback}</Text>
              </div>
            </>
          )}

          {detection.extraction_notes && (
            <>
              <Divider my="md" />
              <div>
                <Text size="sm" c="dimmed" mb="xs">Extraction Notes</Text>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{detection.extraction_notes}</Text>
              </div>
            </>
          )}

          {detection.missing_details && detection.missing_details.length > 0 && (
            <>
              <Divider my="md" />
              <div>
                <Text size="sm" c="dimmed" mb="xs">Missing Details</Text>
                <Group gap="xs">
                  {detection.missing_details.map((detail, idx) => (
                    <Badge key={idx} color="red" variant="light">{detail}</Badge>
                  ))}
                </Group>
              </div>
            </>
          )}
        </Paper>

        {/* Verification Data */}
        {(detection.authenticity_status || detection.verification_status || detection.authentication_summary || 
          detection.verification_summary || detection.summary || detection.measurements || 
          detection.recommendations || detection.verification_confidence) && (
          <Paper shadow="sm" p="xl" withBorder>
            <Title order={3} mb="md">Verification Results</Title>
            <Stack gap="md">
              {/* Show authenticity_status (fashion) OR verification_status (electronics) */}
              {(detection.authenticity_status || detection.verification_status) && (
                <Group>
                  <ThemeIcon
                    size="lg"
                    color={
                      (detection.authenticity_status === 'Verified Authentic' || 
                       detection.verification_status === 'Verified Accurate') ? 'green' : 
                      (detection.authenticity_status === 'Likely Authentic' || 
                       detection.verification_status === 'Likely Accurate') ? 'blue' : 'orange'
                    }
                  >
                    <IconCircleCheck />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>
                      {detection.category === 'fashion' ? 'Authenticity Status' : 'Verification Status'}
                    </Text>
                    <Badge 
                      color={
                        (detection.authenticity_status === 'Verified Authentic' || 
                         detection.verification_status === 'Verified Accurate') ? 'green' : 
                        (detection.authenticity_status === 'Likely Authentic' || 
                         detection.verification_status === 'Likely Accurate') ? 'blue' : 'orange'
                      } 
                      size="lg"
                    >
                      {detection.authenticity_status || detection.verification_status}
                    </Badge>
                  </div>
                </Group>
              )}

              {detection.verification_confidence && (
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Verification Confidence</Text>
                  <Badge color="cyan" size="lg">
                    {detection.verification_confidence}%
                  </Badge>
                </div>
              )}

              {(detection.authentication_summary || detection.verification_summary || detection.summary) && (
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Summary</Text>
                  <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {detection.authentication_summary || detection.verification_summary || detection.summary}
                  </Text>
                </div>
              )}

              {(detection.specs_match !== undefined && detection.specs_match !== null) && (
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Specifications Match</Text>
                  {typeof detection.specs_match === 'boolean' ? (
                    <Badge color={detection.specs_match ? 'green' : 'red'} size="lg">
                      {detection.specs_match ? 'Specifications Match' : 'Specifications Do Not Match'}
                    </Badge>
                  ) : (
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{String(detection.specs_match)}</Text>
                  )}
                </div>
              )}

              {(detection.authenticity_details || detection.verification_details) && (
                <div>
                  <Text size="sm" c="dimmed" mb="xs">
                    {detection.category === 'fashion' ? 'Authenticity Details' : 'Verification Details'}
                  </Text>
                  <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {detection.authenticity_details || detection.verification_details}
                  </Text>
                </div>
              )}

              {detection.recommendations && (
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Recommendations</Text>
                  <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {detection.recommendations}
                  </Text>
                </div>
              )}

              {detection.verified_features && detection.verified_features.length > 0 && (
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Verified Features</Text>
                  <Stack gap="xs">
                    {detection.verified_features.map((feature, idx) => (
                      <Group key={idx} gap="xs">
                        <IconCheck size={16} color="green" />
                        <Text size="sm">{feature}</Text>
                      </Group>
                    ))}
                  </Stack>
                </div>
              )}

              {detection.authentication_notes && (
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Authentication Notes</Text>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{detection.authentication_notes}</Text>
                </div>
              )}

              {detection.measurements && detection.measurements !== 'N/A' && (
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Measurements</Text>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{detection.measurements}</Text>
                  {detection.measurements_source && (
                    <Text size="xs" c="dimmed" mt="xs">Source: {detection.measurements_source}</Text>
                  )}
                </div>
              )}
            </Stack>
          </Paper>
        )}

        {/* Pricing Data */}
        {(detection.SnaptoSell_suggestion || detection.ebay_market || detection.facebook_market || detection.craigslist_market) && (
          <Paper shadow="sm" p="xl" withBorder>
            <Title order={3} mb="md">Pricing Analysis</Title>
            <Stack gap="lg">
              
              {/* Marketplace Data Grid */}
              {(detection.ebay_market || detection.facebook_market || detection.craigslist_market || 
                detection.poshmark_market || detection.depop_market || detection.mercari_market) && (
                <div>
                  <Text fw={600} size="lg" mb="md">Marketplace Pricing Data</Text>
                  <Grid>
                    {Object.entries(detection)
                      .filter(([key]) => key.endsWith('_market'))
                      .map(([key, data]: [string, any]) => {
                        if (!data || !data.average || data.sample_size === 0) return null;

                        const marketplaceNames: Record<string, string> = {
                          'poshmark_market': 'Poshmark',
                          'depop_market': 'Depop',
                          'ebay_fashion_market': 'eBay Fashion',
                          'thredup_market': 'ThredUp',
                          'mercari_market': 'Mercari',
                          'facebook_market': 'Facebook Marketplace',
                          'ebay_market': 'eBay',
                          'craigslist_market': 'Craigslist',
                        };

                        const marketName = marketplaceNames[key] || key
                          .replace('_market', '')
                          .split('_')
                          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ');

                        return (
                          <Grid.Col key={key} span={{ base: 12, sm: 6, md: 4 }}>
                            <Card withBorder p="md">
                              <Text fw={600} size="sm" mb="xs">
                                {marketName}
                              </Text>
                              <Stack gap="xs">
                                <Group justify="apart">
                                  <Text size="sm" c="dimmed">Lowest:</Text>
                                  <Text fw={500}>{data.lowest}</Text>
                                </Group>
                                <Group justify="apart">
                                  <Text size="sm" c="dimmed">Highest:</Text>
                                  <Text fw={500}>{data.highest}</Text>
                                </Group>
                                <Group justify="apart">
                                  <Text size="sm" c="dimmed">Average:</Text>
                                  <Text fw={600} c="green">{data.average}</Text>
                                </Group>
                                <Text size="xs" c="dimmed" mt="xs">
                                  Based on {data.sample_size} listings
                                </Text>
                              </Stack>
                            </Card>
                          </Grid.Col>
                        );
                      })}
                  </Grid>
                </div>
              )}

              {/* SnaptoSell Recommendation */}
              {detection.SnaptoSell_suggestion && (
                <div>
                  <Text fw={600} size="lg" mb="md">💡 SnaptoSell Recommendation</Text>
                  <Card withBorder p="md" style={{ background: 'var(--mantine-color-blue-0)' }}>
                    <Stack gap="sm">
                      {detection.SnaptoSell_suggestion.typical_resale_price && (
                        <Group justify="apart">
                          <Text fw={500}>Typical Resale Price:</Text>
                          <Text fw={700} size="lg" c="green">
                            {detection.SnaptoSell_suggestion.typical_resale_price}
                          </Text>
                        </Group>
                      )}
                      {detection.SnaptoSell_suggestion.price_range && (
                        <Group justify="apart">
                          <Text fw={500}>Price Range:</Text>
                          <Text fw={600}>{detection.SnaptoSell_suggestion.price_range}</Text>
                        </Group>
                      )}
                      {detection.SnaptoSell_suggestion.confidence && (
                        <Group justify="apart">
                          <Text fw={500}>Confidence:</Text>
                          <Badge
                            color={
                              detection.SnaptoSell_suggestion.confidence === 'high' || detection.SnaptoSell_suggestion.confidence === 'High'
                                ? 'green'
                                : detection.SnaptoSell_suggestion.confidence === 'medium' || detection.SnaptoSell_suggestion.confidence === 'Medium'
                                ? 'yellow'
                                : 'orange'
                            }
                          >
                            {detection.SnaptoSell_suggestion.confidence.toUpperCase()}
                          </Badge>
                        </Group>
                      )}
                      {detection.SnaptoSell_suggestion.pricing_notes && (
                        <Text size="sm" c="dimmed" mt="xs">
                          {detection.SnaptoSell_suggestion.pricing_notes}
                        </Text>
                      )}
                      {detection.SnaptoSell_suggestion.notes && (
                        <Text size="sm" c="dimmed" mt="xs">
                          {detection.SnaptoSell_suggestion.notes}
                        </Text>
                      )}
                    </Stack>
                  </Card>
                </div>
              )}

              {/* Original Retail Price */}
              {detection.original_retail_price && detection.original_retail_price !== 'Not available' && (
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Original Retail Price</Text>
                  <Text fw={600} size="lg">{detection.original_retail_price}</Text>
                </div>
              )}

              {/* Pricing Strategy */}
              {detection.pricing_strategy && (
                <Alert icon={<IconInfoCircle />} color="blue" variant="light">
                  <Text fw={600} mb="xs">Pricing Strategy</Text>
                  <Text size="sm">{detection.pricing_strategy}</Text>
                </Alert>
              )}

              {/* Seasonal Guidance */}
              {detection.seasonal_pricing_guidance && (
                <Alert icon={<IconCalendar />} color="orange" variant="light">
                  <Text fw={600} mb="xs">Seasonal Pricing Guidance</Text>
                  <Text size="sm">{detection.seasonal_pricing_guidance}</Text>
                </Alert>
              )}

              {/* Platform Recommendations */}
              {detection.platform_recommendations && detection.platform_recommendations.length > 0 && (
                <div>
                  <Text fw={600} mb="md">Recommended Platforms</Text>
                  <Stack gap="sm">
                    {detection.platform_recommendations.map((platform, idx) => (
                      <Card key={idx} withBorder p="md">
                        <Group>
                          <ThemeIcon size="md" color="green">
                            <IconShoppingCart size={18} />
                          </ThemeIcon>
                          <div style={{ flex: 1 }}>
                            <Text fw={600}>{platform.platform}</Text>
                            <Text size="sm" c="dimmed">{platform.reason}</Text>
                          </div>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </div>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

export default DetectionDetailPage;
