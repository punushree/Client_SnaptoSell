import { useRef, useState, useEffect } from "react";
import {
  Container, Paper, Stack, Title, Text, Button, Group, Center, Alert,
  ActionIcon, Box, Image, SimpleGrid, Card, Badge,
  Modal
} from "@mantine/core";
import {
  IconCamera, IconCapture, IconAlertCircle,
  IconTrash, IconUpload, IconX
} from "@tabler/icons-react";
import SampleImages from "~/components/SampleImages";

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

  const messages = [
    "1) Capture or upload Front image of device",
    "2) Capture or upload Back image of device",
    "3) Capture or upload Left image of device",
    "4) Capture or upload Right image of device",
    "5) Capture or upload Settings image of device"
  ];

  // Detect mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Start camera
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    try {
      setIsLoading(true);
      if (stream) stream.getTracks().forEach((t) => t.stop());

      const actualMode = isMobile ? mode : "user";
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

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsVideoReady(false);
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

  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCapturedImages((prev) =>
      prev.length < 5 ? [...prev, url] : prev
    );
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

        // Optionally reset form
        // setCapturedImages([]);
        // setDetails("");
        // stopCamera();
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

  return (
    <Container size="full" p="md">
      {/* Show only Success UI when submitSuccess exists */}
      {submitSuccess ? (
        <Alert color="green" onClose={() => setSubmitSuccess(null)} withCloseButton>
          <div style={{ padding: "20px" }}>
            <Text fw={600} mb="xs">
              Images submitted successfully!
            </Text>
            <Text size="md" mb="xs">Status: {submitSuccess.status}</Text>

            {/* Analysis Section */}
            {submitSuccess.analysis && (
              <Box mt="md">
                <Text fw={600} size="md" mb="xs">
                  Analysis Results:
                </Text>
                <Text size="md">
                  Product: {submitSuccess.analysis.identified_product || "N/A"}
                </Text>
                <Text size="md">
                  Brand: {submitSuccess.analysis.brand || "N/A"}
                </Text>
                <Text size="md">
                  Condition: {submitSuccess.analysis.condition_rating || "N/A"}
                </Text>
                {submitSuccess.analysis.short_description && (
                  <Text size="md" mt="xs">
                    {submitSuccess.analysis.short_description}
                  </Text>
                )}
              </Box>
            )}

            {/*Uploaded Images Preview */}
            {capturedImages.length > 0 && (
              <Box mt="lg">
                <SimpleGrid cols={isMobile ? 3 : 3} spacing="sm" w="100%">
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
                        style={{
                          width: "100%",
                          height: isMobile ? "150px" : "250px",
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
                  // Reset 
                  setSubmitSuccess(null);
                  setCapturedImages([]);
                  setDetails("");
                  setSubmitError(null);
                  stopCamera(); // for previous stream is stopped
                  startCamera("environment");
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
              {!stream ? (
                <Center py="xl">
                  <Button
                    leftSection={<IconCamera />}
                    onClick={() => startCamera()}
                    loading={isLoading}
                  >
                    Start Camera
                  </Button>
                </Center>
              ) : (
                <>
                  <Group
                    align="flex-start"
                    grow={!isMobile}
                    style={{
                      flexDirection: isMobile ? "column" : "row",
                    }}
                  >
                    <Box
                      style={{
                        position: "relative",
                        width: isMobile ? "100%" : "70%",
                        height: isMobile ? 300 : 630,
                        background: "#000",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
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
                    </Box>

                    <Stack
                      gap="sm"
                      align={isMobile ? "stretch" : "center"}
                      style={{
                        width: isMobile ? "100%" : 220,
                        marginTop: isMobile ? 12 : 0,
                      }}
                    >
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
                          variant="light"
                          leftSection={<IconUpload />}
                          onClick={() => fileRef.current?.click()}
                        >
                          Upload
                        </Button>
                        <Button
                          variant="outline"
                          color="red"
                          onClick={stopCamera}
                        >
                          Cancel
                        </Button>
                      </Group>

                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                      />

                      {capturedImages.length > 0 && (
                        <Box style={{ width: "100%" }}>
                          <SimpleGrid cols={isMobile ? 3 : 2} spacing="sm" w="100%">
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
                                  style={{
                                    width: "100%",
                                    height: isMobile ? "150px" : "190px",
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
                    </Stack>
                  </Group>

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
