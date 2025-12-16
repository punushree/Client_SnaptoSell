import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Stepper,
  Alert,
  TextInput,
  Textarea,
  Image,
  Grid,
  Badge,
  Card,
  Loader,
  Modal,
  ActionIcon,
  Progress,
  Select,
  useMantineTheme,
  Flex,
  Box,
  Center,
  Divider,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Dropzone } from "@mantine/dropzone";
import "@mantine/dropzone/styles.css";
import {
  IconCamera,
  IconUpload,
  IconTrash,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
  IconArrowRight,
  IconArrowLeft,
  IconDeviceDesktop,
  IconShirt,
  IconPackage,
  IconCloudUpload,
  IconSearch,
  IconShieldCheck,
  IconCurrencyDollar,
  IconCircleCheck,
} from "@tabler/icons-react";
import ProductAnalysisUI from "@/components/ProductAnalysisUI";
import ProductPricing from "@/components/ProductPricing";
import AIMarketplacePricing from "@/components/AIMarketplacePricing";
import SampleImages from "@/components/SampleImages";

interface CategoryData {
  category: string;
  confidence_score: number;
  detected_product_type: string;
  reasoning: string;
}

interface IdentificationData {
  identified_product: string;
  brand: string;
  model: string;
  color_variants: string;
  condition_rating: string;
  estimated_year: string;
  short_description: string;
  confidence_score: number;
  // Dynamic metadata fields - can include any field returned by AI
  [key: string]: any;
}

interface VerificationData {
  authenticity_status: string;
  verification_confidence: number;
  authentication_summary: string;
  authentic_markers_found?: string[];
  red_flags_found?: string[];
  brand_verification?: string;
  official_sources_checked?: string[];
  authenticity_details?: string;
  retail_price_reference?: string;
  market_availability?: string;
  recommendations?: string;
  // Legacy fields for backwards compatibility
  specs_match?: boolean;
  authenticity_warnings?: string[];
  verification_summary?: string;
  // Dynamic fields from AI response
  [key: string]: any;
}

const DetectPage = () => {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Stepper state
  const [active, setActive] = useState(0);
  
  // Camera & images
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // Form data
  const [description, setDescription] = useState("");
  
  // API responses
  const [uuid, setUuid] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [identificationData, setIdentificationData] = useState<IdentificationData | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  
  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Editable product data
  const [editedProduct, setEditedProduct] = useState<Partial<IdentificationData>>({});
  
  // Pricing data from eBay
  const [pricingData, setPricingData] = useState<any>(null);

  // Sample images modal state
  const [showSampleImages, setShowSampleImages] = useState(false);

  // Execution time tracking
  const [timeBreakdown, setTimeBreakdown] = useState<{
    stage0?: number;
    stage1?: number;
    stage2?: number;
    stage3?: number;
  }>({});

  // Validation errors and retry
  const [validationErrors, setValidationErrors] = useState<Array<{
    type: string;
    message: string;
    details?: any;
  }>>([]);
  const [validationSuggestions, setValidationSuggestions] = useState<string[]>([]);
  const [showRetryModal, setShowRetryModal] = useState(false);

  // Start camera
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      setIsLoading(true);
      if (stream) stream.getTracks().forEach((t) => t.stop());

      const isMobileDevice = typeof window !== "undefined" && window.innerWidth < 768;
      const actualMode = isMobileDevice ? mode : "user";
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: actualMode } },
      });

      setStream(mediaStream);
      setFacingMode(actualMode);
      setIsLoading(false);
    } catch (err) {
      setError("Camera permission denied. Please allow camera access.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => setIsVideoReady(true);
    }
  }, [stream]);

  // Browser history integration
  useEffect(() => {
    // Initialize history state on mount
    if (window.history.state?.step === undefined) {
      window.history.replaceState({ step: 0 }, '', window.location.pathname);
    }

    // Handle browser back/forward buttons
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.step !== undefined) {
        setActive(event.state.step);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update history when step changes
  useEffect(() => {
    if (window.history.state?.step !== active) {
      window.history.pushState({ step: active }, '', window.location.pathname);
    }
  }, [active]);

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsVideoReady(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && capturedImages.length < 5) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (facingMode === "user") {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95);

      setCapturedImages((prev) => [...prev, imageDataUrl]);
    }
  };

  const deleteImage = (index: number) =>
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).map((file: File) =>
      URL.createObjectURL(file)
    );

    setCapturedImages((prev) => {
      const remainingSlots = 5 - prev.length;
      return [...prev, ...newImages.slice(0, remainingSlots)];
    });

    e.target.value = "";
  };

  // Convert image URL to File object
  const imageURLtoFile = async (
    imageUrl: string,
    filename: string
  ): Promise<File> => {
    if (imageUrl.startsWith("blob:")) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type || "image/jpeg" });
    }

    if (imageUrl.startsWith("data:")) {
      const arr = imageUrl.split(",");
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const base64Data = arr[1];

      try {
        const bstr = atob(base64Data);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      } catch (error) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type || mime });
      }
    }

    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  };

  // Step 1: Upload images and detect category
  const handleCategoryDetection = async () => {
    if (capturedImages.length < 1 || capturedImages.length > 5) {
      setError("Please upload between 1 and 5 images.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("description", description.trim());

      const filePromises = capturedImages.map((imageUrl, index) =>
        imageURLtoFile(imageUrl, `image-${index}.jpg`)
      );
      const files = await Promise.all(filePromises);

      files.forEach((file, index) => {
        formData.append(`image${index}`, file);
      });

      const response = await fetch("/api/detect/category", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      const executionTime = (Date.now() - startTime) / 1000;

      // Track execution time
      setTimeBreakdown(prev => ({ ...prev, stage0: executionTime }));

      if (!response.ok) {
        throw new Error(result.error || "Category detection failed");
      }

      if (result.success) {
        setUuid(result.data.uuid);
        setCategoryData(result.data.categoryData);
        setActive(1); // Move to step 2
      } else {
        throw new Error(result.error || "Category detection failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Identify product
  const handleIdentification = async () => {
    if (!uuid || !categoryData) {
      setError("Missing required data");
      return;
    }

    setIsLoading(true);
    setError(null);
    setValidationErrors([]);
    setValidationSuggestions([]);

    const startTime = Date.now();

    try {
      const response = await fetch("/api/detect/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid,
          category: categoryData.category,
          userText: description,
        }),
      });

      const result = await response.json();
      const executionTime = (Date.now() - startTime) / 1000;

      // Track execution time
      setTimeBreakdown(prev => ({ ...prev, stage1: executionTime }));

      if (!response.ok) {
        throw new Error(result.error || "Identification failed");
      }

      if (result.success) {
        const identData = result.data.identification;
        
        // Check if validation data is included
        if (result.data.validation && !result.data.validation.valid) {
          // Show validation errors
          setValidationErrors(result.data.validation.errors || []);
          setValidationSuggestions(result.data.validation.suggestions || []);
          setShowRetryModal(true);
          return;
        }

        setIdentificationData(identData);
        setEditedProduct(identData);
        
        // For 'other' category, skip to completion (no verification/pricing needed)
        if (categoryData.category === 'other') {
          setActive(5); // Skip directly to completion
        } else {
          setActive(2); // Move to step 3 (review for electronics/fashion)
        }
      } else {
        throw new Error(result.error || "Identification failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify product (optional for electronics)
  const handleVerification = async () => {
    if (!uuid || !categoryData) {
      setError("Missing required data");
      return;
    }

    setIsLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      const response = await fetch("/api/detect/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid,
          category: categoryData.category,
        }),
      });

      const result = await response.json();
      const executionTime = (Date.now() - startTime) / 1000;

      // Track execution time
      setTimeBreakdown(prev => ({ ...prev, stage2: executionTime }));

      if (!response.ok) {
        throw new Error(result.error || "Verification failed");
      }

      if (result.success) {
        setVerificationData(result.data.verification);
        window.history.pushState({ step: 3 }, '', window.location.pathname);
        setActive(3); // Move to verification results step
      } else {
        throw new Error(result.error || "Verification failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Confirm and move to pricing
  const handleConfirmation = async () => {
    if (!uuid) {
      setError("Missing UUID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/detect/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid,
          isCorrect: true,
          updatedData: editedProduct,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Confirmation failed");
      }

      if (result.success) {
        // Move to pricing step
        window.history.pushState({ step: 4 }, '', window.location.pathname);
        setActive(4); // Move to pricing step
      } else {
        throw new Error(result.error || "Confirmation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4: Handle pricing completion
  const handlePricingComplete = () => {
    window.history.pushState({ step: 5 }, '', window.location.pathname);
    setActive(5); // Move to completion
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "electronics":
        return <IconDeviceDesktop size={20} />;
      case "fashion":
        return <IconShirt size={20} />;
      default:
        return <IconPackage size={20} />;
    }
  };

  const resetFlow = () => {
    setActive(0);
    setCapturedImages([]);
    setDescription("");
    setUuid(null);
    setCategoryData(null);
    setIdentificationData(null);
    setVerificationData(null);
    setEditedProduct({});
    setError(null);
    stopCamera();
  };

  return (
    <Container size="xl" p="md">
      <Title order={1} mb="xs">
        Snap to Detect Product
      </Title>
      
      <Text c="dimmed" mb="sm">
        Capture a photo of the product to detect it and find its price
      </Text>

      <Text mb="xs">
        Capture/Upload a minimum 3 to 5 photos of the product.
      </Text>

      <Text mb="xs">
        Capture/Upload a photos form both sides like front side, back side, left side, right side of the product. Click here for priview sample images
        <Button
          variant="light"
          ml="xs"
          size="xs"
          onClick={() => setShowSampleImages(true)}
        >
          View Sample Images
        </Button>
      </Text>

      <Text mb="xl">
        After capture/upload a photos and add product details.
      </Text>

      {/* Sample Images Modal */}
      <Modal
        opened={showSampleImages}
        onClose={() => setShowSampleImages(false)}
        title={
          <Text fw={600} size="lg">
            Sample Images
          </Text>
        }
        size="xl"
        centered
      >
        <SampleImages />
      </Modal>

      {error && (
        <Alert
          icon={<IconAlertCircle />}
          color="red"
          mb="md"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Flex gap="md" align="flex-start" direction={{ base: 'row', md: 'column' }}>
        {/* Stepper - Vertical on mobile/tablet, Horizontal on desktop */}
        <Box style={{ 
          flexShrink: 0, 
          width: isMobile ? 'auto' : '100%',
          overflowX: isMobile ? 'visible' : 'auto'
        }}>
          <Stepper 
            active={active} 
            onStepClick={() => {}} // Disable direct click navigation
            mb={isMobile ? 0 : "xl"}
            orientation={isMobile ? "vertical" : "horizontal"}
            size={isMobile ? "xs" : "sm"}
            styles={isMobile ? {
              stepBody: {
                display: 'none',
              },
              step: {
                padding: '8px 0',
                minHeight: '36px',
              },
              stepLabel: {
                display: 'none',
              },
              stepDescription: {
                display: 'none',
              },
              root: {
                // Adjust height based on category (fewer steps for 'other')
                minHeight: categoryData?.category === 'other' ? '180px' : '250px',
              }
            } : undefined}
          >
            <Stepper.Step
              label="Upload"
              description="Capture or upload images"
              icon={<IconCloudUpload size={18} />}
            />
            <Stepper.Step
              label="Category"
              description="Product category detected"
              icon={getCategoryIcon(categoryData?.category || "")}
            />
            <Stepper.Step
              label="Identify"
              description="Review product details"
              icon={<IconSearch size={18} />}
            />
            {/* Conditionally show Verify and Pricing steps (not for 'other' category) */}
            {categoryData?.category && categoryData.category !== 'other' && (
              <>
                <Stepper.Step
                  label="Verify"
                  description={categoryData?.category === 'fashion' ? 'Authentication check' : 'Authenticity check'}
                  icon={<IconShieldCheck size={18} />}
                />
                <Stepper.Step
                  label="Pricing"
                  description="Market price analysis"
                  icon={<IconCurrencyDollar size={18} />}
                />
              </>
            )}
            {/* For 'other' category - show completion step instead */}
            {categoryData?.category === 'other' && (
              <Stepper.Step
                label="Complete"
                description="Analysis complete"
                icon={<IconCircleCheck size={18} />}
              />
            )}
          </Stepper>
        </Box>

        {/* Main Content Area */}
        <Box style={{ flex: 1, width: '100%' }}>
          {/* Step 0: Upload */}
          {active === 0 && (
          <Paper shadow="sm" p="md" withBorder mt="md">
            <Stack gap="md">
              <Text fw={500}>Step 1: Upload Product Images</Text>
              <Text size="sm" c="dimmed">
                Upload or capture 1-5 clear images of your product from different angles
              </Text>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />

              <Group align="flex-start" gap="md" wrap="wrap">
                {/* Left side - Camera and controls */}
                <Stack
                  gap="md"
                  style={{
                    flex: "1 1 calc(50% - 0.5rem)",
                    minWidth: "min(100%, 400px)",
                  }}
                >
                  <Box
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "clamp(300px, 50vw, 500px)",
                      background: stream ? "#000" : "#f1f3f5",
                      borderRadius: 8,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!stream ? (
                      <Stack align="center" gap="md">
                        <IconCamera size={64} color="#adb5bd" />
                        <Text size="sm" c="dimmed">
                          Camera preview will appear here
                        </Text>
                        <Button
                          leftSection={<IconCamera />}
                          onClick={() => startCamera()}
                          loading={isLoading}
                        >
                          Start Camera
                        </Button>
                      </Stack>
                    ) : (
                      <>
                        {!isVideoReady && (
                          <Text c="white">Loading camera...</Text>
                        )}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: isVideoReady ? "block" : "none",
                            transform:
                              facingMode === "user" ? "scaleX(-1)" : "none",
                          }}
                        />
                      </>
                    )}
                  </Box>

                  {stream && (
                    <Group justify="center" wrap="wrap" w="100%">
                      <Button
                        leftSection={<IconCamera />}
                        onClick={captureImage}
                        disabled={!isVideoReady || capturedImages.length >= 5}
                      >
                        Capture Image
                      </Button>
                      <Button
                        variant="outline"
                        color="red"
                        onClick={stopCamera}
                      >
                        Stop Camera
                      </Button>
                    </Group>
                  )}
                </Stack>

                {/* Right side - Upload options and other content */}
                <Stack
                  gap="md"
                  style={{
                    flex: "1 1 calc(50% - 0.5rem)",
                    minWidth: "min(100%, 400px)",
                  }}
                >
                  {/* Captured Images Preview - Show in right column */}
                  {capturedImages.length > 0 && (
                    <Box style={{ width: "100%" }}>
                      <Group justify="space-between" mb="sm">
                        <Text fw={600}>
                          Captured Images ({capturedImages.length}/5)
                        </Text>
                        <Button
                          variant="light"
                          color="red"
                          size="xs"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => setCapturedImages([])}
                        >
                          Reset All
                        </Button>
                      </Group>
                      <Grid gutter="sm">
                        {capturedImages.map((img, index) => (
                          <Grid.Col key={index} span={{ base: 6, sm: 6 }}>
                            <Card
                              p={0}
                              radius="md"
                              withBorder
                              style={{
                                position: "relative",
                                overflow: "hidden",
                              }}
                            >
                              <Badge
                                color="blue"
                                size="xs"
                                radius="sm"
                                style={{
                                  position: "absolute",
                                  top: 6,
                                  left: 6,
                                  zIndex: 10,
                                }}
                              >
                                {index + 1}
                              </Badge>
                              <Image
                                src={img}
                                fit="cover"
                                h={{ base: 120, sm: 150, md: 180 }}
                                w="100%"
                                style={{
                                  display: "block",
                                }}
                              />
                              <ActionIcon
                                color="red"
                                variant="filled"
                                radius="xl"
                                p={3}
                                style={{
                                  position: "absolute",
                                  top: 6,
                                  right: 6,
                                }}
                                onClick={() => deleteImage(index)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Card>
                          </Grid.Col>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Drag and Drop Zone */}
                  <Divider
                    label="OR upload without camera"
                    labelPosition="center"
                  />

                  <Dropzone
                    onDrop={(files) => {
                      const newImages = files.map((file) =>
                        URL.createObjectURL(file)
                      );
                      setCapturedImages((prev) => {
                        const remainingSlots = 5 - prev.length;
                        return [...prev, ...newImages.slice(0, remainingSlots)];
                      });
                    }}
                    onReject={() => {
                      setError("Please upload valid image files (max 5MB each)");
                    }}
                    maxSize={5 * 1024 ** 2}
                    accept={{ "image/*": [".jpeg", ".jpg", ".png", ".webp"] }}
                    multiple
                    disabled={capturedImages.length >= 5}
                  >
                    <Group
                      justify="center"
                      gap="sm"
                      mih={100}
                      style={{ pointerEvents: "none" }}
                    >
                      <Dropzone.Accept>
                        <IconCloudUpload
                          size={32}
                          stroke={1.5}
                          color="var(--mantine-color-blue-6)"
                        />
                      </Dropzone.Accept>
                      <Dropzone.Reject>
                        <IconX
                          size={32}
                          stroke={1.5}
                          color="var(--mantine-color-red-6)"
                        />
                      </Dropzone.Reject>
                      <Dropzone.Idle>
                        <IconCloudUpload
                          size={32}
                          stroke={1.5}
                          color="var(--mantine-color-gray-4)"
                        />
                      </Dropzone.Idle>

                      <div>
                        <Text size="sm" inline fw={500}>
                          Drag images here or click to select
                        </Text>
                        <Text size="xs" c="dimmed" inline>
                          {" "}
                          (max 5MB each)
                        </Text>
                      </div>
                    </Group>
                  </Dropzone>
                </Stack>
              </Group>

              <Textarea
                label="Product Description (Optional)"
                placeholder="e.g., iPhone 14 Pro 256GB Space Black"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              <Group justify="flex-end">
                <Button
                  rightSection={<IconArrowRight />}
                  onClick={handleCategoryDetection}
                  loading={isLoading}
                  disabled={capturedImages.length === 0}
                >
                  Detect Category
                </Button>
              </Group>
            </Stack>
          </Paper>
          )}

          {/* Step 1: Category */}
          {active === 1 && (
          <Paper shadow="sm" p="md" withBorder mt="md">
            <Stack gap="md">
              <Text fw={500}>Step 2: Category Detection Result</Text>

              {categoryData && (
                <Card withBorder>
                  <Group justify="apart" mb="md">
                    <Group>
                      {getCategoryIcon(categoryData.category)}
                      <Text fw={600} size="lg">
                        {categoryData.category.charAt(0).toUpperCase() +
                          categoryData.category.slice(1)}
                      </Text>
                    </Group>
                    <Badge color="green">{categoryData.confidence_score}% confident</Badge>
                  </Group>
                  <Text size="sm" c="dimmed" mb="xs">
                    <strong>Detected as:</strong> {categoryData.detected_product_type}
                  </Text>
                  <Text size="sm" c="dimmed">
                    <strong>Reasoning:</strong> {categoryData.reasoning}
                  </Text>
                </Card>
              )}

              <Group justify="space-between">
                <Button
                  leftSection={<IconArrowLeft />}
                  variant="light"
                  onClick={() => setActive(0)}
                >
                  Back
                </Button>
                <Button
                  rightSection={<IconArrowRight />}
                  onClick={handleIdentification}
                  loading={isLoading}
                >
                  Identify Product
                </Button>
              </Group>
            </Stack>
          </Paper>
          )}

          {/* Step 2: Identify */}
          {active === 2 && (
          <Paper shadow="sm" p="md" withBorder mt="md">
            <Stack gap="md">
              <Text fw={500}>Step 3: Review & Edit Product Details</Text>

              {identificationData && (
                <Card withBorder>
                  <Group justify="apart" mb="md">
                    <Text fw={600} size="lg">
                      {identificationData.identified_product}
                    </Text>
                    <Badge color="blue">
                      {identificationData.confidence_score}% confident
                    </Badge>
                  </Group>

                  <Grid>
                    {/* Core Fields */}
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Product Name"
                        value={editedProduct.identified_product || ""}
                        onChange={(e) =>
                          setEditedProduct({
                            ...editedProduct,
                            identified_product: e.target.value,
                          })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Brand"
                        value={editedProduct.brand || ""}
                        onChange={(e) =>
                          setEditedProduct({ ...editedProduct, brand: e.target.value })
                        }
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Model"
                        value={editedProduct.model || ""}
                        onChange={(e) =>
                          setEditedProduct({ ...editedProduct, model: e.target.value })
                        }
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Color"
                        value={editedProduct.color_variants || ""}
                        onChange={(e) =>
                          setEditedProduct({
                            ...editedProduct,
                            color_variants: e.target.value,
                          })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        label="Product Condition"
                        placeholder="Select condition"
                        value={editedProduct.product_condition || ""}
                        onChange={(value) =>
                          setEditedProduct({
                            ...editedProduct,
                            product_condition: value || "",
                          })
                        }
                        data={[
                          { value: "new", label: "New" },
                          { value: "like new", label: "Like New" },
                          { value: "good", label: "Good" },
                          { value: "fair", label: "Fair" },
                          { value: "poor", label: "Poor" },
                        ]}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        label="Condition Rating"
                        value={editedProduct.condition_rating || ""}
                        onChange={(value) =>
                          setEditedProduct({
                            ...editedProduct,
                            condition_rating: value || "",
                          })
                        }
                        data={
                          categoryData?.category === 'fashion'
                            ? [
                                { value: "NWT", label: "NWT (New With Tags)" },
                                { value: "NWOT", label: "NWOT (New Without Tags)" },
                                { value: "like new", label: "Like New" },
                                { value: "excellent pre-owned condition", label: "Excellent Pre-Owned" },
                                { value: "very good pre-owned condition", label: "Very Good Pre-Owned" },
                                { value: "good pre-owned condition", label: "Good Pre-Owned" },
                                { value: "fair pre-owned condition", label: "Fair Pre-Owned" },
                                { value: "poor condition", label: "Poor Condition" },
                              ]
                            : [
                                { value: "Excellent", label: "Excellent" },
                                { value: "Good", label: "Good" },
                                { value: "Fair", label: "Fair" },
                                { value: "Poor", label: "Poor" },
                              ]
                        }
                        searchable
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Estimated Year"
                        placeholder="e.g., 2023"
                        value={editedProduct.estimated_year || ""}
                        onChange={(e) =>
                          setEditedProduct({
                            ...editedProduct,
                            estimated_year: e.target.value,
                          })
                        }
                      />
                    </Grid.Col>

                    {/* Fashion-specific: Brand Tier */}
                    {categoryData?.category === 'fashion' && (
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label="Brand Tier"
                          value={editedProduct.brand_tier || ""}
                          onChange={(value) =>
                            setEditedProduct({
                              ...editedProduct,
                              brand_tier: value || "",
                            })
                          }
                          data={[
                            { value: "ultra-luxury", label: "💎 Ultra-Luxury (Hermès, Chanel, Louis Vuitton)" },
                            { value: "luxury", label: "✨ Luxury (Gucci, Prada, Burberry)" },
                            { value: "premium designer", label: "🌟 Premium Designer (Ralph Lauren, Calvin Klein)" },
                            { value: "contemporary", label: "Contemporary (Zara, H&M, Mango)" },
                            { value: "athletic premium", label: "Athletic Premium (Lululemon, Arc'teryx)" },
                            { value: "athletic mainstream", label: "Athletic (Nike, Adidas, Puma)" },
                            { value: "streetwear", label: "Streetwear (Supreme, Off-White)" },
                            { value: "fast fashion", label: "Fast Fashion (Shein, Forever 21)" },
                            { value: "vintage", label: "🕰️ Vintage" },
                            { value: "unbranded", label: "Unbranded" },
                          ]}
                          searchable
                        />
                      </Grid.Col>
                    )}

                    {/* Electronics-specific: Carrier Lock Status */}
                    {categoryData?.category === 'electronics' && (
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label="Carrier Lock Status"
                          value={editedProduct.carrier_lock_status || ""}
                          onChange={(value) =>
                            setEditedProduct({
                              ...editedProduct,
                              carrier_lock_status: value || "",
                            })
                          }
                          data={[
                            { value: "unlocked", label: "Unlocked" },
                            { value: "locked", label: "Carrier Locked" },
                            { value: "unknown", label: "Unknown" },
                          ]}
                        />
                      </Grid.Col>
                    )}

                    {/* Dynamic Metadata Fields */}
                    {Object.entries(identificationData)
                      .filter(([key, value]) => {
                        // Skip core fields and internal fields
                        const skipFields = [
                          'identified_product', 'brand', 'model', 'color_variants',
                          'condition_rating', 'product_condition', 'estimated_year', 'short_description',
                          'confidence_score', 'uuid', 'category', 'status',
                          'brand_tier', 'carrier_lock_status', // Now handled as explicit selects
                          'clarity_feedback', 'possible_confusion', 'image_text_match', // Validation fields
                          'missing_details', 'preliminary_authenticity', 'extraction_notes' // Internal fields
                        ];
                        
                        // Filter out empty values, null, undefined, and skip fields
                        return !skipFields.includes(key) && 
                               value !== null && 
                               value !== undefined && 
                               value !== '' &&
                               String(value).trim() !== '';
                      })
                      .map(([key, value]) => {
                        // Format field label (e.g., "material_composition" -> "Material Composition")
                        const label = key
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');

                        return (
                          <Grid.Col key={key} span={{ base: 12, sm: 6 }}>
                            <TextInput
                              label={label}
                              value={editedProduct[key] || ""}
                              onChange={(e) =>
                                setEditedProduct({
                                  ...editedProduct,
                                  [key]: e.target.value,
                                })
                              }
                            />
                          </Grid.Col>
                        );
                      })}

                    <Grid.Col span={12}>
                      <Textarea
                        label="Description"
                        value={editedProduct.short_description || ""}
                        onChange={(e) =>
                          setEditedProduct({
                            ...editedProduct,
                            short_description: e.target.value,
                          })
                        }
                        rows={4}
                      />
                    </Grid.Col>
                  </Grid>
                </Card>
              )}

              <Group justify="space-between">
                <Button
                  leftSection={<IconArrowLeft />}
                  variant="light"
                  onClick={() => setActive(1)}
                >
                  Back
                </Button>
                <Button
                  rightSection={<IconArrowRight />}
                  onClick={handleVerification}
                  loading={isLoading}
                  color="blue"
                >
                  Continue to Verification
                </Button>
              </Group>
            </Stack>
          </Paper>
          )}

          {/* Step 3: Verify */}
          {active === 3 && (
          <Paper shadow="sm" p="md" withBorder mt="md">
            <Stack gap="md">
              <Group gap="xs">
                <IconShieldCheck size={24} />
                <Text fw={500} size="lg">Step 4: Product Authentication & Verification</Text>
              </Group>

              {isLoading && (
                <Stack align="center" gap="md" py="xl">
                  <Loader size="lg" />
                  <Stack gap="xs" align="center">
                    <Text size="sm" c="dimmed">Verifying product authenticity via web search...</Text>
                    <Text size="xs" c="dimmed">🔍 Checking brand authenticity and detecting counterfeits...</Text>
                  </Stack>
                </Stack>
              )}

              {verificationData && !isLoading && (
                <Stack gap="md">
                  {/* Status Badge with Summary */}
                  <Card withBorder p="md">
                    <Group justify="space-between" mb="md">
                      <Group gap="xs">
                        {verificationData.authenticity_status?.toLowerCase().includes('authentic') || 
                         verificationData.authenticity_status?.toLowerCase().includes('verified') ? (
                          <IconCheck size={24} color="green" />
                        ) : (
                          <IconAlertCircle size={24} color="orange" />
                        )}
                        <Text fw={600} size="lg">
                          {verificationData.authenticity_status}
                        </Text>
                      </Group>
                      <Badge
                        size="lg"
                        color={
                          verificationData.verification_confidence >= 80
                            ? "green"
                            : verificationData.verification_confidence >= 60
                            ? "yellow"
                            : "orange"
                        }
                      >
                        Confidence: {verificationData.verification_confidence}%
                      </Badge>
                    </Group>

                    <Text size="sm" c="dimmed">
                      {verificationData.authentication_summary || verificationData.verification_summary}
                    </Text>
                  </Card>

                  {/* Brand Tier Context (Fashion Only) */}
                  {categoryData?.category === 'fashion' && identificationData?.brand_tier && (
                    <Alert
                      color={
                        identificationData.brand_tier === 'ultra-luxury' || identificationData.brand_tier === 'luxury'
                          ? 'yellow'
                          : 'blue'
                      }
                      icon={
                        identificationData.brand_tier === 'ultra-luxury' ? '💎' :
                        identificationData.brand_tier === 'luxury' ? '✨' :
                        identificationData.brand_tier === 'vintage' ? '🕰️' :
                        identificationData.brand_tier === 'fast fashion' ? '👕' : '🌟'
                      }
                    >
                      <Text fw={600} size="sm">
                        {identificationData.brand_tier === 'ultra-luxury' && 'This is an ultra-luxury brand. Authentication is critical due to high counterfeit risk.'}
                        {identificationData.brand_tier === 'luxury' && 'This is a luxury brand. Careful authentication recommended.'}
                        {identificationData.brand_tier === 'premium designer' && 'This is a premium designer brand. Authentication adds value.'}
                        {identificationData.brand_tier === 'fast fashion' && 'This is a fast fashion brand. Focus on condition over authenticity.'}
                        {identificationData.brand_tier === 'vintage' && 'This is a vintage item. Age and condition are key factors.'}
                        {identificationData.brand_tier === 'unbranded' && 'This is an unbranded item. Authentication not applicable.'}
                        {!['ultra-luxury', 'luxury', 'premium designer', 'fast fashion', 'vintage', 'unbranded'].includes(identificationData.brand_tier) && 'Brand tier provides context for pricing and authentication.'}
                      </Text>
                    </Alert>
                  )}

                  {/* Authentic Markers Found */}
                  {verificationData.authentic_markers_found && verificationData.authentic_markers_found.length > 0 && (
                    <Card withBorder p="md">
                      <Group gap="xs" mb="sm">
                        <IconCheck size={18} color="green" />
                        <Text fw={600} c="green">✅ Authentic Markers:</Text>
                      </Group>
                      <Stack gap="xs">
                        {verificationData.authentic_markers_found.map((marker: string, idx: number) => (
                          <Text key={idx} size="sm" pl="md">
                            • {marker}
                          </Text>
                        ))}
                      </Stack>
                    </Card>
                  )}

                  {/* Red Flags Found */}
                  {verificationData.red_flags_found && verificationData.red_flags_found.length > 0 && 
                   verificationData.red_flags_found[0]?.toLowerCase() !== 'none' && (
                    <Alert icon={<IconAlertCircle />} color="red" title="⚠️ Red Flags Detected">
                      <Stack gap="xs">
                        {verificationData.red_flags_found.map((flag: string, idx: number) => (
                          <Text key={idx} size="sm">
                            • {flag}
                          </Text>
                        ))}
                      </Stack>
                    </Alert>
                  )}

                  {/* Legacy authenticity warnings (fallback) */}
                  {!verificationData.red_flags_found && verificationData.authenticity_warnings && 
                   verificationData.authenticity_warnings.length > 0 && (
                    <Alert icon={<IconAlertCircle />} color="yellow">
                      <Stack gap="xs">
                        <Text fw={600}>Warnings:</Text>
                        {verificationData.authenticity_warnings.map((warning: string, idx: number) => (
                          <Text key={idx} size="sm">
                            • {warning}
                          </Text>
                        ))}
                      </Stack>
                    </Alert>
                  )}

                  {/* Brand Authentication Info */}
                  <Alert color="blue" icon={<IconAlertCircle />}>
                    <Text size="sm" fw={500}>
                      Brand authentication helps ensure accurate pricing.
                    </Text>
                  </Alert>

                  {/* Official Sources Checked (Collapsible) */}
                  {verificationData.official_sources_checked && verificationData.official_sources_checked.length > 0 && (
                    <Card withBorder p="md">
                      <details>
                        <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                          📚 Sources Checked
                        </summary>
                        <Stack gap="xs" mt="sm">
                          {verificationData.official_sources_checked.map((source: string, idx: number) => (
                            <Text key={idx} size="xs" c="dimmed" pl="md">
                              • {source}
                            </Text>
                          ))}
                        </Stack>
                      </details>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {verificationData.recommendations && (
                    <Alert color="yellow" icon={<IconAlertCircle />}>
                      <Text size="sm" fw={500} mb="xs">💡 Recommendations:</Text>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {verificationData.recommendations}
                      </Text>
                    </Alert>
                  )}

                  {/* Additional Details (if available) */}
                  {verificationData.authenticity_details && (
                    <Card withBorder p="md">
                      <Text fw={500} mb="sm">Authenticity Details:</Text>
                      <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                        {verificationData.authenticity_details}
                      </Text>
                    </Card>
                  )}

                  {/* Specs Match Badge (for electronics - legacy) */}
                  {verificationData.specs_match !== undefined && (
                    <Group>
                      <Badge color={verificationData.specs_match ? "green" : "red"}>
                        Specs {verificationData.specs_match ? "Match" : "Mismatch"}
                      </Badge>
                    </Group>
                  )}
                </Stack>
              )}

              <Group justify="space-between" mt="md">
                <Button
                  leftSection={<IconArrowLeft />}
                  variant="light"
                  onClick={() => setActive(2)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  rightSection={<IconArrowRight />}
                  onClick={handleConfirmation}
                  loading={isLoading}
                  color="blue"
                >
                  Continue to Pricing
                </Button>
              </Group>
            </Stack>
          </Paper>
          )}

          {/* Step 4: Pricing */}
          {active === 4 && (
          <Paper shadow="sm" p="md" withBorder mt="md">
            <Stack gap="md">
              <Group gap="xs">
                <IconCurrencyDollar size={24} />
                <Text fw={500} size="lg">Step 5: Market Price Analysis</Text>
              </Group>
              
              {uuid && categoryData ? (
                <AIMarketplacePricing
                  uuid={uuid}
                  category={categoryData.category}
                  onPricingComplete={(data) => {
                    setPricingData(data);
                  }}
                />
              ) : (
                <Alert icon={<IconAlertCircle />} color="yellow">
                  Unable to fetch pricing data. Product UUID not found.
                </Alert>
              )}

              <Group justify="space-between" mt="lg">
                <Button
                  leftSection={<IconArrowLeft />}
                  variant="light"
                  onClick={() => setActive(3)}
                >
                  Back to Verification
                </Button>
                <Button
                  rightSection={<IconCheck />}
                  onClick={handlePricingComplete}
                  color="green"
                >
                  Complete Analysis
                </Button>
              </Group>
            </Stack>
          </Paper>
          )}

          {/* Step 5: Completed */}
          {active === 5 && (
          <Paper shadow="sm" p="md" withBorder mt="md">
            <Stack gap="md">
              <Group justify="center">
                <IconCheck size={48} color="green" />
              </Group>
              <Text fw={600} size="xl" ta="center">
                Product Detection Complete!
              </Text>
              <Text c="dimmed" ta="center">
                Your product has been successfully analyzed and saved.
              </Text>

              {/* Show uploaded images */}
              {capturedImages.length > 0 && (
                <div>
                  <Text fw={500} mb="sm">Uploaded Images</Text>
                  <Grid>
                    {capturedImages.map((img, idx) => (
                      <Grid.Col key={idx} span={{ base: 6, sm: 4, md: 3 }}>
                        <Image src={img} alt={`Product ${idx + 1}`} radius="md" />
                      </Grid.Col>
                    ))}
                  </Grid>
                </div>
              )}

              {/* Category Information */}
              {categoryData && (
                <Card withBorder>
                  <Text fw={600} size="lg" mb="md">
                    Category
                  </Text>
                  <Stack gap="xs">
                    <Group justify="apart">
                      <Text size="sm" c="dimmed">Detected Category:</Text>
                      <Badge size="lg" color="blue">
                        {categoryData.category.toUpperCase()}
                      </Badge>
                    </Group>
                    <Group justify="apart">
                      <Text size="sm" c="dimmed">Product Type:</Text>
                      <Text fw={500}>{categoryData.detected_product_type}</Text>
                    </Group>
                    <Group justify="apart">
                      <Text size="sm" c="dimmed">Confidence:</Text>
                      <Badge color="green">{categoryData.confidence_score}%</Badge>
                    </Group>
                  </Stack>
                </Card>
              )}

              {/* Product Details */}
              {identificationData && (
                <Card withBorder>
                  <Text fw={600} size="lg" mb="md">
                    Product Details
                  </Text>
                  <Stack gap="xs">
                    <Group justify="apart">
                      <Text size="sm" c="dimmed">Product:</Text>
                      <Text fw={500}>{identificationData.identified_product}</Text>
                    </Group>
                    <Group justify="apart">
                      <Text size="sm" c="dimmed">Brand:</Text>
                      <Text fw={500}>{identificationData.brand}</Text>
                    </Group>
                    {identificationData.model && (
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">Model:</Text>
                        <Text fw={500}>{identificationData.model}</Text>
                      </Group>
                    )}
                    {identificationData.color_variants && (
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">Color:</Text>
                        <Text fw={500}>{identificationData.color_variants}</Text>
                      </Group>
                    )}
                    <Group justify="apart">
                      <Text size="sm" c="dimmed">Condition:</Text>
                      <Badge color="blue">{identificationData.condition_rating}</Badge>
                    </Group>
                    {identificationData.product_condition && (
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">Product Condition:</Text>
                        <Badge color={identificationData.product_condition === 'new' ? 'green' : 'yellow'}>
                          {identificationData.product_condition.toUpperCase()}
                        </Badge>
                      </Group>
                    )}
                    {identificationData.estimated_year && (
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">Estimated Year:</Text>
                        <Text fw={500}>{identificationData.estimated_year}</Text>
                      </Group>
                    )}
                    {identificationData.short_description && (
                      <div>
                        <Text size="sm" c="dimmed" mb="xs">Description:</Text>
                        <Text size="sm">{identificationData.short_description}</Text>
                      </div>
                    )}
                    <Group justify="apart">
                      <Text size="sm" c="dimmed">Confidence Score:</Text>
                      <Badge color="green">{identificationData.confidence_score}%</Badge>
                    </Group>
                  </Stack>
                </Card>
              )}

              {/* Verification Results */}
              {verificationData && (
                <Card withBorder>
                  <Text fw={600} size="lg" mb="md">
                    Verification Results
                  </Text>
                  <Stack gap="xs">
                    <Group justify="apart">
                      <Text size="sm" c="dimmed">Authenticity Status:</Text>
                      <Badge 
                        size="lg"
                        color={
                          verificationData.authenticity_status?.toLowerCase().includes('authentic') ||
                          verificationData.authenticity_status?.toLowerCase().includes('verified')
                            ? "green"
                            : verificationData.authenticity_status?.toLowerCase().includes('uncertain')
                            ? "yellow"
                            : "orange"
                        }
                      >
                        {verificationData.authenticity_status}
                      </Badge>
                    </Group>
                    <Group justify="apart">
                      <Text size="sm" c="dimmed">Verification Confidence:</Text>
                      <Badge 
                        color={
                          verificationData.verification_confidence >= 80
                            ? "green"
                            : verificationData.verification_confidence >= 60
                            ? "yellow"
                            : "orange"
                        }
                      >
                        {verificationData.verification_confidence}%
                      </Badge>
                    </Group>
                    {verificationData.authentication_summary && (
                      <div>
                        <Text size="sm" c="dimmed" mb="xs">Summary:</Text>
                        <Text size="sm">{verificationData.authentication_summary}</Text>
                      </div>
                    )}
                  </Stack>
                </Card>
              )}

              {/* AI Marketplace Pricing */}
              {pricingData && (
                <Card withBorder>
                  <Text fw={600} size="lg" mb="md">
                    Market Pricing
                  </Text>
                  
                  {/* Overall Recommendation */}
                  {pricingData.overall_recommendation && (
                    <Alert color="green" icon={<IconCheck />} mb="md">
                      <Text size="sm">{pricingData.overall_recommendation}</Text>
                    </Alert>
                  )}

                  {/* Marketplace Data */}
                  <Grid>
                    {Object.entries(pricingData)
                      .filter(([key]) => key.endsWith('_market'))
                      .map(([key, data]: [string, any]) => {
                        if (!data || !data.average || data.sample_size === 0) return null;
                        
                        const marketName = key
                          .replace('_market', '')
                          .split('_')
                          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ');

                        return (
                          <Grid.Col key={key} span={{ base: 12, sm: 6 }}>
                            <Card withBorder p="sm">
                              <Text fw={600} size="sm" mb="xs">{marketName}</Text>
                              <Group justify="apart">
                                <Text size="xs" c="dimmed">Average:</Text>
                                <Text fw={600} c="green">{data.average}</Text>
                              </Group>
                              <Group justify="apart">
                                <Text size="xs" c="dimmed">Range:</Text>
                                <Text size="xs">{data.lowest} - {data.highest}</Text>
                              </Group>
                              <Text size="xs" c="dimmed" mt="xs">
                                Based on {data.sample_size} listings
                              </Text>
                            </Card>
                          </Grid.Col>
                        );
                      })}
                  </Grid>

                  {/* SnaptoSell Suggestion */}
                  {pricingData.SnaptoSell_suggestion && (
                    <Card withBorder p="md" bg="blue.0" mt="md">
                      <Text fw={600} mb="sm">💡 SnaptoSell Recommendation</Text>
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">Typical Resale Price:</Text>
                        <Text fw={700} c="green" size="lg">
                          {pricingData.SnaptoSell_suggestion.typical_resale_price}
                        </Text>
                      </Group>
                      <Group justify="apart" mt="xs">
                        <Text size="sm" c="dimmed">Price Range:</Text>
                        <Text fw={600}>{pricingData.SnaptoSell_suggestion.price_range}</Text>
                      </Group>
                      <Group justify="apart" mt="xs">
                        <Text size="sm" c="dimmed">Confidence:</Text>
                        <Badge color={
                          pricingData.SnaptoSell_suggestion.confidence === 'high'
                            ? 'green'
                            : pricingData.SnaptoSell_suggestion.confidence === 'medium'
                            ? 'yellow'
                            : 'orange'
                        }>
                          {pricingData.SnaptoSell_suggestion.confidence.toUpperCase()}
                        </Badge>
                      </Group>
                    </Card>
                  )}
                </Card>
              )}

              {/* Execution Time */}
              {Object.keys(timeBreakdown).length > 0 && (
                <Card withBorder>
                  <Text fw={600} size="sm" mb="md">⏱️ Execution Time Breakdown</Text>
                  <Stack gap="xs">
                    {timeBreakdown.stage0 && (
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">Category Detection:</Text>
                        <Text size="sm">{timeBreakdown.stage0.toFixed(2)}s</Text>
                      </Group>
                    )}
                    {timeBreakdown.stage1 && (
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">Identification:</Text>
                        <Text size="sm">{timeBreakdown.stage1.toFixed(2)}s</Text>
                      </Group>
                    )}
                    {timeBreakdown.stage2 && (
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">Verification:</Text>
                        <Text size="sm">{timeBreakdown.stage2.toFixed(2)}s</Text>
                      </Group>
                    )}
                    {timeBreakdown.stage3 && (
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">Pricing:</Text>
                        <Text size="sm">{timeBreakdown.stage3.toFixed(2)}s</Text>
                      </Group>
                    )}
                    <Divider />
                    <Group justify="apart">
                      <Text fw={600}>Total:</Text>
                      <Text fw={600}>
                        {Object.values(timeBreakdown).reduce((a, b) => a + (b || 0), 0).toFixed(2)}s
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              )}

              {/* Navigation buttons */}
              <Group justify="center" gap="md">
                <Button
                  onClick={() => {
                    const report = {
                      ...identificationData,
                      ...verificationData,
                      ...pricingData,
                      analysis_metadata: {
                        timestamp: new Date().toISOString(),
                        analyzer_version: "2.0.0",
                        model_used: "gpt-5.1-2025-11-13",
                        execution_times: timeBreakdown,
                        product_category: categoryData?.category
                      }
                    };
                    const blob = new Blob([JSON.stringify(report, null, 2)], {
                      type: "application/json"
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${categoryData?.category}_analysis_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  leftSection={<IconCloudUpload size={18} />}
                  variant="filled"
                >
                  💾 Download JSON Report
                </Button>
                <Button onClick={resetFlow} variant="light">
                  Analyze Another Product
                </Button>
                <Button onClick={() => navigate("/my-detections")}>
                  View My Detections
                </Button>
              </Group>
            </Stack>
          </Paper>
          )}
        </Box>
      </Flex>

      {/* Retry Modal for Validation Errors */}
      <Modal
        opened={showRetryModal}
        onClose={() => setShowRetryModal(false)}
        title={<Text fw={700} size="lg">❌ Identification Issues</Text>}
        centered
        size="lg"
      >
        <Stack gap="md">
          <Alert color="red" icon={<IconAlertCircle />}>
            The product could not be identified clearly. Please review the issues below and upload better images.
          </Alert>

          {validationErrors.length > 0 && (
            <div>
              <Text fw={600} mb="sm">Issues Detected:</Text>
              <Stack gap="xs">
                {validationErrors.map((error, index) => (
                  <Alert key={index} color="orange" icon={<IconX />}>
                    <Text fw={600}>{error.type.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text size="sm">{error.message}</Text>
                  </Alert>
                ))}
              </Stack>
            </div>
          )}

          {validationSuggestions.length > 0 && (
            <div>
              <Text fw={600} mb="sm">💡 Suggestions:</Text>
              <Stack gap="xs">
                {validationSuggestions.map((suggestion, index) => (
                  <Group key={index} gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm">{suggestion}</Text>
                  </Group>
                ))}
              </Stack>
            </div>
          )}

          <Group justify="flex-end" gap="md">
            <Button onClick={() => setShowRetryModal(false)} variant="light">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowRetryModal(false);
                resetFlow();
              }}
              color="green"
              leftSection={<IconRefresh size={18} />}
            >
              Upload Better Images
            </Button>
          </Group>
        </Stack>
      </Modal>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Container>
  );
};

export default DetectPage;
