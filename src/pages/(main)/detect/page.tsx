import '@mantine/dropzone/styles.css';
import { useRef, useState, useEffect } from "react";
import {
  Container, Paper, Stack, Title, Text, Button, Group, Center, Alert,
  ActionIcon, Box, Image, SimpleGrid, Card, Badge,
  Modal, TextInput, Textarea, NumberInput, Divider,
  Select
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import {
  IconCamera, IconCapture, IconAlertCircle,
  IconTrash, IconX, IconCloudUpload
} from "@tabler/icons-react";
import SampleImages from "@/components/SampleImages";

const Page = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [details, setDetails] = useState("");
  const [showSampleImages, setShowSampleImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  
  // Form fields for editing product information
  const [editedProduct, setEditedProduct] = useState({
    identified_product: "",
    brand: "",
    color_variants: "",
    size: "",
    condition_rating: "",
    estimated_year: "",
    short_description: "",
     storage: "",
    model: "",
    model_variant : "",
    carrier : "",
    connectivity :"",
  });

  const messages = [
    "1) Capture or upload Front image of device",
    "2) Capture or upload Back image of device",
    "3) Capture or upload Left image of device",
    "4) Capture or upload Right image of device",
    "5) Capture or upload Settings image of device"
  ];

  // Start camera
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      setIsLoading(true);
      if (stream) stream.getTracks().forEach((t) => t.stop());

      // Check if mobile device
      const isMobileDevice = typeof window !== "undefined" && window.innerWidth < 768;
      const actualMode = isMobileDevice ? mode : "user";
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: actualMode } }
      });

      setStream(mediaStream);
      setFacingMode(actualMode);
      setIsLoading(false);
    } catch (err) {
      setError("Camera permission blocked. Please allow access.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => setIsVideoReady(true);
    }
  }, [stream]);

  // Scroll to top when result (success or error) is shown
  useEffect(() => {
    if (submitSuccess || submitError) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [submitSuccess, submitError]);

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsVideoReady(false);
    // Don't clear captured images - just stop the camera
  };

  const resetAllImages = () => {
    setCapturedImages([]);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
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

      setCapturedImages((prev) =>
        prev.length < 5 ? [...prev, imageDataUrl] : prev
      );
    }
  };

  const deleteImage = (index: number) =>
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));

  // const handleFileUpload = (e: any) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //   const url = URL.createObjectURL(file);
  //   setCapturedImages((prev) =>
  //     prev.length < 5 ? [...prev, url] : prev
  //   );
  // };

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

    // Reset the input so the same files can be selected again
    e.target.value = '';
  };


  // Convert image URL to File object
  const imageURLtoFile = async (imageUrl: string, filename: string): Promise<File> => {
    // Handle blob URLs (from file uploads)
    if (imageUrl.startsWith('blob:')) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type || 'image/jpeg' });
    }

    // Handle data URLs (from camera capture)
    if (imageUrl.startsWith('data:')) {
      const arr = imageUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
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
        // Fallback: fetch as blob if atob fails
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type || mime });
      }
    }

    // Fallback for any other URL type
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  };

  const handleSubmit = async () => {
    // Validation
    if (details.trim() === "") {
      setSubmitError("Please enter device details before submitting.");
      return;
    }

    if (capturedImages.length < 3 || capturedImages.length > 5) {
      setSubmitError("Please upload between 3 and 5 images.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // Create FormData
      const formData = new FormData();

      // Add description
      formData.append('description', details.trim());
      console.log('Description:', details.trim());

      // Convert image URLs (data URLs or blob URLs) to File objects and add to FormData
      console.log('Converting images to files...');
      const filePromises = capturedImages.map((imageUrl, index) =>
        imageURLtoFile(imageUrl, `image-${index}.jpg`)
      );
      const files = await Promise.all(filePromises);
      console.log(`Converted ${files.length} files:`, files.map(f => ({ name: f.name, size: f.size, type: f.type })));

      files.forEach((file, index) => {
        formData.append(`image${index}`, file);
      });

      console.log('Sending request to /api/detect...');
      // Make POST request to API
      const response = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status, response.statusText);

      let result;

      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`);
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error(`Failed to parse server response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      console.log('Response data:', result);

      if (!response.ok) {
        // Show detailed error from backend
        const errorMsg = result.details
          ? `${result.error || 'Error'}: ${result.details}`
          : result.error || result.details || `Failed to submit images (Status: ${response.status})`;
        console.error('API Error:', errorMsg, result);
        throw new Error(errorMsg);
      }

      if (result.success) {
        setSubmitSuccess(result.data);
        // Initialize form with detected data
        setEditedProduct({
          identified_product: result.data.analysis?.identified_product || "",
          brand: result.data.analysis?.brand || "",
          color_variants: result.data.analysis?.color_variants || "",
          size: result.data.analysis?.size || "",
          condition_rating: result.data.analysis?.condition_rating || "",
          estimated_year: result.data.analysis?.estimated_year || "",
          short_description: result.data.analysis?.short_description || "",
           storage: result.data.analysis?.storage || "",
           model: result.data.analysis?.model || "",
           model_variant: result.data.analysis?.model_variant || "",
           carrier : result.data.analysis?.carrier || "",
           connectivity : result.data.analysis?.connectivity || "",
        });
        setShowConfirmation(true);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      console.error('Submit error:', err);

      // Log more details for debugging
      if (err instanceof Error) {
        console.error('Error stack:', err.stack);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmation = async (isCorrect: boolean) => {
    if (!submitSuccess) return;

    setIsConfirming(true);
    setConfirmationError(null);

    try {
      const response = await fetch('/api/detect/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: submitSuccess.uuid,
          isCorrect: isCorrect,
          updatedData: isCorrect ? editedProduct : editedProduct
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to confirm product information');
      }

      // Show success state with confirmed data
      setShowConfirmation(false);
      setSubmitSuccess({
        ...submitSuccess,
        userConfirmed: result.data.userConfirmed
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setConfirmationError(errorMessage);
      console.error('Confirmation error:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Container size="full" p="md">
      {/* Confirmation Modal - Ask user if detected information is correct */}
      <Modal
        opened={showConfirmation && !!submitSuccess}
        onClose={() => setShowConfirmation(false)}
        title={<Text fw={600} size="lg">Is this information correct?</Text>}
        size="lg"
        centered
      >
        <Stack gap="md">
          {confirmationError && (
            <Alert color="red" title="Error" onClose={() => setConfirmationError(null)} withCloseButton>
              {confirmationError}
            </Alert>
          )}

          <Paper p="md" radius="md" bg="blue.0" withBorder>
            <Text fw={600} mb="md">Detected Information:</Text>
            <Stack gap="xs">
              <div>
                <Text size="sm" c="dimmed">Product Name</Text>
                <Text fw={500}>{submitSuccess?.analysis?.identified_product || "N/A"}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Brand</Text>
                <Text fw={500}>{submitSuccess?.analysis?.brand || "N/A"}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Model</Text>
                <Text fw={500}>{submitSuccess?.analysis?.model || "N/A"}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Model Variant</Text>
                <Text fw={500}>{submitSuccess?.analysis?.model_variant || "N/A"}</Text>
              </div>
              
              <div>
                <Text size="sm" c="dimmed">Storage 
                  <Text component="span" c="red">*</Text>
                </Text>

                <Text fw={500}>{submitSuccess?.analysis?.storage || "N/A"}</Text>
              </div>

              <div>
                <Text size="sm" c="dimmed">Color</Text>
                <Text fw={500}>{submitSuccess?.analysis?.color_variants || "N/A"}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Size</Text>
                <Text fw={500}>{submitSuccess?.analysis?.size || "N/A"}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Condition Rating</Text>
                <Text fw={500}>{submitSuccess?.analysis?.condition_rating || "N/A"}</Text>
              </div>

              <div>
                <Text size="sm" c="dimmed">Carrier</Text>
                <Text fw={500}>{submitSuccess?.analysis?.carrier || "N/A"}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Estimated Year</Text>
                <Text fw={500}>{submitSuccess?.analysis?.estimated_year || "N/A"}</Text>
              </div>
            </Stack>
          </Paper>

          <Stack gap="sm">
            <Text fw={600} size="sm">Update Information (if needed):</Text>
            
            <TextInput
              label="Product Name"
              placeholder="e.g., iPhone 15 Pro"
              value={editedProduct.identified_product}
              onChange={(e) => setEditedProduct({...editedProduct, identified_product: e.target.value})}
            />

            <TextInput
              label="Brand"
              placeholder="e.g., Apple"
              value={editedProduct.brand}
              onChange={(e) => setEditedProduct({...editedProduct, brand: e.target.value})}
            />

            <TextInput
              label="Color"
              placeholder="e.g., Space Black"
              value={editedProduct.color_variants}
              onChange={(e) => setEditedProduct({...editedProduct, color_variants: e.target.value})}
            />

            <TextInput
              label="Size"
              placeholder="e.g., 6.1 inches"
              value={editedProduct.size}
              onChange={(e) => setEditedProduct({...editedProduct, size: e.target.value})}
            />

            <NumberInput
              label="Condition Rating (1-10)"
              placeholder="e.g., 8"
              min={1}
              max={10}
              value={editedProduct.condition_rating}
                  //value={typeof editedProduct.condition_rating === 'string' && editedProduct.condition_rating === '' ? undefined : Number(editedProduct.condition_rating)}
              onChange={(val) => setEditedProduct({...editedProduct, condition_rating: val !== null && val !== undefined ? String(val) : ""})}
            />

            <TextInput
              label="Estimated Year"
              placeholder="e.g., 2023"
              value={editedProduct.estimated_year}
              onChange={(e) => setEditedProduct({...editedProduct, estimated_year: e.target.value})}
            />
            <TextInput
              label="Model"
              placeholder=""
              value={editedProduct.model}
              onChange={(e) => setEditedProduct({...editedProduct, model: e.target.value})}
            />

            <TextInput
              label="Model Number"
              placeholder=""
              value={editedProduct.model_variant}
              onChange={(e) => setEditedProduct({...editedProduct, model_variant: e.target.value})}
            />

             <TextInput
              label="Storage"
              placeholder=""
              value={editedProduct.storage}
              onChange={(e) => setEditedProduct({...editedProduct, storage: e.target.value})}
            />

            <Select
              label="Carrier"
              placeholder=""
              searchable
              nothingFoundMessage="No results"
              
               data={["Locked", "Unlocked"]}
              value={editedProduct.carrier}
              onChange={(value) =>
                setEditedProduct({ ...editedProduct, carrier: value || "" })
              }
            />

            <Textarea
              label="Description"
              placeholder="Additional description"
              value={editedProduct.short_description}
              onChange={(e) => setEditedProduct({...editedProduct, short_description: e.target.value})}
              rows={3}
            />
          </Stack>

          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              onClick={() => handleConfirmation(true)}
              loading={isConfirming}
              disabled={isConfirming}
            >
              Yes, Correct
            </Button>
            <Button
              color="yellow"
              onClick={() => handleConfirmation(false)}
              loading={isConfirming}
              disabled={isConfirming}
            >
              Update Info
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Show only Success UI when submitSuccess exists */}
      {submitSuccess ? (
        <Alert color="green" onClose={() => setSubmitSuccess(null)} withCloseButton>
          <div style={{ padding: "20px" }}>
            <Text fw={600} mb="xs">
              {submitSuccess.userConfirmed ? "✓ Product Information Confirmed!" : "✓ Product Information Updated Successfully!"}
            </Text>
            <Text size="md" mb="xs">Status: {submitSuccess.status}</Text>

            {/* Analysis Section */}
            {submitSuccess.analysis && (
              <Box mt="md">
                <Text fw={600} size="md" mb="xs">
                  Final Product Details:
                </Text>
                <Stack gap="xs">
                  <div>
                    <Text size="sm" c="dimmed">Product Name</Text>
                    <Text fw={500}>{submitSuccess.analysis.identified_product || "N/A"}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Brand</Text>
                    <Text fw={500}>{submitSuccess.analysis.brand || "N/A"}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Color</Text>
                    <Text fw={500}>{submitSuccess.analysis.color_variants || "N/A"}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Size</Text>
                    <Text fw={500}>{submitSuccess.analysis.size || "N/A"}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Condition</Text>
                    <Text fw={500}>{submitSuccess.analysis.condition_rating || "N/A"}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Model</Text>
                    <Text fw={500}>{submitSuccess.analysis.model || "N/A"}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Model Number</Text>
                    <Text fw={500}>{submitSuccess.analysis.model_variant || "N/A"}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Storage</Text>
                    <Text fw={500}>{submitSuccess.analysis.storage || "N/A"}</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Estimated Year</Text>
                    <Text fw={500}>{submitSuccess.analysis.estimated_year || "N/A"}</Text>
                  </div>
                  {submitSuccess.analysis.short_description && (
                    <div>
                      <Text size="sm" c="dimmed">Description</Text>
                      <Text fw={500}>{submitSuccess.analysis.short_description}</Text>
                    </div>
                  )}
                </Stack>
              </Box>
            )}

            {/*Uploaded Images Preview */}
            {capturedImages.length > 0 && (
              <Box mt="lg">
                <SimpleGrid cols={{ base: 3, sm: 3, md: 3 }} spacing="sm" w="100%">
                  {capturedImages.map((img, index) => (
                    <Card
                      key={index}
                      p={0}
                      radius="md"
                      withBorder
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        width: "100%",
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
                        h={{ base: 150, sm: 200, md: 250 }}
                        w="100%"
                        style={{
                          display: "block",
                        }}
                      />
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* Button to start new submission */}
            <Group justify="center" mt="xl">
              <Button
                color="yellow"
                variant="light"
                onClick={() => {
                  // Reset UI only
                  setSubmitSuccess(null);
                  setCapturedImages([]);
                  setDetails("");
                  setSubmitError(null);
                  stopCamera();
                }}
              >
                New Search
              </Button>
            </Group>
          </div>
        </Alert>
      ) : (


        <Stack gap="lg">


          {/*Error Popup / handle   */}
          <Modal
            opened={!!error}
            onClose={() => setError(null)}
            centered
            withCloseButton
            title={
              <Group>
                <IconAlertCircle color="red" />
                <Text fw={600}>Camera Error</Text>
              </Group>
            }
          >
            <Text>{error}</Text>
          </Modal>

          {/* Submission Error Popup */}
          <Modal
            opened={!!submitError}
            onClose={() => setSubmitError(null)}
            centered
            withCloseButton
            title={
              <Group>
                <IconAlertCircle color="red" />
                <Text fw={600}>Submission Error</Text>
              </Group>
            }
          >
            <Text>{submitError}</Text>
          </Modal>

          {/* {error && (
            <Alert icon={<IconAlertCircle />} color="red">
              {error}
            </Alert>
          )}
          {submitError && (
            <Alert
              icon={<IconAlertCircle />}
              color="red"
              onClose={() => setSubmitError(null)}
              withCloseButton
            >
              {submitError}
            </Alert>
          )} */}

          {/*  Original form & camera UI */}
          <div>
            <Title order={1} mb="xs">
              Snap to Detect Product
            </Title>
            <Text c="dimmed">
              Capture a photo of the product to detect it and find its price
            </Text>
            <Text >
              Capture/Upload a minimum 3 to 5 photos of the product.
            </Text>
            <Text>
              Capture/Upload a photos form both sides like front side, back side, left side, right side of the product. Click here for priview sample images

              {/* <Button variant="light" ml="xs" onClick={handleShowSampleImages}>
              Sample Images
            </Button> */}
              <Button
                variant="light"
                ml="xs"
                mt="sm"
                onClick={() => setShowSampleImages(true)}
              >
                View Sample Images
              </Button>
            </Text>
            <Text>
              After capture/upload a photos and add product details.
            </Text>
          </div>

          {showSampleImages && (
            <Paper shadow="sm" p="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Title order={4}>Sample Images</Title>
                <Button
                  variant="light"
                  leftSection={<IconX size={16} />}
                  onClick={() => setShowSampleImages(false)}
                >
                  Close
                </Button>
              </Group>
              <SampleImages />
            </Paper>
          )}

          <Paper shadow="sm" p="md" withBorder>
            <Stack gap="md">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />

              <Group
                align="flex-start"
                gap="md"
                wrap="wrap"
              >
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
                        <Text size="sm" c="dimmed">Camera preview will appear here</Text>
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
                        {!isVideoReady && <Text c="white">Loading camera...</Text>}
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
                    <>
                      {capturedImages.length < 5 && (
                        <Badge
                          size="lg"
                          radius="sm"
                          style={{
                            backgroundColor: "white",
                            color: "black",
                          }}
                        >
                          {messages[capturedImages.length]}
                        </Badge>
                      )}

                      <Group justify="center" wrap="wrap" w="100%">
                        <Button
                          leftSection={<IconCapture />}
                          onClick={captureImage}
                          disabled={!isVideoReady}
                        >
                          Capture
                        </Button>
                        <Button
                          variant="outline"
                          color="red"
                          onClick={stopCamera}
                        >
                          Cancel
                        </Button>
                      </Group>
                    </>
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
                        <Text fw={600}>Captured Images ({capturedImages.length}/5)</Text>
                        <Button
                          variant="light"
                          color="red"
                          size="xs"
                          leftSection={<IconTrash size={14} />}
                          onClick={resetAllImages}
                        >
                          Reset All
                        </Button>
                      </Group>
                      <SimpleGrid cols={{ base: 2, sm: 2, md: 2 }} spacing="sm" w="100%">
                        {capturedImages.map((img, index) => (
                          <Card
                            key={index}
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
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}

                  {/* Drag and Drop Zone */}
                  <Divider label="OR upload without camera" labelPosition="center" />

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
                    onReject={(files) => {
                      files.forEach((file) => {
                        let reason = 'Unknown reason';
                        
                        if (file.errors.length > 0) {
                          const error = file.errors[0];
                          if (error.code === 'file-too-large') {
                            reason = 'File size exceeds 10MB limit';
                          } else if (error.code === 'file-invalid-type') {
                            reason = 'Invalid file type. Only images are allowed';
                          } else {
                            reason = error.message || 'File rejected';
                          }
                        }

                        notifications.show({
                          title: 'File Rejected',
                          message: `${file.file.name}: ${reason}`,
                          color: 'red',
                          autoClose: 5000,
                        });
                      });
                    }}
                    maxSize={5 * 1024 ** 2}
                    accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }}
                    multiple
                  >
                    <Group justify="center" gap="sm" mih={100} style={{ pointerEvents: 'none' }}>
                      <Dropzone.Accept>
                        <IconCloudUpload size={32} stroke={1.5} color="var(--mantine-color-blue-6)" />
                      </Dropzone.Accept>
                      <Dropzone.Reject>
                        <IconX size={32} stroke={1.5} color="var(--mantine-color-red-6)" />
                      </Dropzone.Reject>
                      <Dropzone.Idle>
                        <IconCloudUpload size={32} stroke={1.5} color="var(--mantine-color-gray-4)" />
                      </Dropzone.Idle>

                      <div>
                        <Text size="sm" inline fw={500}>
                          Drag images here or click to select
                        </Text>
                        <Text size="xs" c="dimmed" inline>
                          {" "}(max 10MB each)
                        </Text>
                      </div>
                    </Group>
                  </Dropzone>
                </Stack>
              </Group>

              {/* Product Details Section - Show only when we have images */}
              {capturedImages.length >= 3 && (
                <>
                  <Divider />
                  <Text fw={600}>Device / Product Details</Text>
                  <input
                    type="text"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Enter device details..."
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      border: "1px solid #ced4da",
                      fontSize: 14,
                    }}
                  />

                  <Group justify="center">
                    <Button
                      color="green"
                      onClick={handleSubmit}
                      disabled={
                        capturedImages.length < 3 ||
                        details.trim() === "" ||
                        isSubmitting
                      }
                      loading={isSubmitting}
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : `Submit Images (${capturedImages.length}/5)`}
                    </Button>
                  </Group>
                </>
              )}
            </Stack>

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </Paper>
        </Stack>
      )}
    </Container>
  );

};

export default Page;
