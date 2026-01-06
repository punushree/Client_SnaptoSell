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
import jsPDF from "jspdf";
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
  // New fields for 'other' category
  measurements?: string;
  measurements_source?: string;
  original_retail_price?: string;
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
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Form data
  const [description, setDescription] = useState("");

  // API responses
  const [uuid, setUuid] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData | null>(null);
  const [identificationData, setIdentificationData] =
    useState<IdentificationData | null>(null);
  const [verificationData, setVerificationData] =
    useState<VerificationData | null>(null);

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable product data
  const [editedProduct, setEditedProduct] = useState<
    Partial<IdentificationData>
  >({});

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
  const [validationErrors, setValidationErrors] = useState<
    Array<{
      type: string;
      message: string;
      details?: any;
    }>
  >([]);
  const [validationSuggestions, setValidationSuggestions] = useState<string[]>(
    []
  );
  const [showRetryModal, setShowRetryModal] = useState(false);

  // Progress tracking for streamlined flow
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [processingStages, setProcessingStages] = useState<{
    categoryIdentification: "pending" | "in-progress" | "complete" | "error";
    verification: "pending" | "in-progress" | "complete" | "error";
    pricing: "pending" | "in-progress" | "complete" | "error";
  }>({
    categoryIdentification: "pending",
    verification: "pending",
    pricing: "pending",
  });

  // Start camera
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      setIsLoading(true);
      if (stream) stream.getTracks().forEach((t) => t.stop());

      const isMobileDevice =
        typeof window !== "undefined" && window.innerWidth < 768;
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
      window.history.replaceState({ step: 0 }, "", window.location.pathname);
    }

    // Handle browser back/forward buttons
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.step !== undefined) {
        setActive(event.state.step);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update history when step changes
  useEffect(() => {
    if (window.history.state?.step !== active) {
      window.history.pushState({ step: active }, "", window.location.pathname);
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
      
      // Use WebP format for better compression (smaller files, faster upload)
      const imageDataUrl = canvas.toDataURL("image/webp", 0.85);

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

  // Convert image URL to File object with compression
  const imageURLtoFile = async (
    imageUrl: string,
    filename: string
  ): Promise<File> => {
    let blob: Blob;

    if (imageUrl.startsWith("blob:")) {
      const response = await fetch(imageUrl);
      blob = await response.blob();
    } else if (imageUrl.startsWith("data:")) {
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
        blob = new Blob([u8arr], { type: mime });
      } catch (error) {
        const response = await fetch(imageUrl);
        blob = await response.blob();
      }
    } else {
      const response = await fetch(imageUrl);
      blob = await response.blob();
    }

    // Compress image if it's too large (> 1MB)
    if (blob.size > 1024 * 1024) {
      const img = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      
      // Maintain aspect ratio but limit max dimension to 1920px
      const maxDimension = 1920;
      let width = img.width;
      let height = img.height;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b || blob),
          'image/webp',
          0.85 // Quality setting
        );
      });
    }

    return new File([blob], filename, { type: blob.type || "image/webp" });
  };

  // Streamlined detection flow: Category + Identification in one step
  const handleStreamlinedDetection = async () => {
    if (capturedImages.length < 1 || capturedImages.length > 5) {
      setError("Please upload between 1 and 5 images.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setActive(1); // Move to processing step
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let identData: IdentificationData | null = null;
    let detectionUuid: string | null = null;
    let categoryInfo: CategoryData | null = null;

    try {
      // Step 1: Category Detection + Identification (0-60% progress)
      const result = await runCategoryAndIdentification();
      identData = result.identificationData;
      detectionUuid = result.uuid;
      categoryInfo = result.categoryData;

      // Check confidence score - if < 80%, stop and show retry modal
      if (identData && identData.confidence_score < 80) {
        setError("Low confidence detection. Please upload clearer images.");
        setShowRetryModal(true);
        setIsLoading(false);
        setActive(0); // Go back to upload
        return;
      }

      // Step 2: Run Verification and Pricing in parallel (60-100% progress)
      await runVerificationAndPricingParallel(detectionUuid, categoryInfo);

      // All done - move to completion
      setProgressPercent(100);
      setCurrentStep("Analysis Complete!");
      setActive(2); // Move to complete step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setActive(0); // Go back to upload step
    } finally {
      setIsLoading(false);
    }
  };

  // Combined Category + Identification in single API call
  const runCategoryAndIdentification = async (): Promise<{
    identificationData: IdentificationData;
    uuid: string;
    categoryData: CategoryData;
  }> => {
    setProcessingStages((prev) => ({ ...prev, categoryIdentification: "in-progress" }));
    setCurrentStep("Analyzing product (category + identification)...");
    setProgressPercent(10);

    const startTime = Date.now();

    try {
      // Prepare images and form data
      const formData = new FormData();
      formData.append("description", description.trim());

      const filePromises = capturedImages.map((imageUrl, index) =>
        imageURLtoFile(imageUrl, `image-${index}.webp`)
      );
      const files = await Promise.all(filePromises);

      files.forEach((file, index) => {
        formData.append(`image${index}`, file);
      });

      setProgressPercent(20);
      
      // Single combined API call for category + identification
      const analyzeResponse = await fetch("/api/detect/analyze", {
        method: "POST",
        body: formData,
      });

      const analyzeResult = await analyzeResponse.json();
      const totalTime = (Date.now() - startTime) / 1000;
      
      // Split the time between category and identification for tracking
      setTimeBreakdown((prev) => ({ 
        ...prev, 
        stage0: totalTime * 0.4, // ~40% for category
        stage1: totalTime * 0.6  // ~60% for identification
      }));

      if (!analyzeResponse.ok) {
        throw new Error(analyzeResult.error || "Analysis failed");
      }

      if (!analyzeResult.success) {
        throw new Error(analyzeResult.error || "Analysis failed");
      }

      const detectedUuid = analyzeResult.data.uuid;
      const detectedCategory = analyzeResult.data.categoryData;
      const identData = analyzeResult.data.identification;
      
      // Check validation
      if (analyzeResult.data.validation && !analyzeResult.data.validation.valid) {
        setValidationErrors(analyzeResult.data.validation.errors || []);
        setValidationSuggestions(analyzeResult.data.validation.suggestions || []);
        throw new Error("Validation failed");
      }
      
      setUuid(detectedUuid);
      setCategoryData(detectedCategory);
      setIdentificationData(identData);
      setEditedProduct(identData);
      setProgressPercent(60);
      setProcessingStages((prev) => ({ ...prev, categoryIdentification: "complete" }));
      
      return {
        identificationData: identData,
        uuid: detectedUuid,
        categoryData: detectedCategory,
      };
    } catch (err) {
      // If combined endpoint fails, fallback to separate calls
      console.warn("Combined API failed, falling back to separate calls:", err);
      return await runCategoryAndIdentificationFallback();
    }
  };

  // Fallback: Separate API calls if combined endpoint not available
  const runCategoryAndIdentificationFallback = async (): Promise<{
    identificationData: IdentificationData;
    uuid: string;
    categoryData: CategoryData;
  }> => {
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append("description", description.trim());

      const filePromises = capturedImages.map((imageUrl, index) =>
        imageURLtoFile(imageUrl, `image-${index}.webp`)
      );
      const files = await Promise.all(filePromises);

      files.forEach((file, index) => {
        formData.append(`image${index}`, file);
      });

      setProgressPercent(20);
      const categoryResponse = await fetch("/api/detect/category", {
        method: "POST",
        body: formData,
      });

      const categoryResult = await categoryResponse.json();
      const categoryTime = (Date.now() - startTime) / 1000;
      setTimeBreakdown((prev) => ({ ...prev, stage0: categoryTime }));

      if (!categoryResponse.ok || !categoryResult.success) {
        throw new Error(categoryResult.error || "Category detection failed");
      }

      const detectedUuid = categoryResult.data.uuid;
      const detectedCategory = categoryResult.data.categoryData;
      
      setUuid(detectedUuid);
      setCategoryData(detectedCategory);
      setProgressPercent(35);

      setCurrentStep("Identifying product details...");
      const identStartTime = Date.now();
      const identResponse = await fetch("/api/detect/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: detectedUuid,
          category: detectedCategory.category,
          userText: description,
        }),
      });

      const identResult = await identResponse.json();
      const identTime = (Date.now() - identStartTime) / 1000;
      setTimeBreakdown((prev) => ({ ...prev, stage1: identTime }));

      if (!identResponse.ok || !identResult.success) {
        throw new Error(identResult.error || "Identification failed");
      }

      if (identResult.data.validation && !identResult.data.validation.valid) {
        setValidationErrors(identResult.data.validation.errors || []);
        setValidationSuggestions(identResult.data.validation.suggestions || []);
        throw new Error("Validation failed");
      }

      const identData = identResult.data.identification;
      setIdentificationData(identData);
      setEditedProduct(identData);
      setProgressPercent(60);
      setProcessingStages((prev) => ({ ...prev, categoryIdentification: "complete" }));
      
      return {
        identificationData: identData,
        uuid: detectedUuid,
        categoryData: detectedCategory,
      };
    } catch (err) {
      setProcessingStages((prev) => ({ ...prev, categoryIdentification: "error" }));
      throw err;
    }
  };

  // Run Verification and Pricing in parallel
  const runVerificationAndPricingParallel = async (detectionUuid: string | null, categoryInfo: CategoryData | null) => {
    if (!detectionUuid || !categoryInfo) {
      throw new Error("Missing required data");
    }

    setCurrentStep("Confirming product details...");
    setProgressPercent(65);

    try {
      // Auto-confirm the product (required by backend before verification)
      const confirmResponse = await fetch("/api/detect/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: detectionUuid,
          isCorrect: true,
          updatedData: editedProduct,
        }),
      });

      const confirmResult = await confirmResponse.json();
      if (!confirmResponse.ok || !confirmResult.success) {
        throw new Error(confirmResult.error || "Confirmation failed");
      }

      setProgressPercent(70);
      setCurrentStep("Running verification and pricing analysis...");

      // Run verification and pricing in parallel
      setProcessingStages((prev) => ({
        ...prev,
        verification: "in-progress",
        pricing: "in-progress",
      }));

      const verifyStartTime = Date.now();
      const pricingStartTime = Date.now();

      const [verificationResult, pricingResult] = await Promise.all([
        // Verification
        fetch("/api/detect/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uuid: detectionUuid,
            category: categoryInfo.category,
          }),
        }).then(async (res) => {
          const data = await res.json();
          const verifyTime = (Date.now() - verifyStartTime) / 1000;
          setTimeBreakdown((prev) => ({ ...prev, stage2: verifyTime }));
          if (!res.ok || !data.success) {
            throw new Error(data.error || "Verification failed");
          }
          return data;
        }),

        // Pricing
        fetch("/api/pricing/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid: detectionUuid }),
        }).then(async (res) => {
          const pricingTime = (Date.now() - pricingStartTime) / 1000;
          setTimeBreakdown((prev) => ({ ...prev, stage3: pricingTime }));
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.warn("Pricing API failed:", res.status, errorData);
            return null;
          }
          
          const data = await res.json();
          console.log("Pricing data received:", data);
          return data;
        }).catch((error) => {
          console.error("Pricing fetch error:", error);
          return null;
        }),
      ]);

      // Update verification state
      if (verificationResult && verificationResult.success) {
        setVerificationData(verificationResult.data.verification);
        setProcessingStages((prev) => ({ ...prev, verification: "complete" }));
      }

      // Update pricing state
      if (pricingResult && pricingResult.success) {
        console.log("Setting pricing data:", pricingResult);
        const actualPricingData = pricingResult.data?.pricing || pricingResult.data || pricingResult;
        setPricingData(actualPricingData);
        setProcessingStages((prev) => ({ ...prev, pricing: "complete" }));
      } else {
        console.warn("Pricing result is null or unsuccessful - pricing may not be available");
        setProcessingStages((prev) => ({ ...prev, pricing: "error" }));
      }

      setProgressPercent(95);
    } catch (err) {
      setProcessingStages((prev) => ({
        ...prev,
        verification: "error",
        pricing: "error",
      }));
      throw err;
    }
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
    setPricingData(null);
    setProgressPercent(0);
    setCurrentStep("");
    setProcessingStages({
      categoryIdentification: "pending",
      verification: "pending",
      pricing: "pending",
    });
    setValidationErrors([]);
    setValidationSuggestions([]);
    setTimeBreakdown({});
    stopCamera();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container size="xl" p="md">
      <Title order={1} mb="xs">
        Snap to Detect Product
      </Title>

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

      <Flex
        gap="md"
        align="flex-start"
        direction={isMobile ? "row" : "column"}
        style={isMobile ? { position: 'relative' } : undefined}
      >
        {/* Stepper - Compact and Responsive */}
        <Box
          style={{
            width: isMobile ? "auto" : "100%",
            overflowX: isMobile ? "visible" : "auto",
            order: isMobile ? 1 : 1,
            position: isMobile ? "sticky" : "relative",
            top: isMobile ? "1rem" : "auto",
            alignSelf: isMobile ? "flex-start" : "auto",
          }}
        >
          <Stepper
            active={active}
            onStepClick={() => {}} // Disable direct click navigation
            mb="md"
            orientation={isMobile ? "vertical" : "horizontal"}
            size="xs"
            styles={{
              root: {
                padding: isMobile ? "0" : "0.5rem 0",
              },
              steps: {
                gap: "0.5rem",
              },
              step: {
                padding: isMobile ? "0.5rem 0" : "0",
                minWidth: isMobile ? "auto" : "70px",
                gap: "0.25rem",
              },
              stepIcon: {
                width: "32px",
                height: "32px",
                minWidth: "32px",
                minHeight: "32px",
                fontSize: "0.875rem",
              },
              stepLabel: {
                fontSize: isMobile ? "0.85rem" : "0.75rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                marginTop: isMobile ? "0" : "0.25rem",
                marginLeft: isMobile ? "0.5rem" : "0",
                display: isMobile ? "none" : "block",
              },
              stepDescription: {
                display: "none",
              },
              separator: {
                marginLeft: isMobile ? "0" : "0.5rem",
                marginRight: isMobile ? "0" : "0.5rem",
                marginTop: isMobile ? "0.25rem" : "0",
                marginBottom: isMobile ? "0.25rem" : "0",
              },
            }}
          >
            <Stepper.Step
              label="Upload"
              icon={<IconCloudUpload size={20} />}
            />
            <Stepper.Step
              label="Processing"
              icon={<IconSearch size={20} />}
            />
            <Stepper.Step
              label="Complete"
              icon={<IconCircleCheck size={20} />}
            />
          </Stepper>
        </Box>

        {/* Main Content Area */}
        <Box style={{ 
          flex: 1, 
          width: isMobile ? "100%" : "100%",
          order: isMobile ? 2 : 2,
        }}>
          {/* Step 0: Upload */}
          {active === 0 && (
            <Paper shadow="sm" p="md" withBorder mt="md">
              <Stack gap="md">
                <Text fw={500}>Step 1: Upload Product Images</Text>
                <Text size="sm" c="dimmed">
                  Upload or capture 1-5 clear images of your product from
                  different angles
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
                      flex: isMobile ? "1 1 100%" : "1 1 calc(50% - 0.5rem)",
                      minWidth: isMobile ? "100%" : "min(100%, 400px)",
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
                      flex: isMobile ? "1 1 100%" : "1 1 calc(50% - 0.5rem)",
                      minWidth: isMobile ? "100%" : "min(100%, 400px)",
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
                          return [
                            ...prev,
                            ...newImages.slice(0, remainingSlots),
                          ];
                        });
                      }}
                      onReject={() => {
                        setError(
                          "Please upload valid image files (max 5MB each)"
                        );
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
                    onClick={handleStreamlinedDetection}
                    loading={isLoading}
                    disabled={capturedImages.length === 0}
                  >
                    Start Analysis
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}

          {/* Step 1: Processing */}
          {active === 1 && (
            <Paper shadow="sm" p="md" withBorder mt="md">
              <Stack gap="lg">
                <Group gap="xs">
                  <Loader size="md" />
                  <Text fw={600} size="lg">
                    Analyzing Your Product...
                  </Text>
                </Group>

                {/* Progress Bar */}
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {currentStep || "Starting analysis..."}
                    </Text>
                    <Text size="sm" fw={500} c="blue">
                      {progressPercent}%
                    </Text>
                  </Group>
                  <Progress
                    value={progressPercent}
                    size="xl"
                    radius="md"
                    animated
                    color="blue"
                  />
                </Stack>

                {/* Processing Stages */}
                <Stack gap="sm">
                  {/* Category & Identification */}
                  <Group justify="space-between">
                    <Group gap="xs">
                      {processingStages.categoryIdentification === "complete" ? (
                        <IconCheck size={20} color="green" />
                      ) : processingStages.categoryIdentification === "in-progress" ? (
                        <Loader size={20} />
                      ) : processingStages.categoryIdentification === "error" ? (
                        <IconX size={20} color="red" />
                      ) : (
                        <IconPackage size={20} style={{ opacity: 0.3 }} />
                      )}
                      <Text size="sm">Category Detection & Identification</Text>
                    </Group>
                    {processingStages.categoryIdentification === "complete" && (
                      <Badge color="green" size="sm">Complete</Badge>
                    )}
                    {processingStages.categoryIdentification === "in-progress" && (
                      <Badge color="blue" size="sm">Processing...</Badge>
                    )}
                  </Group>

                  {/* Verification */}
                  <Group justify="space-between">
                    <Group gap="xs">
                      {processingStages.verification === "complete" ? (
                        <IconCheck size={20} color="green" />
                      ) : processingStages.verification === "in-progress" ? (
                        <Loader size={20} />
                      ) : processingStages.verification === "error" ? (
                        <IconX size={20} color="red" />
                      ) : (
                        <IconShieldCheck size={20} style={{ opacity: 0.3 }} />
                      )}
                      <Text size="sm">Product Verification</Text>
                    </Group>
                    {processingStages.verification === "complete" && (
                      <Badge color="green" size="sm">Complete</Badge>
                    )}
                    {processingStages.verification === "in-progress" && (
                      <Badge color="blue" size="sm">Processing...</Badge>
                    )}
                  </Group>

                  {/* Pricing */}
                  <Group justify="space-between">
                    <Group gap="xs">
                      {processingStages.pricing === "complete" ? (
                        <IconCheck size={20} color="green" />
                      ) : processingStages.pricing === "in-progress" ? (
                        <Loader size={20} />
                      ) : processingStages.pricing === "error" ? (
                        <IconX size={20} color="red" />
                      ) : (
                        <IconCurrencyDollar size={20} style={{ opacity: 0.3 }} />
                      )}
                      <Text size="sm">Market Price Analysis</Text>
                    </Group>
                    {processingStages.pricing === "complete" && (
                      <Badge color="green" size="sm">Complete</Badge>
                    )}
                    {processingStages.pricing === "in-progress" && (
                      <Badge color="blue" size="sm">Processing...</Badge>
                    )}
                  </Group>
                </Stack>

                {/* Info Alert */}
                <Alert color="blue" icon={<IconAlertCircle />}>
                  <Text size="sm">
                    Please wait while we analyze your product. This may take a few moments.
                  </Text>
                </Alert>
              </Stack>
            </Paper>
          )}

          {/* Completion Step: Step 2 - Complete Analysis */}
          {active === 2 && (
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
                    <Text fw={500} mb="sm">
                      Uploaded Images
                    </Text>
                    <Grid>
                      {capturedImages.map((img, idx) => (
                        <Grid.Col key={idx} span={{ base: 6, sm: 4, md: 3 }}>
                          <Image
                            src={img}
                            alt={`Product ${idx + 1}`}
                            radius="md"
                            loading="lazy"
                          />
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
                        <Text size="sm" c="dimmed">
                          Detected Category:
                        </Text>
                        <Badge size="lg" color="blue">
                          {categoryData.category.toUpperCase()}
                        </Badge>
                      </Group>
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">
                          Product Type:
                        </Text>
                        <Text fw={500}>
                          {categoryData.detected_product_type}
                        </Text>
                      </Group>
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">
                          Confidence:
                        </Text>
                        <Badge color="green">
                          {categoryData.confidence_score}%
                        </Badge>
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
                        <Text size="sm" c="dimmed">
                          Product:
                        </Text>
                        <Text fw={500}>
                          {identificationData.identified_product}
                        </Text>
                      </Group>
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">
                          Brand:
                        </Text>
                        <Text fw={500}>{identificationData.brand}</Text>
                      </Group>
                      {identificationData.model && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Model:
                          </Text>
                          <Text fw={500}>{identificationData.model}</Text>
                        </Group>
                      )}
                      {identificationData.color_variants && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Color:
                          </Text>
                          <Text fw={500}>
                            {identificationData.color_variants}
                          </Text>
                        </Group>
                      )}
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">
                          Condition:
                        </Text>
                        <Badge color="blue">
                          {identificationData.condition_rating}
                        </Badge>
                      </Group>
                      {identificationData.product_condition && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Product Condition:
                          </Text>
                          <Badge
                            color={
                              identificationData.product_condition === "new"
                                ? "green"
                                : "yellow"
                            }
                          >
                            {identificationData.product_condition.toUpperCase()}
                          </Badge>
                        </Group>
                      )}
                      {identificationData.estimated_year && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Estimated Year:
                          </Text>
                          <Text fw={500}>
                            {identificationData.estimated_year}
                          </Text>
                        </Group>
                      )}
                      {/* Additional metadata fields */}
                      {identificationData.size && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Size:
                          </Text>
                          <Text fw={500}>{identificationData.size}</Text>
                        </Group>
                      )}
                      {identificationData.material_composition && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Material:
                          </Text>
                          <Text fw={500}>{identificationData.material_composition}</Text>
                        </Group>
                      )}
                      {identificationData.storage && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Storage:
                          </Text>
                          <Text fw={500}>{identificationData.storage}</Text>
                        </Group>
                      )}
                      {identificationData.ram && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            RAM:
                          </Text>
                          <Text fw={500}>{identificationData.ram}</Text>
                        </Group>
                      )}
                      {identificationData.short_description && (
                        <div>
                          <Text size="sm" c="dimmed" mb="xs">
                            Description:
                          </Text>
                          <Text size="sm">
                            {identificationData.short_description}
                          </Text>
                        </div>
                      )}
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">
                          Confidence Score:
                        </Text>
                        <Badge color="green">
                          {identificationData.confidence_score}%
                        </Badge>
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
                        <Text size="sm" c="dimmed">
                          Authenticity Status:
                        </Text>
                        <Badge
                          size="lg"
                          color={
                            verificationData.authenticity_status
                              ?.toLowerCase()
                              .includes("authentic") ||
                            verificationData.authenticity_status
                              ?.toLowerCase()
                              .includes("verified")
                              ? "green"
                              : verificationData.authenticity_status
                                    ?.toLowerCase()
                                    .includes("uncertain")
                                ? "yellow"
                                : "orange"
                          }
                        >
                          {verificationData.authenticity_status}
                        </Badge>
                      </Group>
                      <Group justify="apart">
                        <Text size="sm" c="dimmed">
                          Verification Confidence:
                        </Text>
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
                          <Text size="sm" c="dimmed" mb="xs">
                            Summary:
                          </Text>
                          <Text size="sm">
                            {verificationData.authentication_summary}
                          </Text>
                        </div>
                      )}
                      {/* Measurements (for 'other' category) */}
                      {verificationData.measurements && verificationData.measurements !== 'N/A' && (
                        <div>
                          <Text size="sm" c="dimmed" mb="xs">
                            Measurements:
                          </Text>
                          <Text size="sm">
                            {verificationData.measurements}
                          </Text>
                          {verificationData.measurements_source && (
                            <Text size="xs" c="dimmed" mt="xs">
                              Source: {verificationData.measurements_source}
                            </Text>
                          )}
                        </div>
                      )}
                      {/* Additional verification details */}
                      {verificationData.authenticity_details && (
                        <div>
                          <Text size="sm" c="dimmed" mb="xs">
                            Details:
                          </Text>
                          <Text size="sm">
                            {verificationData.authenticity_details}
                          </Text>
                        </div>
                      )}
                      {verificationData.recommendations && (
                        <div>
                          <Text size="sm" c="dimmed" mb="xs">
                            Recommendations:
                          </Text>
                          <Text size="sm">
                            {verificationData.recommendations}
                          </Text>
                        </div>
                      )}
                    </Stack>
                  </Card>
                )}

                {/* AI Marketplace Pricing */}
                {pricingData ? (
                  <Card withBorder>
                    <Text fw={600} size="lg" mb="md">
                      Market Pricing
                    </Text>

                    {/* Overall Recommendation */}
                    {pricingData.overall_recommendation && (
                      <Alert color="green" icon={<IconCheck />} mb="md">
                        <Text size="sm">
                          {pricingData.overall_recommendation}
                        </Text>
                      </Alert>
                    )}

                    {/* Marketplace Data */}
                    <Grid>
                      {Object.entries(pricingData)
                        .filter(([key]) => key.endsWith("_market"))
                        .map(([key, data]: [string, any]) => {
                          if (!data || !data.average || data.sample_size === 0)
                            return null;

                          // Map marketplace keys to proper names
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
                            .replace("_market", "")
                            .split("_")
                            .map(
                              (w: string) =>
                                w.charAt(0).toUpperCase() + w.slice(1)
                            )
                            .join(" ");

                          return (
                            <Grid.Col key={key} span={{ base: 12, sm: 6 }}>
                              <Card withBorder p="sm">
                                <Text fw={600} size="sm" mb="xs">
                                  {marketName}
                                </Text>
                                <Group justify="apart">
                                  <Text size="xs" c="dimmed">
                                    Average:
                                  </Text>
                                  <Text fw={600} c="green">
                                    {data.average}
                                  </Text>
                                </Group>
                                <Group justify="apart">
                                  <Text size="xs" c="dimmed">
                                    Range:
                                  </Text>
                                  <Text size="xs">
                                    {data.lowest} - {data.highest}
                                  </Text>
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
                        <Text fw={600} mb="sm">
                          💡 SnaptoSell Recommendation
                        </Text>
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Typical Resale Price:
                          </Text>
                          <Text fw={700} c="green" size="lg">
                            {
                              pricingData.SnaptoSell_suggestion
                                .typical_resale_price
                            }
                          </Text>
                        </Group>
                        <Group justify="apart" mt="xs">
                          <Text size="sm" c="dimmed">
                            Price Range:
                          </Text>
                          <Text fw={600}>
                            {pricingData.SnaptoSell_suggestion.price_range}
                          </Text>
                        </Group>
                        <Group justify="apart" mt="xs">
                          <Text size="sm" c="dimmed">
                            Confidence:
                          </Text>
                          <Badge
                            color={
                              pricingData.SnaptoSell_suggestion.confidence ===
                              "high"
                                ? "green"
                                : pricingData.SnaptoSell_suggestion
                                      .confidence === "medium"
                                  ? "yellow"
                                  : "orange"
                            }
                          >
                            {pricingData.SnaptoSell_suggestion.confidence.toUpperCase()}
                          </Badge>
                        </Group>
                      </Card>
                    )}

                    {/* Original Retail Price - Prominent Display */}
                    {(pricingData.original_retail_price || 
                      pricingData.official_price || 
                      pricingData.retail_price_reference ||
                      verificationData?.original_retail_price ||
                      verificationData?.retail_price_reference) && (
                      <Card withBorder p="md" bg="gray.0" mt="md">
                        <Group justify="space-between" align="center">
                          <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                              Original Retail Price
                            </Text>
                            <Text size="xl" fw={700} c="blue" mt="xs">
                              {pricingData.original_retail_price ||
                                pricingData.official_price ||
                                pricingData.retail_price_reference ||
                                verificationData?.original_retail_price ||
                                verificationData?.retail_price_reference}
                            </Text>
                          </div>
                          <Badge size="lg" color="gray" variant="light">
                            MSRP
                          </Badge>
                        </Group>
                      </Card>
                    )}

                    {/* Pricing Strategy */}
                    {pricingData.pricing_strategy && (
                      <Alert color="blue" mt="md" icon={<IconAlertCircle />}>
                        <Text fw={600} size="sm" mb="xs">
                          🎯 Pricing Strategy
                        </Text>
                        <Text size="sm">{pricingData.pricing_strategy}</Text>
                      </Alert>
                    )}

                    {/* Platform Recommendations */}
                    {pricingData.platform_recommendations && 
                     Array.isArray(pricingData.platform_recommendations) &&
                     pricingData.platform_recommendations.length > 0 && (
                      <div>
                        <Text fw={600} size="sm" mt="md" mb="xs">
                          🛒 Platform Recommendations
                        </Text>
                        <Stack gap="xs">
                          {pricingData.platform_recommendations.map((platform: any, idx: number) => (
                            <Card key={idx} withBorder p="xs">
                              <Text fw={500} size="sm">
                                {platform.platform}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {platform.reason}
                              </Text>
                            </Card>
                          ))}
                        </Stack>
                      </div>
                    )}

                    {/* Seasonal Pricing Guidance */}
                    {pricingData.seasonal_pricing_guidance && (
                      <Alert color="orange" mt="md" icon={<IconAlertCircle />}>
                        <Text fw={600} size="sm" mb="xs">
                          🗓️ Seasonal Pricing Guidance
                        </Text>
                        <Text size="sm">{pricingData.seasonal_pricing_guidance}</Text>
                      </Alert>
                    )}
                  </Card>
                ) : (
                  <Card withBorder>
                    <Text fw={600} size="lg" mb="md">
                      Market Pricing
                    </Text>
                    <Alert color="yellow" icon={<IconAlertCircle />}>
                      <Text size="sm">
                        Pricing data is being fetched. If this persists, pricing analysis may not be available for this product.
                      </Text>
                    </Alert>
                  </Card>
                )}

                {/* Execution Time */}
                {/* {Object.keys(timeBreakdown).length > 0 && (
                  <Card withBorder>
                    <Text fw={600} size="sm" mb="md">
                      ⏱️ Execution Time Breakdown
                    </Text>
                    <Stack gap="xs">
                      {timeBreakdown.stage0 && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Category Detection:
                          </Text>
                          <Text size="sm">
                            {timeBreakdown.stage0.toFixed(2)}s
                          </Text>
                        </Group>
                      )}
                      {timeBreakdown.stage1 && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Identification:
                          </Text>
                          <Text size="sm">
                            {timeBreakdown.stage1.toFixed(2)}s
                          </Text>
                        </Group>
                      )}
                      {timeBreakdown.stage2 && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Verification:
                          </Text>
                          <Text size="sm">
                            {timeBreakdown.stage2.toFixed(2)}s
                          </Text>
                        </Group>
                      )}
                      {timeBreakdown.stage3 && (
                        <Group justify="apart">
                          <Text size="sm" c="dimmed">
                            Pricing:
                          </Text>
                          <Text size="sm">
                            {timeBreakdown.stage3.toFixed(2)}s
                          </Text>
                        </Group>
                      )}
                      <Divider />
                      <Group justify="apart">
                        <Text fw={600}>Total:</Text>
                        <Text fw={600}>
                          {Object.values(timeBreakdown)
                            .reduce((a, b) => a + (b || 0), 0)
                            .toFixed(2)}
                          s
                        </Text>
                      </Group>
                    </Stack>
                  </Card>
                )} */}

                {/* Navigation buttons */}
                <Group justify="center" gap="md">
                  {/* <Button
                    onClick={() => {
                      // Generate PDF Report
                      const pdf = new jsPDF();
                      const pageWidth = pdf.internal.pageSize.getWidth();
                      const pageHeight = pdf.internal.pageSize.getHeight();
                      const margin = 20;
                      const maxWidth = pageWidth - (margin * 2);
                      let yPosition = margin;
                      
                      // Title
                      pdf.setFontSize(20);
                      pdf.setFont('helvetica', 'bold');
                      pdf.text('SnaptoSell Product Analysis Report', margin, yPosition);
                      yPosition += 15;
                      
                      // Metadata
                      pdf.setFontSize(10);
                      pdf.setFont('helvetica', 'normal');
                      pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
                      yPosition += 7;
                      pdf.text(`Analysis Version: 2.0.0`, margin, yPosition);
                      yPosition += 7;
                      pdf.text(`Model: gpt-5.1-2025-11-13`, margin, yPosition);
                      yPosition += 12;
                      
                      // Category Section
                      if (categoryData) {
                        pdf.setFillColor(240, 240, 255);
                        pdf.rect(margin, yPosition - 5, maxWidth, 8, 'F');
                        pdf.setFontSize(14);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Category Information', margin + 2, yPosition);
                        yPosition += 12;
                        
                        pdf.setFontSize(10);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(`Category: ${categoryData.category.toUpperCase()}`, margin + 5, yPosition);
                        yPosition += 7;
                        pdf.text(`Product Type: ${categoryData.detected_product_type || 'N/A'}`, margin + 5, yPosition);
                        yPosition += 7;
                        pdf.text(`Confidence: ${categoryData.confidence_score}%`, margin + 5, yPosition);
                        yPosition += 12;
                      }
                      
                      // Product Details Section
                      if (identificationData) {
                        if (yPosition > pageHeight - 80) {
                          pdf.addPage();
                          yPosition = margin;
                        }
                        
                        pdf.setFillColor(240, 255, 240);
                        pdf.rect(margin, yPosition - 5, maxWidth, 8, 'F');
                        pdf.setFontSize(14);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Product Details', margin + 2, yPosition);
                        yPosition += 12;
                        
                        pdf.setFontSize(10);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(`Product: ${identificationData.identified_product || 'N/A'}`, margin + 5, yPosition);
                        yPosition += 7;
                        pdf.text(`Brand: ${identificationData.brand || 'N/A'}`, margin + 5, yPosition);
                        yPosition += 7;
                        if (identificationData.model) {
                          pdf.text(`Model: ${identificationData.model}`, margin + 5, yPosition);
                          yPosition += 7;
                        }
                        if (identificationData.color_variants) {
                          pdf.text(`Color: ${identificationData.color_variants}`, margin + 5, yPosition);
                          yPosition += 7;
                        }
                        pdf.text(`Condition: ${identificationData.condition_rating || 'N/A'}`, margin + 5, yPosition);
                        yPosition += 7;
                        if (identificationData.product_condition) {
                          pdf.text(`Product Condition: ${identificationData.product_condition.toUpperCase()}`, margin + 5, yPosition);
                          yPosition += 7;
                        }
                        if (identificationData.estimated_year) {
                          pdf.text(`Year: ${identificationData.estimated_year}`, margin + 5, yPosition);
                          yPosition += 7;
                        }
                        pdf.text(`Confidence Score: ${identificationData.confidence_score}%`, margin + 5, yPosition);
                        yPosition += 7;
                        if (identificationData.short_description) {
                          const descLines = pdf.splitTextToSize(`Description: ${identificationData.short_description}`, maxWidth - 10);
                          pdf.text(descLines, margin + 5, yPosition);
                          yPosition += (descLines.length * 7) + 5;
                        }
                        yPosition += 5;
                      }
                      
                      // Verification Section
                      if (verificationData) {
                        if (yPosition > pageHeight - 60) {
                          pdf.addPage();
                          yPosition = margin;
                        }
                        
                        pdf.setFillColor(255, 250, 240);
                        pdf.rect(margin, yPosition - 5, maxWidth, 8, 'F');
                        pdf.setFontSize(14);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Verification Results', margin + 2, yPosition);
                        yPosition += 12;
                        
                        pdf.setFontSize(10);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(`Status: ${verificationData.authenticity_status || 'N/A'}`, margin + 5, yPosition);
                        yPosition += 7;
                        pdf.text(`Confidence: ${verificationData.verification_confidence || 'N/A'}%`, margin + 5, yPosition);
                        yPosition += 7;
                        if (verificationData.authentication_summary) {
                          const summaryLines = pdf.splitTextToSize(`Summary: ${verificationData.authentication_summary}`, maxWidth - 10);
                          pdf.text(summaryLines, margin + 5, yPosition);
                          yPosition += (summaryLines.length * 7) + 5;
                        }
                        // Add measurements for 'other' category
                        if (verificationData.measurements && verificationData.measurements !== 'N/A') {
                          pdf.text(`Measurements: ${verificationData.measurements}`, margin + 5, yPosition);
                          yPosition += 7;
                          if (verificationData.measurements_source) {
                            pdf.text(`  Source: ${verificationData.measurements_source}`, margin + 10, yPosition);
                            yPosition += 7;
                          }
                        }
                        yPosition += 5;
                      }
                      
                      // Pricing Section
                      if (pricingData) {
                        if (yPosition > pageHeight - 100) {
                          pdf.addPage();
                          yPosition = margin;
                        }
                        
                        pdf.setFillColor(240, 255, 240);
                        pdf.rect(margin, yPosition - 5, maxWidth, 8, 'F');
                        pdf.setFontSize(14);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Market Pricing', margin + 2, yPosition);
                        yPosition += 12;
                        
                        // SnaptoSell Recommendation
                        if (pricingData.SnaptoSell_suggestion) {
                          pdf.setFontSize(12);
                          pdf.setFont('helvetica', 'bold');
                          pdf.text('SnaptoSell Recommendation:', margin + 5, yPosition);
                          yPosition += 10;
                          
                          pdf.setFontSize(10);
                          pdf.setFont('helvetica', 'normal');
                          pdf.text(`Typical Resale Price: ${pricingData.SnaptoSell_suggestion.typical_resale_price || 'N/A'}`, margin + 10, yPosition);
                          yPosition += 7;
                          pdf.text(`Price Range: ${pricingData.SnaptoSell_suggestion.price_range || 'N/A'}`, margin + 10, yPosition);
                          yPosition += 7;
                          pdf.text(`Confidence: ${pricingData.SnaptoSell_suggestion.confidence || 'N/A'}`, margin + 10, yPosition);
                          yPosition += 10;
                        }
                        
                        // Market Data
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Marketplace Data:', margin + 5, yPosition);
                        yPosition += 10;
                        
                        pdf.setFontSize(10);
                        pdf.setFont('helvetica', 'normal');
                        Object.entries(pricingData)
                          .filter(([key]) => key.endsWith('_market'))
                          .forEach(([key, data]: [string, any]) => {
                            if (data && data.average && data.sample_size > 0) {
                              if (yPosition > pageHeight - 30) {
                                pdf.addPage();
                                yPosition = margin;
                              }
                              
                              const marketName = key.replace('_market', '').split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                              pdf.text(`${marketName}:`, margin + 10, yPosition);
                              yPosition += 7;
                              pdf.text(`  Average: ${data.average}`, margin + 15, yPosition);
                              yPosition += 7;
                              pdf.text(`  Range: ${data.lowest} - ${data.highest}`, margin + 15, yPosition);
                              yPosition += 7;
                              pdf.text(`  Sample Size: ${data.sample_size} listings`, margin + 15, yPosition);
                              yPosition += 10;
                            }
                          });
                        
                        // Overall Recommendation
                        if (pricingData.overall_recommendation) {
                          if (yPosition > pageHeight - 30) {
                            pdf.addPage();
                            yPosition = margin;
                          }
                          const recLines = pdf.splitTextToSize(`Recommendation: ${pricingData.overall_recommendation}`, maxWidth - 10);
                          pdf.text(recLines, margin + 5, yPosition);
                          yPosition += (recLines.length * 7) + 5;
                        }
                        
                        // Original Retail Price
                        const originalPrice = pricingData.original_retail_price || 
                                            pricingData.official_price || 
                                            pricingData.retail_price_reference ||
                                            verificationData?.original_retail_price ||
                                            verificationData?.retail_price_reference;
                        if (originalPrice && originalPrice !== 'Not available') {
                          pdf.text(`Original Retail Price: ${originalPrice}`, margin + 5, yPosition);
                          yPosition += 10;
                        }
                        
                        // Pricing Strategy
                        if (pricingData.pricing_strategy) {
                          if (yPosition > pageHeight - 30) {
                            pdf.addPage();
                            yPosition = margin;
                          }
                          pdf.setFont('helvetica', 'bold');
                          pdf.text('Pricing Strategy:', margin + 5, yPosition);
                          yPosition += 7;
                          pdf.setFont('helvetica', 'normal');
                          const strategyLines = pdf.splitTextToSize(pricingData.pricing_strategy, maxWidth - 10);
                          pdf.text(strategyLines, margin + 10, yPosition);
                          yPosition += (strategyLines.length * 7) + 5;
                        }
                        
                        // Platform Recommendations
                        if (pricingData.platform_recommendations && Array.isArray(pricingData.platform_recommendations) && pricingData.platform_recommendations.length > 0) {
                          if (yPosition > pageHeight - 50) {
                            pdf.addPage();
                            yPosition = margin;
                          }
                          pdf.setFont('helvetica', 'bold');
                          pdf.text('Platform Recommendations:', margin + 5, yPosition);
                          yPosition += 7;
                          pdf.setFont('helvetica', 'normal');
                          pricingData.platform_recommendations.forEach((platform: any) => {
                            pdf.text(`- ${platform.platform}: ${platform.reason}`, margin + 10, yPosition);
                            yPosition += 7;
                          });
                          yPosition += 5;
                        }
                        
                        // Seasonal Pricing Guidance
                        if (pricingData.seasonal_pricing_guidance) {
                          if (yPosition > pageHeight - 30) {
                            pdf.addPage();
                            yPosition = margin;
                          }
                          pdf.setFont('helvetica', 'bold');
                          pdf.text('Seasonal Pricing Guidance:', margin + 5, yPosition);
                          yPosition += 7;
                          pdf.setFont('helvetica', 'normal');
                          const seasonalLines = pdf.splitTextToSize(pricingData.seasonal_pricing_guidance, maxWidth - 10);
                          pdf.text(seasonalLines, margin + 10, yPosition);
                          yPosition += (seasonalLines.length * 7) + 5;
                        }
                      }
                      
                      // Execution Time
                      if (Object.keys(timeBreakdown).length > 0) {
                        if (yPosition > pageHeight - 60) {
                          pdf.addPage();
                          yPosition = margin;
                        }
                        
                        pdf.setFillColor(245, 245, 245);
                        pdf.rect(margin, yPosition - 5, maxWidth, 8, 'F');
                        pdf.setFontSize(14);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Execution Time Breakdown', margin + 2, yPosition);
                        yPosition += 12;
                        
                        pdf.setFontSize(10);
                        pdf.setFont('helvetica', 'normal');
                        if (timeBreakdown.stage0) {
                          pdf.text(`Category Detection: ${timeBreakdown.stage0.toFixed(2)}s`, margin + 5, yPosition);
                          yPosition += 7;
                        }
                        if (timeBreakdown.stage1) {
                          pdf.text(`Identification: ${timeBreakdown.stage1.toFixed(2)}s`, margin + 5, yPosition);
                          yPosition += 7;
                        }
                        if (timeBreakdown.stage2) {
                          pdf.text(`Verification: ${timeBreakdown.stage2.toFixed(2)}s`, margin + 5, yPosition);
                          yPosition += 7;
                        }
                        if (timeBreakdown.stage3) {
                          pdf.text(`Pricing: ${timeBreakdown.stage3.toFixed(2)}s`, margin + 5, yPosition);
                          yPosition += 7;
                        }
                        const total = Object.values(timeBreakdown).reduce((a, b) => a + (b || 0), 0);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(`Total: ${total.toFixed(2)}s`, margin + 5, yPosition);
                      }
                      
                      // Save PDF
                      const filename = `${categoryData?.category || 'product'}_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
                      pdf.save(filename);
                    }}
                    leftSection={<IconCloudUpload size={18} />}
                    variant="filled"
                  >
                    📄 Download PDF Report
                  </Button> */}
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
        title={
          <Text fw={700} size="lg">
            ❌ Identification Issues
          </Text>
        }
        centered
        size="lg"
      >
        <Stack gap="md">
          <Alert color="red" icon={<IconAlertCircle />}>
            The product could not be identified clearly. Please review the
            issues below and upload better images.
          </Alert>

          {validationErrors.length > 0 && (
            <div>
              <Text fw={600} mb="sm">
                Issues Detected:
              </Text>
              <Stack gap="xs">
                {validationErrors.map((error, index) => (
                  <Alert key={index} color="orange" icon={<IconX />}>
                    <Text fw={600}>
                      {error.type.replace(/_/g, " ").toUpperCase()}
                    </Text>
                    <Text size="sm">{error.message}</Text>
                  </Alert>
                ))}
              </Stack>
            </div>
          )}

          {validationSuggestions.length > 0 && (
            <div>
              <Text fw={600} mb="sm">
                💡 Suggestions:
              </Text>
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
